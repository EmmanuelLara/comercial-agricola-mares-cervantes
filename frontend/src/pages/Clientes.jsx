import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  UserPlus, 
  Mail, 
  Phone, 
  Edit, 
  Trash, 
  UserRound,
  X,
  AlertTriangle,
  Save,
  Search,
  FileSpreadsheet,
  Eye,
  MapPin,
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { exportToExcel, readExcelFile } from '../utils/excelUtils';
import { REGIMENES_FISCALES, USOS_CFDI } from '../utils/satConstants';

const EMPTY_FORM = {
  NombreCompleto: '',
  RFC: '',
  RazonSocial: '',
  RegimenFiscal: '616 - Sin obligaciones fiscales',
  UsoCFDI: 'G03 - Gastos en general',
  Total_Deuda: 0,
  CodigoPostal: '',
  Calle: '',
  Num_Ext: '',
  Num_Int: '',
  Colonia: '',
  Localidad: '',
  Municipio: '',
  EstadoGeografico: '',
  Correo: '',
  Telefono: '',
  Estado: 'Activo'
};

// ─────────────────────────────────────────────
// Componente: Modal de Confirmación de Eliminación
// ─────────────────────────────────────────────
const DeleteConfirmModal = ({ client, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/clients/${client._id}`);
      onConfirm();
      onClose();
    } catch (error) {
      alert('Error al eliminar cliente: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Eliminar Cliente
          </h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ padding: '1rem 0 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            ¿Estás seguro de que deseas eliminar a este cliente?
          </p>
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '0.75rem', color: '#991b1b', fontWeight: 700 }}>
            {client.NombreCompleto} (#{client.Numero_Cliente})
          </div>
          <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Esta acción no se puede deshacer.
          </small>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn danger" onClick={handleDelete} disabled={deleting} style={{ background: '#ef4444', color: '#fff' }}>
            <Trash size={16} /> {deleting ? 'Eliminando...' : 'Sí, Eliminar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente: Modal de Ver Detalles
// ─────────────────────────────────────────────
const ViewClientModal = ({ client, onClose }) => {
  const infoBlock = (label, value, icon, isHighlight = false) => (
    <div style={{
      background: isHighlight ? '#f8fafc' : '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    }}>
      <span style={{ fontSize: '1.25rem', marginTop: '2px', flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
          {label}
        </div>
        <div style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 500, wordBreak: 'break-word' }}>
          {value || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.92rem' }}>Sin registrar</span>}
        </div>
      </div>
    </div>
  );

  const sectionHeading = (title, icon) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', marginTop: '4px' }}>
      {icon}
      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </span>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '820px', width: '95%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem' }}>
            <Eye size={22} color="#0284c7" /> Ficha Completa del Cliente
          </h2>
          <button className="close-btn" onClick={onClose}><X size={22} /></button>
        </div>

        {/* Encabezado destacado del cliente */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          padding: '1.1rem 1.3rem',
          margin: '1rem 0 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: '#0284c7', borderRadius: '50%', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(2,132,199,0.3)' }}>
              <UserRound size={28} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0c4a6e', lineHeight: 1.2 }}>
                {client.NombreCompleto}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#0369a1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, background: '#bae6fd', padding: '2px 8px', borderRadius: '6px', color: '#0369a1' }}>
                  #{client.Numero_Cliente || 'Sin ID'}
                </span>
                {client.Serie_Interno && client.Folio_Interno && (
                  <span style={{ color: '#0284c7' }}>
                    Serie: <strong>{client.Serie_Interno}-{client.Folio_Interno}</strong>
                  </span>
                )}
                <span className={`badge ${client.Estado === 'Activo' ? 'success' : 'danger'}`} style={{ fontSize: '0.78rem', padding: '3px 8px' }}>
                  {client.Estado || 'Activo'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Saldo Deuda</div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: client.Total_Deuda > 0 ? '#dc2626' : '#16a34a'
            }}>
              ${Number(client.Total_Deuda || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Contenido en cuadrícula de 2 columnas para ver TODO JUNTO sin apretarse */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', maxHeight: '68vh', overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* Columna 1: Fiscal & Contacto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sectionHeading('Datos Fiscales y Contacto', <Building2 size={18} color="#0284c7" />)}
            
            {infoBlock('RFC SAT', client.RFC ? (
              <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, letterSpacing: '0.04em', color: '#0f172a' }}>
                {client.RFC}
              </span>
            ) : null, '🪪')}

            {infoBlock('Razón Social', client.RazonSocial, '🏢')}
            {infoBlock('Régimen Fiscal', client.RegimenFiscal, '📋')}
            {infoBlock('Uso de CFDI (SAT)', client.UsoCFDI || 'G03 - Gastos en general', '🏷️')}

            {infoBlock('Teléfono', client.Telefono ? (
              <a href={`tel:${client.Telefono}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                {client.Telefono}
              </a>
            ) : null, '📞')}

            {infoBlock('Correo Electrónico', client.Correo ? (
              <a href={`mailto:${client.Correo}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                {client.Correo}
              </a>
            ) : null, '✉️')}
          </div>

          {/* Columna 2: Ubicación & Domicilio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sectionHeading('Ubicación y Domicilio', <MapPin size={18} color="#0284c7" />)}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {infoBlock('Localidad', client.Localidad, '🏘️')}
              {infoBlock('Municipio', client.Municipio, '🏙️')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
              {infoBlock('Estado', client.EstadoGeografico, '🗺️')}
              {infoBlock('C. Postal', client.CodigoPostal, '📮')}
            </div>

            {infoBlock('Colonia', client.Colonia, '🏠')}

            {infoBlock('Calle y Números', [
              client.Calle, 
              client.Num_Ext ? `Ext. ${client.Num_Ext}` : null,
              client.Num_Int ? `Int. ${client.Num_Int}` : null
            ].filter(Boolean).join(', '), '🚪')}

            {infoBlock('Dirección Completa', client.Direccion, '📍', true)}
          </div>

        </div>

        <div className="modal-actions" style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn secondary" onClick={onClose} style={{ padding: '0.6rem 1.4rem', fontSize: '0.95rem' }}>
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente Principal: Clientes
// ─────────────────────────────────────────────
const Clients = () => {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deletingClient, setDeletingClient] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nombre-asc');
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    // Separar dirección si viene todo junto (para edición)
    setFormData({
      NombreCompleto: client.NombreCompleto || '',
      RFC: client.RFC || '',
      RazonSocial: client.RazonSocial || client.NombreCompleto || '',
      RegimenFiscal: client.RegimenFiscal || '616 - Sin obligaciones fiscales',
      UsoCFDI: client.UsoCFDI || 'G03 - Gastos en general',
      Total_Deuda: client.Total_Deuda || 0,
      CodigoPostal: client.CodigoPostal || '',
      Calle: '',
      Num_Ext: '',
      Num_Int: '',
      Colonia: client.Colonia || '',
      Localidad: client.Localidad || '',
      Municipio: client.Municipio || '',
      EstadoGeografico: client.EstadoGeografico || '',
      Correo: client.Correo || '',
      Telefono: client.Telefono || '',
      Estado: client.Estado || 'Activo',
      _direccionActual: client.Direccion || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Combinar campos de dirección en uno solo
      const { Calle, Num_Ext, Num_Int, Colonia, _direccionActual, ...rest } = formData;
      const parts = [Calle, Num_Ext].filter(Boolean).join(' ');
      const intPart = Num_Int ? `Int. ${Num_Int}` : '';
      const coloniaPart = Colonia;
      const Direccion = [parts, intPart, coloniaPart].filter(Boolean).join(', ') || _direccionActual || '';

      const payload = { ...rest, Colonia, Direccion };

      if (editingClient) {
        await api.put(`/clients/${editingClient._id}`, payload);
      } else {
        await api.post('/clients', payload);
      }
      setShowModal(false);
      setEditingClient(null);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (error) {
      alert('Error al guardar el cliente: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredClients = clients
    .filter(c => 
      (c.NombreCompleto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Numero_Cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.RFC || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.RazonSocial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Localidad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Municipio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Telefono || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.Correo || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'nombre-asc') {
        return (a.NombreCompleto || '').localeCompare(b.NombreCompleto || '', 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'nombre-desc') {
        return (b.NombreCompleto || '').localeCompare(a.NombreCompleto || '', 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'id-asc') {
        const numA = parseInt((a.Numero_Cliente || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.Numero_Cliente || '').replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      }
      if (sortBy === 'id-desc') {
        const numA = parseInt((a.Numero_Cliente || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.Numero_Cliente || '').replace(/\D/g, ''), 10) || 0;
        return numB - numA;
      }
      if (sortBy === 'deuda-desc') {
        return (Number(b.Total_Deuda) || 0) - (Number(a.Total_Deuda) || 0);
      }
      if (sortBy === 'rfc-asc') {
        return (a.RFC || '').localeCompare(b.RFC || '', 'es');
      }
      return 0;
    });

  const handleExportExcel = () => {
    const columns = [
      { key: 'Numero_Cliente', label: 'ID Cliente' },
      { key: 'RFC', label: 'RFC' },
      { key: 'RazonSocial', label: 'Razón Social' },
      { key: 'RegimenFiscal', label: 'Régimen Fiscal' },
      { key: 'UsoCFDI', label: 'Uso de CFDI' },
      { key: 'Telefono', label: 'Teléfono' },
      { key: 'Correo', label: 'Correo' },
      { key: 'Localidad', label: 'Localidad' },
      { key: 'Municipio', label: 'Municipio' },
      { key: 'EstadoGeografico', label: 'Estado Geográfico' },
      { key: 'Calle', label: 'Calle' },
      { key: 'Num_Ext', label: 'Núm. Ext.' },
      { key: 'Num_Int', label: 'Núm. Int.' },
      { key: 'Colonia', label: 'Colonia' },
      { key: 'CodigoPostal', label: 'C.P.' },
      { key: 'Estado', label: 'Estado Cliente' }
    ];
    exportToExcel(filteredClients, columns, 'clientes_mares');
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const rawJson = await readExcelFile(file);
      if (!rawJson || rawJson.length === 0) {
        alert('El archivo de Excel está vacío o no contiene filas válidas.');
        return;
      }

      if (!window.confirm(`Se leyeron ${rawJson.length} clientes del archivo Excel. ¿Deseas importarlos a la base de datos?`)) return;

      const res = await api.post('/clients/bulk', { clientes: rawJson });
      alert(res.data.message || '¡Importación de clientes completada!');
      fetchData();
    } catch (err) {
      alert('Error al leer o importar el archivo de Excel: ' + (err.response?.data?.message || err.message));
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="clients fade-in">
      <div className="header-actions">
        <div>
          <h1>Gestión de Clientes y Datos Fiscales</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Control de clientes, directorio fiscal SAT CFDI 4.0 y saldos de deuda
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="file"
            id="import-excel-clients"
            accept=".xlsx, .xls, .csv"
            onChange={handleImportExcel}
            style={{ display: 'none' }}
          />
          <button className="btn secondary" onClick={() => document.getElementById('import-excel-clients').click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
            <FileSpreadsheet size={18} color="#1d4ed8" /> Importar Excel
          </button>
          <button className="btn secondary" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
            <FileSpreadsheet size={18} color="#166534" /> Exportar Excel
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <UserPlus size={18} /> Nuevo Cliente
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: '1 1 auto' }}>
          <div className="search-bar" style={{ width: '360px', maxWidth: '100%', margin: 0 }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, RFC, localidad..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Selector de orden A-Z */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '8px' }}>
            <ArrowUpDown size={15} color="#0284c7" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Orden:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="nombre-asc">Nombre (A → Z)</option>
              <option value="nombre-desc">Nombre (Z → A)</option>
              <option value="id-asc">ID Cliente (# Menor)</option>
              <option value="id-desc">ID Cliente (# Mayor)</option>
              <option value="deuda-desc">Mayor Deuda ($)</option>
              <option value="rfc-asc">RFC (A → Z)</option>
            </select>
          </div>
        </div>

        {/* Indicador de cantidad de registros */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '6px 14px',
          borderRadius: '9999px',
          fontSize: '0.88rem',
          color: '#334155',
          fontWeight: 600,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0284c7',
            color: '#ffffff',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <UserRound size={14} />
          </span>
          {searchTerm.trim() ? (
            <span>
              Mostrando <strong style={{ color: '#0284c7' }}>{filteredClients.length}</strong> de <strong style={{ color: '#0f172a' }}>{clients.length}</strong> clientes
            </span>
          ) : (
            <span>
              Total: <strong style={{ color: '#0284c7', fontSize: '0.95rem' }}>{clients.length.toLocaleString('es-MX')}</strong> clientes registrados
            </span>
          )}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', width: '90px' }} 
                onClick={() => setSortBy(prev => prev === 'id-asc' ? 'id-desc' : 'id-asc')}
                title="Clic para ordenar por ID"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  ID Cliente
                  {sortBy === 'id-asc' && <ArrowUp size={14} color="#0284c7" />}
                  {sortBy === 'id-desc' && <ArrowDown size={14} color="#0284c7" />}
                </div>
              </th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', width: '130px' }}
                onClick={() => setSortBy('rfc-asc')}
                title="Clic para ordenar por RFC"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  RFC
                  {sortBy === 'rfc-asc' && <ArrowUp size={14} color="#0284c7" />}
                </div>
              </th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none', minWidth: '180px' }}
                onClick={() => setSortBy(prev => prev === 'nombre-asc' ? 'nombre-desc' : 'nombre-asc')}
                title="Clic para ordenar A-Z / Z-A"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: sortBy.startsWith('nombre') ? '#0284c7' : 'inherit' }}>
                  Nombre del Cliente
                  {sortBy === 'nombre-asc' && <ArrowUp size={14} color="#0284c7" />}
                  {sortBy === 'nombre-desc' && <ArrowDown size={14} color="#0284c7" />}
                  {!sortBy.startsWith('nombre') && <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                </div>
              </th>
              <th style={{ minWidth: '160px' }}>Contacto</th>
              <th style={{ minWidth: '160px' }}>Ubicación</th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none', textAlign: 'right', whiteSpace: 'nowrap', width: '120px' }}
                onClick={() => setSortBy('deuda-desc')}
                title="Clic para ordenar por mayor deuda"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', width: '100%' }}>
                  Saldo Deuda
                  {sortBy === 'deuda-desc' && <ArrowDown size={14} color="#dc2626" />}
                </div>
              </th>
              <th style={{ textAlign: 'center', whiteSpace: 'nowrap', width: '90px' }}>Estado</th>
              <th style={{ textAlign: 'center', whiteSpace: 'nowrap', width: '120px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <tr key={client._id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className="badge secondary" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      #{client.Numero_Cliente}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {client.RFC ? (
                      <code style={{ background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.82rem' }}>
                        {client.RFC}
                      </code>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Sin RFC</span>
                    )}
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{client.NombreCompleto}</strong>
                    {client.RazonSocial && client.RazonSocial !== client.NombreCompleto && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Razón: {client.RazonSocial}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.82rem' }}>
                      {client.Telefono ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
                          <Phone size={13} color="#0284c7" /> {client.Telefono}
                        </span>
                      ) : null}
                      {client.Correo ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                          <Mail size={13} color="#0284c7" /> {client.Correo}
                        </span>
                      ) : null}
                      {!client.Telefono && !client.Correo && (
                        <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Sin contacto</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                      {client.Localidad || client.Municipio ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="#0284c7" />
                          {[client.Localidad, client.Municipio].filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Sin ubicación</span>
                      )}
                      {client.CodigoPostal && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '17px' }}>CP: {client.CodigoPostal}</div>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: Number(client.Total_Deuda) > 0 ? '#dc2626' : '#16a34a'
                    }}>
                      ${Number(client.Total_Deuda || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span className={`badge ${client.Estado === 'Activo' ? 'success' : 'danger'}`}>
                      {client.Estado || 'Activo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button 
                        className="btn-icon" 
                        title="Ver detalles completos"
                        onClick={() => setViewingClient(client)}
                        style={{ color: '#0369a1', background: '#f0f9ff' }}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Editar"
                        onClick={() => openEditModal(client)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon danger" 
                        title="Eliminar"
                        onClick={() => setDeletingClient(client)}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    <UserRound size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p>{loading ? 'Cargando clientes...' : 'No hay clientes registrados'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal Crear / Editar Cliente ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingClient ? `Editar Cliente: ${editingClient.NombreCompleto}` : 'Añadir Nuevo Cliente'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre del Cliente</label>
                <input 
                  type="text" 
                  name="NombreCompleto" 
                  required 
                  placeholder="Ej. Juan Pérez López"
                  value={formData.NombreCompleto}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>RFC (Fiscal)</label>
                  <input 
                    type="text" 
                    name="RFC" 
                    placeholder="Ej. PELJ900101XYZ"
                    style={{ textTransform: 'uppercase' }}
                    value={formData.RFC}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Razón Social (Fiscal)</label>
                  <input 
                    type="text" 
                    name="RazonSocial" 
                    placeholder="Nombre o Razón Social registrada"
                    value={formData.RazonSocial}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Régimen Fiscal (SAT CFDI 4.0)</label>
                  <select name="RegimenFiscal" value={formData.RegimenFiscal} onChange={handleInputChange}>
                    {REGIMENES_FISCALES.map(rf => (
                      <option key={rf} value={rf}>{rf}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Uso de CFDI Predeterminado (SAT)</label>
                  <select name="UsoCFDI" value={formData.UsoCFDI || 'G03 - Gastos en general'} onChange={handleInputChange}>
                    {USOS_CFDI.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Total de Deuda ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="Total_Deuda" 
                    placeholder="0.00"
                    value={formData.Total_Deuda}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Estado del Cliente</label>
                  <select name="Estado" value={formData.Estado} onChange={handleInputChange}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* ── Contacto ── */}
              <div style={{ marginTop: '0.75rem', marginBottom: '0.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📞 Contacto
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input 
                    type="tel" 
                    name="Telefono" 
                    placeholder="Ej. 449 123 4567"
                    value={formData.Telefono}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input 
                    type="email" 
                    name="Correo" 
                    placeholder="cliente@ejemplo.com"
                    value={formData.Correo}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* ── Ubicación ── */}
              <div style={{ marginTop: '0.75rem', marginBottom: '0.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📍 Ubicación
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Localidad</label>
                  <input 
                    type="text" 
                    name="Localidad" 
                    placeholder="Ej. Jesús María"
                    value={formData.Localidad}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Municipio</label>
                  <input 
                    type="text" 
                    name="Municipio" 
                    placeholder="Ej. Aguascalientes"
                    value={formData.Municipio}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Estado Geográfico</label>
                <input 
                  type="text" 
                  name="EstadoGeografico" 
                  placeholder="Ej. Aguascalientes"
                  value={formData.EstadoGeografico}
                  onChange={handleInputChange}
                />
              </div>

              {/* ── Dirección ── */}
              <div style={{ marginTop: '0.75rem', marginBottom: '0.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🏠 Dirección
              </div>
              <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Calle</label>
                  <input 
                    type="text" 
                    name="Calle" 
                    placeholder="Ej. Av. Guerrero"
                    value={formData.Calle}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Núm. Ext.</label>
                  <input 
                    type="text" 
                    name="Num_Ext" 
                    placeholder="121"
                    value={formData.Num_Ext}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Núm. Int.</label>
                  <input 
                    type="text" 
                    name="Num_Int" 
                    placeholder="4"
                    value={formData.Num_Int}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Colonia</label>
                  <input 
                    type="text" 
                    name="Colonia" 
                    placeholder="Ej. Centro"
                    value={formData.Colonia}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Código Postal</label>
                  <input 
                    type="text" 
                    name="CodigoPostal" 
                    placeholder="Ej. 20900"
                    value={formData.CodigoPostal}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              {/* Vista previa de dirección combinada */}
              {(formData.Calle || formData.Num_Ext || formData.Colonia) && (
                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '8px 12px', fontSize: '0.82rem', color: '#475569', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: '#94a3b8' }}>Vista previa: </span>
                  {[formData.Calle, formData.Num_Ext, formData.Num_Int ? `Int. ${formData.Num_Int}` : '', formData.Colonia].filter(Boolean).join(', ')}
                </div>
              )}
              {/* Dirección existente al editar */}
              {editingClient && formData._direccionActual && !formData.Calle && (
                <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px', fontSize: '0.82rem', color: '#713f12', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>Dirección actual guardada: </span>{formData._direccionActual}
                  <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '2px' }}>Llena los campos de arriba para actualizarla</div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> {editingClient ? 'Guardar Cambios' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Ver Detalles ── */}
      {viewingClient && (
        <ViewClientModal 
          client={viewingClient} 
          onClose={() => setViewingClient(null)} 
        />
      )}

      {/* ── Modal Eliminar ── */}
      {deletingClient && (
        <DeleteConfirmModal 
          client={deletingClient} 
          onClose={() => setDeletingClient(null)} 
          onConfirm={fetchData} 
        />
      )}
    </div>
  );
};

export default Clients;

