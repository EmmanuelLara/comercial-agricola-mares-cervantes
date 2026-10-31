const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
    Numero_Cliente: { type: String, unique: true },
    Serie_Interno: { type: String, default: 'A' },
    Folio_Interno: { type: String, default: '' },
    NombreCompleto: { type: String, required: true },
    RFC: { type: String, default: '' },
    RazonSocial: { type: String, default: '' },
    RegimenFiscal: { type: String, default: '616 - Sin obligaciones fiscales' },
    UsoCFDI: { type: String, default: 'G03 - Gastos en general' },
    Total_Deuda: { type: Number, default: 0 },
    CodigoPostal: { type: String, default: '' },
    Calle: { type: String, default: '' },
    Num_Ext: { type: String, default: '' },
    Num_Int: { type: String, default: '' },
    Colonia: { type: String, default: '' },
    Direccion: { type: String, default: '' },
    Localidad: { type: String, default: '' },
    Municipio: { type: String, default: '' },
    EstadoGeografico: { type: String, default: '' },
    Correo: { type: String, default: '' },
    Telefono: { type: String, default: '' },
    Estado: { type: String, default: 'Activo' },
    FechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cliente', ClienteSchema);
