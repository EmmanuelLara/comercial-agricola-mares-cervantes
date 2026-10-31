const express = require('express');
const router = express.Router();
const Empleado = require('../models/Empleado');
const Asistencia = require('../models/Asistencia');
const { getNextSequenceValue } = require('../utils/counter');

// Helper para fecha en formato YYYY-MM-DD local
const getFechaLocal = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ─────────────────────────────────────────────
// CRUD EMPLEADOS
// ─────────────────────────────────────────────

// Obtener todos los empleados
router.get('/empleados', async (req, res) => {
    try {
        const empleados = await Empleado.find().sort({ Estado: 1, Nombre: 1 });
        return res.json({ success: true, empleados });
    } catch (err) {
        console.error('Error al obtener empleados:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Crear nuevo empleado
router.post('/empleados', async (req, res) => {
    try {
        const { Nombre, Puesto, Telefono, Email, SalarioPorHora, SalarioSemanal, TipoSalario, Notas } = req.body;
        if (!Nombre || !Nombre.trim()) {
            return res.status(400).json({ success: false, message: 'El nombre del empleado es obligatorio' });
        }

        const seq = await getNextSequenceValue('empleado_matricula');
        const Matricula = 'EMP-' + seq.toString().padStart(4, '0');

        const nuevoEmpleado = new Empleado({
            Matricula,
            Nombre: Nombre.trim(),
            Puesto: Puesto || 'Mecánico Agrícola',
            Telefono: Telefono || '',
            Email: Email || '',
            SalarioPorHora: Number(SalarioPorHora) || 0,
            SalarioSemanal: Number(SalarioSemanal) || 0,
            TipoSalario: TipoSalario || 'Por Hora',
            Notas: Notas || ''
        });

        await nuevoEmpleado.save();
        return res.status(201).json({ success: true, empleado: nuevoEmpleado });
    } catch (err) {
        console.error('Error al registrar empleado:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Editar empleado
router.put('/empleados/:id', async (req, res) => {
    try {
        const { Nombre, Puesto, Telefono, Email, SalarioPorHora, SalarioSemanal, TipoSalario, Estado, Notas } = req.body;
        const empleado = await Empleado.findById(req.params.id);
        if (!empleado) {
            return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
        }

        if (Nombre !== undefined) empleado.Nombre = Nombre.trim();
        if (Puesto !== undefined) empleado.Puesto = Puesto;
        if (Telefono !== undefined) empleado.Telefono = Telefono;
        if (Email !== undefined) empleado.Email = Email;
        if (SalarioPorHora !== undefined) empleado.SalarioPorHora = Number(SalarioPorHora) || 0;
        if (SalarioSemanal !== undefined) empleado.SalarioSemanal = Number(SalarioSemanal) || 0;
        if (TipoSalario !== undefined) empleado.TipoSalario = TipoSalario;
        if (Estado !== undefined) empleado.Estado = Estado;
        if (Notas !== undefined) empleado.Notas = Notas;

        await empleado.save();
        return res.json({ success: true, empleado });
    } catch (err) {
        console.error('Error al actualizar empleado:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Eliminar empleado
router.delete('/empleados/:id', async (req, res) => {
    try {
        const empleado = await Empleado.findById(req.params.id);
        if (!empleado) {
            return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
        }
        await Empleado.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: `Empleado ${empleado.Nombre} eliminado.` });
    } catch (err) {
        console.error('Error al eliminar empleado:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────
// RELOJ CHECADOR DIARIO (ASISTENCIA & HORAS)
// ─────────────────────────────────────────────

// Obtener estado del checador para una fecha específica (por defecto hoy)
router.get('/checador/estado', async (req, res) => {
    try {
        const fecha = req.query.fecha || getFechaLocal();
        const empleados = await Empleado.find({ Estado: 'Activo' }).sort({ Nombre: 1 });
        const asistencias = await Asistencia.find({ Fecha: fecha });

        // Mapear cada empleado con su registro del día si existe
        const resultado = empleados.map(emp => {
            const registro = asistencias.find(a => String(a.Id_Empleado) === String(emp._id));
            let estadoChecador = 'Sin Registro';
            let horasLlevadas = 0;

            if (registro) {
                estadoChecador = registro.Estado;
                if (registro.Estado === 'En Turno' && registro.HoraEntrada) {
                    const ahora = new Date();
                    const diffMs = ahora.getTime() - new Date(registro.HoraEntrada).getTime();
                    horasLlevadas = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
                } else if (registro.HorasTrabajadas) {
                    horasLlevadas = registro.HorasTrabajadas;
                }
            }

            return {
                empleado: emp,
                registro: registro || null,
                estadoChecador,
                horasLlevadas
            };
        });

        return res.json({ success: true, fecha, estado: resultado });
    } catch (err) {
        console.error('Error al obtener estado del checador:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Marcar Entrada (Check-In)
router.post('/checador/check-in', async (req, res) => {
    try {
        const { Id_Empleado, Fecha, HoraEntrada, Notas } = req.body;
        if (!Id_Empleado) {
            return res.status(400).json({ success: false, message: 'Se requiere el ID del empleado' });
        }

        const empleado = await Empleado.findById(Id_Empleado);
        if (!empleado) {
            return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
        }

        const fechaTurno = Fecha || getFechaLocal();

        // Verificar si ya tiene un turno abierto hoy
        const existente = await Asistencia.findOne({
            Id_Empleado,
            Fecha: fechaTurno,
            Estado: 'En Turno'
        });

        if (existente) {
            return res.status(400).json({ 
                success: false, 
                message: `${empleado.Nombre} ya tiene una entrada registrada hoy a las ${new Date(existente.HoraEntrada).toLocaleTimeString('es-MX')}.` 
            });
        }

        const entrada = HoraEntrada ? new Date(HoraEntrada) : new Date();

        const nuevaAsistencia = new Asistencia({
            Id_Empleado,
            Nombre_Empleado: empleado.Nombre,
            Puesto: empleado.Puesto,
            Fecha: fechaTurno,
            HoraEntrada: entrada,
            SalarioPorHoraAlMomento: empleado.SalarioPorHora || 0,
            Estado: 'En Turno',
            Notas: Notas || ''
        });

        await nuevaAsistencia.save();

        return res.status(201).json({
            success: true,
            message: `Entrada registrada para ${empleado.Nombre} a las ${entrada.toLocaleTimeString('es-MX')}`,
            asistencia: nuevaAsistencia
        });
    } catch (err) {
        console.error('Error en check-in:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Marcar Salida (Check-Out)
router.post('/checador/check-out', async (req, res) => {
    try {
        const { Id_Empleado, AsistenciaId, HoraSalida, MinutosAlmuerzoDescanso, Notas } = req.body;

        let asistencia = null;
        if (AsistenciaId) {
            asistencia = await Asistencia.findById(AsistenciaId);
        } else if (Id_Empleado) {
            // Buscar turno activo de hoy
            asistencia = await Asistencia.findOne({
                Id_Empleado,
                Estado: 'En Turno'
            }).sort({ HoraEntrada: -1 });
        }

        if (!asistencia) {
            return res.status(404).json({ 
                success: false, 
                message: 'No se encontró un turno activo pendiente de salida para este empleado.' 
            });
        }

        const salida = HoraSalida ? new Date(HoraSalida) : new Date();
        const entrada = new Date(asistencia.HoraEntrada);

        // Minutos de descanso / comida a descontar
        const descansoMin = Number(MinutosAlmuerzoDescanso) || 0;
        const totalMs = Math.max(0, salida.getTime() - entrada.getTime() - (descansoMin * 60 * 1000));
        const totalHorasDecimal = Math.round((totalMs / (1000 * 60 * 60)) * 100) / 100;

        // Horas ordinarias (hasta 8 hrs) y horas extras (después de 8 hrs)
        const horasRegulares = Math.min(8, totalHorasDecimal);
        const horasExtras = Math.max(0, Math.round((totalHorasDecimal - 8) * 100) / 100);

        const sueldoHora = asistencia.SalarioPorHoraAlMomento || 0;
        // Horas extras se pagan a tiempo regular o doble según tarifa (aquí 1.5x)
        const montoTotalTurno = Math.round((horasRegulares * sueldoHora + horasExtras * sueldoHora * 1.5) * 100) / 100;

        asistencia.HoraSalida = salida;
        asistencia.HorasTrabajadas = totalHorasDecimal;
        asistencia.HorasExtras = horasExtras;
        asistencia.MinutosAlmuerzoDescanso = descansoMin;
        asistencia.MontoTotalTurno = montoTotalTurno;
        asistencia.Estado = 'Finalizado';
        if (Notas) asistencia.Notas = (asistencia.Notas ? asistencia.Notas + ' | ' : '') + Notas;

        await asistencia.save();

        return res.json({
            success: true,
            message: `Salida registrada para ${asistencia.Nombre_Empleado}. Total: ${totalHorasDecimal} horas trabajadas (${horasExtras} extras).`,
            asistencia
        });
    } catch (err) {
        console.error('Error en check-out:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Registro manual de asistencia / horas (para ajustes pasados)
router.post('/asistencias/manual', async (req, res) => {
    try {
        const { Id_Empleado, Fecha, HoraEntrada, HoraSalida, MinutosAlmuerzoDescanso, HorasManuales, Notas, Estado } = req.body;
        if (!Id_Empleado || !Fecha) {
            return res.status(400).json({ success: false, message: 'Id_Empleado y Fecha son obligatorios' });
        }

        const empleado = await Empleado.findById(Id_Empleado);
        if (!empleado) {
            return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
        }

        let totalHoras = 0;
        let entrada = null;
        let salida = null;

        if (HoraEntrada && HoraSalida) {
            entrada = new Date(HoraEntrada);
            salida = new Date(HoraSalida);
            const descansoMin = Number(MinutosAlmuerzoDescanso) || 0;
            const diffMs = Math.max(0, salida.getTime() - entrada.getTime() - (descansoMin * 60 * 1000));
            totalHoras = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        } else if (HorasManuales !== undefined) {
            totalHoras = Number(HorasManuales) || 0;
            entrada = new Date(`${Fecha}T08:00:00`);
            const endHour = 8 + Math.floor(totalHoras);
            const endMin = Math.round((totalHoras % 1) * 60);
            salida = new Date(`${Fecha}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`);
        }

        const horasRegulares = Math.min(8, totalHoras);
        const horasExtras = Math.max(0, Math.round((totalHoras - 8) * 100) / 100);
        const sueldoHora = empleado.SalarioPorHora || 0;
        const montoTotalTurno = Math.round((horasRegulares * sueldoHora + horasExtras * sueldoHora * 1.5) * 100) / 100;

        const nuevaAsistencia = new Asistencia({
            Id_Empleado,
            Nombre_Empleado: empleado.Nombre,
            Puesto: empleado.Puesto,
            Fecha,
            HoraEntrada: entrada || new Date(),
            HoraSalida: salida,
            HorasTrabajadas: totalHoras,
            HorasExtras: horasExtras,
            MinutosAlmuerzoDescanso: Number(MinutosAlmuerzoDescanso) || 0,
            SalarioPorHoraAlMomento: sueldoHora,
            MontoTotalTurno: montoTotalTurno,
            Estado: Estado || (salida ? 'Finalizado' : 'En Turno'),
            Notas: Notas || 'Registro manual'
        });

        await nuevaAsistencia.save();
        return res.status(201).json({ success: true, asistencia: nuevaAsistencia });
    } catch (err) {
        console.error('Error al registrar asistencia manual:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Modificar registro de asistencia existente
router.put('/asistencias/:id', async (req, res) => {
    try {
        const { HoraEntrada, HoraSalida, HorasTrabajadas, MinutosAlmuerzoDescanso, Estado, Notas } = req.body;
        const registro = await Asistencia.findById(req.params.id);
        if (!registro) {
            return res.status(404).json({ success: false, message: 'Registro no encontrado' });
        }

        if (HoraEntrada) registro.HoraEntrada = new Date(HoraEntrada);
        if (HoraSalida) registro.HoraSalida = new Date(HoraSalida);
        if (MinutosAlmuerzoDescanso !== undefined) registro.MinutosAlmuerzoDescanso = Number(MinutosAlmuerzoDescanso) || 0;
        if (Estado) registro.Estado = Estado;
        if (Notas !== undefined) registro.Notas = Notas;

        if (HorasTrabajadas !== undefined) {
            registro.HorasTrabajadas = Number(HorasTrabajadas);
        } else if (registro.HoraEntrada && registro.HoraSalida) {
            const diffMs = Math.max(0, new Date(registro.HoraSalida).getTime() - new Date(registro.HoraEntrada).getTime() - ((registro.MinutosAlmuerzoDescanso || 0) * 60 * 1000));
            registro.HorasTrabajadas = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        }

        const regular = Math.min(8, registro.HorasTrabajadas);
        registro.HorasExtras = Math.max(0, Math.round((registro.HorasTrabajadas - 8) * 100) / 100);
        const sueldoH = registro.SalarioPorHoraAlMomento || 0;
        registro.MontoTotalTurno = Math.round((regular * sueldoH + registro.HorasExtras * sueldoH * 1.5) * 100) / 100;

        await registro.save();
        return res.json({ success: true, asistencia: registro });
    } catch (err) {
        console.error('Error al editar asistencia:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Eliminar registro de asistencia
router.delete('/asistencias/:id', async (req, res) => {
    try {
        await Asistencia.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: 'Registro de asistencia eliminado.' });
    } catch (err) {
        console.error('Error al eliminar asistencia:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Obtener historial de asistencias con filtros
router.get('/asistencias', async (req, res) => {
    try {
        const { fechaInicio, fechaFin, idEmpleado, puesto } = req.query;
        let query = {};

        if (fechaInicio && fechaFin) {
            query.Fecha = { $gte: fechaInicio, $lte: fechaFin };
        } else if (fechaInicio) {
            query.Fecha = fechaInicio;
        }

        if (idEmpleado) {
            query.Id_Empleado = idEmpleado;
        }

        if (puesto) {
            query.Puesto = puesto;
        }

        const registros = await Asistencia.find(query).sort({ Fecha: -1, HoraEntrada: -1 });
        return res.json({ success: true, asistencias: registros });
    } catch (err) {
        console.error('Error al listar asistencias:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────
// REPORTE DE HORAS & NÓMINA POR PERIODO
// ─────────────────────────────────────────────
router.get('/reporte-horas', async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        let query = { Estado: { $ne: 'Falta' } };

        if (fechaInicio && fechaFin) {
            query.Fecha = { $gte: fechaInicio, $lte: fechaFin };
        }

        const registros = await Asistencia.find(query);
        const empleados = await Empleado.find().sort({ Nombre: 1 });

        // Agrupar totales por empleado
        const reporte = empleados.map(emp => {
            const turnos = registros.filter(r => String(r.Id_Empleado) === String(emp._id));
            const totalHoras = Math.round(turnos.reduce((acc, t) => acc + (t.HorasTrabajadas || 0), 0) * 100) / 100;
            const totalExtras = Math.round(turnos.reduce((acc, t) => acc + (t.HorasExtras || 0), 0) * 100) / 100;
            const diasTrabajados = turnos.filter(t => (t.HorasTrabajadas || 0) > 0).length;
            const totalPagar = Math.round(turnos.reduce((acc, t) => acc + (t.MontoTotalTurno || 0), 0) * 100) / 100;

            return {
                empleado: emp,
                turnosCount: turnos.length,
                diasTrabajados,
                totalHoras,
                horasRegulares: Math.max(0, Math.round((totalHoras - totalExtras) * 100) / 100),
                totalExtras,
                totalPagar
            };
        });

        const granTotalHoras = Math.round(reporte.reduce((acc, r) => acc + r.totalHoras, 0) * 100) / 100;
        const granTotalPagar = Math.round(reporte.reduce((acc, r) => acc + r.totalPagar, 0) * 100) / 100;

        return res.json({
            success: true,
            periodo: { fechaInicio, fechaFin },
            reporte,
            granTotalHoras,
            granTotalPagar
        });
    } catch (err) {
        console.error('Error al generar reporte de horas:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
