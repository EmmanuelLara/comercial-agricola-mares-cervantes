import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Printer, 
  ArrowRight, 
  ShoppingCart,
  DollarSign, 
  Calendar, 
  User, 
  FileCheck,
  AlertCircle,
  Wrench
} from 'lucide-react';

const Cotizaciones = () => {
  const [quotes, setQuotes] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal Nueva Cotizacion
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    Nombre_Cliente: '',
    Telefono_Cliente: '',
    Email_Cliente: '',
    Direccion_Cliente: '',
    VigenciaDias: 15,
    Notas: '',
    Condiciones: 'Precios sujetos a cambio sin previo aviso. Tiempo de entrega según disponibilidad de inventario.',
    AplicarIVA: false,
    Descuento: 0,
    TipoDescuento: 'monto'
  });

  const [items, setItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState(1);

  // Modal Ver/Imprimir
  const [viewQuote, setViewQuote] = useState(null);

  // Modal Convertir a Venta
  const [convertModal, setConvertModal] = useState(null);
  const [convertPayment, setConvertPayment] = useState({
    MetodoPago: 'Efectivo',
    MontoPago: ''
  });

  // Modal Convertir a Servicio / Taller
  const [serviceModal, setServiceModal] = useState(null);
  const [serviceData, setServiceData] = useState({
    TipoEquipo: 'Tractor',
    Marca: '',
    Modelo: '',
    SeriePlacas: '',
    HorometroKM: '',
    TipoServicio: 'Mantenimiento y Cambio de Filtros',
    CostoManoDeObra: 350
  });

  const [businessInfo, setBusinessInfo] = useState(null);

  const printRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, pRes, cRes, bRes] = await Promise.all([
        api.get('/quotes'),
        api.get('/inventory'),
        api.get('/clients'),
        api.get('/business')
      ]);
      setQuotes(qRes.data || []);
      setProducts(pRes.data || []);
      setClients(cRes.data || []);
      setBusinessInfo(bRes.data || null);
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (selectedProductId) {
      const prod = products.find(p => p._id === selectedProductId);
      if (!prod) return;
      const qty = parseFloat(itemQty) || 1;
      const price = parseFloat(itemPrice) || prod.Precio_Venta || 0;
      const newItem = {
        Id_Producto: prod._id,
        Codigo: prod.Numero || '',
        Descripcion: prod.Nombre,
        PrecioUnitario: price,
        Cantidad: qty,
        Subtotal: Math.round(qty * price * 100) / 100
      };
      setItems([...items, newItem]);
    } else if (customDesc.trim()) {
      const qty = parseFloat(itemQty) || 1;
      const price = parseFloat(itemPrice) || 0;
      const newItem = {
        Codigo: 'SRV-CUSTOM',
        Descripcion: customDesc.trim(),
        PrecioUnitario: price,
        Cantidad: qty,
        Subtotal: Math.round(qty * price * 100) / 100
      };
      setItems([...items, newItem]);
    }
    // Reset inputs
    setSelectedProductId('');
    setCustomDesc('');
    setItemPrice('');
    setItemQty(1);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((acc, it) => acc + it.Subtotal, 0);
    let desc = parseFloat(formData.Descuento) || 0;
    if (formData.TipoDescuento === 'porcentaje') {
      desc = (subtotal * desc) / 100;
    }
    const base = Math.max(0, subtotal - desc);
    const iva = formData.AplicarIVA ? Math.round(base * 0.16 * 100) / 100 : 0;
    const total = Math.round((base + iva) * 100) / 100;
    return { subtotal, desc, iva, total };
  };

  const handleSaveQuote = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Por favor agrega al menos un producto o concepto a la cotización');
      return;
    }
    if (!formData.Nombre_Cliente.trim()) {
      alert('Por favor especifica el nombre del cliente');
      return;
    }

    const { subtotal, desc, iva, total } = calculateTotals();

    try {
      const payload = {
        ...formData,
        Subtotal: subtotal,
        Descuento: desc,
        IVA: iva,
        MontoTotal: total,
        Detalles: items
      };

      await api.post('/quotes', payload);
      setShowModal(false);
      // Reset
      setFormData({
        Nombre_Cliente: '',
        Telefono_Cliente: '',
        Email_Cliente: '',
        Direccion_Cliente: '',
        VigenciaDias: 15,
        Notas: '',
        Condiciones: 'Precios sujetos a cambio sin previo aviso. Tiempo de entrega según disponibilidad de inventario.',
        AplicarIVA: false,
        Descuento: 0,
        TipoDescuento: 'monto'
      });
      setItems([]);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar la cotización');
    }
  };

  const handleConvertQuote = async () => {
    if (!convertModal) return;
    try {
      await api.post(`/quotes/${convertModal._id}/convert`, {
        MetodoPago: convertPayment.MetodoPago,
        MontoPago: parseFloat(convertPayment.MontoPago) || convertModal.MontoTotal
      });
      setConvertModal(null);
      fetchData();
      alert('¡Cotización convertida en Venta exitosamente!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al convertir cotización');
    }
  };

  const handleConvertToService = async () => {
    if (!serviceModal) return;
    try {
      await api.post(`/quotes/${serviceModal._id}/convert-service`, serviceData);
      setServiceModal(null);
      fetchData();
      alert('¡Cotización convertida en Orden de Servicio y enviada al Taller exitosamente!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al convertir a orden de servicio');
    }
  };

  const handleDeleteQuote = async (id, folio) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la cotización ${folio}?`)) return;
    try {
      await api.delete(`/quotes/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/quotes/${id}`, { Estado: newStatus });
      fetchData();
    } catch (err) {
      alert('Error al actualizar estado');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtrado
  const filteredQuotes = quotes.filter(q => {
    const matchQuery = (
      (q.Folio || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.Nombre_Cliente || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.Telefono_Cliente || '').includes(search)
    );
    if (filterStatus === 'all') return matchQuery;
    return matchQuery && q.Estado === filterStatus;
  });

  const totals = calculateTotals();

  // Metrics
  const totalCotizaciones = quotes.length;
  const pendientes = quotes.filter(q => q.Estado === 'Pendiente').length;
  const convertidas = quotes.filter(q => q.Estado === 'Convertida').length;
  const totalMonto = quotes.reduce((acc, q) => acc + (q.MontoTotal || 0), 0);

  return (
    <div>
      <div className="no-print">
        {/* Top Header */}
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2>Cotizaciones y Presupuestos</h2>
            <p style={{ color: 'var(--text-muted)' }}>Crea, gestiona presupuestos comerciales y conviértelos a venta con 1 clic</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nueva Cotización
          </button>
        </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Emitidas</span>
              <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem' }}>{totalCotizaciones}</h3>
            </div>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '10px', borderRadius: '10px' }}>
              <FileText size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Pendientes</span>
              <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#d97706' }}>{pendientes}</h3>
            </div>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '10px', borderRadius: '10px' }}>
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Convertidas a Venta</span>
              <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#10b981' }}>{convertidas}</h3>
            </div>
            <div style={{ background: '#d1fae5', color: '#10b981', padding: '10px', borderRadius: '10px' }}>
              <ShoppingCart size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Monto Total Cotizado</span>
              <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: 'var(--primary)' }}>${totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '10px', borderRadius: '10px' }}>
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Buscar por Folio, Cliente o Teléfono..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius)', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'Pendiente', 'Aprobada', 'Convertida', 'Rechazada'].map(st => (
            <button 
              key={st}
              className={`filter-pill-btn ${filterStatus === st ? 'active' : ''}`}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
                background: filterStatus === st ? 'var(--primary)' : 'var(--white)',
                color: filterStatus === st ? 'white' : 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              {st === 'all' ? 'Todas' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Folio</th>
              <th style={{ padding: '1rem' }}>Fecha</th>
              <th style={{ padding: '1rem' }}>Cliente</th>
              <th style={{ padding: '1rem' }}>Items</th>
              <th style={{ padding: '1rem' }}>Total</th>
              <th style={{ padding: '1rem' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Cargando cotizaciones...</td></tr>
            ) : filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={40} style={{ margin: '0 auto 10px', display: 'block', color: '#cbd5e1' }} />
                  No se encontraron cotizaciones con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filteredQuotes.map(q => (
                <tr key={q._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{q.Folio}</td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>
                    {new Date(q.FechaRegistro).toLocaleDateString('es-MX')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{q.Nombre_Cliente}</div>
                    {q.Telefono_Cliente && <small style={{ color: '#94a3b8' }}>Tel: {q.Telefono_Cliente}</small>}
                  </td>
                  <td style={{ padding: '1rem' }}>{q.Detalles?.length || 0} conceptos</td>
                  <td style={{ padding: '1rem', fontWeight: 700, fontSize: '1.05rem' }}>
                    ${(q.MontoTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span 
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: 
                          q.Estado === 'Convertida' ? '#d1fae5' :
                          q.Estado === 'Aprobada' ? '#e0f2fe' :
                          q.Estado === 'Rechazada' ? '#fee2e2' : '#fef3c7',
                        color: 
                          q.Estado === 'Convertida' ? '#059669' :
                          q.Estado === 'Aprobada' ? '#0284c7' :
                          q.Estado === 'Rechazada' ? '#dc2626' : '#d97706'
                      }}
                    >
                      {q.Estado}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button 
                        className="btn-icon" 
                        title="Ver / Imprimir"
                        onClick={() => setViewQuote(q)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}
                      >
                        <Printer size={16} color="#0284c7" />
                      </button>

                      {q.Estado !== 'Convertida' && (
                        <>
                          <button 
                            className="btn-icon" 
                            title="Convertir a Venta de Mostrador"
                            onClick={() => {
                              setConvertModal(q);
                              setConvertPayment({ MetodoPago: 'Efectivo', MontoPago: q.MontoTotal });
                            }}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #a7f3d0', background: '#ecfdf5', cursor: 'pointer' }}
                          >
                            <ShoppingCart size={16} color="#10b981" />
                          </button>

                          <button 
                            className="btn-icon" 
                            title="Pasar a Orden de Servicio / Taller"
                            onClick={() => {
                              setServiceModal(q);
                              setServiceData({
                                TipoEquipo: 'Tractor',
                                Marca: '',
                                Modelo: '',
                                SeriePlacas: '',
                                HorometroKM: '',
                                TipoServicio: 'Mantenimiento y Cambio de Filtros',
                                CostoManoDeObra: 350
                              });
                            }}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fed7aa', background: '#fff7ed', cursor: 'pointer' }}
                          >
                            <Wrench size={16} color="#ea580c" />
                          </button>
                        </>
                      )}

                      <button 
                        className="btn-icon" 
                        title="Eliminar"
                        onClick={() => handleDeleteQuote(q._id, q.Folio)}
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL: NUEVA COTIZACION ── */}
      {showModal && (
        <div className="modal-backdrop no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h3>Nueva Cotización / Presupuesto</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleSaveQuote}>
              {/* Cliente y Condiciones */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Elegir de Clientes Registrados
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedClientId(val);
                      if (val) {
                        const cli = clients.find(c => c._id === val);
                        if (cli) {
                          setFormData(prev => ({
                            ...prev,
                            Nombre_Cliente: cli.NombreCompleto || cli.RazonSocial || cli.Nombre || '',
                            Telefono_Cliente: cli.Telefono || cli.Telefono_Cliente || '',
                            Email_Cliente: cli.Correo || cli.Email || '',
                            Direccion_Cliente: cli.Direccion || ''
                          }));
                        }
                      }
                    }}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1', background: '#fff' }}
                  >
                    <option value="">-- Seleccionar cliente existente --</option>
                    {clients.map(c => {
                      const name = c.NombreCompleto || c.RazonSocial || c.Nombre;
                      return (
                        <option key={c._id} value={c._id}>
                          {name} {c.RFC ? `(${c.RFC})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Nombre del Cliente <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="Nombre completo o Empresa" 
                    required 
                    value={formData.Nombre_Cliente}
                    onChange={e => {
                      setSelectedClientId('');
                      setFormData({ ...formData, Nombre_Cliente: e.target.value });
                    }}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Teléfono / WhatsApp <small style={{ color: '#64748b', fontWeight: 400 }}>(Opcional)</small>
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ej. 464 123 4567" 
                    value={formData.Telefono_Cliente}
                    onChange={e => setFormData({ ...formData, Telefono_Cliente: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Vigencia (Días)</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={formData.VigenciaDias}
                    onChange={e => setFormData({ ...formData, VigenciaDias: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Agregar Items / Productos */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem', color: 'var(--text-main)' }}>Agregar Concepto o Producto del Inventario</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.8rem', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Seleccionar del Inventario</label>
                    <select 
                      value={selectedProductId}
                      onChange={e => {
                        setSelectedProductId(e.target.value);
                        const prod = products.find(p => p._id === e.target.value);
                        if (prod) {
                          const price = prod.Precio_venta ?? prod.Precio_Venta ?? prod.Precio ?? prod.precio ?? 0;
                          setItemPrice(price);
                        }
                      }}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">-- O escribir concepto personalizado abajo --</option>
                      {products.map(p => {
                        const price = p.Precio_venta ?? p.Precio_Venta ?? p.Precio ?? p.precio ?? 0;
                        return (
                          <option key={p._id} value={p._id}>
                            {p.Nombre} (Stock: {p.Stock}) - ${Number(price).toFixed(2)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Precio Unitario ($)</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="0.00"
                      value={itemPrice}
                      onChange={e => setItemPrice(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Cantidad</label>
                    <input 
                      type="number" 
                      min="1"
                      value={itemQty}
                      onChange={e => setItemQty(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleAddItem}
                    style={{ height: '42px', padding: '0 1.2rem' }}
                  >
                    <Plus size={16} /> Agregar
                  </button>
                </div>

                {!selectedProductId && (
                  <div style={{ marginTop: '0.8rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>O Concepto Libre / Mano de Obra / Servicio</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Servicio de Mantenimiento Preventivo, Cambio de Filtros o Refacción Especial"
                      value={customDesc}
                      onChange={e => setCustomDesc(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}
              </div>

              {/* Tabla de Items */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Descripción</th>
                    <th style={{ padding: '8px', width: '100px' }}>Cant.</th>
                    <th style={{ padding: '8px', width: '120px' }}>Precio</th>
                    <th style={{ padding: '8px', width: '120px' }}>Subtotal</th>
                    <th style={{ padding: '8px', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No hay conceptos agregados aún.</td></tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px' }}>{it.Descripcion}</td>
                        <td style={{ padding: '8px' }}>{it.Cantidad}</td>
                        <td style={{ padding: '8px' }}>${it.PrecioUnitario.toFixed(2)}</td>
                        <td style={{ padding: '8px', fontWeight: 600 }}>${it.Subtotal.toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button type="button" onClick={() => handleRemoveItem(idx)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Totales y Opciones */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Notas o Condiciones Adicionales</label>
                  <textarea 
                    rows="3"
                    value={formData.Condiciones}
                    onChange={e => setFormData({ ...formData, Condiciones: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  ></textarea>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Subtotal:</span>
                    <strong>${totals.subtotal.toFixed(2)}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Descuento:</span>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.Descuento}
                      onChange={e => setFormData({ ...formData, Descuento: e.target.value })}
                      style={{ width: '90px', padding: '4px', textAlign: 'right' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.AplicarIVA} 
                        onChange={e => setFormData({ ...formData, AplicarIVA: e.target.checked })}
                      />
                      <span>Incluir IVA (16%):</span>
                    </label>
                    <span>${totals.iva.toFixed(2)}</span>
                  </div>

                  <hr style={{ margin: '8px 0', borderColor: '#e2e8f0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 800 }}>
                    <span>Total:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cotización</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONVERTIR A VENTA ── */}
      {convertModal && (
        <div className="modal-backdrop no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart color="var(--primary)" /> Convertir a Venta
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Se registrará la venta del folio <strong>{convertModal.Folio}</strong> para el cliente <strong>{convertModal.Nombre_Cliente}</strong> y se descontarán las existencias del inventario.
            </p>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700 }}>
                <span>Total a Cobrar:</span>
                <span style={{ color: 'var(--primary)' }}>${convertModal.MontoTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Método de Pago</label>
              <select 
                value={convertPayment.MetodoPago}
                onChange={e => setConvertPayment({ ...convertPayment, MetodoPago: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta de Débito/Crédito</option>
                <option value="Transferencia">Transferencia Bancaria</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setConvertModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleConvertQuote}>Confirmar y Procesar Venta</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONVERTIR A SERVICIO / TALLER ── */}
      {serviceModal && (
        <div className="modal-backdrop no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', maxWidth: '520px', width: '100%', padding: '1.8rem' }}>
            <h3 style={{ marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench color="#ea580c" /> Pasar a Orden de Servicio / Taller
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
              Se creará la orden de taller para <strong>{serviceModal.Nombre_Cliente}</strong> con las refacciones de la cotización <strong>{serviceModal.Folio}</strong>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tipo de Equipo</label>
                <select 
                  value={serviceData.TipoEquipo}
                  onChange={e => setServiceData({ ...serviceData, TipoEquipo: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                >
                  <option value="Tractor">Tractor</option>
                  <option value="Cosechadora">Cosechadora</option>
                  <option value="Implemento Agrícola">Implemento Agrícola</option>
                  <option value="Camión">Camión</option>
                  <option value="Camioneta">Camioneta</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Marca</label>
                <input 
                  type="text" 
                  placeholder="Ej. John Deere"
                  value={serviceData.Marca}
                  onChange={e => setServiceData({ ...serviceData, Marca: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Modelo</label>
                <input 
                  type="text" 
                  placeholder="Ej. 5415"
                  value={serviceData.Modelo}
                  onChange={e => setServiceData({ ...serviceData, Modelo: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Horómetro / KM</label>
                <input 
                  type="text" 
                  placeholder="Ej. 1,200 hrs"
                  value={serviceData.HorometroKM}
                  onChange={e => setServiceData({ ...serviceData, HorometroKM: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mano de Obra ($)</label>
              <input 
                type="number" 
                step="any"
                value={serviceData.CostoManoDeObra}
                onChange={e => setServiceData({ ...serviceData, CostoManoDeObra: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setServiceModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleConvertToService}>
                Crear Orden de Taller
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ── MODAL / VISTA DE IMPRESION ── */}
      {viewQuote && (
        <div className="modal-backdrop print-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', maxWidth: '850px', width: '100%', maxHeight: '95vh', overflowY: 'auto', padding: '2rem' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} /> Imprimir / PDF</button>
              <button className="btn btn-secondary" onClick={() => setViewQuote(null)}>Cerrar</button>
            </div>

            {/* Documento Imprimible - Hoja Membretada de Cotización */}
            <div className="printable-quote" ref={printRef} style={{ padding: '0.5rem 0', background: 'white', fontFamily: 'Outfit, sans-serif', width: '100%', boxSizing: 'border-box', fontSize: '0.92rem' }}>
              {/* Membrete Superior: Si el Admin subió una Hoja Membretada personalizada */}
              {businessInfo?.HeaderImage ? (
                <div style={{ marginBottom: '1.2rem', borderBottom: '3px solid #10b981', paddingBottom: '0.8rem' }}>
                  <img 
                    src={businessInfo.HeaderImage} 
                    alt="Hoja Membretada" 
                    style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', display: 'block', marginBottom: '0.8rem' }} 
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.2rem' }}>
                      {businessInfo.Nombre || 'COMERCIAL AGRÍCOLA MARES CERVANTES'}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ background: '#10b981', color: 'white', fontSize: '0.82rem', fontWeight: 800, padding: '4px 12px', borderRadius: '4px', display: 'inline-block', marginRight: '10px' }}>
                        PRESUPUESTO / COTIZACIÓN: <strong>{viewQuote.Folio}</strong>
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                        Emisión: {new Date(viewQuote.FechaRegistro || Date.now()).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #10b981', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
                  <div>
                    <h1 style={{ color: '#0f172a', fontWeight: 900, fontSize: '1.55rem', letterSpacing: '-0.5px', margin: '0 0 4px' }}>
                      {businessInfo?.Nombre || 'COMERCIAL AGRÍCOLA MARES CERVANTES'}
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 700, margin: '2px 0 4px' }}>
                      Servicio de Tractores y Refaccionaria
                    </p>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                      {businessInfo?.Direccion || 'Salamanca - Celaya, Guanajuato, México'} • Tel: {businessInfo?.Telefono || '(464) 640-0000'} • Email: {businessInfo?.Email || 'ventas@marescervantes.com'}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', background: '#f8fafc', padding: '10px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ background: '#10b981', color: 'white', fontSize: '0.78rem', fontWeight: 800, padding: '3px 10px', borderRadius: '4px', display: 'inline-block', marginBottom: '3px' }}>
                      PRESUPUESTO / COTIZACIÓN
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>{viewQuote.Folio}</div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                      Emisión: {new Date(viewQuote.FechaRegistro || Date.now()).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 700 }}>
                      Vigencia: {viewQuote.VigenciaDias || 15} días naturales
                    </div>
                  </div>
                </div>
              )}

              {/* Datos del Cliente y Condiciones Comercial */}
              <div style={{ background: '#f8fafc', padding: '1rem 1.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1.2rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.4rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                    PROPUESTA PRESENTADA A:
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a', marginTop: '2px' }}>
                    {viewQuote.Nombre_Cliente}
                  </div>
                  {viewQuote.Direccion_Cliente && <div style={{ fontSize: '0.88rem', color: '#475569', marginTop: '3px' }}>📍 {viewQuote.Direccion_Cliente}</div>}
                </div>

                <div style={{ fontSize: '0.88rem', borderLeft: '2px solid #e2e8f0', paddingLeft: '1.2rem' }}>
                  {viewQuote.Telefono_Cliente && <div style={{ marginBottom: '2px' }}><strong>Tel / WhatsApp:</strong> {viewQuote.Telefono_Cliente}</div>}
                  {viewQuote.Email_Cliente && <div style={{ marginBottom: '2px' }}><strong>Correo:</strong> {viewQuote.Email_Cliente}</div>}
                  <div><strong>Forma de Pago:</strong> Contado / Transferencia</div>
                </div>
              </div>

              {/* Tabla de Productos y Servicios Cotizados */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.2rem', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: 'white', textAlign: 'left', fontSize: '0.85rem' }}>
                    <th style={{ padding: '10px 12px', width: '55px', textAlign: 'center' }}>CANT</th>
                    <th style={{ padding: '10px 12px' }}>DESCRIPCIÓN DEL CONCEPTO / REFACCIÓN</th>
                    <th style={{ padding: '10px 12px', width: '120px', textAlign: 'right' }}>P. UNITARIO</th>
                    <th style={{ padding: '10px 12px', width: '120px', textAlign: 'right' }}>IMPORTE</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewQuote.Detalles || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{it.Cantidad}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {it.Codigo && <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.85rem' }}>[{it.Codigo}] </span>}
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{it.Descripcion}</span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>${(it.PrecioUnitario || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>${(it.Subtotal || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bloque de Totales y Observaciones */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.5rem', alignItems: 'start', marginBottom: '1.5rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem 1.2rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569' }}>
                  <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px', fontSize: '0.88rem' }}>Términos Comerciales y Notas:</strong>
                  <p style={{ margin: '0 0 4px' }}>• {viewQuote.Condiciones || 'Precios sujetos a cambio sin previo aviso. Entrega según disponibilidad de inventario.'}</p>
                  {viewQuote.Notas && <p style={{ margin: 0 }}>• <strong>Notas adicionales:</strong> {viewQuote.Notas}</p>}
                </div>

                <div style={{ background: '#f1f5f9', padding: '1rem 1.2rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                    <span>Subtotal:</span>
                    <strong>${(viewQuote.Subtotal || 0).toFixed(2)}</strong>
                  </div>
                  {viewQuote.Descuento > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem', color: '#ef4444' }}>
                      <span>Descuento:</span>
                      <span>-${viewQuote.Descuento.toFixed(2)}</span>
                    </div>
                  )}
                  {viewQuote.IVA > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem', color: '#0284c7' }}>
                      <span>IVA (16%):</span>
                      <span>${viewQuote.IVA.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.3rem', color: '#10b981', marginTop: '8px', borderTop: '2px solid #cbd5e1', paddingTop: '8px' }}>
                    <span>TOTAL:</span>
                    <span>${(viewQuote.MontoTotal || 0).toFixed(2)} MXN</span>
                  </div>
                </div>
              </div>

              {/* Firmas de Autorización */}
              <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '0.85rem', marginTop: '2.5rem' }}>
                <div style={{ width: '230px', borderTop: '1px dashed #64748b', paddingTop: '8px' }}>
                  <strong>Firma de Aceptación del Cliente</strong>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '2px' }}>Nombre y Fecha de Conformidad</div>
                </div>

                <div style={{ width: '230px', borderTop: '1px dashed #64748b', paddingTop: '8px' }}>
                  <strong>Comercial Agrícola Mares Cervantes</strong>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '2px' }}>Asesor de Ventas y Servicios</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cotizaciones;
