const express = require('express');
const router = express.Router();
const Factura = require('../models/Factura');
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Negocio = require('../models/Negocio');
const { getNextSequenceValue } = require('../utils/counter');
const { timbrarFactura, cancelarFacturaPAC } = require('../utils/pacService');
const crypto = require('crypto');

// GET all invoices
router.get('/', async (req, res) => {
    try {
        const facturas = await Factura.find().sort({ FechaEmision: -1 });
        return res.json(facturas);
    } catch (err) {
        console.error('Error al obtener facturas:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener facturas: ' + err.message });
    }
});

// GET single invoice by ID
router.get('/:id', async (req, res) => {
    try {
        const factura = await Factura.findById(req.params.id);
        if (!factura) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada' });
        }
        return res.json({ success: true, factura });
    } catch (err) {
        console.error('Error al obtener factura:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener factura: ' + err.message });
    }
});

// GET download XML file of CFDI 4.0
router.get('/:id/xml', async (req, res) => {
    try {
        const factura = await Factura.findById(req.params.id);
        if (!factura) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada' });
        }

        let xmlContent = factura.XmlString;
        if (!xmlContent) {
            const negocioInfo = await Negocio.findOne();
            const timbradoResult = await timbrarFactura(factura, negocioInfo);
            xmlContent = timbradoResult.XmlString;
            factura.XmlString = xmlContent;
            await factura.save();
        }

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="${factura.Folio || 'CFDI'}_${factura.FolioFiscalUUID || 'SAT'}.xml"`);
        return res.send(xmlContent);
    } catch (err) {
        console.error('Error al obtener XML de la factura:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener XML: ' + err.message });
    }
});

// POST generate invoice with CFDI 4.0 (Facturapi / Sandbox)
router.post('/', async (req, res) => {
    try {
        const {
            RFC,
            RazonSocial,
            RegimenFiscal,
            UsoCFDI,
            CodigoPostal,
            Email,
            Direccion,
            FormaPago,
            MetodoPago,
            CondicionesDePago,
            Items,
            Id_Venta,
            Id_Servicio,
            Notas
        } = req.body;

        if (!RFC || !RazonSocial) {
            return res.status(400).json({ success: false, message: 'RFC y Razón Social son requeridos para facturación' });
        }

        if (!Items || Items.length === 0) {
            return res.status(400).json({ success: false, message: 'Debe incluir al menos un concepto en la factura' });
        }

        const seq = await getNextSequenceValue('factura_folio');
        const Folio = 'FAC-' + seq.toString().padStart(5, '0');

        // Calcular subtotal, IVA y total
        let Subtotal = 0;
        let DescuentoTotal = 0;
        let IVATotal = 0;

        const formattedItems = Items.map(item => {
            const cant = parseFloat(item.Cantidad) || 1;
            const precio = parseFloat(item.ValorUnitario) || 0;
            const desc = parseFloat(item.Descuento) || 0;
            const imp = Math.round((cant * precio - desc) * 100) / 100;
            const iva = Math.round((imp * 0.16) * 100) / 100;

            Subtotal += (cant * precio);
            DescuentoTotal += desc;
            IVATotal += iva;

            return {
                ClaveProdServ: item.ClaveProdServ || '10151500',
                Descripcion: item.Descripcion,
                Cantidad: cant,
                ClaveUnidad: item.ClaveUnidad || 'H87',
                Unidad: item.Unidad || 'Pieza',
                ValorUnitario: precio,
                Importe: imp,
                Descuento: desc,
                IVA: iva
            };
        });

        const Total = Math.round((Subtotal - DescuentoTotal + IVATotal) * 100) / 100;

        const tempFactura = {
            Folio,
            Serie: 'FAC',
            RFC: RFC.toUpperCase().trim(),
            RazonSocial,
            RegimenFiscal: RegimenFiscal || '601 - General de Ley Personas Morales',
            UsoCFDI: UsoCFDI || 'G03 - Gastos en general',
            CodigoPostal: CodigoPostal || '20903',
            Email: Email || '',
            Direccion: Direccion || '',
            FormaPago: FormaPago || '01 - Efectivo',
            MetodoPago: MetodoPago || 'PUE - Pago en una sola exhibición',
            CondicionesDePago: CondicionesDePago || 'Contado',
            Subtotal: Math.round(Subtotal * 100) / 100,
            DescuentoTotal: Math.round(DescuentoTotal * 100) / 100,
            IVATotal: Math.round(IVATotal * 100) / 100,
            Total,
            Items: formattedItems,
            FechaEmision: new Date()
        };

        // Obtener datos del emisor
        const negocioInfo = await Negocio.findOne();

        // Ejecutar Timbrado Fiscal (Facturapi SAT / Sandbox)
        const datosTimbrado = await timbrarFactura(tempFactura, negocioInfo);

        const newFactura = new Factura({
            ...tempFactura,
            ...datosTimbrado,
            Id_Venta: Id_Venta || undefined,
            Id_Servicio: Id_Servicio || undefined,
            Notas: Notas || ''
        });

        await newFactura.save();

        if (Id_Servicio) {
            const Servicio = require('../models/Servicio');
            await Servicio.findByIdAndUpdate(Id_Servicio, {
                Id_Factura: newFactura._id,
                Folio_Factura: newFactura.Folio
            });
        }

        return res.status(201).json({ success: true, factura: newFactura });
    } catch (err) {
        console.error('Error al generar factura:', err);
        return res.status(500).json({ success: false, message: 'Error al generar factura: ' + err.message });
    }
});

// PUT cancel invoice
router.put('/:id/cancel', async (req, res) => {
    try {
        const factura = await Factura.findById(req.params.id);
        if (!factura) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada' });
        }

        // Cancelar ante el SAT / Facturapi si tiene ID
        if (factura.FacturapiId) {
            try {
                await cancelarFacturaPAC(factura);
            } catch (pacErr) {
                console.warn('[Cancelación] Advertencia al cancelar en PAC:', pacErr.message);
            }
        }

        factura.Estado = 'Cancelada';
        await factura.save();

        return res.json({ success: true, message: `Factura ${factura.Folio} cancelada exitosamente`, factura });
    } catch (err) {
        console.error('Error al cancelar factura:', err);
        return res.status(500).json({ success: false, message: 'Error al cancelar factura: ' + err.message });
    }
});

module.exports = router;
