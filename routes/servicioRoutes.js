const express = require('express');
const router = express.Router();
const Servicio = require('../models/Servicio');
const Filtro = require('../models/Filtro');
const Producto = require('../models/Producto');
const Venta = require('../models/Venta');
const Salida = require('../models/Salida');
const { getNextSequenceValue } = require('../utils/counter');

// GET all service orders
router.get('/', async (req, res) => {
    try {
        const { estado, q, esTorno } = req.query;
        let filter = {};

        if (estado && estado !== 'Todos') {
            filter.Estado = estado;
        }

        if (esTorno === 'true') {
            filter.EsTrabajoTorno = true;
        } else if (esTorno === 'false') {
            filter.EsTrabajoTorno = { $ne: true };
        }

        if (q) {
            filter.$or = [
                { Folio: { $regex: q, $options: 'i' } },
                { Nombre_Cliente: { $regex: q, $options: 'i' } },
                { Marca: { $regex: q, $options: 'i' } },
                { Modelo: { $regex: q, $options: 'i' } },
                { TipoServicio: { $regex: q, $options: 'i' } },
                { 'DetallesTorno.TipoPieza': { $regex: q, $options: 'i' } },
                { 'DetallesTorno.MaterialUsado': { $regex: q, $options: 'i' } }
            ];
        }

        const services = await Servicio.find(filter).sort({ FechaIngreso: -1 });
        return res.json(services);
    } catch (err) {
        console.error('Error al obtener servicios:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener servicios: ' + err.message });
    }
});

// GET filter catalog lookup by machine name / part number
router.get('/filters/lookup', async (req, res) => {
    try {
        const { q } = req.query;
        let filter = {};
        if (q) {
            filter.$or = [
                { Nombre_Maquina: { $regex: q, $options: 'i' } },
                { Numero: { $regex: q, $options: 'i' } },
                { Numero_Original: { $regex: q, $options: 'i' } },
                { Nombre_Filtro: { $regex: q, $options: 'i' } }
            ];
        }
        const filtros = await Filtro.find(filter).limit(30);
        return res.json(filtros);
    } catch (err) {
        console.error('Error en lookup de filtros:', err);
        return res.status(500).json({ success: false, message: 'Error al buscar filtros: ' + err.message });
    }
});

// GET service formatted for Facturación SAT CFDI 4.0
router.get('/:id/to-factura', async (req, res) => {
    try {
        const srv = await Servicio.findById(req.params.id);
        if (!srv) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }

        const items = [];

        // Concepto Mano de Obra de Taller
        if (srv.CostoManoDeObra > 0) {
            items.push({
                ClaveProdServ: (srv.EsTrabajoTorno && !srv.CostoTorno) ? '73151600' : '78181500', // Torno o Mantenimiento
                Descripcion: (srv.EsTrabajoTorno && !srv.CostoTorno)
                    ? `Trabajo de Torno y Maquinado: ${srv.DetallesTorno?.TipoPieza || srv.TipoServicio} (${srv.DetallesTorno?.MaterialUsado || 'Acero/Bronce'}) - ${srv.DetallesTorno?.Dimensiones || ''}`.trim()
                    : `Servicio de Taller / Mano de Obra: ${srv.TipoServicio} (${srv.Marca} ${srv.Modelo})`.trim(),
                Cantidad: 1,
                ClaveUnidad: 'E48',
                Unidad: 'Servicio',
                ValorUnitario: srv.CostoManoDeObra,
                Importe: srv.CostoManoDeObra,
                Descuento: srv.Descuento || 0,
                IVA: Math.round(Math.max(0, srv.CostoManoDeObra - (srv.Descuento || 0)) * 0.16 * 100) / 100
            });
        }

        // Concepto Trabajo de Torno si viene en el mismo servicio (combinado)
        if (srv.CostoTorno > 0) {
            items.push({
                ClaveProdServ: '73151600', // Torno y Maquinados SAT
                Descripcion: `Trabajo de Torno y Maquinado: ${srv.DetallesTorno?.TipoPieza || 'Pieza Maquinada / Fabricación'} (${srv.DetallesTorno?.MaterialUsado || 'Acero/Bronce'}) - ${srv.DetallesTorno?.Dimensiones || ''}`.trim(),
                Cantidad: 1,
                ClaveUnidad: 'E48',
                Unidad: 'Servicio',
                ValorUnitario: srv.CostoTorno,
                Importe: srv.CostoTorno,
                Descuento: 0,
                IVA: Math.round(srv.CostoTorno * 0.16 * 100) / 100
            });
        }

        // Repuestos / Materiales / Litros de Aceite
        for (const r of srv.Repuestos) {
            const isAceite = (r.Nombre || '').toLowerCase().includes('aceite') || (r.Unidad || '').toLowerCase().includes('litro');
            items.push({
                ClaveProdServ: isAceite ? '15121500' : '40161505', // Lubricantes o Filtros/Refacciones
                Descripcion: `${r.Nombre} ${r.Unidad && r.Unidad !== 'Pieza' ? '(' + r.Unidad + ')' : ''}`.trim(),
                Cantidad: r.Cantidad,
                ClaveUnidad: r.Unidad === 'Litros' ? 'LTR' : 'H87',
                Unidad: r.Unidad || 'Pieza',
                ValorUnitario: r.PrecioUnitario,
                Importe: r.Subtotal,
                Descuento: 0,
                IVA: Math.round(r.Subtotal * 0.16 * 100) / 100
            });
        }

        return res.json({
            success: true,
            servicio: srv,
            cliente: {
                Nombre: srv.Nombre_Cliente,
                Telefono: srv.Telefono_Cliente,
                Email: srv.Email_Cliente
            },
            items,
            subtotal: srv.CostoManoDeObra + (srv.CostoTorno || 0) + srv.SubtotalRepuestos,
            descuento: srv.Descuento || 0,
            total: srv.TotalServicio
        });
    } catch (err) {
        console.error('Error al preparar datos para factura:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// GET historial de trabajos por cliente
router.get('/historial-cliente', async (req, res) => {
    try {
        const { nombre } = req.query;
        if (!nombre || nombre.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Proporciona al menos 2 caracteres del nombre del cliente.' });
        }

        const servicios = await Servicio.find({
            Nombre_Cliente: { $regex: nombre.trim(), $options: 'i' }
        }).sort({ FechaIngreso: -1 });

        // Agrupar por nombre normalizado
        const grupos = {};
        for (const s of servicios) {
            const key = s.Nombre_Cliente.trim().toUpperCase();
            if (!grupos[key]) {
                grupos[key] = {
                    nombre: s.Nombre_Cliente,
                    telefono: s.Telefono_Cliente || '',
                    email: s.Email_Cliente || '',
                    trabajos: [],
                    totalGastado: 0,
                    pendientePago: 0,
                    maquinaria: new Set()
                };
            }
            grupos[key].trabajos.push(s);
            grupos[key].totalGastado += s.TotalServicio || 0;
            if (s.Estado !== 'Entregado') {
                grupos[key].pendientePago += s.TotalServicio || 0;
            }
            if (s.Marca && s.Modelo) {
                grupos[key].maquinaria.add(`${s.Marca} ${s.Modelo}`.trim());
            }
        }

        // Convertir Sets a Arrays
        const result = Object.values(grupos).map(g => ({
            ...g,
            maquinaria: Array.from(g.maquinaria)
        }));

        return res.json({ success: true, clientes: result, total: servicios.length });
    } catch (err) {
        console.error('Error al obtener historial de cliente:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// GET cuentas por cobrar del taller (trabajos no entregados / sin cobrar)
router.get('/cuentas-por-cobrar', async (req, res) => {
    try {
        const servicios = await Servicio.find({
            Estado: { $nin: ['Entregado', 'Cancelado'] }
        }).sort({ FechaIngreso: 1 }); // más antiguo primero

        // Agrupar por cliente
        const grupos = {};
        for (const s of servicios) {
            const key = s.Nombre_Cliente.trim().toUpperCase();
            if (!grupos[key]) {
                grupos[key] = {
                    nombre: s.Nombre_Cliente,
                    telefono: s.Telefono_Cliente || '',
                    trabajos: [],
                    totalPendiente: 0,
                    diasMaximo: 0
                };
            }
            const diasTranscurridos = Math.floor((Date.now() - new Date(s.FechaIngreso).getTime()) / (1000 * 60 * 60 * 24));
            grupos[key].trabajos.push({
                ...s.toObject(),
                diasTranscurridos
            });
            grupos[key].totalPendiente += s.TotalServicio || 0;
            if (diasTranscurridos > grupos[key].diasMaximo) {
                grupos[key].diasMaximo = diasTranscurridos;
            }
        }

        const result = Object.values(grupos).sort((a, b) => b.diasMaximo - a.diasMaximo);
        const totalGeneral = result.reduce((acc, g) => acc + g.totalPendiente, 0);

        return res.json({ success: true, clientes: result, totalGeneral, totalServicios: servicios.length });
    } catch (err) {
        console.error('Error al obtener cuentas por cobrar:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// GET single service by ID
router.get('/:id', async (req, res) => {
    try {
        const service = await Servicio.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }
        return res.json({ success: true, servicio: service });
    } catch (err) {
        console.error('Error al obtener orden de servicio:', err);
        return res.status(500).json({ success: false, message: 'Error al obtener orden de servicio: ' + err.message });
    }
});

// POST new service order or lathe job
router.post('/', async (req, res) => {
    try {
        const {
            Nombre_Cliente,
            Telefono_Cliente,
            Email_Cliente,
            TipoEquipo,
            Marca,
            Modelo,
            SeriePlacas,
            HorometroKM,
            TipoServicio,
            TecnicoResponsable,
            Prioridad,
            CostoManoDeObra,
            CostoTorno,
            IncluyeTorno,
            Descuento,
            Repuestos,
            FechaEstimadaEntrega,
            DiagnosticoInicial,
            Observaciones,
            EsTrabajoTorno,
            DetallesTorno
        } = req.body;

        if (!Nombre_Cliente) {
            return res.status(400).json({ success: false, message: 'El nombre del cliente es obligatorio' });
        }

        // Si es trabajo de torno, marca y modelo pueden ser automáticos
        const finalMarca = Marca || (EsTrabajoTorno ? 'Torno y Maquinados' : 'General');
        const finalModelo = Modelo || (EsTrabajoTorno ? (DetallesTorno?.TipoPieza || 'Pieza a Fabricar') : 'Agrícola');

        const seq = await getNextSequenceValue('servicio_folio');
        const prefix = EsTrabajoTorno ? 'TRN-' : 'SRV-';
        const Folio = prefix + seq.toString().padStart(5, '0');

        let SubtotalRepuestos = 0;
        const formattedRepuestos = (Repuestos || []).map(r => {
            const cant = parseFloat(r.Cantidad) || 1;
            const precio = parseFloat(r.PrecioUnitario) || 0;
            const sub = Math.round(cant * precio * 100) / 100;
            SubtotalRepuestos += sub;
            return {
                Id_Producto: r.Id_Producto || undefined,
                Codigo: r.Codigo || '',
                Nombre: r.Nombre,
                Cantidad: cant,
                Unidad: r.Unidad || 'Pieza',
                PrecioUnitario: precio,
                Subtotal: sub
            };
        });

        const manoObra = parseFloat(CostoManoDeObra) || 0;
        const costoTorno = parseFloat(CostoTorno) || 0;
        const desc = parseFloat(Descuento) || 0;
        const TotalServicio = Math.max(0, manoObra + costoTorno + SubtotalRepuestos - desc);

        const newService = new Servicio({
            Folio,
            Nombre_Cliente,
            Telefono_Cliente: Telefono_Cliente || '',
            Email_Cliente: Email_Cliente || '',
            EsTrabajoTorno: !!EsTrabajoTorno,
            IncluyeTorno: !!IncluyeTorno || costoTorno > 0,
            DetallesTorno: DetallesTorno || {},
            TipoEquipo: TipoEquipo || (EsTrabajoTorno ? 'Torno / Maquinado' : 'Tractor'),
            Marca: finalMarca,
            Modelo: finalModelo,
            SeriePlacas: SeriePlacas || '',
            HorometroKM: HorometroKM || '',
            TipoServicio: TipoServicio || (EsTrabajoTorno ? 'Trabajo de Torno y Maquinado' : 'Cambio de Filtros'),
            TecnicoResponsable: TecnicoResponsable || (EsTrabajoTorno ? 'Tornero Responsable' : 'Taller Principal'),
            Prioridad: Prioridad || 'Normal',
            CostoManoDeObra: manoObra,
            CostoTorno: costoTorno,
            SubtotalRepuestos,
            Descuento: desc,
            TotalServicio,
            Repuestos: formattedRepuestos,
            FechaEstimadaEntrega: FechaEstimadaEntrega ? new Date(FechaEstimadaEntrega) : undefined,
            DiagnosticoInicial: DiagnosticoInicial || '',
            Observaciones: Observaciones || ''
        });

        await newService.save();

        // Descontar inventario y registrar Salida para control de aceite / taller
        for (const item of formattedRepuestos) {
            if (item.Id_Producto) {
                await Producto.findByIdAndUpdate(item.Id_Producto, {
                    $inc: { Stock: -item.Cantidad }
                });

                try {
                    const seqSal = await getNextSequenceValue('salida_folio');
                    const folSal = 'SAL-' + seqSal.toString().padStart(5, '0');
                    const salidaItem = new Salida({
                        Folio: folSal,
                        Fecha: new Date(),
                        TipoSalida: EsTrabajoTorno ? 'Material para Torno' : 'Salida para Trabajo en Taller',
                        Id_Producto: item.Id_Producto,
                        Codigo_Producto: item.Codigo,
                        Nombre_Producto: item.Nombre,
                        Cantidad: item.Cantidad,
                        UnidadMedida: item.Unidad || 'Pieza',
                        PrecioUnitario: item.PrecioUnitario,
                        Total: item.Subtotal,
                        DestinoTrabajo: `${newService.Folio} - ${newService.Nombre_Cliente} (${newService.Marca} ${newService.Modelo})`,
                        Id_Servicio: newService._id,
                        Folio_Servicio: newService.Folio,
                        Nombre_Cliente: newService.Nombre_Cliente,
                        Solicitante: newService.TecnicoResponsable,
                        Observaciones: `Salida de material para trabajo ${newService.Folio}`
                    });
                    await salidaItem.save();
                } catch (e) {
                    console.warn('Error al auto-registrar Salida:', e.message);
                }
            }
        }

        return res.status(201).json({ success: true, servicio: newService });
    } catch (err) {
        console.error('Error al registrar orden de servicio:', err);
        return res.status(500).json({ success: false, message: 'Error al registrar orden de servicio: ' + err.message });
    }
});

// PUT update service order
router.put('/:id', async (req, res) => {
    try {
        const {
            Estado,
            TrabajosRealizados,
            Observaciones,
            DiagnosticoInicial,
            CostoManoDeObra,
            Descuento,
            Repuestos,
            TecnicoResponsable,
            Prioridad,
            FechaEstimadaEntrega,
            Nombre_Cliente,
            Telefono_Cliente,
            Email_Cliente,
            TipoEquipo,
            Marca,
            Modelo,
            SeriePlacas,
            HorometroKM,
            TipoServicio,
            EsTrabajoTorno,
            DetallesTorno
        } = req.body;

        const service = await Servicio.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }

        const isContentEdit = (
            Repuestos !== undefined ||
            CostoManoDeObra !== undefined ||
            Descuento !== undefined ||
            DiagnosticoInicial !== undefined ||
            Observaciones !== undefined ||
            Nombre_Cliente !== undefined ||
            Marca !== undefined ||
            Modelo !== undefined
        );

        if (service.Estado === 'Entregado' && isContentEdit) {
            return res.status(400).json({
                success: false,
                message: 'No se puede editar una orden ya entregada y cobrada.'
            });
        }

        if (Estado) {
            service.Estado = Estado;
            if (Estado === 'Completado' && !service.FechaCompletado) {
                service.FechaCompletado = new Date();
            }
            if (Estado === 'Entregado' && !service.FechaEntrega) {
                service.FechaEntrega = new Date();
            }
        }

        if (TrabajosRealizados !== undefined) service.TrabajosRealizados = TrabajosRealizados;
        if (Observaciones !== undefined) service.Observaciones = Observaciones;
        if (DiagnosticoInicial !== undefined) service.DiagnosticoInicial = DiagnosticoInicial;
        if (TecnicoResponsable !== undefined) service.TecnicoResponsable = TecnicoResponsable;
        if (Prioridad !== undefined) service.Prioridad = Prioridad;
        if (FechaEstimadaEntrega !== undefined) service.FechaEstimadaEntrega = FechaEstimadaEntrega;
        if (Nombre_Cliente !== undefined) service.Nombre_Cliente = Nombre_Cliente;
        if (Telefono_Cliente !== undefined) service.Telefono_Cliente = Telefono_Cliente;
        if (Email_Cliente !== undefined) service.Email_Cliente = Email_Cliente;
        if (TipoEquipo !== undefined) service.TipoEquipo = TipoEquipo;
        if (Marca !== undefined) service.Marca = Marca;
        if (Modelo !== undefined) service.Modelo = Modelo;
        if (SeriePlacas !== undefined) service.SeriePlacas = SeriePlacas;
        if (HorometroKM !== undefined) service.HorometroKM = HorometroKM;
        if (TipoServicio !== undefined) service.TipoServicio = TipoServicio;
        if (EsTrabajoTorno !== undefined) service.EsTrabajoTorno = EsTrabajoTorno;
        if (DetallesTorno !== undefined) service.DetallesTorno = { ...(service.DetallesTorno || {}), ...DetallesTorno };

        if (CostoManoDeObra !== undefined) service.CostoManoDeObra = parseFloat(CostoManoDeObra) || 0;
        if (CostoTorno !== undefined) service.CostoTorno = parseFloat(CostoTorno) || 0;
        if (IncluyeTorno !== undefined) service.IncluyeTorno = !!IncluyeTorno;
        if (Descuento !== undefined) service.Descuento = parseFloat(Descuento) || 0;

        // Si se actualizan repuestos, recalcular y ajustar inventario por diferencia
        if (Repuestos && Array.isArray(Repuestos)) {
            const qtyKey = (r) => r.Id_Producto ? String(r.Id_Producto) : null;
            const oldQty = {};
            (service.Repuestos || []).forEach(r => {
                const key = qtyKey(r);
                if (!key) return;
                oldQty[key] = (oldQty[key] || 0) + (parseFloat(r.Cantidad) || 0);
            });

            let SubtotalRepuestos = 0;
            service.Repuestos = Repuestos.map(r => {
                const cant = parseFloat(r.Cantidad) || 1;
                const precio = parseFloat(r.PrecioUnitario) || 0;
                const sub = Math.round(cant * precio * 100) / 100;
                SubtotalRepuestos += sub;
                return {
                    Id_Producto: r.Id_Producto || undefined,
                    Codigo: r.Codigo || '',
                    Nombre: r.Nombre,
                    Cantidad: cant,
                    Unidad: r.Unidad || 'Pieza',
                    PrecioUnitario: precio,
                    Subtotal: sub
                };
            });
            service.SubtotalRepuestos = SubtotalRepuestos;

            const newQty = {};
            service.Repuestos.forEach(r => {
                const key = qtyKey(r);
                if (!key) return;
                newQty[key] = (newQty[key] || 0) + (parseFloat(r.Cantidad) || 0);
            });

            const allIds = new Set([...Object.keys(oldQty), ...Object.keys(newQty)]);
            for (const id of allIds) {
                const delta = (newQty[id] || 0) - (oldQty[id] || 0);
                if (delta !== 0) {
                    await Producto.findByIdAndUpdate(id, { $inc: { Stock: -delta } });
                }
            }
        }

        service.TotalServicio = Math.max(0, (service.CostoManoDeObra || 0) + (service.CostoTorno || 0) + (service.SubtotalRepuestos || 0) - (service.Descuento || 0));

        await service.save();
        return res.json({ success: true, servicio: service });
    } catch (err) {
        console.error('Error al actualizar orden de servicio:', err);
        return res.status(500).json({ success: false, message: 'Error al actualizar orden de servicio: ' + err.message });
    }
});

// POST deliver and generate sale / ticket
router.post('/:id/deliver', async (req, res) => {
    try {
        const service = await Servicio.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }

        const { MetodoPago, PagoDetalles, MontoPago } = req.body;

        const seqVenta = await getNextSequenceValue('venta_folio');
        const FolioVenta = 'V' + seqVenta.toString().padStart(5, '0');

        const detallesVenta = [];

        // 1. Agregar las refacciones, filtros y aceites
        for (const r of service.Repuestos) {
            detallesVenta.push({
                Id_Producto: r.Id_Producto || undefined,
                Concepto: `${r.Nombre} ${r.Unidad && r.Unidad !== 'Pieza' ? '(' + r.Cantidad + ' ' + r.Unidad + ')' : ''}`.trim(),
                Precio_Venta: r.PrecioUnitario,
                Cantidad: r.Cantidad,
                MontoTotal: r.Subtotal
            });
        }

        // 2. Agregar la Mano de Obra de Taller
        if (service.CostoManoDeObra > 0) {
            const conceptoMO = (service.EsTrabajoTorno && !service.CostoTorno)
                ? `Trabajo de Torno: ${service.DetallesTorno?.TipoPieza || service.TipoServicio}`
                : `Mano de Obra / Taller: ${service.TipoServicio} (${service.Marca} ${service.Modelo})`;

            detallesVenta.push({
                Concepto: conceptoMO,
                Precio_Venta: service.CostoManoDeObra,
                Cantidad: 1,
                MontoTotal: service.CostoManoDeObra
            });
        }

        // 3. Agregar Trabajo de Torno si viene en el mismo servicio (combinado)
        if (service.CostoTorno > 0) {
            detallesVenta.push({
                Concepto: `Trabajo de Torno y Maquinado: ${service.DetallesTorno?.TipoPieza || 'Pieza Maquinada'}`,
                Precio_Venta: service.CostoTorno,
                Cantidad: 1,
                MontoTotal: service.CostoTorno
            });
        }

        const totalVenta = service.TotalServicio;
        const pago = MontoPago ? parseFloat(MontoPago) : totalVenta;
        const cambio = Math.max(0, pago - totalVenta);

        const newSale = new Venta({
            Nombre_Cliente: service.Nombre_Cliente,
            Tipodedocumento: (service.CostoManoDeObra > 0 && service.CostoTorno > 0)
                ? 'Nota de Taller y Torno'
                : (service.EsTrabajoTorno ? 'Nota de Trabajo de Torno' : 'Ticket de Servicio / Remisión'),
            Numero_Cliente: service.Telefono_Cliente,
            Folio: FolioVenta,
            MetodoPago: MetodoPago || 'Efectivo',
            PagoDetalles: PagoDetalles || {},
            Subtotal: (service.CostoManoDeObra || 0) + (service.CostoTorno || 0) + (service.SubtotalRepuestos || 0),
            Descuento: service.Descuento,
            MontoTotal: totalVenta,
            MontoPago: pago,
            MontoCambio: cambio,
            Detalles: detallesVenta
        });

        await newSale.save();

        service.Estado = 'Entregado';
        service.FechaEntrega = new Date();
        service.Id_Venta = newSale._id;
        await service.save();

        return res.json({
            success: true,
            message: `Servicio ${service.Folio} entregado y cobrado en Nota/Venta ${FolioVenta}`,
            servicio: service,
            venta: newSale
        });
    } catch (err) {
        console.error('Error al entregar servicio:', err);
        return res.status(500).json({ success: false, message: 'Error al entregar servicio: ' + err.message });
    }
});

// DELETE service order
router.delete('/:id', async (req, res) => {
    try {
        const service = await Servicio.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Orden de servicio no encontrada' });
        }

        // Devolver stock de repuestos si no fue entregada
        if (service.Estado !== 'Entregado') {
            for (const item of service.Repuestos) {
                if (item.Id_Producto) {
                    await Producto.findByIdAndUpdate(item.Id_Producto, {
                        $inc: { Stock: item.Cantidad }
                    });
                }
            }
        }

        await Servicio.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: `Orden ${service.Folio} eliminada correctamente` });
    } catch (err) {
        console.error('Error al eliminar orden de servicio:', err);
        return res.status(500).json({ success: false, message: 'Error al eliminar orden de servicio: ' + err.message });
    }
});

module.exports = router;
