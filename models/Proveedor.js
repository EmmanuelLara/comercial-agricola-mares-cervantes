const mongoose = require('mongoose');

const ProveedorSchema = new mongoose.Schema({
    Numero_Proveedor: { type: String, unique: true },
    RazonSocial: { type: String, required: true },
    RFC: { type: String },
    Contacto: { type: String },
    Correo: { type: String },
    Telefono: { type: String },
    Direccion: { type: String },
    Ciudad: { type: String },
    Estado_Prov: { type: String },
    CodigoPostal: { type: String },
    Estado: { type: String, default: 'Activo' }, // Estatus: Activo/Inactivo
    FechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Proveedor', ProveedorSchema);
