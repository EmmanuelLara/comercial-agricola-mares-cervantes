const mongoose = require('mongoose');

const RepuestoUsadoSchema = new mongoose.Schema({
    Id_Producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
    Codigo: { type: String, default: '' },
    Nombre: { type: String, required: true },
    Cantidad: { type: Number, required: true, default: 1 },
    Unidad: { type: String, default: 'Pieza' }, // Pieza, Litros, Metros, Kilos, etc.
    PrecioUnitario: { type: Number, required: true },
    Subtotal: { type: Number, required: true }
});

const ServicioSchema = new mongoose.Schema({
    Folio: { type: String, unique: true },
    // Datos del Cliente
    Nombre_Cliente: { type: String, required: true },
    Telefono_Cliente: { type: String, default: '' },
    Email_Cliente: { type: String, default: '' },

    // Indicador si es trabajo específico de Torno y Maquinados
    EsTrabajoTorno: { type: Boolean, default: false },
    DetallesTorno: {
        TipoPieza: { type: String, default: '' },       // Ej. Buje, Flecha, Eje, Masa, Perno, Rosca, etc.
        MaterialUsado: { type: String, default: '' },   // Ej. Bronce fosforado, Acero 1045, 4140, Solera
        Dimensiones: { type: String, default: '' },     // Ej. 2" x 150mm con barreno de 1"
        HorasTorno: { type: Number, default: 0 },
        PrecioPorHora: { type: Number, default: 0 }
    },

    // Datos de la Maquinaria / Vehículo / Pieza
    TipoEquipo: { 
        type: String, 
        default: 'Tractor' 
        // e.g. Tractor, Torno / Maquinado, Cosechadora, Implemento Agrícola, Camión, Camioneta, Generador/Bomba, Automóvil, Otro
    },
    Marca: { type: String, default: '' },
    Modelo: { type: String, default: '' },
    SeriePlacas: { type: String, default: '' },
    HorometroKM: { type: String, default: '' },

    // Datos del Servicio
    TipoServicio: { 
        type: String, 
        required: true,
        default: 'Cambio de Filtros' 
        // e.g. Cambio de Filtros, Cambio de Aceite y Filtros, Mantenimiento Preventivo, Mantenimiento Hidráulico, Trabajo de Torno / Maquinado, Rectificado y Soldadura, etc.
    },
    TecnicoResponsable: { type: String, default: 'Taller Principal' }, // O Tornero / Mecánico
    Estado: {
        type: String,
        enum: ['Recibido', 'En Proceso', 'Esperando Repuestos', 'Completado', 'Entregado', 'Cancelado'],
        default: 'Recibido'
    },
    Prioridad: {
        type: String,
        enum: ['Normal', 'Alta', 'Urgente'],
        default: 'Normal'
    },

    // Costos
    CostoManoDeObra: { type: Number, default: 0 },
    CostoTorno: { type: Number, default: 0 },
    IncluyeTorno: { type: Boolean, default: false },
    SubtotalRepuestos: { type: Number, default: 0 },
    Descuento: { type: Number, default: 0 },
    TotalServicio: { type: Number, required: true },

    Repuestos: [RepuestoUsadoSchema], // Materiales, filtros, aceites llevados para el trabajo

    // Fechas
    FechaIngreso: { type: Date, default: Date.now },
    FechaEstimadaEntrega: { type: Date },
    FechaCompletado: { type: Date },
    FechaEntrega: { type: Date },

    // Notas
    DiagnosticoInicial: { type: String, default: '' },
    TrabajosRealizados: { type: String, default: '' },
    Observaciones: { type: String, default: '' },

    // Relación de Venta si fue cobrado con Ticket o Nota
    Id_Venta: { type: mongoose.Schema.Types.ObjectId, ref: 'Venta' },
    
    // Relación de Factura SAT si fue facturado
    Id_Factura: { type: mongoose.Schema.Types.ObjectId, ref: 'Factura' },
    Folio_Factura: { type: String, default: '' }
});

module.exports = mongoose.model('Servicio', ServicioSchema);
