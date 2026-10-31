const express = require('express');
const router = express.Router();
const Cotizacion = require('../models/Cotizacion');
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const { getNextSequenceValue } = require('../utils/counter');

// GET all quotes
router.get('/', async (req, res) => {
    try {
        const quotes = await Cotizacion.find().sort({ FechaRegistro: -1 });
        return res.json(quotes);
    } catch (err) {
        console.error('Error al obtener cotizaciones:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener cotizaciones: ' + err.message });
    }
});

// GET single quote by ID
router.get('/:id', async (req, res) => {
    try {
        const quote = await Cotizacion.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }
        return res.json({ success: true, cotizacion: quote });
    } catch (err) {
        console.error('Error al obtener cotización:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener cotización: ' + err.message });
    }
});

// POST new quote
router.post('/', async (req, res) => {
    try {
        const {
            Nombre_Cliente,
            Telefono_Cliente,
            Email_Cliente,
            Direccion_Cliente,
            Subtotal,
            Descuento,
            TipoDescuento,
            IVA,
            AplicarIVA,
            MontoTotal,
            VigenciaDias,
            Notas,
            Condiciones,
            Detalles
        } = req.body;

        if (!Detalles || Detalles.length === 0) {
            return res.status(400).json({ success: false, message: 'La cotización debe incluir al menos un producto o servicio' });
        }

        const seq = await getNextSequenceValue('cotizacion_folio');
        const Folio = 'COT-' + seq.toString().padStart(5, '0');

        const newQuote = new Cotizacion({
            Folio,
            Nombre_Cliente: Nombre_Cliente || 'Cliente General',
            Telefono_Cliente: Telefono_Cliente || '',
            Email_Cliente: Email_Cliente || '',
            Direccion_Cliente: Direccion_Cliente || '',
            Subtotal: parseFloat(Subtotal) || 0,
            Descuento: parseFloat(Descuento) || 0,
            TipoDescuento: TipoDescuento || 'monto',
            IVA: parseFloat(IVA) || 0,
            AplicarIVA: !!AplicarIVA,
            MontoTotal: parseFloat(MontoTotal) || 0,
            VigenciaDias: parseInt(VigenciaDias, 10) || 15,
            Notas: Notas || '',
            Condiciones: Condiciones || undefined,
            Detalles: Detalles || []
        });

        await newQuote.save();
        return res.status(201).json({ success: true, cotizacion: newQuote });
    } catch (err) {
        console.error('Error al registrar cotización:', err);
        return res.status(500).json({ success: false, message: 'Error al registrar cotización: ' + err.message });
    }
});

// PUT update quote
router.put('/:id', async (req, res) => {
    try {
        const quote = await Cotizacion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }
        return res.json({ success: true, cotizacion: quote });
    } catch (err) {
        console.error('Error al actualizar cotización:', err);
        return res.status(500).json({ success: false, message: 'Error al actualizar cotización: ' + err.message });
    }
});

// POST convert quote to sale
router.post('/:id/convert', async (req, res) => {
    try {
        const quote = await Cotizacion.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }

        if (quote.Estado === 'Convertida') {
            return res.status(400).json({ success: false, message: 'Esta cotización ya fue convertida a venta previamente' });
        }

        const { MetodoPago, PagoDetalles, MontoPago } = req.body;

        // 1. Validar stock de productos vinculados
        for (const item of quote.Detalles) {
            if (item.Id_Producto) {
                const prod = await Producto.findById(item.Id_Producto);
                if (prod && prod.Stock < item.Cantidad) {
                    return res.status(400).json({
                        success: false,
                        message: `Stock insuficiente para "${prod.Nombre}". Stock disponible: ${prod.Stock}, cantidad requerida: ${item.Cantidad}`
                    });
                }
            }
        }

        // 2. Generar Folio de Venta
        const seqVenta = await getNextSequenceValue('venta_folio');
        const FolioVenta = 'V' + seqVenta.toString().padStart(5, '0');

        const detallesVenta = quote.Detalles.map(d => ({
            Id_Producto: d.Id_Producto,
            Concepto: d.Descripcion || d.Concepto,
            Precio_Venta: d.PrecioUnitario,
            Cantidad: d.Cantidad,
            MontoTotal: d.Subtotal
        }));

        const totalVenta = quote.MontoTotal;
        const pago = MontoPago ? parseFloat(MontoPago) : totalVenta;
        const cambio = Math.max(0, pago - totalVenta);

        const newSale = new Venta({
            Nombre_Cliente: quote.Nombre_Cliente,
            Tipodedocumento: 'Ticket Cotizado',
            Numero_Cliente: quote.Telefono_Cliente,
            Folio: FolioVenta,
            MetodoPago: MetodoPago || 'Efectivo',
            PagoDetalles: PagoDetalles || {},
            Subtotal: quote.Subtotal,
            Descuento: quote.Descuento,
            TipoDescuento: quote.TipoDescuento,
            MontoTotal: totalVenta,
            MontoPago: pago,
            MontoCambio: cambio,
            Detalles: detallesVenta
        });

        await newSale.save();

        // 3. Descontar inventario
        for (const item of quote.Detalles) {
            if (item.Id_Producto) {
                await Producto.findByIdAndUpdate(item.Id_Producto, {
                    $inc: { Stock: -item.Cantidad }
                });
            }
        }

        // 4. Marcar cotización como Convertida
        quote.Estado = 'Convertida';
        quote.Id_VentaAsociada = newSale._id;
        await quote.save();

        return res.json({
            success: true,
            message: `Cotización ${quote.Folio} convertida con éxito en Venta ${FolioVenta}`,
            venta: newSale,
            cotizacion: quote
        });
    } catch (err) {
        console.error('Error al convertir cotización:', err);
        return res.status(500).json({ success: false, message: 'Error al convertir cotización: ' + err.message });
    }
});

// POST convert quote to service order
router.post('/:id/convert-service', async (req, res) => {
    try {
        const quote = await Cotizacion.findById(req.params.id);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }

        const Servicio = require('../models/Servicio');
        const { TipoEquipo, Marca, Modelo, SeriePlacas, HorometroKM, TipoServicio, CostoManoDeObra } = req.body;

        const seqSrv = await getNextSequenceValue('servicio_folio');
        const FolioSrv = 'SRV-' + seqSrv.toString().padStart(5, '0');

        let subRepuestos = 0;
        const repuestos = quote.Detalles.map(d => {
            subRepuestos += d.Subtotal;
            return {
                Id_Producto: d.Id_Producto || undefined,
                Codigo: d.Codigo || '',
                Nombre: d.Descripcion,
                Cantidad: d.Cantidad,
                PrecioUnitario: d.PrecioUnitario,
                Subtotal: d.Subtotal
            };
        });

        const manoObra = CostoManoDeObra !== undefined ? parseFloat(CostoManoDeObra) : 0;
        const totalServicio = subRepuestos + manoObra;

        const newService = new Servicio({
            Folio: FolioSrv,
            Nombre_Cliente: quote.Nombre_Cliente,
            Telefono_Cliente: quote.Telefono_Cliente,
            Email_Cliente: quote.Email_Cliente,
            TipoEquipo: TipoEquipo || 'Tractor',
            Marca: Marca || 'General',
            Modelo: Modelo || 'General',
            SeriePlacas: SeriePlacas || '',
            HorometroKM: HorometroKM || '',
            TipoServicio: TipoServicio || 'Mantenimiento y Cambio de Filtros',
            CostoManoDeObra: manoObra,
            SubtotalRepuestos: subRepuestos,
            TotalServicio: totalServicio,
            Repuestos: repuestos,
            DiagnosticoInicial: `Generado a partir de Cotización ${quote.Folio}. ${quote.Notas || ''}`
        });

        await newService.save();

        quote.Estado = 'Aprobada';
        await quote.save();

        return res.json({
            success: true,
            message: `Cotización ${quote.Folio} convertida en Orden de Servicio ${FolioSrv}`,
            servicio: newService
        });
    } catch (err) {
        console.error('Error al convertir cotización a servicio:', err);
        return res.status(500).json({ success: false, message: 'Error al convertir cotización a servicio: ' + err.message });
    }
});

// DELETE quote
router.delete('/:id', async (req, res) => {
    try {
        const quote = await Cotizacion.findByIdAndDelete(req.params.id);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }
        return res.json({ success: true, message: `Cotización ${quote.Folio} eliminada correctamente` });
    } catch (err) {
        console.error('Error al eliminar cotización:', err);
        return res.status(500).json({ success: false, message: 'Error al eliminar cotización: ' + err.message });
    }
});

module.exports = router;
