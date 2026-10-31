const mongoose = require('mongoose');

const DetalleCompraSchema = new mongoose.Schema({
    Id_Producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    Precio_Compra: { type: Number, required: true },
    Precio_venta: { type: Number },
    Stock: { type: Number, required: true }, // Cantidad comprada
    MontoTotal: { type: Number, required: true }
});

const CompraSchema = new mongoose.Schema({
    Id_Proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', required: true },
    Tipodedocumento: { type: String },
    Folio: { type: String, unique: true },
    MontoTotal: { type: Number, required: true },
    Detalles: [DetalleCompraSchema],
    FechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Compra', CompraSchema);
