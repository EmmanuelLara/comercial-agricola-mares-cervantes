import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  Clock, 
  UserCheck, 
  DollarSign, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  Printer, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  Play, 
  Square, 
  FileSpreadsheet, 
  Filter, 
  Check, 
  X,
  FileText
} from 'lucide-react';

const PUESTOS = [
  'Mecánico Agrícola',
  'Tornero / Maquinados',
  'Ayudante de Taller',
  'Ventas / Mostrador',
  'Almacenista',
  'Administrador',
  'Otro'
];

const getFechaHoy = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Personal = () => {
  const [activeTab, setActiveTab] = useState('checador'); // 'checador' | 'horas' | 'empleados' | 'analizador'

  // Datos
  const [empleados, setEmpleados] = useState([]);
  const [estadoChecador, setEstadoChecador] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(getFechaHoy());
  const [loading, setLoading] = useState(false);
  const [horaActual, setHoraActual] = useState(new Date().toLocaleTimeString('es-MX'));

  // Filtros de reporte de horas
  const [filtroPeriodo, setFiltroPeriodo] = useState('semana'); // 'hoy', 'semana', 'mes', 'personalizado'
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(getFechaHoy());
  const [empleadoFiltro, setEmpleadoFiltro] = useState('all');
  const [reporteHoras, setReporteHoras] = useState(null);
  const [registrosAsistencias, setRegistrosAsistencias] = useState([]);

  // Modales
  const [showEmpleadoModal, setShowEmpleadoModal] = useState(false);
  const [empleadoForm, setEmpleadoForm] = useState({
    Nombre: '',
    Puesto: 'Mecánico Agrícola',
    Telefono: '',
    Email: '',
    SalarioPorHora: 80,
    SalarioSemanal: 0,
    TipoSalario: 'Por Hora',
    Notas: ''
  });
  const [editingEmpleadoId, setEditingEmpleadoId] = useState(null);

  // Modal Salida con minutos almuerzo
  const [checkoutModal, setCheckoutModal] = useState(null);
  const [checkoutMinutosDescanso, setCheckoutMinutosDescanso] = useState(0);
  const [checkoutNotas, setCheckoutNotas] = useState('');

  // Modal Turno Manual
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    Id_Empleado: '',
    Fecha: getFechaHoy(),
    HorasManuales: 8,
    MinutosAlmuerzoDescanso: 0,
    Notas: ''
  });

  // Modal Analizador de Tablas y Códigos
  const [tablaTexto, setTablaTexto] = useState('');
  const [analisisResultado, setAnalisisResultado] = useState(null);
  const [analizando, setAnalizando] = useState(false);

  // Reloj en vivo
  useEffect(() => {
    const timer = setInterval(() => {
      setHoraActual(new Date().toLocaleTimeString('es-MX'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchEmpleados();
    fetchChecador(fechaSeleccionada);
  }, [fechaSeleccionada]);

  useEffect(() => {
    if (activeTab === 'horas') {
      fetchReporteHoras();
    }
  }, [activeTab, fechaInicio, fechaFin, empleadoFiltro]);

  const fetchEmpleados = async () => {
    try {
      const res = await api.get('/personal/empleados');
      setEmpleados(res.data.empleados || []);
    } catch (err) {
      console.error('Error al cargar empleados:', err);
    }
  };

  const fetchChecador = async (fecha) => {
    try {
      setLoading(true);
      const res = await api.get(`/personal/checador/estado?fecha=${fecha}`);
      setEstadoChecador(res.data.estado || []);
    } catch (err) {
      console.error('Error al cargar estado del checador:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReporteHoras = async () => {
    try {
      setLoading(true);
      let params = `fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      if (empleadoFiltro !== 'all') params += `&idEmpleado=${empleadoFiltro}`;

      const [resReporte, resRegistros] = await Promise.all([
        api.get(`/personal/reporte-horas?${params}`),
        api.get(`/personal/asistencias?${params}`)
      ]);
      setReporteHoras(resReporte.data);
      setRegistrosAsistencias(resRegistros.data.asistencias || []);
    } catch (err) {
      console.error('Error al cargar reporte de horas:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Manejo de Checador ───────────────────────────
  const handleCheckIn = async (idEmpleado, nombre) => {
    try {
      const res = await api.post('/personal/checador/check-in', {
        Id_Empleado: idEmpleado,
        Fecha: fechaSeleccionada
      });
      alert(res.data.message || '¡Entrada registrada!');
      fetchChecador(fechaSeleccionada);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al registrar entrada');
    }
  };

  const handleOpenCheckOut = (registro) => {
    setCheckoutModal(registro);
    setCheckoutMinutosDescanso(0);
    setCheckoutNotas('');
  };

  const handleConfirmCheckOut = async () => {
    if (!checkoutModal) return;
    try {
      const res = await api.post('/personal/checador/check-out', {
        AsistenciaId: checkoutModal._id,
        MinutosAlmuerzoDescanso: checkoutMinutosDescanso,
        Notas: checkoutNotas
      });
      alert(res.data.message || '¡Salida registrada!');
      setCheckoutModal(null);
      fetchChecador(fechaSeleccionada);
      if (activeTab === 'horas') fetchReporteHoras();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al registrar salida');
    }
  };

  // ── Guardar / Editar Empleado ─────────────────────
  const handleSaveEmpleado = async (e) => {
    e.preventDefault();
    if (!empleadoForm.Nombre.trim()) {
      alert('Ingresa el nombre del trabajador');
      return;
    }
    try {
      if (editingEmpleadoId) {
        await api.put(`/personal/empleados/${editingEmpleadoId}`, empleadoForm);
        alert('Trabajador actualizado');
      } else {
        await api.post('/personal/empleados', empleadoForm);
        alert('Trabajador registrado exitosamente');
      }
      setShowEmpleadoModal(false);
      setEditingEmpleadoId(null);
      setEmpleadoForm({
        Nombre: '',
        Puesto: 'Mecánico Agrícola',
        Telefono: '',
        Email: '',
        SalarioPorHora: 80,
        SalarioSemanal: 0,
        TipoSalario: 'Por Hora',
        Notas: ''
      });
      fetchEmpleados();
      fetchChecador(fechaSeleccionada);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar trabajador');
    }
  };

  const handleEditEmpleado = (emp) => {
    setEditingEmpleadoId(emp._id);
    setEmpleadoForm({
      Nombre: emp.Nombre || '',
      Puesto: emp.Puesto || 'Mecánico Agrícola',
      Telefono: emp.Telefono || '',
      Email: emp.Email || '',
      SalarioPorHora: emp.SalarioPorHora || 0,
      SalarioSemanal: emp.SalarioSemanal || 0,
      TipoSalario: emp.TipoSalario || 'Por Hora',
      Notas: emp.Notas || ''
    });
    setShowEmpleadoModal(true);
  };

  const handleDeleteEmpleado = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al trabajador ${nombre}?`)) return;
    try {
      await api.delete(`/personal/empleados/${id}`);
      fetchEmpleados();
      fetchChecador(fechaSeleccionada);
    } catch (err) {
      alert('Error al eliminar trabajador');
    }
  };

  // ── Registro Manual de Horas ─────────────────────
  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!manualForm.Id_Empleado) {
      alert('Selecciona un trabajador');
      return;
    }
    try {
      await api.post('/personal/asistencias/manual', manualForm);
      alert('Turno de horas registrado con éxito');
      setShowManualModal(false);
      fetchChecador(fechaSeleccionada);
      if (activeTab === 'horas') fetchReporteHoras();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al registrar horas manuales');
    }
  };

  const handleDeleteAsistencia = async (id) => {
    if (!window.confirm('¿Eliminar este registro de turno?')) return;
    try {
      await api.delete(`/personal/asistencias/${id}`);
      fetchReporteHoras();
      fetchChecador(fechaSeleccionada);
    } catch (err) {
      alert('Error al eliminar registro');
    }
  };

  // ── Analizador de Tablas y Códigos ────────────────
  const handleAnalizarTabla = async () => {
    if (!tablaTexto.trim()) {
      alert('Pega o escribe las filas de tu tabla (Excel, CSV o texto separado por comas o tabuladores).');
      return;
    }

    setAnalizando(true);
    setAnalisisResultado(null);

    try {
      // Parsear líneas de texto (acepta TSV o CSV)
      const lineas = tablaTexto.trim().split('\n');
      const filasParsed = [];

      lineas.forEach(linea => {
        const limpia = linea.trim();
        if (!limpia) return;

        // Separar por tabuladores (Excel) o por comas
        const cols = limpia.includes('\t') ? limpia.split('\t') : limpia.split(',');
        
        // Si hay encabezado tipo "CODIGO", omitir si coincide
        if (cols[0]?.toLowerCase().includes('codigo') && cols[1]?.toLowerCase().includes('nombre')) return;

        if (cols.length >= 2) {
          filasParsed.push({
            Codigo_Barras: cols[0]?.trim() || '',
            Nombre: cols[1]?.trim() || '',
            Precio_venta: parseFloat(cols[2]) || 0,
            Stock: parseFloat(cols[3]) || 0
          });
        } else {
          filasParsed.push({
            Codigo_Barras: '',
            Nombre: cols[0]?.trim() || '',
            Precio_venta: 0,
            Stock: 0
          });
        }
      });

      const res = await api.post('/inventory/analizar-tabla', { productos: filasParsed });
      setAnalisisResultado(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al analizar tabla');
    } finally {
      setAnalizando(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="personal-page" style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* ── ENCABEZADO PRINCIPAL ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users color="var(--primary)" size={32} /> Personal & Reloj Checador
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.92rem' }}>
            Control diario de asistencia, registro de entradas/salidas y cálculo automático de horas trabajadas para el taller
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '8px', textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Hora en Vivo</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>{horaActual}</span>
          </div>

          <button 
            className="btn btn-primary"
            onClick={() => { setEditingEmpleadoId(null); setShowEmpleadoModal(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={18} /> Nuevo Trabajador
          </button>
        </div>
      </div>

      {/* ── BARRA DE PESTAÑAS ── */}
      <div style={{ display: 'flex', gap: '0.6rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('checador')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.92rem',
            background: activeTab === 'checador' ? 'var(--primary)' : '#f1f5f9',
            color: activeTab === 'checador' ? 'white' : '#475569',
            boxShadow: activeTab === 'checador' ? '0 2px 8px rgba(16, 185, 129, 0.25)' : 'none'
          }}
        >
          <Clock size={18} /> 🕒 Reloj Checador de Hoy
        </button>

        <button
          onClick={() => setActiveTab('horas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.92rem',
            background: activeTab === 'horas' ? '#0284c7' : '#f1f5f9',
            color: activeTab === 'horas' ? 'white' : '#475569',
            boxShadow: activeTab === 'horas' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none'
          }}
        >
          <DollarSign size={18} /> 📊 Detalle de Horas & Nómina
        </button>

        <button
          onClick={() => setActiveTab('empleados')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.92rem',
            background: activeTab === 'empleados' ? '#7c3aed' : '#f1f5f9',
            color: activeTab === 'empleados' ? 'white' : '#475569',
            boxShadow: activeTab === 'empleados' ? '0 2px 8px rgba(124, 58, 237, 0.25)' : 'none'
          }}
        >
          <Users size={18} /> 👥 Catálogo de Trabajadores ({empleados.length})
        </button>

        <button
          onClick={() => setActiveTab('analizador')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.92rem',
            background: activeTab === 'analizador' ? '#d97706' : '#f1f5f9',
            color: activeTab === 'analizador' ? 'white' : '#475569',
            boxShadow: activeTab === 'analizador' ? '0 2px 8px rgba(217, 119, 6, 0.25)' : 'none'
          }}
        >
          <FileSpreadsheet size={18} /> 🔍 Análisis de Tablas & Códigos
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 1: RELOJ CHECADOR DIARIO */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'checador' && (
        <div>
          {/* Barra de control de fecha */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '1rem 1.4rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar size={20} color="var(--primary)" />
              <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>Fecha del Checador:</label>
              <input 
                type="date"
                value={fechaSeleccionada}
                onChange={e => setFechaSeleccionada(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600 }}
              />
              {fechaSeleccionada === getFechaHoy() && (
                <span style={{ background: '#d1fae5', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                  HOY
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setFechaSeleccionada(getFechaHoy())}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              >
                Ir a Hoy
              </button>
              <button 
                onClick={() => setShowManualModal(true)}
                style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
              >
                + Registrar Turno Manual
              </button>
            </div>
          </div>

          {/* Grid de Trabajadores */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Cargando checador...</div>
          ) : estadoChecador.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
              <Users size={48} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
              <h3>No hay trabajadores registrados</h3>
              <p style={{ color: '#64748b' }}>Registra primero a los mecánicos y torneros en el catálogo para comenzar a checar.</p>
              <button className="btn btn-primary" onClick={() => setShowEmpleadoModal(true)}>
                + Registrar Primer Trabajador
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
              {estadoChecador.map(({ empleado, registro, estadoChecador, horasLlevadas }) => {
                const enTurno = estadoChecador === 'En Turno';
                const finalizado = estadoChecador === 'Finalizado';
                const sinRegistro = estadoChecador === 'Sin Registro';

                return (
                  <div 
                    key={empleado._id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      border: `2px solid ${enTurno ? '#10b981' : finalizado ? '#cbd5e1' : '#f1f5f9'}`,
                      boxShadow: enTurno ? '0 4px 14px rgba(16, 185, 129, 0.15)' : '0 2px 6px rgba(0,0,0,0.04)',
                      padding: '1.2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      {/* Cabecera de la tarjeta */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800, fontFamily: 'monospace' }}>{empleado.Matricula}</span>
                          <h3 style={{ margin: '2px 0 0', fontSize: '1.15rem', color: '#0f172a' }}>{empleado.Nombre}</h3>
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{empleado.Puesto}</span>
                        </div>
                        
                        {/* Estado Badge */}
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: enTurno ? '#d1fae5' : finalizado ? '#e0f2fe' : '#f1f5f9',
                          color: enTurno ? '#047857' : finalizado ? '#0369a1' : '#64748b',
                          border: `1px solid ${enTurno ? '#a7f3d0' : finalizado ? '#bae6fd' : '#e2e8f0'}`
                        }}>
                          {enTurno ? '🟢 EN TURNO' : finalizado ? '✅ FINALIZADO' : '⚪ SIN ENTRADA'}
                        </span>
                      </div>

                      {/* Detalles de Horario */}
                      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#64748b' }}>Entrada:</span>
                          <strong>{registro?.HoraEntrada ? new Date(registro.HoraEntrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '—'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#64748b' }}>Salida:</span>
                          <strong>{registro?.HoraSalida ? new Date(registro.HoraSalida).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : (enTurno ? 'En curso...' : '—')}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' }}>
                          <span style={{ color: '#64748b', fontWeight: 700 }}>Horas Trabajadas:</span>
                          <strong style={{ color: enTurno ? '#047857' : '#0f172a', fontSize: '0.95rem' }}>
                            {horasLlevadas > 0 ? `${horasLlevadas} hrs` : '0 hrs'}
                            {registro?.HorasExtras > 0 && <span style={{ color: '#d97706', fontSize: '0.75rem', marginLeft: '4px' }}>({registro.HorasExtras} extras)</span>}
                          </strong>
                        </div>
                      </div>

                      {empleado.SalarioPorHora > 0 && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>
                          Tarifa: <strong>${empleado.SalarioPorHora}/hora</strong>
                          {registro?.MontoTotalTurno > 0 && (
                            <span style={{ float: 'right', color: '#047857', fontWeight: 800 }}>Ganado hoy: ${registro.MontoTotalTurno.toFixed(2)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botones de Acción Checador */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '0.8rem' }}>
                      {sinRegistro && (
                        <button
                          onClick={() => handleCheckIn(empleado._id, empleado.Nombre)}
                          style={{
                            flex: 1,
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Play size={16} /> Marcar Entrada
                        </button>
                      )}

                      {enTurno && (
                        <button
                          onClick={() => handleOpenCheckOut(registro)}
                          style={{
                            flex: 1,
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Square size={16} /> Marcar Salida
                        </button>
                      )}

                      {finalizado && (
                        <div style={{ flex: 1, textAlign: 'center', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, padding: '4px' }}>
                          ✓ Turno completado ({registro.HorasTrabajadas} hrs)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 2: DETALLE DE HORAS & NÓMINA */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'horas' && (
        <div>
          {/* Filtros de Reporte */}
          <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Filtros de Reporte de Horas</h3>
              <button 
                onClick={handlePrint}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={16} /> Imprimir Nómina
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Desde:</label>
                <input 
                  type="date"
                  value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Hasta:</label>
                <input 
                  type="date"
                  value={fechaFin}
                  onChange={e => setFechaFin(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Trabajador:</label>
                <select 
                  value={empleadoFiltro}
                  onChange={e => setEmpleadoFiltro(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="all">Todos los trabajadores</option>
                  {empleados.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.Nombre} ({emp.Puesto})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button 
                  onClick={fetchReporteHoras}
                  style={{ width: '100%', background: 'var(--primary)', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Filtrar Reporte
                </button>
              </div>
            </div>
          </div>

          {/* Tarjetas de Resumen General */}
          {reporteHoras && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem 1.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#16a34a' }}>Total Horas Trabajadas</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
                  {reporteHoras.granTotalHoras || 0} hrs
                </div>
              </div>

              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem 1.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#d97706' }}>Registros de Asistencia</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#b45309', marginTop: '4px' }}>
                  {registrosAsistencias.length} turnos
                </div>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1rem 1.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#2563eb' }}>Total Nómina a Pagar</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1d4ed8', marginTop: '4px' }}>
                  ${(reporteHoras.granTotalPagar || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Resumen por Trabajador */}
          {reporteHoras && (
            <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '0.9rem 1.2rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
                Resumen de Horas y Nómina por Trabajador
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 12px' }}>Trabajador</th>
                    <th style={{ padding: '8px 12px' }}>Puesto</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center' }}>Días Trab.</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Horas Regulares</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Horas Extras</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Horas</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tarifa / Hr</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Pagar ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {(reporteHoras.reporte || []).map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{r.empleado.Nombre}</td>
                      <td style={{ padding: '8px 12px', color: '#64748b' }}>{r.empleado.Puesto}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{r.diasTrabajados} días</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{r.horasRegulares} hrs</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: r.totalExtras > 0 ? '#d97706' : '#64748b', fontWeight: r.totalExtras > 0 ? 700 : 400 }}>
                        {r.totalExtras} hrs
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800 }}>{r.totalHoras} hrs</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>${r.empleado.SalarioPorHora || 0}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, color: '#16a34a', fontSize: '0.95rem' }}>
                        ${r.totalPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabla de Registros Detallados Día por Día */}
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '0.9rem 1.2rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
              <span>Detalle de Turnos ({registrosAsistencias.length})</span>
            </div>
            {registrosAsistencias.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No hay registros de horas en el rango seleccionado.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 10px' }}>Fecha</th>
                    <th style={{ padding: '8px 10px' }}>Trabajador</th>
                    <th style={{ padding: '8px 10px' }}>Entrada</th>
                    <th style={{ padding: '8px 10px' }}>Salida</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Almuerzo</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Horas</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Extras</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Pago Turno</th>
                    <th style={{ padding: '8px 10px' }}>Notas</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {registrosAsistencias.map((reg) => (
                    <tr key={reg._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{reg.Fecha}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{reg.Nombre_Empleado}</td>
                      <td style={{ padding: '8px 10px' }}>
                        {reg.HoraEntrada ? new Date(reg.HoraEntrada).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {reg.HoraSalida ? new Date(reg.HoraSalida).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'En turno'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>{reg.MinutosAlmuerzoDescanso || 0} min</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>{reg.HorasTrabajadas} hrs</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: reg.HorasExtras > 0 ? '#d97706' : '#94a3b8' }}>
                        {reg.HorasExtras > 0 ? `+${reg.HorasExtras}` : '—'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                        ${(reg.MontoTotalTurno || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#64748b', fontSize: '0.8rem' }}>{reg.Notas || '—'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteAsistencia(reg._id)}
                          style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer' }}
                          title="Eliminar registro"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 3: CATÁLOGO DE TRABAJADORES */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'empleados' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
            {empleados.map(emp => (
              <div 
                key={emp._id}
                style={{
                  background: 'white',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', fontFamily: 'monospace' }}>{emp.Matricula}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: emp.Estado === 'Activo' ? '#d1fae5' : '#fee2e2',
                      color: emp.Estado === 'Activo' ? '#047857' : '#b91c1c'
                    }}>
                      {emp.Estado}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: '#0f172a' }}>{emp.Nombre}</h3>
                  <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.8rem' }}>{emp.Puesto}</div>

                  <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                    {emp.Telefono && <div>📞 {emp.Telefono}</div>}
                    <div>💰 Tarifa por hora: <strong>${emp.SalarioPorHora || 0} MXN</strong></div>
                    {emp.SalarioSemanal > 0 && <div>💵 Sueldo fijo: <strong>${emp.SalarioSemanal} semanal</strong></div>}
                    {emp.Notas && <div style={{ color: '#94a3b8', marginTop: '4px' }}>📝 {emp.Notas}</div>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '0.8rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => handleEditEmpleado(emp)}
                    style={{ flex: 1, background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Edit size={14} /> Editar
                  </button>
                  <button
                    onClick={() => handleDeleteEmpleado(emp._id, emp.Nombre)}
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 4: ANÁLISIS DE TABLAS Y RECHAZO DE CÓDIGOS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'analizador' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.8rem' }}>
          <div style={{ marginBottom: '1.2rem' }}>
            <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet color="#d97706" size={26} /> Analizador de Tablas y Validación de Códigos
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem' }}>
              Pega aquí filas copiadas de Excel o CSV. El sistema analizará cada producto y <strong>RECHAZARÁ automáticamente</strong> los códigos que estén repetidos en la tabla o que ya existan en tu inventario para no crear duplicados ni errores.
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px', color: '#334155' }}>
              Pega las filas de Excel aquí (Formato: Código [Tab] Nombre [Tab] Precio [Tab] Stock):
            </label>
            <textarea
              rows={8}
              value={tablaTexto}
              onChange={e => setTablaTexto(e.target.value)}
              placeholder={"Ejemplo:\n75010001\tFiltro de Aceite Donaldson\t185.00\t10\n75010002\tBuje Bronce 2 pulg\t350.00\t5\n75010001\tFiltro Repetido (Será RECHAZADO)\t180.00\t2"}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
            <button
              onClick={handleAnalizarTabla}
              disabled={analizando}
              style={{
                background: '#d97706',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Search size={18} /> {analizando ? 'Analizando códigos...' : 'Analizar y Validar Códigos'}
            </button>
            <button
              onClick={() => { setTablaTexto(''); setAnalisisResultado(null); }}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Limpiar
            </button>
          </div>

          {/* Resultado del Análisis */}
          {analisisResultado && (
            <div>
              {/* Tarjetas de métricas de análisis */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Total Filas Analizadas</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>{analisisResultado.totalFilas}</div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#16a34a' }}>✅ Códigos Válidos</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803d' }}>{analisisResultado.totalValidos}</div>
                </div>

                <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#ef4444' }}>❌ Códigos RECHAZADOS</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#dc2626' }}>{analisisResultado.totalRechazados}</div>
                </div>
              </div>

              {/* Lista de Códigos RECHAZADOS */}
              {analisisResultado.rechazados && analisisResultado.rechazados.length > 0 && (
                <div style={{ marginBottom: '1.5rem', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1.2rem' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={18} /> Detalle de Productos y Códigos RECHAZADOS ({analisisResultado.rechazados.length}):
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#fee2e2', color: '#991b1b', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px' }}>Fila</th>
                        <th style={{ padding: '6px 8px' }}>Código</th>
                        <th style={{ padding: '6px 8px' }}>Nombre en Tabla</th>
                        <th style={{ padding: '6px 8px' }}>Motivo del Rechazo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analisisResultado.rechazados.map((rec, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #fecaca' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 700 }}>#{rec.fila}</td>
                          <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>{rec.codigo}</td>
                          <td style={{ padding: '6px 8px' }}>{rec.nombre}</td>
                          <td style={{ padding: '6px 8px', color: '#b91c1c', fontWeight: 600 }}>⚠️ {rec.motivo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Lista de Códigos VÁLIDOS */}
              {analisisResultado.validos && analisisResultado.validos.length > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1.2rem' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={18} /> Códigos Válidos y Listos ({analisisResultado.validos.length}):
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#dcfce7', color: '#166534', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px' }}>Fila</th>
                        <th style={{ padding: '6px 8px' }}>Código</th>
                        <th style={{ padding: '6px 8px' }}>Nombre</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Precio</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right' }}>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analisisResultado.validos.map((val, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #bbf7d0' }}>
                          <td style={{ padding: '6px 8px' }}>#{val.fila}</td>
                          <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>{val.codigo}</td>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>{val.nombre}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>${val.precio.toFixed(2)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{val.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: NUEVO / EDITAR TRABAJADOR ── */}
      {showEmpleadoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '1.8rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', color: '#0f172a' }}>
              {editingEmpleadoId ? 'Editar Trabajador' : 'Registrar Nuevo Trabajador'}
            </h3>

            <form onSubmit={handleSaveEmpleado}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  Nombre Completo *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez González"
                  value={empleadoForm.Nombre}
                  onChange={e => setEmpleadoForm({ ...empleadoForm, Nombre: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                    Puesto / Especialidad *
                  </label>
                  <select
                    value={empleadoForm.Puesto}
                    onChange={e => setEmpleadoForm({ ...empleadoForm, Puesto: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    {PUESTOS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                    Teléfono
                  </label>
                  <input 
                    type="text"
                    placeholder="Ej. 449 123 4567"
                    value={empleadoForm.Telefono}
                    onChange={e => setEmpleadoForm({ ...empleadoForm, Telefono: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                    Sueldo por Hora ($) *
                  </label>
                  <input 
                    type="number"
                    step="any"
                    required
                    value={empleadoForm.SalarioPorHora}
                    onChange={e => setEmpleadoForm({ ...empleadoForm, SalarioPorHora: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                    Sueldo Semanal ($)
                  </label>
                  <input 
                    type="number"
                    step="any"
                    value={empleadoForm.SalarioSemanal}
                    onChange={e => setEmpleadoForm({ ...empleadoForm, SalarioSemanal: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  Notas u Observaciones
                </label>
                <input 
                  type="text"
                  placeholder="Ej. Experiencia en rectificado y flechas / Horario 8am a 6pm"
                  value={empleadoForm.Notas}
                  onChange={e => setEmpleadoForm({ ...empleadoForm, Notas: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowEmpleadoModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}
                >
                  Guardar Trabajador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRMAR SALIDA (CHECK-OUT) ── */}
      {checkoutModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '1.8rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>Registrar Salida de Turno</h3>
            <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.9rem' }}>
              Trabajador: <strong>{checkoutModal.Nombre_Empleado}</strong>
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                Minutos de Almuerzo / Comida (se descuentan del total):
              </label>
              <input 
                type="number"
                min="0"
                value={checkoutMinutosDescanso}
                onChange={e => setCheckoutMinutosDescanso(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                placeholder="Ej. 60 minutos"
              />
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                Notas del turno:
              </label>
              <input 
                type="text"
                value={checkoutNotas}
                onChange={e => setCheckoutNotas(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                placeholder="Ej. Se terminó tractor de Don Raúl"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                type="button"
                onClick={() => setCheckoutModal(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleConfirmCheckOut}
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 700 }}
              >
                Confirmar Salida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TURNO MANUAL / CORRECCIÓN ── */}
      {showManualModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '460px', padding: '1.8rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#0f172a' }}>Registrar Turno Manual</h3>
            
            <form onSubmit={handleSaveManual}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  Trabajador *
                </label>
                <select
                  required
                  value={manualForm.Id_Empleado}
                  onChange={e => setManualForm({ ...manualForm, Id_Empleado: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Selecciona trabajador...</option>
                  {empleados.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.Nombre} ({emp.Puesto})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                    Fecha *
                  </label>
                  <input 
                    type="date"
                    required
                    value={manualForm.Fecha}
                    onChange={e => setManualForm({ ...manualForm, Fecha: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                    Horas Trabajadas *
                  </label>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={manualForm.HorasManuales}
                    onChange={e => setManualForm({ ...manualForm, HorasManuales: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#334155' }}>
                  Notas / Motivo
                </label>
                <input 
                  type="text"
                  placeholder="Ej. Olvidó checar al salir / Turno de sábado"
                  value={manualForm.Notas}
                  onChange={e => setManualForm({ ...manualForm, Notas: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button 
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f1f5f9', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#0284c7', color: 'white', cursor: 'pointer', fontWeight: 700 }}
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Personal;
