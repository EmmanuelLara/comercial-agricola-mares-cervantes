import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { exportToExcel } from '../utils/excelUtils';
import {
  BarChart2,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  Printer,
  Receipt,
  ShoppingCart,
  Tractor,
  Wrench,
  Package,
  FileText,
  Droplets,
  Cog,
  CheckCircle2,
  Clock
} from 'lucide-react';

const PRESETS = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta Semana' },
  { id: 'month', label: 'Este Mes' },
  { id: 'year', label: 'Este Año' },
  { id: 'custom', label: 'Personalizado' }
];

const money = (n) => `$${(Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const toInputDate = (d) => {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
};

const rangeForPreset = (preset, customFrom, customTo) => {
  const now = new Date();
  if (preset === 'today') return { from: startOfDay(now), to: endOfDay(now) };
  if (preset === 'week') {
    const from = startOfDay(now);
    const day = from.getDay();
    const diff = day === 0 ? 6 : day - 1;
    from.setDate(from.getDate() - diff);
    return { from, to: endOfDay(now) };
  }
  if (preset === 'month') {
    return { from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: endOfDay(now) };
  }
  if (preset === 'year') {
    return { from: startOfDay(new Date(now.getFullYear(), 0, 1)), to: endOfDay(now) };
  }
  const from = customFrom ? startOfDay(customFrom) : startOfDay(now);
  const to = customTo ? endOfDay(customTo) : endOfDay(now);
  return { from, to };
};

const inRange = (dateVal, from, to) => {
  if (!dateVal) return false;
  const d = new Date(dateVal);
  return d >= from && d <= to;
};

const Reportes = () => {
  const [sales, setSales] = useState([]);
  const [services, setServices] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('month');
  const [customFrom, setCustomFrom] = useState(toInputDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [customTo, setCustomTo] = useState(toInputDate(new Date()));
  const [tab, setTab] = useState('salidas'); // 'salidas' | 'materiales' | 'torno' | 'ventas' | 'servicios' | 'inventario'

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sRes, srvRes, qRes, salRes] = await Promise.all([
          api.get('/sales').then(r => r.data).catch(() => []),
          api.get('/services').then(r => r.data).catch(() => []),
          api.get('/quotes').then(r => r.data).catch(() => []),
          api.get('/salidas').then(r => r.data).catch(() => [])
        ]);
        setSales(Array.isArray(sRes) ? sRes : []);
        setServices(Array.isArray(srvRes) ? srvRes : []);
        setQuotes(Array.isArray(qRes) ? qRes : []);
        setSalidas(Array.isArray(salRes) ? salRes : []);
      } catch (err) {
        console.error('Error al cargar reportes:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const { from, to } = useMemo(
    () => rangeForPreset(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  );

  const periodLabel = `${from.toLocaleDateString('es-MX')} — ${to.toLocaleDateString('es-MX')}`;

  const filteredSales = useMemo(
    () => sales.filter(s => inRange(s.FechaRegistro, from, to)),
    [sales, from, to]
  );
  const filteredServices = useMemo(
    () => services.filter(s => inRange(s.FechaIngreso, from, to)),
    [services, from, to]
  );
  const filteredQuotes = useMemo(
    () => quotes.filter(q => inRange(q.FechaRegistro, from, to)),
    [quotes, from, to]
  );
  const filteredSalidas = useMemo(
    () => salidas.filter(s => inRange(s.Fecha, from, to)),
    [salidas, from, to]
  );

  // Estadísticas de Salidas de Aceite y Materiales
  const salidasStats = useMemo(() => {
    let totalLitrosAceite = 0;
    let totalValor = 0;
    const porAceite = {};
    const porTipo = {};
    const porSolicitante = {};

    filteredSalidas.forEach(s => {
      if (s.Estado === 'Cancelada') return;
      const cant = Number(s.Cantidad) || 0;
      const tot = Number(s.Total) || 0;
      totalValor += tot;

      const isOil = (s.UnidadMedida === 'Litros') || 
                    (s.Nombre_Producto && s.Nombre_Producto.toLowerCase().includes('aceite')) ||
                    (s.TipoSalida === 'Despacho de Aceite a Granel');

      if (isOil) {
        totalLitrosAceite += cant;
        const nombre = s.Nombre_Producto.trim();
        if (!porAceite[nombre]) porAceite[nombre] = { litros: 0, count: 0, valor: 0 };
        porAceite[nombre].litros += cant;
        porAceite[nombre].count += 1;
        porAceite[nombre].valor += tot;
      }

      const tipo = s.TipoSalida || 'Otro';
      if (!porTipo[tipo]) porTipo[tipo] = { count: 0, valor: 0 };
      porTipo[tipo].count += 1;
      porTipo[tipo].valor += tot;

      const solicitante = s.Solicitante || 'Taller Principal';
      if (!porSolicitante[solicitante]) porSolicitante[solicitante] = { count: 0, litros: 0 };
      porSolicitante[solicitante].count += 1;
      if (isOil) porSolicitante[solicitante].litros += cant;
    });

    return {
      totalLitrosAceite: Math.round(totalLitrosAceite * 100) / 100,
      totalSalidas: filteredSalidas.filter(s => s.Estado !== 'Cancelada').length,
      totalValor,
      porAceite,
      porTipo,
      porSolicitante
    };
  }, [filteredSalidas]);

  // Estadísticas de Trabajos de Torno
  const tornoServices = useMemo(() => {
    return filteredServices.filter(s => s.EsTrabajoTorno);
  }, [filteredServices]);

  const tornoStats = useMemo(() => {
    const total = tornoServices.reduce((acc, s) => acc + (Number(s.TotalServicio) || 0), 0);
    const mo = tornoServices.reduce((acc, s) => acc + (Number(s.CostoManoDeObra) || 0), 0);
    const rep = tornoServices.reduce((acc, s) => acc + (Number(s.SubtotalRepuestos) || 0), 0);
    const porPieza = {};

    tornoServices.forEach(s => {
      const pieza = s.DetallesTorno?.TipoPieza || 'Pieza Especial';
      if (!porPieza[pieza]) porPieza[pieza] = { count: 0, total: 0 };
      porPieza[pieza].count += 1;
      porPieza[pieza].total += Number(s.TotalServicio) || 0;
    });

    return { total, mo, rep, count: tornoServices.length, porPieza };
  }, [tornoServices]);

  // Materiales Llevados por Trabajo (Agrupados)
  const materialesLlevados = useMemo(() => {
    return filteredServices.map(srv => {
      const items = (srv.Repuestos || []).map(r => `${r.Cantidad} ${r.Unidad || ''} de ${r.Nombre}`.trim());
      return {
        id: srv._id,
        folio: srv.Folio,
        fecha: srv.FechaIngreso,
        cliente: srv.Nombre_Cliente,
        equipo: srv.EsTrabajoTorno ? `⚙️ Torno: ${srv.DetallesTorno?.TipoPieza || srv.TipoServicio}` : `${srv.TipoEquipo || ''} ${srv.Marca || ''} ${srv.Modelo || ''}`.trim(),
        itemsTexto: items.length > 0 ? items.join(', ') : 'Sin refacciones cargadas (Solo mano de obra)',
        cantItems: srv.Repuestos?.length || 0,
        subtotalRepuestos: srv.SubtotalRepuestos || 0,
        manoObra: srv.CostoManoDeObra || 0,
        total: srv.TotalServicio || 0,
        estado: srv.Estado
      };
    });
  }, [filteredServices]);

  const ventasStats = useMemo(() => {
    const total = filteredSales.reduce((acc, s) => acc + (Number(s.MontoTotal) || 0), 0);
    const count = filteredSales.length;
    const avg = count ? total / count : 0;
    const byMethod = { Efectivo: 0, Tarjeta: 0, Transferencia: 0, Mixto: 0, Otro: 0 };
    filteredSales.forEach(s => {
      const amount = Number(s.MontoTotal) || 0;
      const method = s.MetodoPago || 'Efectivo';
      if (method === 'Mixto' && s.PagoDetalles) {
        byMethod.Efectivo += Number(s.PagoDetalles.Efectivo) || 0;
        byMethod.Tarjeta += Number(s.PagoDetalles.Tarjeta) || 0;
        byMethod.Transferencia += Number(s.PagoDetalles.Transferencia) || 0;
      } else if (method === 'Efectivo') byMethod.Efectivo += amount;
      else if (String(method).toLowerCase().includes('tarjeta')) byMethod.Tarjeta += amount;
      else if (String(method).toLowerCase().includes('transfer')) byMethod.Transferencia += amount;
      else if (method === 'Mixto') byMethod.Mixto += amount;
      else byMethod.Otro += amount;
    });
    const quotesTotal = filteredQuotes.reduce((acc, q) => acc + (Number(q.MontoTotal) || 0), 0);
    return { total, count, avg, byMethod, quotesCount: filteredQuotes.length, quotesTotal };
  }, [filteredSales, filteredQuotes]);

  const serviciosStats = useMemo(() => {
    const agricolas = filteredServices.filter(s => !s.EsTrabajoTorno);
    const labor = agricolas.reduce((acc, s) => acc + (Number(s.CostoManoDeObra) || 0), 0);
    const parts = agricolas.reduce((acc, s) => acc + (Number(s.SubtotalRepuestos) || 0), 0);
    const total = agricolas.reduce((acc, s) => acc + (Number(s.TotalServicio) || 0), 0);
    const byTipo = {};
    const byMarca = {};
    agricolas.forEach(s => {
      const tipo = s.TipoEquipo || 'Otro';
      const marca = s.Marca || 'Sin marca';
      if (!byTipo[tipo]) byTipo[tipo] = { count: 0, total: 0 };
      byTipo[tipo].count += 1;
      byTipo[tipo].total += Number(s.TotalServicio) || 0;
      if (!byMarca[marca]) byMarca[marca] = { count: 0, total: 0 };
      byMarca[marca].count += 1;
      byMarca[marca].total += Number(s.TotalServicio) || 0;
    });
    return { labor, parts, total, count: agricolas.length, byTipo, byMarca };
  }, [filteredServices]);

  const inventoryStats = useMemo(() => {
    const map = {};
    const bump = (key, nombre, codigo, qty, monto, origen) => {
      if (!key) return;
      if (!map[key]) {
        map[key] = { nombre, codigo: codigo || '—', qty: 0, monto: 0, origen };
      }
      map[key].qty += Number(qty) || 0;
      map[key].monto += Number(monto) || 0;
    };
    filteredSales.forEach(sale => {
      (sale.Detalles || []).forEach(det => {
        const id = det.Id_Producto?._id || det.Id_Producto;
        const nombre = det.Concepto || det.Nombre_Producto || 'Producto';
        bump(id ? String(id) : `n:${nombre}`, nombre, det.Codigo_Producto, det.Cantidad, det.MontoTotal, 'Venta');
      });
    });
    filteredServices.forEach(srv => {
      (srv.Repuestos || []).forEach(r => {
        const id = r.Id_Producto?._id || r.Id_Producto;
        bump(id ? String(id) : `n:${r.Nombre}`, r.Nombre, r.Codigo, r.Cantidad, r.Subtotal, srv.EsTrabajoTorno ? 'Torno' : 'Taller');
      });
    });
    filteredSalidas.forEach(sal => {
      if (sal.Estado === 'Cancelada') return;
      const id = sal.Id_Producto?._id || sal.Id_Producto;
      bump(id ? String(id) : `sal:${sal.Nombre_Producto}`, sal.Nombre_Producto, sal.Codigo_Producto, sal.Cantidad, sal.Total, 'Salida Almacén');
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [filteredSales, filteredServices, filteredSalidas]);

  const handleExportExcel = () => {
    if (tab === 'salidas') {
      exportToExcel(
        filteredSalidas.map(s => ({
          Folio: s.Folio,
          Fecha: s.Fecha ? new Date(s.Fecha).toLocaleString('es-MX') : '',
          TipoSalida: s.TipoSalida,
          Producto: s.Nombre_Producto,
          Cantidad: s.Cantidad,
          Unidad: s.UnidadMedida,
          DestinoTrabajo: s.DestinoTrabajo,
          Solicitante: s.Solicitante,
          ValorTotal: s.Total,
          Estado: s.Estado
        })),
        [
          { key: 'Folio', label: 'Folio' },
          { key: 'Fecha', label: 'Fecha' },
          { key: 'TipoSalida', label: 'Tipo de Salida' },
          { key: 'Producto', label: 'Producto / Aceite' },
          { key: 'Cantidad', label: 'Cantidad' },
          { key: 'Unidad', label: 'Unidad' },
          { key: 'DestinoTrabajo', label: 'Destino / Trabajo' },
          { key: 'Solicitante', label: 'Solicitante' },
          { key: 'ValorTotal', label: 'Valor ($)' },
          { key: 'Estado', label: 'Estado' }
        ],
        'reporte_salidas_aceite',
        'Salidas y Aceite'
      );
    } else if (tab === 'materiales') {
      exportToExcel(
        materialesLlevados.map(m => ({
          Folio: m.folio,
          Fecha: m.fecha ? new Date(m.fecha).toLocaleDateString('es-MX') : '',
          Cliente: m.cliente,
          Equipo: m.equipo,
          MaterialesLlevados: m.itemsTexto,
          ManoDeObra: m.manoObra,
          Insumos: m.subtotalRepuestos,
          Total: m.total,
          Estado: m.estado
        })),
        [
          { key: 'Folio', label: 'Folio' },
          { key: 'Fecha', label: 'Fecha' },
          { key: 'Cliente', label: 'Cliente' },
          { key: 'Equipo', label: 'Equipo / Torno' },
          { key: 'MaterialesLlevados', label: 'Insumos y Litros Llevados' },
          { key: 'Insumos', label: 'Total Insumos ($)' },
          { key: 'ManoDeObra', label: 'Mano de Obra ($)' },
          { key: 'Total', label: 'Total Trabajo ($)' },
          { key: 'Estado', label: 'Estado' }
        ],
        'reporte_materiales_llevados_trabajos',
        'Materiales por Trabajo'
      );
    } else if (tab === 'torno') {
      exportToExcel(
        tornoServices.map(s => ({
          Folio: s.Folio,
          Fecha: s.FechaIngreso ? new Date(s.FechaIngreso).toLocaleDateString('es-MX') : '',
          Cliente: s.Nombre_Cliente,
          Pieza: s.DetallesTorno?.TipoPieza || s.TipoServicio,
          Material: s.DetallesTorno?.MaterialUsado || '',
          Dimensiones: s.DetallesTorno?.Dimensiones || '',
          HorasTorno: s.DetallesTorno?.HorasTorno || 0,
          ManoObra: s.CostoManoDeObra,
          Insumos: s.SubtotalRepuestos,
          Total: s.TotalServicio,
          Estado: s.Estado
        })),
        [
          { key: 'Folio', label: 'Folio' },
          { key: 'Fecha', label: 'Fecha' },
          { key: 'Cliente', label: 'Cliente' },
          { key: 'Pieza', label: 'Pieza Maquinada' },
          { key: 'Material', label: 'Material' },
          { key: 'Dimensiones', label: 'Dimensiones' },
          { key: 'HorasTorno', label: 'Horas Torno' },
          { key: 'ManoObra', label: 'Mano de Obra ($)' },
          { key: 'Insumos', label: 'Insumos / Barras ($)' },
          { key: 'Total', label: 'Total ($)' },
          { key: 'Estado', label: 'Estado' }
        ],
        'reporte_trabajos_torno',
        'Torno'
      );
    } else if (tab === 'ventas') {
      exportToExcel(
        filteredSales.map(s => ({
          Folio: s.Folio,
          Fecha: s.FechaRegistro ? new Date(s.FechaRegistro).toLocaleString('es-MX') : '',
          Cliente: s.Nombre_Cliente,
          Documento: s.Tipodedocumento,
          MetodoPago: s.MetodoPago,
          Subtotal: s.Subtotal,
          Descuento: s.Descuento,
          Total: s.MontoTotal
        })),
        [
          { key: 'Folio', label: 'Folio' },
          { key: 'Fecha', label: 'Fecha' },
          { key: 'Cliente', label: 'Cliente' },
          { key: 'Documento', label: 'Documento' },
          { key: 'MetodoPago', label: 'Método de Pago' },
          { key: 'Subtotal', label: 'Subtotal' },
          { key: 'Descuento', label: 'Descuento' },
          { key: 'Total', label: 'Total' }
        ],
        'reporte_ventas',
        'Ventas'
      );
    } else if (tab === 'servicios') {
      exportToExcel(
        filteredServices.filter(s => !s.EsTrabajoTorno).map(s => ({
          Folio: s.Folio,
          Fecha: s.FechaIngreso ? new Date(s.FechaIngreso).toLocaleDateString('es-MX') : '',
          Cliente: s.Nombre_Cliente,
          Equipo: `${s.TipoEquipo || ''} ${s.Marca || ''} ${s.Modelo || ''}`.trim(),
          Servicio: s.TipoServicio,
          Estado: s.Estado,
          ManoObra: s.CostoManoDeObra,
          Repuestos: s.SubtotalRepuestos,
          Total: s.TotalServicio
        })),
        [
          { key: 'Folio', label: 'Folio' },
          { key: 'Fecha', label: 'Fecha' },
          { key: 'Cliente', label: 'Cliente' },
          { key: 'Equipo', label: 'Equipo' },
          { key: 'Servicio', label: 'Servicio' },
          { key: 'Estado', label: 'Estado' },
          { key: 'ManoObra', label: 'Mano de Obra' },
          { key: 'Repuestos', label: 'Repuestos' },
          { key: 'Total', label: 'Total' }
        ],
        'reporte_servicios',
        'Servicios'
      );
    } else {
      exportToExcel(
        inventoryStats.map(p => ({
          Producto: p.nombre,
          Codigo: p.codigo,
          Cantidad: p.qty,
          Monto: p.monto,
          Origen: p.origen
        })),
        [
          { key: 'Producto', label: 'Producto' },
          { key: 'Codigo', label: 'Código' },
          { key: 'Cantidad', label: 'Cantidad' },
          { key: 'Monto', label: 'Monto' },
          { key: 'Origen', label: 'Origen' }
        ],
        'reporte_rotacion_inventario',
        'Inventario'
      );
    }
  };

  const pillStyle = (active, customColor = null) => ({
    padding: '0.55rem 1.1rem',
    borderRadius: '20px',
    border: '1px solid #cbd5e1',
    background: active ? (customColor || 'var(--primary)') : 'var(--white)',
    color: active ? 'white' : 'var(--text-main)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  });

  return (
    <div>
      <div className="no-print">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>Punto de Reportes y Auditoría Operativa</h2>
            <p style={{ color: 'var(--text-muted)' }}>Despacho de aceite, insumos por trabajo, maquinados de torno, ventas y taller • {periodLabel}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button className="btn btn-secondary" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileSpreadsheet size={18} /> Exportar Excel
            </button>
            <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={18} /> Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Selector de Fechas y Periodos */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.2rem', alignItems: 'center' }}>
          <Calendar size={18} color="#64748b" />
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => setPreset(p.id)} style={pillStyle(preset === p.id)}>
              {p.label}
            </button>
          ))}
          {preset === 'custom' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ padding: '0.45rem 0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              <span style={{ color: '#64748b' }}>a</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ padding: '0.45rem 0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
          )}
        </div>

        {/* Pestañas del Punto de Reportes */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setTab('salidas')} style={pillStyle(tab === 'salidas', '#0284c7')}>
            <Droplets size={16} /> Salidas y Despacho de Aceite ({filteredSalidas.length})
          </button>
          <button onClick={() => setTab('materiales')} style={pillStyle(tab === 'materiales', '#16a34a')}>
            <Package size={16} /> Materiales Llevados por Trabajo ({materialesLlevados.length})
          </button>
          <button onClick={() => setTab('torno')} style={pillStyle(tab === 'torno', '#7c3aed')}>
            <Cog size={16} /> Trabajos de Torno ({tornoServices.length})
          </button>
          <button onClick={() => setTab('ventas')} style={pillStyle(tab === 'ventas')}>
            <ShoppingCart size={16} /> Ventas y Facturación
          </button>
          <button onClick={() => setTab('servicios')} style={pillStyle(tab === 'servicios')}>
            <Wrench size={16} /> Taller Agrícola
          </button>
          <button onClick={() => setTab('inventario')} style={pillStyle(tab === 'inventario')}>
            <BarChart2 size={16} /> Rotación de Inventario
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando reportes...</div>
      ) : (
        <div className="printable-report">
          <div className="print-only" style={{ display: 'none' }}>
            <h2>Comercial Agrícola Mares Cervantes — Reporte de Operación</h2>
            <p>Periodo: {periodLabel} • Sección: {
              tab === 'salidas' ? 'Despacho y Salidas de Aceite' :
              tab === 'materiales' ? 'Materiales e Insumos Llevados para Trabajos' :
              tab === 'torno' ? 'Trabajos de Torno y Maquinados' :
              tab === 'ventas' ? 'Ventas Mostrador' :
              tab === 'servicios' ? 'Servicios de Taller' : 'Rotación de Inventario'
            }</p>
          </div>

          {/* ── REPORTE 1: SALIDAS Y DESPACHO DE ACEITE ── */}
          {tab === 'salidas' && (
            <>
              <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <Kpi title="Litros de Aceite Despachados" value={`${salidasStats.totalLitrosAceite} Lts`} icon={<Droplets size={22} />} color="#0284c7" bg="#e0f2fe" />
                <Kpi title="Total Registros de Salida" value={salidasStats.totalSalidas} icon={<FileText size={22} />} color="#16a34a" bg="#dcfce7" />
                <Kpi title="Valor Total de Insumos" value={money(salidasStats.totalValor)} icon={<DollarSign size={22} />} color="#d97706" bg="#fef3c7" />
                <Kpi title="Tipos de Lubricante" value={Object.keys(salidasStats.porAceite).length} icon={<Package size={22} />} color="#7c3aed" bg="#ede9fe" />
              </div>

              {/* Desglose de litros por tipo de aceite */}
              <h4 style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Droplets size={18} color="#0284c7" /> Resumen de Litros Despachados por Aceite / Lubricante:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
                {Object.entries(salidasStats.porAceite).length === 0 ? (
                  <div style={{ background: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius)', color: 'var(--text-muted)' }}>
                    No hay despachos de aceite registrados en este periodo.
                  </div>
                ) : (
                  Object.entries(salidasStats.porAceite).map(([nombre, info]) => (
                    <div key={nombre} style={{ background: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #0284c7' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{nombre}</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7', marginTop: 4 }}>
                        {info.litros} Litros
                      </div>
                      <small style={{ color: '#64748b' }}>{info.count} salida(s) • {money(info.valor)}</small>
                    </div>
                  ))
                )}
              </div>

              <h4 style={{ marginBottom: '0.8rem' }}>Bitácora Detallada de Salidas y Despachos:</h4>
              <DataTable
                headers={['Folio', 'Fecha', 'Tipo de Salida', 'Producto / Lubricante', 'Cantidad', 'Destino / Trabajo', 'Solicitante', 'Total', 'Estado']}
                empty="No hay salidas registradas en el periodo seleccionado."
                rows={filteredSalidas.map(s => [
                  s.Folio,
                  s.Fecha ? new Date(s.Fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '',
                  s.TipoSalida,
                  s.Nombre_Producto,
                  `${s.Cantidad} ${s.UnidadMedida}`,
                  s.DestinoTrabajo || 'Consumo Taller',
                  s.Solicitante || 'Taller',
                  money(s.Total),
                  s.Estado
                ])}
              />
            </>
          )}

          {/* ── REPORTE 2: MATERIALES LLEVADOS POR TRABAJO ── */}
          {tab === 'materiales' && (
            <>
              <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <Kpi title="Órdenes con Materiales" value={materialesLlevados.filter(m => m.cantItems > 0).length} icon={<Package size={22} />} color="#16a34a" bg="#dcfce7" />
                <Kpi title="Total Costo Insumos Llevados" value={money(materialesLlevados.reduce((a, b) => a + b.subtotalRepuestos, 0))} icon={<DollarSign size={22} />} color="#0284c7" bg="#e0f2fe" />
                <Kpi title="Total Mano de Obra" value={money(materialesLlevados.reduce((a, b) => a + b.manoObra, 0))} icon={<Wrench size={22} />} color="#d97706" bg="#fef3c7" />
                <Kpi title="Monto Total Trabajos" value={money(materialesLlevados.reduce((a, b) => a + b.total, 0))} icon={<CheckCircle2 size={22} />} color="#7c3aed" bg="#ede9fe" />
              </div>

              <h4 style={{ marginBottom: '0.8rem' }}>Relación de qué se llevó para cada trabajo / servicio:</h4>
              <DataTable
                headers={['Folio', 'Fecha', 'Cliente', 'Equipo / Torno', 'Insumos, Filtros y Aceites Llevados', 'Insumos ($)', 'Mano Obra ($)', 'Total', 'Estado']}
                empty="No hay órdenes de servicio en el periodo seleccionado."
                rows={materialesLlevados.map(m => [
                  m.folio,
                  m.fecha ? new Date(m.fecha).toLocaleDateString('es-MX') : '',
                  m.cliente,
                  m.equipo,
                  m.itemsTexto,
                  money(m.subtotalRepuestos),
                  money(m.manoObra),
                  money(m.total),
                  m.estado
                ])}
              />
            </>
          )}

          {/* ── REPORTE 3: TRABAJOS DE TORNO Y MAQUINADOS ── */}
          {tab === 'torno' && (
            <>
              <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <Kpi title="Total Facturado en Torno" value={money(tornoStats.total)} icon={<DollarSign size={22} />} color="#7c3aed" bg="#ede9fe" />
                <Kpi title="Mano de Obra / Maquinado" value={money(tornoStats.mo)} icon={<Cog size={22} />} color="#0284c7" bg="#e0f2fe" />
                <Kpi title="Materiales Empleados" value={money(tornoStats.rep)} icon={<Package size={22} />} color="#16a34a" bg="#dcfce7" />
                <Kpi title="Piezas Maquinadas" value={tornoStats.count} icon={<CheckCircle2 size={22} />} color="#d97706" bg="#fef3c7" />
              </div>

              <h4 style={{ marginBottom: '0.8rem' }}>Desglose por Tipo de Pieza Torneada:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
                {Object.entries(tornoStats.porPieza).length === 0 ? (
                  <div style={{ background: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius)', color: 'var(--text-muted)' }}>
                    No hay trabajos de torno registrados en este periodo.
                  </div>
                ) : (
                  Object.entries(tornoStats.porPieza).map(([pieza, info]) => (
                    <div key={pieza} style={{ background: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #7c3aed' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{pieza}</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7c3aed', marginTop: 4 }}>
                        {money(info.total)}
                      </div>
                      <small style={{ color: '#64748b' }}>{info.count} pieza(s) fabricada(s)</small>
                    </div>
                  ))
                )}
              </div>

              <h4 style={{ marginBottom: '0.8rem' }}>Historial Detallado de Trabajos de Torno:</h4>
              <DataTable
                headers={['Folio', 'Fecha', 'Cliente', 'Pieza / Maquinado', 'Material & Medidas', 'Horas Torno', 'Mano Obra', 'Materiales', 'Total', 'Estado']}
                empty="No hay trabajos de torno registrados en este periodo."
                rows={tornoServices.map(s => [
                  s.Folio,
                  s.FechaIngreso ? new Date(s.FechaIngreso).toLocaleDateString('es-MX') : '',
                  s.Nombre_Cliente,
                  s.DetallesTorno?.TipoPieza || s.TipoServicio,
                  `${s.DetallesTorno?.MaterialUsado || 'Acero'} ${s.DetallesTorno?.Dimensiones ? '(' + s.DetallesTorno?.Dimensiones + ')' : ''}`,
                  s.DetallesTorno?.HorasTorno || 1,
                  money(s.CostoManoDeObra),
                  money(s.SubtotalRepuestos),
                  money(s.TotalServicio),
                  s.Estado
                ])}
              />
            </>
          )}

          {/* ── REPORTE 4: VENTAS Y FACTURACIÓN ── */}
          {tab === 'ventas' && (
            <>
              <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <Kpi title="Total vendido" value={money(ventasStats.total)} icon={<DollarSign size={22} />} color="#16a34a" bg="#dcfce7" />
                <Kpi title="Tickets / ventas" value={ventasStats.count} icon={<Receipt size={22} />} color="#0284c7" bg="#e0f2fe" />
                <Kpi title="Ticket promedio" value={money(ventasStats.avg)} icon={<BarChart2 size={22} />} color="#d97706" bg="#fef3c7" />
                <Kpi title="Cotizaciones" value={`${ventasStats.quotesCount} · ${money(ventasStats.quotesTotal)}`} icon={<FileText size={22} />} color="#7c3aed" bg="#ede9fe" />
              </div>

              <h4 style={{ marginBottom: '0.8rem' }}>Desglose por método de pago</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginBottom: '1.5rem' }}>
                {Object.entries(ventasStats.byMethod).filter(([k, v]) => v > 0 || ['Efectivo', 'Tarjeta', 'Transferencia'].includes(k)).map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--white)', padding: '1rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{k}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 4 }}>{money(v)}</div>
                  </div>
                ))}
              </div>

              <DataTable
                headers={['Folio', 'Fecha', 'Cliente', 'Documento', 'Pago', 'Total']}
                empty="No hay ventas en el periodo seleccionado."
                rows={filteredSales.map(s => [
                  s.Folio,
                  s.FechaRegistro ? new Date(s.FechaRegistro).toLocaleDateString('es-MX') : '',
                  s.Nombre_Cliente,
                  s.Tipodedocumento || '—',
                  s.MetodoPago || 'Efectivo',
                  money(s.MontoTotal)
                ])}
              />
            </>
          )}

          {/* ── REPORTE 5: SERVICIOS DE TALLER AGRÍCOLA ── */}
          {tab === 'servicios' && (
            <>
              <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <Kpi title="Total servicios agrícolas" value={money(serviciosStats.total)} icon={<Wrench size={22} />} color="#16a34a" bg="#dcfce7" />
                <Kpi title="Mano de obra" value={money(serviciosStats.labor)} icon={<DollarSign size={22} />} color="#0284c7" bg="#e0f2fe" />
                <Kpi title="Repuestos / filtros" value={money(serviciosStats.parts)} icon={<Package size={22} />} color="#d97706" bg="#fef3c7" />
                <Kpi title="Órdenes de tractor" value={serviciosStats.count} icon={<Tractor size={22} />} color="#7c3aed" bg="#ede9fe" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <GroupedCard title="Por tipo de maquinaria" data={serviciosStats.byTipo} />
                <GroupedCard title="Por marca de tractor" data={serviciosStats.byMarca} />
              </div>

              <DataTable
                headers={['Folio', 'Fecha', 'Cliente', 'Equipo', 'Servicio', 'Estado', 'Total']}
                empty="No hay órdenes de servicio agrícola en el periodo seleccionado."
                rows={filteredServices.filter(s => !s.EsTrabajoTorno).map(s => [
                  s.Folio,
                  s.FechaIngreso ? new Date(s.FechaIngreso).toLocaleDateString('es-MX') : '',
                  s.Nombre_Cliente,
                  `${s.Marca || ''} ${s.Modelo || ''}`.trim(),
                  s.TipoServicio,
                  s.Estado,
                  money(s.TotalServicio)
                ])}
              />
            </>
          )}

          {/* ── REPORTE 6: ROTACIÓN DE INVENTARIO ── */}
          {tab === 'inventario' && (
            <>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Productos, filtros y aceites más vendidos, despachados o utilizados en taller durante el periodo.
              </p>
              <DataTable
                headers={['Producto / Filtro / Aceite', 'Código', 'Cantidad Despachada', 'Monto Generado', 'Origen']}
                empty="No hay movimientos de inventario en el periodo seleccionado."
                rows={inventoryStats.map(p => [
                  p.nombre,
                  p.codigo,
                  p.qty,
                  money(p.monto),
                  p.origen
                ])}
              />
            </>
          )}
        </div>
      )}

      <style>{`
        @media print {
          .no-print, .sidebar, .top-bar { display: none !important; }
          .print-only { display: block !important; }
          .app-container { display: block; }
          .content { margin: 0; padding: 0; }
        }
      `}</style>
    </div>
  );
};

const Kpi = ({ title, value, icon, color, bg }) => (
  <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{title}</span>
        <h3 style={{ fontSize: '1.25rem', marginTop: '0.3rem' }}>{value}</h3>
      </div>
      <div style={{ background: bg, color, padding: '10px', borderRadius: '10px' }}>{icon}</div>
    </div>
  </div>
);

const GroupedCard = ({ title, data }) => {
  const entries = Object.entries(data || {}).sort((a, b) => b[1].count - a[1].count);
  return (
    <div style={{ background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: '1rem' }}>
      <h4 style={{ margin: '0 0 0.8rem' }}>{title}</h4>
      {entries.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin datos</p>
      ) : (
        entries.map(([name, info]) => (
          <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
            <span><strong>{name}</strong> · {info.count} orden{info.count === 1 ? '' : 'es'}</span>
            <span style={{ fontWeight: 700 }}>{money(info.total)}</span>
          </div>
        ))
      )}
    </div>
  );
};

const DataTable = ({ headers, rows, empty }) => (
  <div className="table-responsive" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <tr>
          {headers.map(h => <th key={h} style={{ padding: '0.9rem 1rem' }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr><td colSpan={headers.length} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{empty}</td></tr>
        ) : (
          rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '0.85rem 1rem', fontWeight: j === 0 ? 700 : 400, color: j === 0 ? 'var(--primary)' : 'inherit' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default Reportes;
