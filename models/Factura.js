const mongoose = require('mongoose');

const FacturaItemSchema = new mongoose.Schema({
    ClaveProdServ: { type: String, default: '01010101' },
    Descripcion: { type: String, required: true },
    Cantidad: { type: Number, required: true },
    ClaveUnidad: { type: String, default: 'H87' },
    Unidad: { type: String, default: 'Pieza' },
    ValorUnitario: { type: Number, required: true },
    Importe: { type: Number, required: true },
    Descuento: { type: Number, default: 0 },
    IVA: { type: Number, default: 0 }
});

const FacturaSchema = new mongoose.Schema({
    Folio: { type: String, unique: true },
    Serie: { type: String, default: 'FAC' },
    FolioFiscalUUID: { type: String, default: '' },
    FechaEmision: { type: Date, default: Date.now },
    
    // Datos del Receptor (Cliente)
    RFC: { type: String, required: true, uppercase: true },
    RazonSocial: { type: String, required: true },
    RegimenFiscal: { type: String, default: '601 - General de Ley Personas Morales' },
    UsoCFDI: { type: String, default: 'G03 - Gastos en general' },
    CodigoPostal: { type: String, default: '00000' },
    Email: { type: String, default: '' },
    Direccion: { type: String, default: '' },

    // Datos de Pago
    FormaPago: { type: String, default: '01 - Efectivo' }, // 01 Efectivo, 03 Transferencia, 04 Tarjeta Crédito, 28 Tarjeta Débito
    MetodoPago: { type: String, default: 'PUE - Pago en una sola exhibición' },
    CondicionesDePago: { type: String, default: 'Contado' },
    Moneda: { type: String, default: 'MXN' },
    TipoCambio: { type: Number, default: 1 },

    // Montos
    Subtotal: { type: Number, required: true },
    DescuentoTotal: { type: Number, default: 0 },
    IVATotal: { type: Number, required: true },
    Total: { type: Number, required: true },

    Items: [FacturaItemSchema],
    
    Id_Venta: { type: mongoose.Schema.Types.ObjectId, ref: 'Venta' },
    Id_Servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio' },
    Estado: { 
        type: String, 
        enum: ['Emitida', 'Pagada', 'Cancelada'], 
        default: 'Emitida' 
    },
    Notas: { type: String, default: '' },

    // Datos de Timbrado Fiscal CFDI 4.0 (Sandbox / Facturapi / Producción)
    FacturapiId: { type: String, default: '' },
    XmlString: { type: String, default: '' },
    SelloCFDI: { type: String, default: '' },
    SelloSAT: { type: String, default: '' },
    NoSerieCSD: { type: String, default: '00001000000505123456' },
    NoSerieSAT: { type: String, default: '00001000000504465028' },
    CadenaOriginalSAT: { type: String, default: '' },
    QrCodeUrl: { type: String, default: '' },
    ModoTimbrado: { type: String, default: 'Prueba (Sandbox)' }
});

module.exports = mongoose.model('Factura', FacturaSchema);
