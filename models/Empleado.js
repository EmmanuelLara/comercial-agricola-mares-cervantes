const mongoose = require('mongoose');

const EmpleadoSchema = new mongoose.Schema({
    Matricula: { type: String, unique: true },
    Nombre: { type: String, required: true },
    Puesto: { 
        type: String, 
        required: true,
        enum: ['Mecánico Agrícola', 'Tornero / Maquinados', 'Ayudante de Taller', 'Ventas / Mostrador', 'Almacenista', 'Administrador', 'Otro'],
        default: 'Mecánico Agrícola'
    },
    Telefono: { type: String, default: '' },
    Email: { type: String, default: '' },
    SalarioPorHora: { type: Number, default: 0 },
    SalarioSemanal: { type: Number, default: 0 },
    TipoSalario: { 
        type: String, 
        enum: ['Por Hora', 'Fijo Semanal', 'Comisión / Destajo'],
        default: 'Por Hora'
    },
    Estado: { 
        type: String, 
        enum: ['Activo', 'Inactivo'],
        default: 'Activo'
    },
    FechaIngreso: { type: Date, default: Date.now },
    Notas: { type: String, default: '' }
});

module.exports = mongoose.model('Empleado', EmpleadoSchema);
