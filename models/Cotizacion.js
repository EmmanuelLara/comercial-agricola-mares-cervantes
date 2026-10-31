const mongoose = require('mongoose');

const DetalleCotizacionSchema = new mongoose.Schema({
    Id_Producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    Codigo: { type: String },
    Descripcion: { type: String, required: true },
    PrecioUnitario: { type: Number, required: true },
    Cantidad: { type: Number, required: true },
    Subtotal: { type: Number, required: true }
});

const CotizacionSchema = new mongoose.Schema({
    Folio: { type: String, unique: true },
    Nombre_Cliente: { type: String, required: true },
    Telefono_Cliente: { type: String, default: '' },
    Email_Cliente: { type: String, default: '' },
    Direccion_Cliente: { type: String, default: '' },
    Subtotal: { type: Number, required: true },
    Descuento: { type: Number, default: 0 },
    TipoDescuento: { type: String, default: 'monto' }, // monto o porcentaje
    IVA: { type: Number, default: 0 },
    AplicarIVA: { type: Boolean, default: false },
    MontoTotal: { type: Number, required: true },
    VigenciaDias: { type: Number, default: 15 },
    Estado: { 
        type: String, 
        enum: ['Pendiente', 'Aprobada', 'Rechazada', 'Convertida'], 
        default: 'Pendiente' 
    },
    Id_VentaAsociada: { type: mongoose.Schema.Types.ObjectId, ref: 'Venta' },
    Notas: { type: String, default: '' },
    Condiciones: { type: String, default: 'Precios sujetos a cambio sin previo aviso. Tiempo de entrega según disponibilidad.' },
    Detalles: [DetalleCotizacionSchema],
    FechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cotizacion', CotizacionSchema);
