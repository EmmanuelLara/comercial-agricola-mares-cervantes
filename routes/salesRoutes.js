const express = require('express');
const router = express.Router();
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');

// GET sales list
router.get('/', async (req, res) => {
    try {
        const sales = await Venta.find().sort({ FechaRegistro: -1 });
        if (req.baseUrl.startsWith('/api')) {
            return res.json(sales);
        }
        res.render('sales', { title: 'Ventas - Comercial Agrícola Mares Cervantes', sales });
    } catch (err) {
        console.error(err);
        if (req.baseUrl.startsWith('/api')) {
            return res.status(500).json({ success: false, message: 'Error al obtener las ventas' });
        }
        res.status(500).render('error', { message: 'Error al obtener las ventas' });
    }
});

// GET single sale with product details populated
router.get('/:id', async (req, res) => {
    try {
        const sale = await Venta.findById(req.params.id);
        if (!sale) {
            return res.status(404).json({ success: false, message: 'Venta no encontrada' });
        }

        // Populate product names for each detail line
        const detallesConNombre = await Promise.all(
            sale.Detalles.map(async (detalle) => {
                if (!detalle.Id_Producto) {
                    return {
                        ...detalle.toObject(),
                        Nombre_Producto: detalle.Concepto || 'Servicio / Mano de Obra',
                        Codigo_Producto: 'SRV-LABOR'
                    };
                }
                const producto = await Producto.findById(detalle.Id_Producto).select('Nombre Numero');
                return {
                    ...detalle.toObject(),
                    Nombre_Producto: producto ? producto.Nombre : (detalle.Concepto || 'Producto'),
                    Codigo_Producto: producto ? producto.Numero : 'N/A'
                };
            })
        );

        return res.json({ success: true, venta: { ...sale.toObject(), Detalles: detallesConNombre } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error al obtener la venta: ' + err.message });
    }
});

const { getNextSequenceValue } = require('../utils/counter');

// POST new sale
router.post('/', async (req, res) => {
    try {
        const { 
            Id_Cliente,
            Nombre_Cliente, 
            Tipodedocumento, 
            UsoCFDI,
            Numero_Cliente, 
            MontoTotal, 
            MontoPago, 
            MontoCambio, 
            MetodoPago,
            PagoDetalles,
            Subtotal,
            Descuento,
            TipoDescuento,
            Detalles 
        } = req.body;

        if (!Detalles || Detalles.length === 0) {
            return res.status(400).json({ success: false, message: 'La venta debe incluir al menos un producto o concepto' });
        }

        // 1. Validar disponibilidad de stock para cada producto (si aplica)
        for (const item of Detalles) {
            if (item.Id_Producto) {
                const prod = await Producto.findById(item.Id_Producto);
                if (!prod) {
                    return res.status(404).json({ success: false, message: `Producto no encontrado (ID: ${item.Id_Producto})` });
                }
                if (prod.Stock < item.Cantidad) {
                    return res.status(400).json({
                        success: false,
                        message: `Stock insuficiente para "${prod.Nombre}". Stock disponible: ${prod.Stock}, cantidad solicitada: ${item.Cantidad}`
                    });
                }
            } else if (!item.Concepto || item.Concepto.trim() === '') {
                return res.status(400).json({ success: false, message: 'Cada partida debe incluir un producto de inventario o una descripción/concepto.' });
            }
        }
        
        const sequence = await getNextSequenceValue('venta_folio');
        const Folio = 'V' + sequence.toString().padStart(5, '0');

        const formattedDetalles = Detalles.map(item => ({
            Id_Producto: item.Id_Producto || undefined,
            Concepto: item.Concepto || undefined,
            Precio_Venta: parseFloat(item.Precio_Venta),
            Cantidad: parseFloat(item.Cantidad),
            MontoTotal: parseFloat(item.MontoTotal)
        }));

        const newSale = new Venta({
            Id_Cliente: Id_Cliente || undefined,
            Nombre_Cliente: Nombre_Cliente || 'Cliente General',
            Tipodedocumento: Tipodedocumento || 'Ticket',
            UsoCFDI: UsoCFDI || 'G03 - Gastos en general',
            Numero_Cliente: Numero_Cliente || '',
            Folio,
            MetodoPago: MetodoPago || 'Efectivo',
            PagoDetalles: PagoDetalles || {},
            Subtotal: Subtotal !== undefined ? parseFloat(Subtotal) : parseFloat(MontoTotal),
            Descuento: Descuento ? parseFloat(Descuento) : 0,
            TipoDescuento: TipoDescuento || 'monto',
            MontoTotal: parseFloat(MontoTotal),
            MontoPago: parseFloat(MontoPago) || parseFloat(MontoTotal),
            MontoCambio: parseFloat(MontoCambio) || 0,
            Detalles: formattedDetalles
        });

        await newSale.save();

        // 2. Descontar stock solo de productos de inventario
        for (const item of Detalles) {
            if (item.Id_Producto) {
                await Producto.findByIdAndUpdate(item.Id_Producto, {
                    $inc: { Stock: -item.Cantidad }
                });
            }
        }

        if (req.baseUrl.startsWith('/api')) {
            return res.status(201).json({ success: true, venta: newSale });
        }
        res.redirect('/sales');
    } catch (err) {
        console.error(err);
        if (req.baseUrl.startsWith('/api')) {
            return res.status(500).json({ success: false, message: 'Error al registrar la venta: ' + err.message });
        }
        res.status(500).render('error', { message: 'Error al registrar la venta: ' + err.message });
    }
});

// DELETE sale
router.delete('/:id', async (req, res) => {
    try {
        const sale = await Venta.findById(req.params.id);
        if (!sale) {
            return res.status(404).json({ success: false, message: 'Venta no encontrada' });
        }

        // Revert stock for each inventoried item sold
        for (const item of sale.Detalles) {
            if (item.Id_Producto) {
                await Producto.findByIdAndUpdate(item.Id_Producto, {
                    $inc: { Stock: item.Cantidad }
                });
            }
        }

        await Venta.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: `Venta #${sale.Folio} cancelada y eliminada correctamente` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error al eliminar venta: ' + err.message });
    }
});

module.exports = router;
