import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Receipt, 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  DollarSign, 
  Building, 
  FileCheck2, 
  CreditCard,
  QrCode,
  UserCheck,
  FileCode,
  Settings,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Wrench,
  Cog
} from 'lucide-react';
import { numeroALetras } from '../utils/numeroALetras';
import { REGIMENES_FISCALES as REGIMENES } from '../utils/satConstants';
import { QRCodeSVG } from 'qrcode.react';

const USOS_CFDI = [
  'G01 - Adquisición de mercancías',
  'G02 - Devoluciones, descuentos o bonificaciones',
  'G03 - Gastos en general',
  'I01 - Construcciones',
  'I02 - Mobilario y equipo de oficina por inversiones',
  'I04 - Equipo de cómputo y accesorios',
  'I08 - Otra maquinaria y equipo',
  'P01 - Por definir',
  'CP01 - Pagos',
  'S01 - Sin efectos fiscales'
];

const FORMAS_PAGO = [
  '01 - Efectivo',
  '02 - Cheque nominativo',
  '03 - Transferencia electrónica de fondos',
  '04 - Tarjeta de crédito',
  '28 - Tarjeta de débito',
  '99 - Por definir'
];

const METODOS_PAGO = [
  'PUE - Pago en una sola exhibición',
  'PPD - Pago en parcialidades o diferido'
];

const Facturas = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [invoices, setInvoices] = useState([]);
  const [sales, setSales] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal Configuración Fiscal SAT (Solo Admin)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingFacturapi, setTestingFacturapi] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configData, setConfigData] = useState({
    RFC: '',
    RazonSocial: '',
    RegimenFiscal: REGIMENES[0],
    CodigoPostal: '',
    FacturapiApiKey: '',
    Logo: ''
  });

  // Modal Nueva Factura
  const [showModal, setShowModal] = useState(false);
  const [invoiceSource, setInvoiceSource] = useState('service'); // 'service' | 'sale' | 'manual'
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [formData, setFormData] = useState({
    RFC: '',
    RazonSocial: '',
    RegimenFiscal: REGIMENES[0],
    UsoCFDI: USOS_CFDI[2], // G03
    CodigoPostal: '',
    Email: '',
    Direccion: '',
    FormaPago: FORMAS_PAGO[0],
    MetodoPago: METODOS_PAGO[0],
    CondicionesDePago: 'Contado',
    Notas: ''
  });

  const [items, setItems] = useState([]);

  // Modal Ver/Imprimir Factura
  const [viewInvoice, setViewInvoice] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, salesRes, clientRes, bizRes, srvRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/sales'),
        api.get('/clients'),
        api.get('/business'),
        api.get('/services').catch(() => ({ data: [] }))
      ]);
      const invoiceData = invRes.data || [];
      setInvoices(invoiceData);
      if (invoiceData.length > 0) {
        setSelectedInvoice(invoiceData[0]);
      }
      setSales(salesRes.data || []);
      setClients(clientRes.data || []);
      setServices(srvRes.data || []);
      const biz = bizRes.data || null;
      setBusinessInfo(biz);
      if (biz) {
        setConfigData({
          RFC: biz.RFC || 'MACE680608RC7',
          RazonSocial: biz.RazonSocial || 'ERNESTO MARES DE LA CRUZ',
          RegimenFiscal: biz.RegimenFiscal || '612 - Personas Físicas con Actividades Empresariales y Profesionales',
          CodigoPostal: biz.CodigoPostal || '20903',
          FacturapiApiKey: biz.FacturapiApiKey || '',
          Logo: biz.Logo || ''
        });
      }
    } catch (err) {
      console.error('Error al cargar facturas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.servicioId && services.length > 0) {
      handleServiceSelect(location.state.servicioId);
      setShowModal(true);
      setInvoiceSource('service');
    }
  }, [location.state, services]);

  const handleTestFacturapi = async () => {
    setTestingFacturapi(true);
    setTestResult(null);
    try {
      const res = await api.post('/business/test-facturapi', {
        apiKey: configData.FacturapiApiKey
      });
      setTestResult({
        success: true,
        message: res.data.message || '¡Conexión exitosa con Facturapi!'
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Error al conectar con Facturapi'
      });
    } finally {
      setTestingFacturapi(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await api.post('/business', configData);
      setBusinessInfo(res.data?.negocio || configData);
      alert('¡Configuración fiscal guardada exitosamente!');
      setShowConfigModal(false);
      setTestResult(null);
    } catch (err) {
      alert('Error al guardar configuración: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingConfig(false);
    }
  };

  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c._id === clientId);
    if (client) {
      setFormData(prev => ({
        ...prev,
        RFC: client.RFC || prev.RFC,
        RazonSocial: client.RazonSocial || client.NombreCompleto || prev.RazonSocial,
        RegimenFiscal: client.RegimenFiscal || prev.RegimenFiscal,
        UsoCFDI: client.UsoCFDI || prev.UsoCFDI,
        CodigoPostal: client.CodigoPostal || prev.CodigoPostal,
        Email: client.Correo || prev.Email,
        Direccion: client.Direccion || prev.Direccion
      }));
    }
  };

  const handleSaleSelect = async (saleId) => {
    setSelectedSaleId(saleId);
    setSelectedServiceId('');
    if (!saleId) {
      setItems([]);
      return;
    }

    try {
      const res = await api.get(`/sales/${saleId}`);
      const venta = res.data?.venta;
      if (venta) {
        setFormData(prev => ({
          ...prev,
          RazonSocial: venta.Nombre_Cliente !== 'Cliente General' ? venta.Nombre_Cliente : prev.RazonSocial,
          Email: venta.Numero_Cliente || prev.Email
        }));

        const invoiceItems = (venta.Detalles || []).map(d => ({
          ClaveProdServ: '01010101',
          Descripcion: d.Nombre_Producto || 'Producto de Venta',
          Cantidad: d.Cantidad,
          ClaveUnidad: 'H87',
          Unidad: 'Pieza',
          ValorUnitario: d.Precio_Venta,
          Importe: d.MontoTotal,
          Descuento: 0,
          IVA: Math.round(d.MontoTotal * 0.16 * 100) / 100
        }));
        setItems(invoiceItems);
      }
    } catch (err) {
      console.error('Error cargando detalle de venta:', err);
    }
  };

  const handleServiceSelect = async (serviceId) => {
    setSelectedServiceId(serviceId);
    setSelectedSaleId('');
    if (!serviceId) {
      setItems([]);
      return;
    }

    try {
      const res = await api.get(`/services/${serviceId}/to-factura`);
      const data = res.data;
      if (data && data.success) {
        const srv = data.servicio;
        const matchedClient = clients.find(c => 
          (c.NombreCompleto && c.NombreCompleto.toLowerCase() === (srv.Nombre_Cliente || '').toLowerCase()) ||
          (c.RazonSocial && c.RazonSocial.toLowerCase() === (srv.Nombre_Cliente || '').toLowerCase())
        );

        setFormData(prev => ({
          ...prev,
          RFC: matchedClient?.RFC || prev.RFC || 'XAXX010101000',
          RazonSocial: matchedClient?.RazonSocial || matchedClient?.NombreCompleto || srv.Nombre_Cliente,
          Email: matchedClient?.Correo || srv.Email_Cliente || prev.Email,
          Direccion: matchedClient?.Direccion || prev.Direccion,
          CodigoPostal: matchedClient?.CodigoPostal || prev.CodigoPostal || '20903',
          UsoCFDI: matchedClient?.UsoCFDI || 'G03 - Gastos en general'
        }));

        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Error cargando servicio para factura:', err);
    }
  };

  const handleAddItemManual = () => {
    setItems([
      ...items,
      {
        ClaveProdServ: '01010101',
        Descripcion: 'Concepto general o refacción',
        Cantidad: 1,
        ClaveUnidad: 'H87',
        Unidad: 'Pieza',
        ValorUnitario: 100,
        Importe: 100,
        Descuento: 0,
        IVA: 16
      }
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'Cantidad' || field === 'ValorUnitario' || field === 'Descuento') {
      const cant = parseFloat(updated[index].Cantidad) || 1;
      const pu = parseFloat(updated[index].ValorUnitario) || 0;
      const desc = parseFloat(updated[index].Descuento) || 0;
      const imp = Math.round((cant * pu - desc) * 100) / 100;
      updated[index].Importe = imp;
      updated[index].IVA = Math.round(imp * 0.16 * 100) / 100;
    }
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((acc, it) => acc + (parseFloat(it.Importe) || 0), 0);
    const ivaTotal = items.reduce((acc, it) => acc + (parseFloat(it.IVA) || 0), 0);
    const total = Math.round((subtotal + ivaTotal) * 100) / 100;
    return { subtotal, ivaTotal, total };
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!formData.RFC.trim() || !formData.RazonSocial.trim()) {
      alert('Por favor especifica el RFC y la Razón Social del cliente');
      return;
    }
    if (items.length === 0) {
      alert('Debes incluir al menos un concepto en la factura');
      return;
    }

    try {
      const payload = {
        ...formData,
        Items: items,
        Id_Venta: selectedSaleId || undefined,
        Id_Servicio: selectedServiceId || undefined
      };

      await api.post('/invoices', payload);
      setShowModal(false);
      setSelectedSaleId('');
      setSelectedServiceId('');
      setItems([]);
      fetchData();
      alert('¡Factura generada exitosamente!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al generar factura');
    }
  };

  const handleCancelInvoice = async (id, folio) => {
    if (!window.confirm(`¿Deseas cancelar la factura ${folio}?`)) return;
    try {
      await api.put(`/invoices/${id}/cancel`);
      fetchData();
      alert(`Factura ${folio} cancelada`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cancelar');
    }
  };

  const handleDuplicateInvoice = (inv) => {
    if (!inv) return;
    setFormData({
      RFC: inv.RFC || '',
      RazonSocial: inv.RazonSocial || '',
      RegimenFiscal: inv.RegimenFiscal || REGIMENES[0],
      UsoCFDI: inv.UsoCFDI || USOS_CFDI[2],
      CodigoPostal: inv.CodigoPostal || '',
      Email: inv.Email || '',
      Direccion: inv.Direccion || '',
      FormaPago: inv.FormaPago || FORMAS_PAGO[0],
      MetodoPago: inv.MetodoPago || METODOS_PAGO[0],
      CondicionesDePago: inv.CondicionesDePago || 'Contado',
      Notas: inv.Notas || ''
    });
    setItems(inv.Items ? [...inv.Items] : []);
    setShowModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchQuery = (
      (inv.Folio || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.RFC || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.RazonSocial || '').toLowerCase().includes(search.toLowerCase())
    );
    if (filterStatus === 'all') return matchQuery;
    return matchQuery && inv.Estado === filterStatus;
  });

  const totals = calculateTotals();

  // Metrics
  const totalFacturas = invoices.length;
  const totalMontoFacturado = invoices.filter(i => i.Estado !== 'Cancelada').reduce((acc, i) => acc + (i.Total || 0), 0);
  const totalIVARecaudado = invoices.filter(i => i.Estado !== 'Cancelada').reduce((acc, i) => acc + (i.IVATotal || 0), 0);

  return (
    <div>
      <div className="no-print">
        {/* Top Header */}
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0 }}>Módulo de Facturación (CFDI 4.0)</h2>
            {/* Indicador de Estado del PAC */}
            <span 
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: businessInfo?.FacturapiApiKey?.startsWith('sk_live') ? '#dcfce7' : businessInfo?.FacturapiApiKey?.startsWith('sk_test') ? '#fef3c7' : '#f1f5f9',
                color: businessInfo?.FacturapiApiKey?.startsWith('sk_live') ? '#15803d' : businessInfo?.FacturapiApiKey?.startsWith('sk_test') ? '#b45309' : '#64748b',
                border: '1px solid currentColor'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: businessInfo?.FacturapiApiKey?.startsWith('sk_live') ? '#22c55e' : businessInfo?.FacturapiApiKey?.startsWith('sk_test') ? '#f59e0b' : '#94a3b8' }}></span>
              {businessInfo?.FacturapiApiKey?.startsWith('sk_live') ? 'SAT Oficial (Facturapi Live)' : businessInfo?.FacturapiApiKey?.startsWith('sk_test') ? 'Facturapi Sandbox (Pruebas)' : 'Simulador Local'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {user?.rol === 'Administrador' && (
              <button 
                className="btn secondary" 
                onClick={() => setShowConfigModal(true)}
                style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Settings size={16} color="#0284c7" /> Configuración SAT & Timbres
              </button>
            )}

            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Emitir Factura
            </button>
          </div>
        </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Facturas Emitidas</span>
              <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem' }}>{totalFacturas}</h3>
            </div>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '10px', borderRadius: '10px' }}>
              <Receipt size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Monto Total Facturado</span>
              <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: 'var(--primary)' }}>${totalMontoFacturado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div style={{ background: '#d1fae5', color: '#10b981', padding: '10px', borderRadius: '10px' }}>
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>IVA Trasladado (16%)</span>
              <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#0284c7' }}>${totalIVARecaudado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '10px', borderRadius: '10px' }}>
              <FileCheck2 size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Buscar por Folio, RFC o Razón Social..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius)', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'Emitida', 'Pagada', 'Cancelada'].map(st => (
            <button 
              key={st}
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
      <div className="table-responsive no-print" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Folio</th>
              <th style={{ padding: '1rem' }}>Fecha</th>
              <th style={{ padding: '1rem' }}>RFC Receptor</th>
              <th style={{ padding: '1rem' }}>Razón Social</th>
              <th style={{ padding: '1rem' }}>Subtotal</th>
              <th style={{ padding: '1rem' }}>IVA (16%)</th>
              <th style={{ padding: '1rem' }}>Total</th>
              <th style={{ padding: '1rem' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ padding: '2rem', textAlign: 'center' }}>Cargando facturas...</td></tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Receipt size={40} style={{ margin: '0 auto 10px', display: 'block', color: '#cbd5e1' }} />
                  No se encontraron facturas emitidas.
                </td>
              </tr>
            ) : (
              filteredInvoices.map(inv => {
                const isSelected = selectedInvoice?._id === inv._id;
                return (
                  <tr 
                    key={inv._id} 
                    onClick={() => setSelectedInvoice(inv)}
                    style={{ 
                      borderBottom: '1px solid #e2e8f0', 
                      background: isSelected ? '#004b5a' : 'transparent',
                      color: isSelected ? '#ffffff' : 'inherit',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: isSelected ? '#38bdf8' : 'var(--primary)' }}>{inv.Folio}</td>
                    <td style={{ padding: '0.85rem 1rem', color: isSelected ? '#e2e8f0' : '#64748b' }}>{new Date(inv.FechaEmision).toLocaleDateString('es-MX')}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{inv.RFC}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: isSelected ? 700 : 400 }}>{inv.RazonSocial}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>${(inv.Subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '0.85rem 1rem', color: isSelected ? '#7dd3fc' : '#0284c7' }}>${(inv.IVATotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '1rem', color: isSelected ? '#34d399' : 'inherit' }}>${(inv.Total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span 
                        style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: inv.Estado === 'Cancelada' ? '#fee2e2' : '#d1fae5',
                          color: inv.Estado === 'Cancelada' ? '#ef4444' : '#059669'
                        }}
                      >
                        {inv.Estado === 'Cancelada' ? 'CANCELADA' : 'VIGENTE'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          className="btn-icon" 
                          title="Ver / Imprimir Factura"
                          onClick={(e) => { e.stopPropagation(); setViewInvoice(inv); }}
                          style={{ padding: '5px', borderRadius: '6px', border: '1px solid #e2e8f0', background: isSelected ? '#0f172a' : '#f8fafc', cursor: 'pointer' }}
                        >
                          <Printer size={15} color="#38bdf8" />
                        </button>

                        {inv.Estado !== 'Cancelada' && (
                          <button 
                            className="btn-icon" 
                            title="Cancelar Factura"
                            onClick={(e) => { e.stopPropagation(); handleCancelInvoice(inv._id, inv.Folio); }}
                            style={{ padding: '5px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', cursor: 'pointer' }}
                          >
                            <Trash2 size={15} color="#ef4444" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── PANEL SUPERIOR E INFERIOR: REGISTRO DE CFDI (Idéntico al sistema legacy) ── */}
      {selectedInvoice && (
        <div className="no-print" style={{ marginTop: '1.25rem', border: '1px solid #005f73', borderRadius: '8px', overflow: 'hidden', background: '#0f172a', color: '#ffffff', fontSize: '0.82rem', boxShadow: 'var(--shadow-lg)' }}>
          
          {/* Header Superior del Registro */}
          <div style={{ background: '#004b5a', padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #005f73', fontSize: '0.85rem', fontWeight: '700' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <span style={{ textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.5px' }}>REGISTRO DE CFDI</span>
              <span>Orden: <span style={{ color: '#facc15' }}>FECHA</span></span>
            </div>
            <div>
              <span>Folio fiscal: <span style={{ fontFamily: 'monospace', color: '#34d399', background: '#064e3b', padding: '2px 8px', borderRadius: '4px', border: '1px solid #059669' }}>{selectedInvoice.FolioFiscalUUID || 'N/A'}</span></span>
            </div>
            <div>
              <span>Comprobantes: <span style={{ color: '#38bdf8', fontWeight: 800 }}>{filteredInvoices.length}</span></span>
            </div>
          </div>

          {/* Bloques de Datos Detallados */}
          <div style={{ padding: '10px 14px', background: '#0f172a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            
            {/* Fila 1: Versión, Status, Moneda */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', background: '#1e293b', padding: '6px 12px', borderRadius: '4px', border: '1px solid #334155' }}>
              <div><strong>Versión:</strong> <span style={{ color: '#38bdf8', fontWeight: 700 }}>4.0</span></div>
              <div><strong>Status:</strong> <span style={{ color: selectedInvoice.Estado === 'Cancelada' ? '#ef4444' : '#34d399', fontWeight: 800, background: selectedInvoice.Estado === 'Cancelada' ? '#450a0a' : '#064e3b', padding: '2px 8px', borderRadius: '4px' }}>{selectedInvoice.Estado === 'Cancelada' ? 'CANCELADA' : 'VIGENTE'}</span></div>
              <div><strong>Moneda:</strong> <span style={{ color: '#facc15' }}>PESO MXN</span></div>
            </div>

            {/* Fila 2: Domicilio & Receptor */}
            <div style={{ background: '#1e293b', padding: '6px 12px', borderRadius: '4px', border: '1px solid #334155', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
              <div><strong>Domicilio Fiscal:</strong> <span style={{ color: '#cbd5e1' }}>{selectedInvoice.Direccion || `C.P. ${selectedInvoice.CodigoPostal || '36700'}`}</span></div>
              <div><strong>Cliente / Receptor:</strong> <span style={{ color: '#facc15', fontWeight: 700 }}>{selectedInvoice.RazonSocial}</span> <span style={{ color: '#94a3b8' }}>({selectedInvoice.RFC})</span></div>
            </div>

            {/* Fila 3: Conceptos */}
            <div style={{ background: '#1e293b', padding: '6px 12px', borderRadius: '4px', border: '1px solid #334155' }}>
              <strong>Conceptos:</strong> <span style={{ color: '#e2e8f0' }}>{(selectedInvoice.Items || []).map(i => i.Descripcion?.toUpperCase()).join(' • ') || 'CONCEPTO AGRÍCOLA / REFACCIÓN DE TRACTOR'}</span>
            </div>

            {/* Fila 4: Totales & Forma/Método de Pago */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', background: '#1e293b', padding: '8px 12px', borderRadius: '4px', border: '1px solid #334155', alignItems: 'center' }}>
              <div><strong>Subtotal:</strong> ${(selectedInvoice.Subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</div>
              <div><strong>Descuento:</strong> $0.00</div>
              <div><strong>I.V.A. (16%):</strong> <span style={{ color: '#38bdf8' }}>${(selectedInvoice.IVATotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></div>
              <div><strong>TOTAL:</strong> <span style={{ color: '#34d399', fontWeight: 800, fontSize: '1.05rem' }}>${(selectedInvoice.Total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span></div>
              <div><strong>Forma de pago:</strong> <span style={{ color: '#facc15' }}>{selectedInvoice.FormaPago || '01 - Efectivo'}</span></div>
              <div><strong>Método de pago:</strong> <span style={{ color: '#facc15' }}>{selectedInvoice.MetodoPago || 'PUE'}</span></div>
            </div>

          </div>

          {/* Barra de Botones de Acción (Botones del sistema legacy) */}
          <div style={{ background: '#004b5a', padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'flex-start', borderTop: '1px solid #005f73' }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              <Plus size={14} /> Nuevo CFDI
            </button>

            <button className="btn secondary" onClick={() => setViewInvoice(selectedInvoice)} style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#38bdf8', color: '#0f172a', fontWeight: 700, border: 'none' }}>
              <Printer size={14} /> Ver CFDI
            </button>

            <button className="btn secondary" onClick={() => window.open(`/api/invoices/${selectedInvoice._id}/xml`, '_blank')} style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#34d399', color: '#0f172a', fontWeight: 700, border: 'none' }}>
              <FileCode size={14} /> Descargar XML
            </button>

            <button className="btn secondary" onClick={() => handleDuplicateInvoice(selectedInvoice)} style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#facc15', color: '#0f172a', fontWeight: 700, border: 'none' }}>
              ⚡ Duplicar CFDI
            </button>

            {selectedInvoice.Estado !== 'Cancelada' && (
              <button className="btn danger" onClick={() => handleCancelInvoice(selectedInvoice._id, selectedInvoice.Folio)} style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#ef4444', color: '#ffffff', fontWeight: 700, border: 'none' }}>
                <Trash2 size={14} /> Cancelar CFDI
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: NUEVA FACTURA ── */}
      {showModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h3>Generar Factura (CFDI 4.0)</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateInvoice}>
              {/* Selector de Origen de Facturación */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid #cbd5e1', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => { setInvoiceSource('service'); setSelectedSaleId(''); }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid #cbd5e1',
                      background: invoiceSource === 'service' ? '#7c3aed' : 'white',
                      color: invoiceSource === 'service' ? 'white' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Cog size={15} /> Facturar desde Trabajo de Torno / Taller
                  </button>

                  <button
                    type="button"
                    onClick={() => { setInvoiceSource('sale'); setSelectedServiceId(''); }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid #cbd5e1',
                      background: invoiceSource === 'sale' ? 'var(--primary)' : 'white',
                      color: invoiceSource === 'sale' ? 'white' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Receipt size={15} /> Facturar desde Ticket de Venta
                  </button>

                  <button
                    type="button"
                    onClick={() => { setInvoiceSource('manual'); setSelectedSaleId(''); setSelectedServiceId(''); }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid #cbd5e1',
                      background: invoiceSource === 'manual' ? '#0284c7' : 'white',
                      color: invoiceSource === 'manual' ? 'white' : '#475569',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={15} /> Factura Directa / Conceptos Libres
                  </button>
                </div>

                {invoiceSource === 'service' && (
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#581c87', display: 'block', marginBottom: '4px' }}>
                      Seleccionar Orden de Trabajo de Torno o Taller:
                    </label>
                    <select
                      value={selectedServiceId}
                      onChange={e => handleServiceSelect(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #c084fc', background: '#faf5ff', fontWeight: 600 }}
                    >
                      <option value="">-- Selecciona una orden de trabajo o torno --</option>
                      {services.map(srv => (
                        <option key={srv._id} value={srv._id}>
                          {srv.Folio} | {srv.EsTrabajoTorno ? `⚙️ Torno: ${srv.DetallesTorno?.TipoPieza || srv.TipoServicio}` : `🚜 ${srv.Marca} ${srv.Modelo}`} | Cliente: {srv.Nombre_Cliente} | Total: ${srv.TotalServicio} ({srv.Estado})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {invoiceSource === 'sale' && (
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#065f46', display: 'block', marginBottom: '4px' }}>
                      Seleccionar Ticket de Venta Realizada:
                    </label>
                    <select 
                      value={selectedSaleId} 
                      onChange={e => handleSaleSelect(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #6ee7b7', background: '#ecfdf5', fontWeight: 600 }}
                    >
                      <option value="">-- Selecciona un ticket de venta --</option>
                      {sales.slice(0, 30).map(s => (
                        <option key={s._id} value={s._id}>
                          Folio: {s.Folio} | Cliente: {s.Nombre_Cliente} | Total: ${s.MontoTotal} | {new Date(s.FechaRegistro).toLocaleDateString('es-MX')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Seleccionar Cliente Registrado */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <UserCheck size={16} color="var(--primary)" /> Seleccionar Cliente Registrado (Autocompletar RFC, Razón Social y Régimen Fiscal):
                </label>
                <select 
                  value={selectedClientId} 
                  onChange={e => handleClientSelect(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid #94a3b8', fontWeight: 600 }}
                >
                  <option value="">-- Escribir datos manualmente o seleccionar cliente de la lista --</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.NombreCompleto} {c.RFC ? `| RFC: ${c.RFC}` : ''} {c.RegimenFiscal ? `| ${c.RegimenFiscal}` : ''} (#{c.Numero_Cliente})
                    </option>
                  ))}
                </select>
              </div>

              {/* Datos del Receptor */}
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem', color: 'var(--text-main)' }}>Datos Fiscales del Receptor (Cliente)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>RFC *</label>
                  <input 
                    type="text" 
                    placeholder="XAXX010101000" 
                    required 
                    maxLength="13"
                    value={formData.RFC}
                    onChange={e => setFormData({ ...formData, RFC: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1', textTransform: 'uppercase' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Razón Social / Nombre Fiscal *</label>
                  <input 
                    type="text" 
                    placeholder="Nombre completo o Empresa" 
                    required 
                    value={formData.RazonSocial}
                    onChange={e => setFormData({ ...formData, RazonSocial: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Código Postal Fiscal</label>
                  <input 
                    type="text" 
                    placeholder="C.P. (5 dígitos)" 
                    maxLength="5"
                    value={formData.CodigoPostal}
                    onChange={e => setFormData({ ...formData, CodigoPostal: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Régimen Fiscal</label>
                  <select 
                    value={formData.RegimenFiscal}
                    onChange={e => setFormData({ ...formData, RegimenFiscal: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  >
                    {REGIMENES.map((r, i) => <option key={i} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Uso de CFDI</label>
                  <select 
                    value={formData.UsoCFDI}
                    onChange={e => setFormData({ ...formData, UsoCFDI: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  >
                    {USOS_CFDI.map((u, i) => <option key={i} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Forma de Pago</label>
                  <select 
                    value={formData.FormaPago}
                    onChange={e => setFormData({ ...formData, FormaPago: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  >
                    {FORMAS_PAGO.map((f, i) => <option key={i} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Conceptos */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Conceptos / Productos a Facturar</h4>
                <button type="button" className="btn btn-secondary" onClick={handleAddItemManual} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                  <Plus size={14} /> Agregar Concepto
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Descripción</th>
                    <th style={{ padding: '8px', width: '80px' }}>Cant.</th>
                    <th style={{ padding: '8px', width: '110px' }}>P. Unit.</th>
                    <th style={{ padding: '8px', width: '110px' }}>Importe</th>
                    <th style={{ padding: '8px', width: '90px' }}>IVA (16%)</th>
                    <th style={{ padding: '8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No hay conceptos agregados. Selecciona una venta o haz clic en "Agregar Concepto".</td></tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px' }}>
                          <input 
                            type="text" 
                            value={it.Descripcion}
                            onChange={e => handleItemChange(idx, 'Descripcion', e.target.value)}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '6px' }}>
                          <input 
                            type="number" 
                            min="1"
                            value={it.Cantidad}
                            onChange={e => handleItemChange(idx, 'Cantidad', e.target.value)}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '6px' }}>
                          <input 
                            type="number" 
                            step="any"
                            value={it.ValorUnitario}
                            onChange={e => handleItemChange(idx, 'ValorUnitario', e.target.value)}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '6px', fontWeight: 600 }}>${(it.Importe || 0).toFixed(2)}</td>
                        <td style={{ padding: '6px', color: '#0284c7' }}>${(it.IVA || 0).toFixed(2)}</td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <button type="button" onClick={() => handleRemoveItem(idx)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Totales */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ width: '280px', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Subtotal:</span>
                    <strong>${totals.subtotal.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#0284c7' }}>
                    <span>IVA (16%):</span>
                    <strong>${totals.ivaTotal.toFixed(2)}</strong>
                  </div>
                  <hr style={{ margin: '6px 0', borderColor: '#e2e8f0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 800 }}>
                    <span>Total:</span>
                    <span>${totals.total.toFixed(2)} MXN</span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Emitir Factura</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* ── MODAL: FORMATO IMPRESO DE FACTURA ── */}
      {viewInvoice && (
        <div className="modal-backdrop print-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '0.75rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', maxWidth: '850px', width: '100%', maxHeight: '96vh', overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} /> Imprimir Factura / PDF</button>
                <button className="btn btn-secondary" onClick={() => window.open(`/api/invoices/${viewInvoice._id}/xml`, '_blank')}>
                  <FileCode size={16} /> Descargar XML CFDI 4.0
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #bae6fd' }}>
                  ⚡ Timbrado Sandbox ({viewInvoice.ModoTimbrado || 'Prueba SAT'})
                </span>
                <button className="btn btn-secondary" onClick={() => setViewInvoice(null)}>Cerrar</button>
              </div>
            </div>

            {/* Documento Fiscal Imprimible (Formato CFDI 4.0 Oficial con elementos más grandes) */}
            <div className="printable-invoice" style={{ padding: '0', fontSize: '11.5px', fontFamily: 'Arial, Helvetica, sans-serif', color: '#0f172a', background: '#ffffff', boxSizing: 'border-box', width: '100%', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
              
              {/* HEADER SUPERIOR: Identidad Comercial + Recuadro Fiscal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px', marginBottom: '10px', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '8px' }}>
                
                {/* Columna Izquierda: Identidad, Logo y Datos Matriz */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {businessInfo?.Logo && (
                    <img 
                      src={businessInfo.Logo} 
                      alt="Logo Empresa" 
                      style={{ maxHeight: '72px', maxWidth: '170px', objectFit: 'contain', flexShrink: 0 }} 
                    />
                  )}
                  <div>
                    <h2 style={{ color: '#0f172a', fontWeight: '800', fontSize: '16px', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                      {businessInfo?.Nombre || 'COMERCIAL AGRÍCOLA MARES CERVANTES'}
                    </h2>
                    <p style={{ margin: '0 0 4px', fontSize: '10.5px', color: '#047857', fontWeight: '700', textTransform: 'uppercase' }}>
                      Servicio de Tractores y Refaccionaria
                    </p>
                    <div style={{ fontSize: '10.5px', color: '#334155', lineHeight: '1.3' }}>
                      <div><strong>Matriz:</strong> {businessInfo?.Direccion || 'Josefa Ortiz de Domínguez #S/N, C.P. 20903, Jesús María, Ags.'}</div>
                      <div><strong>Teléfono:</strong> {businessInfo?.Telefono || '(464) 640-0000'} • <strong>Email:</strong> {businessInfo?.Email || 'ventas@marescervantes.com'}</div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Recuadro Oficial Factura CFDI 4.0 */}
                <div style={{ border: '2px solid #0f172a', borderRadius: '5px', overflow: 'hidden', background: '#ffffff' }}>
                  <div style={{ background: '#0f172a', color: '#ffffff', padding: '5px 8px', fontWeight: '800', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    FACTURA (CFDI 4.0)
                  </div>
                  <div style={{ padding: '6px 10px', fontSize: '10.5px', lineHeight: '1.35', color: '#0f172a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px', marginBottom: '3px' }}>
                      <strong>FOLIO:</strong> <span style={{ fontWeight: '800', fontSize: '13px', color: '#0284c7' }}>{viewInvoice.Folio || 'FAC-00001'}</span>
                    </div>
                    <div><strong>Tipo de Comprobante:</strong> I - Ingreso</div>
                    <div><strong>No. Serie CSD:</strong> {viewInvoice.NoSerieCSD || '00001000000505123456'}</div>
                    <div><strong>Fecha Emisión:</strong> {viewInvoice.FechaEmision ? new Date(viewInvoice.FechaEmision).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</div>
                    <div><strong>Lugar de Expedición:</strong> C.P. {businessInfo?.CodigoPostal || '20903'}</div>
                  </div>
                </div>

              </div>

              {/* RECUADROS FISCALES: EMISOR Y RECEPTOR */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                
                {/* Recuadro Emisor */}
                <div style={{ border: '1px solid #94a3b8', borderRadius: '5px', overflow: 'hidden', background: '#f8fafc' }}>
                  <div style={{ background: '#334155', color: '#ffffff', padding: '4px 8px', fontWeight: '700', fontSize: '10.5px', textTransform: 'uppercase' }}>
                    DATOS DEL EMISOR
                  </div>
                  <div style={{ padding: '6px 8px', fontSize: '10.5px', lineHeight: '1.4' }}>
                    <div><strong>Razón Social:</strong> {businessInfo?.RazonSocial || 'ERNESTO MARES DE LA CRUZ'}</div>
                    <div><strong>RFC:</strong> <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{businessInfo?.RFC || 'MACE680608RC7'}</span></div>
                    <div><strong>Régimen Fiscal:</strong> {businessInfo?.RegimenFiscal || '612 - Personas Físicas con Actividades Empresariales y Profesionales'}</div>
                  </div>
                </div>

                {/* Recuadro Receptor */}
                <div style={{ border: '1px solid #94a3b8', borderRadius: '5px', overflow: 'hidden', background: '#f8fafc' }}>
                  <div style={{ background: '#334155', color: '#ffffff', padding: '4px 8px', fontWeight: '700', fontSize: '10.5px', textTransform: 'uppercase' }}>
                    DATOS DEL RECEPTOR (CLIENTE)
                  </div>
                  <div style={{ padding: '6px 8px', fontSize: '10.5px', lineHeight: '1.4' }}>
                    <div><strong>Razón Social:</strong> <span style={{ fontWeight: '700' }}>{viewInvoice.RazonSocial || 'PÚBLICO EN GENERAL'}</span></div>
                    <div><strong>RFC:</strong> <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{viewInvoice.RFC || 'XAXX010101000'}</span> • <strong>C.P. Fiscal:</strong> {viewInvoice.CodigoPostal || '36700'}</div>
                    <div><strong>Régimen Fiscal:</strong> {viewInvoice.RegimenFiscal || '616 - Sin obligaciones fiscales'}</div>
                    <div><strong>Uso de CFDI:</strong> {viewInvoice.UsoCFDI || 'G03 - Gastos en general'}</div>
                  </div>
                </div>

              </div>

              {/* TABLA DE CONCEPTOS */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', border: '1.5px solid #64748b', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#ffffff', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', width: '44%', borderRight: '1px solid #475569' }}>DESCRIPCIÓN / PRODUCTO</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: '12%', borderRight: '1px solid #475569' }}>UNIDAD</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: '8%', borderRight: '1px solid #475569' }}>CANT.</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', width: '18%', borderRight: '1px solid #475569' }}>PRECIO UNIT.</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', width: '18%' }}>IMPORTE</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewInvoice.Items && viewInvoice.Items.length > 0 ? viewInvoice.Items : [
                    { ClaveProdServ: '10151500', Cantidad: 1, ClaveUnidad: 'H87', Unidad: 'Pieza', Descripcion: 'PRODUCTO / SERVICIO AGRÍCOLA', ValorUnitario: viewInvoice.Subtotal || 0, Importe: viewInvoice.Subtotal || 0, IVA: viewInvoice.IVATotal || 0 }
                  ]).map((it, idx) => {
                    const cant = Number(it.Cantidad) || 1;
                    const precio = Number(it.ValorUnitario) || 0;
                    const importe = Number(it.Importe) || (cant * precio);
                    const ivaItem = Number(it.IVA) || Math.round(importe * 0.16 * 100) / 100;

                    return (
                      <React.Fragment key={idx}>
                        <tr style={{ borderTop: idx > 0 ? '1px solid #cbd5e1' : 'none', fontSize: '11px', background: idx % 2 === 0 ? '#ffffff' : '#fcfcfc' }}>
                          <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a', borderRight: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                            {it.Descripcion?.toUpperCase()}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0', fontSize: '10.5px', color: '#475569' }}>
                            {it.ClaveUnidad || 'H87'} - {it.Unidad || 'Pieza'}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '700', borderRight: '1px solid #e2e8f0' }}>
                            {cant}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                            ${precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            ${importe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                        {/* Sub-línea fiscal del concepto con IVA detallado */}
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', fontSize: '10px', color: '#475569' }}>
                          <td colSpan={5} style={{ padding: '3px 8px' }}>
                            <span><strong>Clave SAT:</strong> {it.ClaveProdServ || '10151500'}</span> • 
                            <span style={{ marginLeft: '8px' }}><strong>Impuesto Traslado:</strong> Base ${importe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Tasa 16% IVA = ${ivaItem.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>

              {/* SECCIÓN RESUMEN & TOTALES (2 Columnas Perfectamente Balanceadas) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px', marginBottom: '10px', alignItems: 'start' }}>
                
                {/* Columna Izquierda: Importe con Letra y Métodos de Pago */}
                <div>
                  {/* Recuadro Total con Letra */}
                  <div style={{ border: '1px solid #94a3b8', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px', background: '#f8fafc' }}>
                    <div style={{ background: '#334155', color: '#ffffff', padding: '3px 8px', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase' }}>
                      IMPORTE CON LETRA
                    </div>
                    <div style={{ padding: '6px 8px', fontWeight: '700', fontSize: '11.5px', color: '#0f172a' }}>
                      {numeroALetras(viewInvoice.Total || 0)}
                    </div>
                  </div>

                  {/* Recuadro Forma y Método de Pago */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', fontSize: '10px', background: '#ffffff', lineHeight: '1.35' }}>
                    <div><strong>Forma de Pago:</strong> {viewInvoice.FormaPago || '01 - Efectivo'}</div>
                    <div><strong>Método de Pago:</strong> {viewInvoice.MetodoPago || 'PUE - Pago en una sola exhibición'}</div>
                    <div><strong>Moneda:</strong> MXN - Peso Mexicano • <strong>Condición:</strong> Contado</div>
                  </div>
                </div>

                {/* Columna Derecha: Tabla de Desglose de Totales */}
                <div style={{ border: '2px solid #0f172a', borderRadius: '5px', overflow: 'hidden', fontSize: '11.5px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <span style={{ fontWeight: '600' }}>SUBTOTAL:</span>
                    <span style={{ fontWeight: '700' }}>${(Number(viewInvoice.Subtotal) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderBottom: '1px solid #e2e8f0', color: '#0284c7' }}>
                    <span style={{ fontWeight: '600' }}>IVA TRASLADADO (16%):</span>
                    <span style={{ fontWeight: '700' }}>${(Number(viewInvoice.IVATotal) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: '#0f172a', color: '#ffffff', fontWeight: '800', fontSize: '14px' }}>
                    <span>TOTAL:</span>
                    <span>${(Number(viewInvoice.Total) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
                  </div>
                </div>

              </div>

              {/* SECCIÓN SELLOS Y TIMBRE FISCAL DIGITAL SAT */}
              <div style={{ border: '1px solid #94a3b8', borderRadius: '5px', padding: '6px 8px', background: '#ffffff', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr', gap: '10px', alignItems: 'start' }}>
                  
                  {/* Código QR Real del SAT */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px', textAlign: 'center', background: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <QRCodeSVG 
                      value={viewInvoice.QrCodeUrl || `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${viewInvoice.FolioFiscalUUID || '4F89B2E1-98AC-4E11-9A32-88C89A0192A4'}&re=${businessInfo?.RFC || 'MACE680608RC7'}&rr=${viewInvoice.RFC || 'XAXX010101000'}&tt=${Number(viewInvoice.Total || 0).toFixed(2)}&fe=${(viewInvoice.SelloCFDI || '12345678').slice(-8)}`} 
                      size={84} 
                      level="M" 
                    />
                  </div>

                  {/* Detalle Fiscal y Sellos Digitales */}
                  <div style={{ fontSize: '9px', lineHeight: '1.2' }}>
                    {/* Header Datos del Timbre */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3px 8px', background: '#f1f5f9', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '4px', fontSize: '9.5px' }}>
                      <div><strong>Folio Fiscal (UUID):</strong> <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{viewInvoice.FolioFiscalUUID || '4F89B2E1-98AC-4E11-9A32-88C89A0192A4'}</span></div>
                      <div><strong>No. Serie CSD del SAT:</strong> <span style={{ fontFamily: 'monospace' }}>{viewInvoice.NoSerieSAT || '00001000000504465028'}</span></div>
                      <div><strong>Fecha Certificación:</strong> {viewInvoice.FechaEmision ? new Date(viewInvoice.FechaEmision).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      <div><strong>RFC Prov. Certif:</strong> SAT970701NN3</div>
                    </div>

                    {/* Sello Digital CFDI */}
                    <div style={{ marginBottom: '3px' }}>
                      <span style={{ fontWeight: '700', color: '#1e293b' }}>SELLO DIGITAL DEL CFDI:</span>
                      <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: '#475569', fontSize: '8.5px', lineHeight: '1.1' }}>
                        {viewInvoice.SelloCFDI || 'mK9+Qx4aG8Lz/W9X0y1A2bC3dE4fG5hI6jK7lM8nO9pQ0rS1tU2vW3xY4zA5bC6dE7fG8hI9jK0lM1nO2pQ3rS4tU5vW6xY7z=='}
                      </div>
                    </div>

                    {/* Sello Digital SAT */}
                    <div style={{ marginBottom: '3px' }}>
                      <span style={{ fontWeight: '700', color: '#1e293b' }}>SELLO DIGITAL DEL SAT:</span>
                      <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: '#475569', fontSize: '8.5px', lineHeight: '1.1' }}>
                        {viewInvoice.SelloSAT || 'aB1+cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4cD5eF6gH7iJ8kL9mN0oP1qR2sT3uV4wX5yZ6aB7cD8eF9gH0iJ1=='}
                      </div>
                    </div>

                    {/* Cadena Original */}
                    <div>
                      <span style={{ fontWeight: '700', color: '#1e293b' }}>CADENA ORIGINAL DEL COMPLEMENTO DE CERTIFICACIÓN DIGITAL DEL SAT:</span>
                      <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: '#475569', fontSize: '8.5px', lineHeight: '1.1' }}>
                        ||1.1|{viewInvoice.FolioFiscalUUID || '4F89B2E1-98AC-4E11-9A32-88C89A0192A4'}|2024-09-07T12:00:00|SAT970701NN3|{viewInvoice.SelloCFDI || 'mK9+Qx4aG8Lz/W9X0y1A2bC3dE4fG5hI6jK7lM8nO9pQ0rS1tU2vW3xY4z'}||
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* FOOTER GENERAL */}
              <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: '#64748b', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
                <span>Este documento es una representación impresa oficial de un CFDI versión 4.0</span>
                <span>Página 1 de 1</span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIGURACIÓN FISCAL SAT & TIMBRES (SOLO ADMIN) ── */}
      {showConfigModal && user?.rol === 'Administrador' && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '8px', borderRadius: '8px' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Configuración Fiscal & PAC (SAT)</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Panel Exclusivo de Administrador</span>
                </div>
              </div>
              <button onClick={() => setShowConfigModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleSaveConfig}>
              {/* Sección Facturapi */}
              <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: 'var(--radius)', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={16} color="#0284c7" /> Clave Secreta de Facturapi (API Key):
                  </label>
                  <a href="https://www.facturapi.io" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}>
                    Obtener en Facturapi.io <ExternalLink size={12} />
                  </a>
                </div>

                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <input 
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk_live_... o sk_test_..."
                    value={configData.FacturapiApiKey}
                    onChange={e => setConfigData({ ...configData, FacturapiApiKey: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #94a3b8', fontFamily: 'monospace', fontSize: '0.9rem' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                  • <strong>sk_live_...</strong>: Emite facturas reales timbradas ante el SAT ($0.60 por timbre).<br/>
                  • <strong>sk_test_...</strong>: Emite timbres en modo pruebas sandbox sin costo.<br/>
                  • Dejar en blanco para usar el simulador local de pruebas interno.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button 
                    type="button"
                    className="btn secondary"
                    onClick={handleTestFacturapi}
                    disabled={testingFacturapi || !configData.FacturapiApiKey}
                    style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#0284c7', color: 'white', border: 'none' }}
                  >
                    {testingFacturapi ? 'Probando...' : '🧪 Probar Conexión'}
                  </button>

                  {testResult && (
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: testResult.success ? '#16a34a' : '#dc2626' }}>
                      {testResult.success ? '✓ ' : '✕ '} {testResult.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Datos del Emisor Fiscal */}
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem', color: '#0f172a' }}>Datos Fiscales del Emisor (Tu Negocio)</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>RFC Emisor *</label>
                  <input 
                    type="text" 
                    value={configData.RFC}
                    onChange={e => setConfigData({ ...configData, RFC: e.target.value.toUpperCase() })}
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1', textTransform: 'uppercase' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Código Postal Fiscal *</label>
                  <input 
                    type="text" 
                    maxLength="5"
                    value={configData.CodigoPostal}
                    onChange={e => setConfigData({ ...configData, CodigoPostal: e.target.value })}
                    required
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Razón Social / Nombre Emisor (Sin S.A. de C.V.) *</label>
                <input 
                  type="text" 
                  value={configData.RazonSocial}
                  onChange={e => setConfigData({ ...configData, RazonSocial: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Régimen Fiscal Emisor *</label>
                <select 
                  value={configData.RegimenFiscal}
                  onChange={e => setConfigData({ ...configData, RegimenFiscal: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                >
                  {REGIMENES.map((r, idx) => (
                    <option key={idx} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Apartado para agregar/gestionar Logo de la empresa */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius)', border: '1px solid #cbd5e1' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  🖼️ Logo de la Empresa (Aparece en el encabezado de las facturas):
                </label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {configData.Logo ? (
                    <div style={{ position: 'relative', border: '1px solid #cbd5e1', padding: '4px', borderRadius: '6px', background: 'white' }}>
                      <img src={configData.Logo} alt="Previsualización Logo" style={{ maxHeight: '50px', maxWidth: '130px', objectFit: 'contain', display: 'block' }} />
                      <button
                        type="button"
                        onClick={() => setConfigData({ ...configData, Logo: '' })}
                        style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                        title="Quitar Logo"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', padding: '8px 12px', background: 'white', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                      Sin logo asignado
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setConfigData({ ...configData, Logo: reader.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    />
                    <small style={{ display: 'block', color: '#64748b', fontSize: '0.72rem', marginTop: '4px' }}>
                      Selecciona una imagen en formato PNG, JPG, SVG o WebP.
                    </small>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button type="button" className="btn secondary" onClick={() => setShowConfigModal(false)}>
                  Cerrar
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingConfig}>
                  {savingConfig ? 'Guardando...' : '💾 Guardar Configuración Fiscal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Facturas;
