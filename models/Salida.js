const mongoose = require('mongoose');

const SalidaSchema = new mongoose.Schema({
    Folio: { type: String, unique: true },
    Fecha: { type: Date, default: Date.now },
    TipoSalida: {
        type: String,
        enum: [
            'Despacho de Aceite a Granel',
            'Salida para Trabajo en Taller',
            'Salida para Trabajo en Campo',
            'Material para Torno',
            'Venta a Granel',
            'Consumo Interno / Merma',
            'Otro'
        ],
        default: 'Despacho de Aceite a Granel'
    },
    Id_Producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: false },
    Codigo_Producto: { type: String, default: '' },
    Nombre_Producto: { type: String, required: true },
    Cantidad: { type: Number, required: true }, // Soporta litros con decimales (ej. 15.5)
    UnidadMedida: { type: String, default: 'Litros' }, // 'Litros', 'Piezas', 'Kilos', 'Metros', 'Galones'
    PrecioUnitario: { type: Number, default: 0 },
    CostoUnitario: { type: Number, default: 0 },
    Total: { type: Number, default: 0 },

    // Destino / Trabajo
    DestinoTrabajo: { type: String, default: '' }, // Ej: "Tractor John Deere 6110D de D. Pedro", "Torno - flecha"
    Id_Servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio', required: false },
    Folio_Servicio: { type: String, default: '' },
    Nombre_Cliente: { type: String, default: '' },

    // Responsable y observaciones
    Solicitante: { type: String, default: 'Taller Principal' }, // Quién retiró el material o aceite
    Observaciones: { type: String, default: '' },
    Estado: { type: String, enum: ['Registrada', 'Cancelada'], default: 'Registrada' },
    Id_Usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: false }
});

module.exports = mongoose.model('Salida', SalidaSchema);
