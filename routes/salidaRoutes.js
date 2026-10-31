const express = require('express');
const router = express.Router();
const Salida = require('../models/Salida');
const Producto = require('../models/Producto');
const Servicio = require('../models/Servicio');
const { getNextSequenceValue } = require('../utils/counter');

// GET all salidas with filters
router.get('/', async (req, res) => {
    try {
        const { tipo, search, from, to } = req.query;
        let query = {};

        if (tipo && tipo !== 'Todos') {
            query.TipoSalida = tipo;
        }

        if (search) {
            query.$or = [
                { Folio: { $regex: search, $options: 'i' } },
                { Nombre_Producto: { $regex: search, $options: 'i' } },
                { DestinoTrabajo: { $regex: search, $options: 'i' } },
                { Solicitante: { $regex: search, $options: 'i' } },
                { Nombre_Cliente: { $regex: search, $options: 'i' } },
                { Folio_Servicio: { $regex: search, $options: 'i' } }
            ];
        }

        if (from || to) {
            query.Fecha = {};
            if (from) {
                const f = new Date(from);
                f.setHours(0, 0, 0, 0);
                query.Fecha.$gte = f;
            }
            if (to) {
                const t = new Date(to);
                t.setHours(23, 59, 59, 999);
                query.Fecha.$lte = t;
            }
        }

        const salidas = await Salida.find(query).sort({ Fecha: -1 }).limit(300);
        return res.json(salidas);
    } catch (err) {
        console.error('Error al obtener salidas:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener salidas: ' + err.message });
    }
});

// GET aggregated statistics of oil and outputs
router.get('/stats', async (req, res) => {
    try {
        const { from, to } = req.query;
        let dateQuery = { Estado: 'Registrada' };

        if (from || to) {
            dateQuery.Fecha = {};
            if (from) {
                const f = new Date(from);
                f.setHours(0, 0, 0, 0);
                dateQuery.Fecha.$gte = f;
            }
            if (to) {
                const t = new Date(to);
                t.setHours(23, 59, 59, 999);
                dateQuery.Fecha.$lte = t;
            }
        }

        const salidas = await Salida.find(dateQuery);

        let totalLitrosAceite = 0;
        let totalSalidas = salidas.length;
        let valorTotal = 0;
        const desglosePorAceite = {};
        const desglosePorTipo = {};

        for (const s of salidas) {
            const cant = Number(s.Cantidad) || 0;
            const total = Number(s.Total) || 0;
            valorTotal += total;

            const isOil = (s.UnidadMedida === 'Litros') || 
                          (s.Nombre_Producto && s.Nombre_Producto.toLowerCase().includes('aceite')) ||
                          (s.TipoSalida === 'Despacho de Aceite a Granel');

            if (isOil) {
                totalLitrosAceite += cant;
                const prodKey = s.Nombre_Producto.trim();
                desglosePorAceite[prodKey] = (desglosePorAceite[prodKey] || 0) + cant;
            }

            const tipoKey = s.TipoSalida || 'Otro';
            desglosePorTipo[tipoKey] = (desglosePorTipo[tipoKey] || 0) + cant;
        }

        return res.json({
            success: true,
            totalSalidas,
            totalLitrosAceite: Math.round(totalLitrosAceite * 100) / 100,
            valorTotal: Math.round(valorTotal * 100) / 100,
            desglosePorAceite,
            desglosePorTipo
        });
    } catch (err) {
        console.error('Error al calcular estadísticas de salidas:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener estadísticas: ' + err.message });
    }
});

// GET single salida
router.get('/:id', async (req, res) => {
    try {
        const salida = await Salida.findById(req.params.id);
        if (!salida) {
            return res.status(404).json({ success: false, message: 'Salida no encontrada' });
        }
        return res.json({ success: true, salida });
    } catch (err) {
        console.error('Error al obtener salida:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// POST new salida (Despacho de aceite o material para trabajo)
router.post('/', async (req, res) => {
    try {
        const {
            TipoSalida,
            Id_Producto,
            Nombre_Producto,
            Cantidad,
            UnidadMedida,
            PrecioUnitario,
            DestinoTrabajo,
            Id_Servicio,
            Nombre_Cliente,
            Solicitante,
            Observaciones
        } = req.body;

        const cantNum = parseFloat(Cantidad);
        if (!cantNum || cantNum <= 0) {
            return res.status(400).json({ success: false, message: 'La cantidad debe ser mayor a 0' });
        }

        let prod = null;
        let nombre = Nombre_Producto;
        let codigo = '';
        let costo = 0;
        let precio = parseFloat(PrecioUnitario) || 0;
        let unidad = UnidadMedida || 'Litros';

        if (Id_Producto) {
            prod = await Producto.findById(Id_Producto);
            if (prod) {
                nombre = prod.Nombre;
                codigo = prod.Numero || prod.Codigo_Barras || '';
                costo = prod.Precio_Compra || 0;
                if (!precio) precio = prod.Precio_venta || 0;
                if (!UnidadMedida && prod.Unidad_Medida) unidad = prod.Unidad_Medida;
            }
        }

        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ success: false, message: 'Debe especificar el nombre del producto o material' });
        }

        const seq = await getNextSequenceValue('salida_folio');
        const Folio = 'SAL-' + seq.toString().padStart(5, '0');
        const total = Math.round(cantNum * precio * 100) / 100;

        let folioServicio = '';
        if (Id_Servicio) {
            const srv = await Servicio.findById(Id_Servicio);
            if (srv) {
                folioServicio = srv.Folio || '';
            }
        }

        const nuevaSalida = new Salida({
            Folio,
            Fecha: new Date(),
            TipoSalida: TipoSalida || 'Despacho de Aceite a Granel',
            Id_Producto: prod ? prod._id : undefined,
            Codigo_Producto: codigo,
            Nombre_Producto: nombre,
            Cantidad: cantNum,
            UnidadMedida: unidad,
            PrecioUnitario: precio,
            CostoUnitario: costo,
            Total: total,
            DestinoTrabajo: DestinoTrabajo || '',
            Id_Servicio: Id_Servicio || undefined,
            Folio_Servicio: folioServicio,
            Nombre_Cliente: Nombre_Cliente || '',
            Solicitante: Solicitante || 'Taller Principal',
            Observaciones: Observaciones || '',
            Id_Usuario: req.user ? req.user._id : undefined
        });

        await nuevaSalida.save();

        // Descontar del inventario si está registrado en el catálogo
        if (prod) {
            await Producto.findByIdAndUpdate(prod._id, {
                $inc: { Stock: -cantNum }
            });
        }

        return res.status(201).json({
            success: true,
            message: `Salida ${Folio} registrada exitosamente (${cantNum} ${unidad} de ${nombre})`,
            salida: nuevaSalida
        });
    } catch (err) {
        console.error('Error al registrar salida:', err);
        return res.status(500).json({ success: false, message: 'Error al registrar salida: ' + err.message });
    }
});

// DELETE / Cancelar salida y reponer stock
router.delete('/:id', async (req, res) => {
    try {
        const salida = await Salida.findById(req.params.id);
        if (!salida) {
            return res.status(404).json({ success: false, message: 'Salida no encontrada' });
        }

        if (salida.Estado === 'Cancelada') {
            return res.status(400).json({ success: false, message: 'Esta salida ya se encuentra cancelada' });
        }

        // Reponer stock si tenía producto vinculado
        if (salida.Id_Producto) {
            await Producto.findByIdAndUpdate(salida.Id_Producto, {
                $inc: { Stock: salida.Cantidad }
            });
        }

        salida.Estado = 'Cancelada';
        await salida.save();

        return res.json({
            success: true,
            message: `Salida ${salida.Folio} cancelada y stock devuelto exitosamente.`,
            salida
        });
    } catch (err) {
        console.error('Error al cancelar salida:', err);
        return res.status(500).json({ success: false, message: 'Error al cancelar salida: ' + err.message });
    }
});

module.exports = router;
