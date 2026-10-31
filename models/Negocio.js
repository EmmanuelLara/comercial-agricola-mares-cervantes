const mongoose = require('mongoose');

const NegocioSchema = new mongoose.Schema({
    Nombre: { type: String, default: 'COMERCIAL AGRÍCOLA MARES CERVANTES' },
    RazonSocial: { type: String, default: 'ERNESTO MARES DE LA CRUZ' },
    RFC: { type: String, default: 'MACE900101XYZ' },
    RegimenFiscal: { type: String, default: '612 - Personas Físicas con Actividades Empresariales y Profesionales' },
    Ruc: { type: String, default: 'MACE900101XYZ' },
    Direccion: { type: String, default: 'Salamanca - Celaya, Guanajuato, México' },
    Telefono: { type: String, default: '(464) 640-0000' },
    Email: { type: String, default: 'ventas@marescervantes.com' },
    Logo: { type: String, default: '' }, // Imagen base64 / URL del logo
    HeaderImage: { type: String, default: '' }, // Imagen de la hoja membretada oficial
    TerminosCotizacion: { type: String, default: 'Precios sujetos a cambio sin previo aviso. Tiempo de entrega según disponibilidad de almacén.' },

    // Datos de Certificados Digitales CSD SAT (Timbrado Oficial)
    TipoPersona: { type: String, default: 'Física' },
    Calle: { type: String, default: 'JOSEFA ORTIZ DE DOMINGUEZ' },
    NoExterior: { type: String, default: '' },
    NoInterior: { type: String, default: '' },
    Colonia: { type: String, default: '' },
    Municipio: { type: String, default: 'JESUS MARIA' },
    EstadoProv: { type: String, default: 'AGUASCALIENTES' },
    CodigoPostal: { type: String, default: '20903' },
    CertificadoCerName: { type: String, default: '' },
    CertificadoCerBase64: { type: String, default: '' },
    LlaveKeyName: { type: String, default: '' },
    LlaveKeyBase64: { type: String, default: '' },
    PasswordCSD: { type: String, default: '' },
    FacturapiApiKey: { type: String, default: '' }
});

module.exports = mongoose.model('Negocio', NegocioSchema);
