const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
    Numero: { type: String, required: true, unique: true },
    Codigo_Barras: { type: String },
    Nombre: { type: String, required: true },
    Descripcion: { type: String },
    Stock: { type: Number, default: 0 },
    Stock_Minimo: { type: Number, default: 2 },
    Ubicacion: { type: String, default: '' },
    Precio_Compra: { type: Number, required: true },
    Precio_venta: { type: Number, required: true },
    Unidad_Medida: { type: String, default: 'Pieza' },
    Estado: { type: String, default: 'Activo' },
    FechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Producto', ProductoSchema);
