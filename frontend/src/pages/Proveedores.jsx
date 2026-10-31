import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Truck, 
  UserCircle, 
  Mail, 
  MapPin, 
  Edit, 
  Trash, 
  X,
  AlertTriangle,
  Save,
  Search
} from 'lucide-react';

const EMPTY_FORM = {
  RazonSocial: '',
  RFC: '',
  Contacto: '',
  Correo: '',
  Telefono: '',
  Direccion: '',
  Ciudad: '',
  Estado_Prov: '',
  CodigoPostal: '',
  Estado: 'Activo'
};

// ─────────────────────────────────────────────
// Componente: Modal de Confirmación de Eliminación
// ─────────────────────────────────────────────
const DeleteConfirmModal = ({ supplier, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/suppliers/${supplier._id}`);
      onConfirm();
      onClose();
    } catch (error) {
      alert('Error al eliminar proveedor: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Eliminar Proveedor
          </h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ padding: '1rem 0 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            ¿Estás seguro de que deseas eliminar este proveedor?
          </p>
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '0.75rem', color: '#991b1b', fontWeight: 700 }}>
            {supplier.RazonSocial} (#{supplier.Numero_Proveedor || 'PROV'})
          </div>
          <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Esta acción no se puede deshacer.
          </small>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn danger" onClick={handleDelete} disabled={deleting} style={{ background: '#ef4444', color: '#fff' }}>
            <Trash size={16} /> {deleting ? 'Eliminando...' : 'Sí, Eliminar Proveedor'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente Principal: Proveedores
// ─────────────────────────────────────────────
const Suppliers = () => {
  const canManage = true;

  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suppliers');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
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
    setEditingSupplier(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      RazonSocial: supplier.RazonSocial || '',
      RFC: supplier.RFC || '',
      Contacto: supplier.Contacto || '',
      Correo: supplier.Correo || '',
      Telefono: supplier.Telefono || '',
      Direccion: supplier.Direccion || '',
      Ciudad: supplier.Ciudad || '',
      Estado_Prov: supplier.Estado_Prov || '',
      CodigoPostal: supplier.CodigoPostal || '',
      Estado: supplier.Estado || 'Activo'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier._id}`, formData);
      } else {
        await api.post('/suppliers', formData);
      }
      setShowModal(false);
      setEditingSupplier(null);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (error) {
      alert('Error al guardar el proveedor: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    (s.RazonSocial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.RFC || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.Contacto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.Numero_Proveedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.Ciudad || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="suppliers fade-in">
      <div className="header-actions">
        <h1>Gestión de Proveedores</h1>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Truck size={18} /> Nuevo Proveedor
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="search-bar" style={{ width: '380px', maxWidth: '100%', margin: 0 }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por empresa, RFC, contacto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Indicador de cantidad de registros de proveedores */}
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
            background: '#6366f1',
            color: '#ffffff',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <Truck size={14} />
          </span>
          {searchTerm.trim() ? (
            <span>
              Mostrando <strong style={{ color: '#4f46e5' }}>{filteredSuppliers.length}</strong> de <strong style={{ color: '#0f172a' }}>{suppliers.length}</strong> proveedores
            </span>
          ) : (
            <span>
              Total: <strong style={{ color: '#4f46e5', fontSize: '0.95rem' }}>{suppliers.length.toLocaleString('es-MX')}</strong> proveedores registrados
            </span>
          )}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Razón Social / RFC</th>
              <th>Contacto</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map(p => (
                <tr key={p._id}>
                  <td><span className="badge secondary">#{p.Numero_Proveedor || 'PROV'}</span></td>
                  <td>
                    <strong>{p.RazonSocial}</strong><br />
                    <small className="text-muted">{p.RFC || 'Sin RFC'}</small>
                  </td>
                  <td>
                    <div><UserCircle size={14} className="text-muted" style={{ marginRight: '8px' }} /> {p.Contacto || 'N/A'}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}><Mail size={14} style={{ marginRight: '8px' }} /> {p.Correo || 'N/A'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>
                      {p.Ciudad ? p.Ciudad : ''} {p.Estado_Prov ? '(' + p.Estado_Prov + ')' : ''}
                    </div>
                    <small className="text-muted">{p.Direccion || ''}</small>
                  </td>
                  <td>
                    <span className={`badge ${p.Estado === 'Activo' ? 'success' : 'secondary'}`}>
                      {p.Estado || 'Activo'}
                    </span>
                  </td>
                  <td>
                    {canManage ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          className="btn-icon" 
                          title="Editar"
                          onClick={() => openEditModal(p)}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="btn-icon danger" 
                          title="Eliminar"
                          onClick={() => setDeletingSupplier(p)}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="badge secondary" style={{ fontSize: '0.75rem' }}>Solo Consulta</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    <Truck size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p>{loading ? 'Cargando proveedores...' : 'No hay proveedores registrados'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal Crear / Editar Proveedor ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSupplier ? `Editar Proveedor #${editingSupplier.Numero_Proveedor || ''}` : 'Añadir Nuevo Proveedor'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Razón Social</label>
                <input 
                  type="text" 
                  name="RazonSocial" 
                  required 
                  placeholder="Nombre de la empresa"
                  value={formData.RazonSocial}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>RFC</label>
                  <input 
                    type="text" 
                    name="RFC" 
                    placeholder="RFC de la empresa"
                    value={formData.RFC}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Contacto (Persona)</label>
                  <input 
                    type="text" 
                    name="Contacto" 
                    placeholder="Nombre de contacto"
                    value={formData.Contacto}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input 
                    type="email" 
                    name="Correo" 
                    placeholder="correo@ejemplo.com"
                    value={formData.Correo}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input 
                    type="tel" 
                    name="Telefono" 
                    placeholder="123 456 7890"
                    value={formData.Telefono}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <input 
                  type="text" 
                  name="Direccion" 
                  placeholder="Calle, número, colonia"
                  value={formData.Direccion}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Ciudad</label>
                  <input 
                    type="text" 
                    name="Ciudad" 
                    placeholder="Ciudad"
                    value={formData.Ciudad}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <input 
                    type="text" 
                    name="Estado_Prov" 
                    placeholder="Estado"
                    value={formData.Estado_Prov}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>C.P.</label>
                  <input 
                    type="text" 
                    name="CodigoPostal" 
                    placeholder="Código Postal"
                    value={formData.CodigoPostal}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {editingSupplier && (
                <div className="form-group">
                  <label>Estado</label>
                  <select name="Estado" value={formData.Estado} onChange={handleInputChange}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> {editingSupplier ? 'Guardar Cambios' : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Eliminar ── */}
      {deletingSupplier && (
        <DeleteConfirmModal 
          supplier={deletingSupplier} 
          onClose={() => setDeletingSupplier(null)} 
          onConfirm={fetchData} 
        />
      )}
    </div>
  );
};

export default Suppliers;
