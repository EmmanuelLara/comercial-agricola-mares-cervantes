const mongoose = require('mongoose');

const DetalleVentaSchema = new mongoose.Schema({
    Id_Producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: false },
    Concepto: { type: String },
    Precio_Venta: { type: Number, required: true },
    Cantidad: { type: Number, required: true },
    MontoTotal: { type: Number, required: true }
});

const VentaSchema = new mongoose.Schema({
    Id_Cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: false },
    Nombre_Cliente: { type: String },
    Tipodedocumento: { type: String },
    UsoCFDI: { type: String, default: 'G03 - Gastos en general' },
    Numero_Cliente: { type: String },
    Folio: { type: String, unique: true },
    MetodoPago: { type: String, default: 'Efectivo' }, // Efectivo, Tarjeta, Transferencia, Mixto
    PagoDetalles: {
        Efectivo: { type: Number, default: 0 },
        Tarjeta: { type: Number, default: 0 },
        Transferencia: { type: Number, default: 0 },
        Referencia: { type: String, default: '' }
    },
    Subtotal: { type: Number },
    Descuento: { type: Number, default: 0 },
    TipoDescuento: { type: String, default: 'monto' }, // monto, porcentaje
    MontoCambio: { type: Number, default: 0 },
    MontoPago: { type: Number, default: 0 },
    MontoTotal: { type: Number, required: true },
    Detalles: [DetalleVentaSchema],
    FechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Venta', VentaSchema);
