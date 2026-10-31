const mongoose = require('mongoose');

const AsistenciaSchema = new mongoose.Schema({
    Id_Empleado: { type: mongoose.Schema.Types.ObjectId, ref: 'Empleado', required: true },
    Nombre_Empleado: { type: String, required: true },
    Puesto: { type: String, default: '' },
    Fecha: { type: String, required: true }, // Formato YYYY-MM-DD para búsquedas e indexación rápida
    HoraEntrada: { type: Date, required: true },
    HoraSalida: { type: Date },
    HorasTrabajadas: { type: Number, default: 0 }, // Horas decimales (ej. 8.5 = 8h 30m)
    HorasExtras: { type: Number, default: 0 },
    MinutosAlmuerzoDescanso: { type: Number, default: 0 },
    SalarioPorHoraAlMomento: { type: Number, default: 0 },
    MontoTotalTurno: { type: Number, default: 0 },
    Estado: { 
        type: String, 
        enum: ['En Turno', 'Finalizado', 'Falta', 'Permiso', 'Vacaciones'],
        default: 'En Turno' 
    },
    // Vinculación opcional con trabajos de taller u órdenes
    TrabajosRealizados: [{
        Id_Servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio' },
        Folio_Servicio: { type: String, default: '' },
        Descripcion: { type: String, default: '' }
    }],
    Notas: { type: String, default: '' }
}, {
    timestamps: true
});

// Índice compuesto para evitar entradas duplicadas activas el mismo día sin salida
AsistenciaSchema.index({ Id_Empleado: 1, Fecha: 1 });

module.exports = mongoose.model('Asistencia', AsistenciaSchema);
