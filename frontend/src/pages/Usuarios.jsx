import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { REGIMENES_FISCALES } from '../utils/satConstants';
import { 
  UserPlus, 
  Edit, 
  Trash, 
  Crown, 
  ShieldCheck, 
  User, 
  UsersRound,
  X,
  Save,
  AlertTriangle,
  KeyRound,
  Database,
  Download,
  Upload,
  CheckCircle2,
  HardDrive,
  Building2,
  Image,
  FileText
} from 'lucide-react';

// ─────────────────────────────────────────────
// Componente: Modal de Crear / Editar Usuario
// ─────────────────────────────────────────────
const UserModal = ({ editUser, onClose, onSaved }) => {
  const isEditing = !!editUser;
  const [formData, setFormData] = useState({
    Nombre_completo: editUser?.Nombre_completo || '',
    Usuario: editUser?.Usuario || '',
    Clave: '',
    Rol: editUser?.Rol || 'Vendedor'
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/users/${editUser._id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      onSaved();
      onClose();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? <><Edit size={18} style={{ marginRight: 8 }} />Editar Usuario</> : <><UserPlus size={18} style={{ marginRight: 8 }} />Nuevo Usuario</>}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              name="Nombre_completo"
              required
              placeholder="Nombre y Apellidos"
              value={formData.Nombre_completo}
              onChange={handleChange}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Usuario (Username)</label>
              <input
                type="text"
                name="Usuario"
                required
                placeholder="usuario123"
                value={formData.Usuario}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>
                <KeyRound size={14} style={{ marginRight: 4 }} />
                {isEditing ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
              </label>
              <input
                type="password"
                name="Clave"
                required={!isEditing}
                placeholder={isEditing ? '••••••••  (sin cambios)' : '••••••••'}
                value={formData.Clave}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Rol de Acceso</label>
            <select name="Rol" value={formData.Rol} onChange={handleChange} required>
              <option value="Vendedor">Vendedor — Solo ventas y consultas</option>
              <option value="Administrador">Administrador — Inventario, compras y usuarios</option>
              <option value="Jefe">Jefe — Acceso total</option>
            </select>
          </div>

          {isEditing && (
            <div style={{ padding: '0.75rem 1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              Si dejas la contraseña vacía, se conservará la contraseña actual.
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente: Modal de Confirmación de Eliminación
// ─────────────────────────────────────────────
const DeleteConfirmModal = ({ user, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/users/${user._id}`);
      onConfirm();
      onClose();
    } catch (error) {
      alert('Error al eliminar: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color: 'var(--danger)' }}>
            <AlertTriangle size={20} style={{ marginRight: 8 }} />Confirmar Eliminación
          </h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: '0.5rem 0 1.5rem', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#dc2626' }}>
            <Trash size={28} />
          </div>
          <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
            ¿Eliminar al usuario <strong>"{user.Nombre_completo}"</strong>?
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn"
            style={{ background: 'var(--danger)', color: 'white', fontWeight: 700 }}
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash size={16} /> {deleting ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Página principal de Usuarios
// ─────────────────────────────────────────────
const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  // Estados para Respaldos (Solo Admin/Jefe)
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState(null);

  // Estados para Configuración del Negocio y Hoja Membretada (Solo Admin/Jefe)
  const [businessForm, setBusinessForm] = useState({
    Nombre: '',
    RazonSocial: '',
    RFC: '',
    RegimenFiscal: '612 - Personas Físicas con Actividades Empresariales y Profesionales',
    Direccion: '',
    Telefono: '',
    Email: '',
    HeaderImage: '',
    TerminosCotizacion: '',
    TipoPersona: 'Física',
    Calle: 'JOSEFA ORTIZ DE DOMINGUEZ',
    NoExterior: '',
    NoInterior: '',
    Colonia: '',
    Municipio: 'JESUS MARIA',
    EstadoProv: 'AGUASCALIENTES',
    CodigoPostal: '20903',
    CertificadoCerName: '',
    CertificadoCerBase64: '',
    LlaveKeyName: '',
    LlaveKeyBase64: '',
    PasswordCSD: ''
  });
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [businessMsg, setBusinessMsg] = useState(null);

  const canManage = currentUser?.rol === 'Administrador';

  const fetchBusinessData = async () => {
    try {
      const res = await api.get('/business');
      if (res.data) {
        setBusinessForm({
          Nombre: res.data.Nombre || 'COMERCIAL AGRÍCOLA MARES CERVANTES',
          RazonSocial: res.data.RazonSocial || 'ERNESTO MARES DE LA CRUZ',
          RFC: res.data.RFC || 'MACE680608RC7',
          RegimenFiscal: res.data.RegimenFiscal || '612 - Personas Físicas con Actividades Empresariales y Profesionales',
          Direccion: res.data.Direccion || 'JOSEFA ORTIZ DE DOMINGUEZ C.P. 20903, JESUS MARIA, AGUASCALIENTES',
          Telefono: res.data.Telefono || '4491798590',
          Email: res.data.Email || 'comercialagricolamc@hotmail.com',
          HeaderImage: res.data.HeaderImage || '',
          TerminosCotizacion: res.data.TerminosCotizacion || 'Precios sujetos a cambio sin previo aviso. Tiempo de entrega según disponibilidad de almacén.',
          TipoPersona: res.data.TipoPersona || 'Física',
          Calle: res.data.Calle || 'JOSEFA ORTIZ DE DOMINGUEZ',
          NoExterior: res.data.NoExterior || '',
          NoInterior: res.data.NoInterior || '',
          Colonia: res.data.Colonia || '',
          Municipio: res.data.Municipio || 'JESUS MARIA',
          EstadoProv: res.data.EstadoProv || 'AGUASCALIENTES',
          CodigoPostal: res.data.CodigoPostal || '20903',
          CertificadoCerName: res.data.CertificadoCerName || '',
          CertificadoCerBase64: res.data.CertificadoCerBase64 || '',
          LlaveKeyName: res.data.LlaveKeyName || '',
          LlaveKeyBase64: res.data.LlaveKeyBase64 || '',
          PasswordCSD: res.data.PasswordCSD || ''
        });
      }
    } catch (err) {
      console.error('Error al cargar datos del negocio:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [response] = await Promise.all([
        api.get('/users'),
        fetchBusinessData()
      ]);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('La imagen seleccionada es demasiado grande (máximo 15MB). Por favor selecciona una versión más ligera.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      setBusinessForm(prev => ({ ...prev, HeaderImage: evt.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCerFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setBusinessForm(prev => ({
        ...prev,
        CertificadoCerName: file.name,
        CertificadoCerBase64: evt.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleKeyFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setBusinessForm(prev => ({
        ...prev,
        LlaveKeyName: file.name,
        LlaveKeyBase64: evt.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    try {
      setSavingBusiness(true);
      const res = await api.post('/business', businessForm);
      setBusinessMsg(res.data.message || '¡Configuración del negocio y Certificados Digitales CSD guardados exitosamente!');
      setTimeout(() => setBusinessMsg(null), 5000);
    } catch (err) {
      alert('Error al guardar datos del negocio: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      setDownloadingBackup(true);
      const res = await api.get('/backup/export');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `backup_mares_cervantes_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackupSuccessMsg('¡Copia de seguridad (.json) generada y descargada exitosamente!');
      setTimeout(() => setBackupSuccessMsg(null), 6000);
    } catch (err) {
      alert('Error al generar respaldo: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleRestoreFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      '⚠️ ADVERTENCIA CRÍTICA:\n\nEsta acción sobreescribirá la información de la base de datos con los datos contenidos en el archivo de respaldo seleccionado.\n\n¿Estás seguro de que deseas proceder con la restauración?'
    );

    if (!confirmed) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setRestoringBackup(true);
        const parsed = JSON.parse(event.target.result);
        const res = await api.post('/backup/import', { backup: parsed });
        setBackupSuccessMsg(res.data.message || '¡Base de datos restaurada correctamente!');
        setTimeout(() => setBackupSuccessMsg(null), 6000);
        await fetchData();
      } catch (err) {
        alert('Error al restaurar respaldo: ' + (err.response?.data?.message || err.message));
      } finally {
        setRestoringBackup(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRolBadge = (rol) => {
    if (rol === 'Jefe') return { cls: 'success', icon: <Crown size={14} style={{ marginRight: 4 }} /> };
    if (rol === 'Administrador') return { cls: 'info', icon: <ShieldCheck size={14} style={{ marginRight: 4 }} /> };
    return { cls: 'primary', icon: <User size={14} style={{ marginRight: 4 }} /> };
  };

  return (
    <div className="users-page fade-in">
      <div className="header-actions">
        <h1>Gestión de Usuarios</h1>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <UserPlus size={18} /> Nuevo Usuario
          </button>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Nombre Completo</th>
              <th>Usuario</th>
              <th>Rol de Acceso</th>
              {canManage && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(u => {
                const badge = getRolBadge(u.Rol);
                const isMe = currentUser?.id === u._id;
                return (
                  <tr key={u._id} style={isMe ? { background: 'rgba(16,185,129,0.04)' } : {}}>
                    <td>
                      <span className="badge secondary">#{u.Matricula_Usuario}</span>
                    </td>
                    <td>
                      <strong>{u.Nombre_completo}</strong>
                      {isMe && <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 700 }}>• Tú</span>}
                    </td>
                    <td>
                      <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: 'var(--primary-dark)', fontWeight: '600' }}>
                        {u.Usuario}
                      </code>
                    </td>
                    <td>
                      <span className={`badge ${badge.cls}`}>
                        {badge.icon}{u.Rol}
                      </span>
                    </td>
                    {canManage && (
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="btn-icon"
                            title="Editar usuario"
                            onClick={() => setEditingUser(u)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-icon danger"
                            title={isMe ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
                            onClick={() => !isMe && setDeletingUser(u)}
                            disabled={isMe}
                            style={{ opacity: isMe ? 0.3 : 1, cursor: isMe ? 'not-allowed' : 'pointer' }}
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={canManage ? 5 : 4} style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    <UsersRound size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p>{loading ? 'Cargando usuarios...' : 'No hay usuarios registrados'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Centro de Respaldos de Base de Datos (Solo Administrador / Jefe) ── */}
      {canManage && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow)', border: '1px solid rgba(226, 232, 240, 0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--primary-dark)' }}>
                <HardDrive size={22} color="var(--primary)" /> Centro de Respaldos & Seguridad de Datos
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
                Crea copias de seguridad de todo el catálogo, ventas, clientes y configuraciones o restaura tu información en caso de emergencia.
              </p>
            </div>
            <span className="badge info" style={{ fontWeight: 700 }}>
              🛡️ Exclusivo Administrador
            </span>
          </div>

          {backupSuccessMsg && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', fontWeight: 700 }}>
              <CheckCircle2 size={20} color="#059669" />
              {backupSuccessMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            
            {/* Opción 1: Descargar Respaldo */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={18} color="#059669" /> Descargar Copia de Seguridad (.json)
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Genera un archivo completo con todos los productos, estanterías, historial de ventas, compras a proveedores y cuentas.
                </p>
              </div>
              <button 
                onClick={handleDownloadBackup} 
                disabled={downloadingBackup}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
              >
                {downloadingBackup ? 'Generando archivo...' : <><Download size={16} /> Descargar Respaldo Completo</>}
              </button>
            </div>

            {/* Opción 2: Restaurar Respaldo */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={18} color="#2563eb" /> Restaurar Base de Datos
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Carga un archivo de respaldo generado previamente para restaurar el sistema.
                </p>
              </div>
              <div>
                <input
                  type="file"
                  id="restore-file-input"
                  accept=".json"
                  onChange={handleRestoreFileSelect}
                  style={{ display: 'none' }}
                />
                <button 
                  onClick={() => document.getElementById('restore-file-input').click()}
                  disabled={restoringBackup}
                  className="btn secondary"
                  style={{ width: '100%', marginTop: '1rem', justifyContent: 'center', border: '1px solid #cbd5e1' }}
                >
                  {restoringBackup ? 'Restaurando base de datos...' : <><Upload size={16} /> Seleccionar Archivo .json</>}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Panel: Configuración del Negocio & Hoja Membretada (Solo Administrador) ── */}
      {canManage && (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow)', border: '1px solid rgba(226, 232, 240, 0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--primary-dark)' }}>
                <Building2 size={22} color="var(--primary)" /> Configuración del Negocio y Hoja Membretada (Cotizaciones)
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
                Sube la imagen oficial de tu hoja membretada/encabezado y edita los datos impresos en cotizaciones, servicios y documentos.
              </p>
            </div>
            <span className="badge success" style={{ fontWeight: 700 }}>
              📄 Membrete Personalizable
            </span>
          </div>

          {businessMsg && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', fontWeight: 700 }}>
              <CheckCircle2 size={20} color="#059669" />
              {businessMsg}
            </div>
          )}

          <form onSubmit={handleSaveBusiness}>
            {/* Subir Hoja Membretada / Header Image */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image size={18} color="#0284c7" /> Hoja Membretada Especial / Imagen de Encabezado
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Carga una imagen (PNG, JPG, WEBP) del encabezado u hoja membretada de tu empresa. Se imprimirá automáticamente en el encabezado de todas las cotizaciones.
              </p>

              {businessForm.HeaderImage ? (
                <div style={{ marginBottom: '1rem', border: '2px dashed #cbd5e1', padding: '1rem', borderRadius: '8px', background: 'white', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>VISTA PREVIA DE LA HOJA MEMBRETADA:</p>
                  <img 
                    src={businessForm.HeaderImage} 
                    alt="Hoja Membretada Presupuesto" 
                    style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e2e8f0' }} 
                  />
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => document.getElementById('header-image-input').click()}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <Upload size={14} /> Cambiar Imagen
                    </button>
                    <button
                      type="button"
                      className="btn danger"
                      onClick={() => setBusinessForm(prev => ({ ...prev, HeaderImage: '' }))}
                      style={{ fontSize: '0.85rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
                    >
                      <Trash size={14} /> Quitar Imagen
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => document.getElementById('header-image-input').click()}
                  style={{ border: '2px dashed #cbd5e1', padding: '2rem', borderRadius: '12px', background: 'white', textAlign: 'center', cursor: 'pointer' }}
                >
                  <Upload size={32} color="#0284c7" style={{ marginBottom: '8px', opacity: 0.8 }} />
                  <p style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Haz clic aquí para seleccionar y subir tu Hoja Membretada</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Formatos recomendados: PNG, JPG, JPEG (Máx 15MB)</p>
                </div>
              )}

              <input
                type="file"
                id="header-image-input"
                accept="image/*"
                onChange={handleHeaderImageChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* Datos Informativos y Fiscales del Negocio */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. ERNESTO MARES DE LA CRUZ"
                  value={businessForm.RazonSocial}
                  onChange={e => setBusinessForm({ ...businessForm, RazonSocial: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, color: 'var(--primary-dark)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Nombre Comercial</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Comercial Agrícola Mares Cervantes"
                  value={businessForm.Nombre}
                  onChange={e => setBusinessForm({ ...businessForm, Nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>RFC Emisor</label>
                <input
                  type="text"
                  placeholder="Ej. MACE680608RC7"
                  value={businessForm.RFC}
                  onChange={e => setBusinessForm({ ...businessForm, RFC: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', textTransform: 'uppercase', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tipo de Persona</label>
                <div style={{ display: 'flex', gap: '1.5rem', padding: '0.6rem 0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="TipoPersona" 
                      value="Física" 
                      checked={businessForm.TipoPersona === 'Física'} 
                      onChange={e => setBusinessForm({ ...businessForm, TipoPersona: e.target.value })}
                    /> Persona Física
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="TipoPersona" 
                      value="Moral" 
                      checked={businessForm.TipoPersona === 'Moral'} 
                      onChange={e => setBusinessForm({ ...businessForm, TipoPersona: e.target.value })}
                    /> Persona Moral
                  </label>
                </div>
              </div>
            </div>

            {/* Domicilio Fiscal Detallado */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Calle</label>
                <input
                  type="text"
                  placeholder="Ej. JOSEFA ORTIZ DE DOMINGUEZ"
                  value={businessForm.Calle}
                  onChange={e => setBusinessForm({ ...businessForm, Calle: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>No. Exterior</label>
                <input
                  type="text"
                  placeholder="Ej. 102"
                  value={businessForm.NoExterior}
                  onChange={e => setBusinessForm({ ...businessForm, NoExterior: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>No. Interior</label>
                <input
                  type="text"
                  placeholder="Ej. A"
                  value={businessForm.NoInterior}
                  onChange={e => setBusinessForm({ ...businessForm, NoInterior: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Colonia</label>
                <input
                  type="text"
                  placeholder="Ej. Centro"
                  value={businessForm.Colonia}
                  onChange={e => setBusinessForm({ ...businessForm, Colonia: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Municipio / Alcaldía</label>
                <input
                  type="text"
                  placeholder="Ej. JESUS MARIA"
                  value={businessForm.Municipio}
                  onChange={e => setBusinessForm({ ...businessForm, Municipio: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Estado</label>
                <input
                  type="text"
                  placeholder="Ej. AGUASCALIENTES"
                  value={businessForm.EstadoProv}
                  onChange={e => setBusinessForm({ ...businessForm, EstadoProv: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Código Postal Fiscal</label>
                <input
                  type="text"
                  placeholder="Ej. 20903"
                  value={businessForm.CodigoPostal}
                  onChange={e => setBusinessForm({ ...businessForm, CodigoPostal: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Teléfono</label>
                <input
                  type="text"
                  placeholder="Ej. 4491798590"
                  value={businessForm.Telefono}
                  onChange={e => setBusinessForm({ ...businessForm, Telefono: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="Ej. comercialagricolamc@hotmail.com"
                  value={businessForm.Email}
                  onChange={e => setBusinessForm({ ...businessForm, Email: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Régimen Fiscal Actual</label>
                <select
                  value={businessForm.RegimenFiscal}
                  onChange={e => setBusinessForm({ ...businessForm, RegimenFiscal: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                >
                  {REGIMENES_FISCALES.map((rf, idx) => (
                    <option key={idx} value={rf}>{rf}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SECCIÓN DE ARCHIVOS DIGITALES (CSD SAT) */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#0284c7" /> Archivos Digitales CSD del SAT (Timbrado Oficial)
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
                
                {/* Campo 1: Certificado Digital (.cer) */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Certificado Digital (.cer)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="file" 
                      id="cer-file-input" 
                      accept=".cer" 
                      onChange={handleCerFileChange} 
                      style={{ display: 'none' }} 
                    />
                    <button 
                      type="button" 
                      className="btn secondary" 
                      onClick={() => document.getElementById('cer-file-input').click()}
                      style={{ padding: '0.6rem 1rem', fontSize: '0.82rem' }}
                    >
                      Seleccionar .cer
                    </button>
                    <span style={{ fontSize: '0.78rem', color: businessForm.CertificadoCerName ? '#059669' : '#64748b', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {businessForm.CertificadoCerName ? `✓ ${businessForm.CertificadoCerName}` : 'Ningún archivo seleccionado'}
                    </span>
                  </div>
                </div>

                {/* Campo 2: Llave Digital (.key) */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Llave Digital (.key)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="file" 
                      id="key-file-input" 
                      accept=".key" 
                      onChange={handleKeyFileChange} 
                      style={{ display: 'none' }} 
                    />
                    <button 
                      type="button" 
                      className="btn secondary" 
                      onClick={() => document.getElementById('key-file-input').click()}
                      style={{ padding: '0.6rem 1rem', fontSize: '0.82rem' }}
                    >
                      Seleccionar .key
                    </button>
                    <span style={{ fontSize: '0.78rem', color: businessForm.LlaveKeyName ? '#059669' : '#64748b', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {businessForm.LlaveKeyName ? `✓ ${businessForm.LlaveKeyName}` : 'Ningún archivo seleccionado'}
                    </span>
                  </div>
                </div>

                {/* Campo 3: Contraseña CSD */}
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Contraseña de Llave Digital (CSD)</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={businessForm.PasswordCSD}
                    onChange={e => setBusinessForm({ ...businessForm, PasswordCSD: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Términos y Condiciones por Defecto (Cotizaciones)</label>
              <textarea
                rows="2"
                value={businessForm.TerminosCotizacion}
                onChange={e => setBusinessForm({ ...businessForm, TerminosCotizacion: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              ></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={savingBusiness}>
                <Save size={16} /> {savingBusiness ? 'Guardando...' : 'Guardar Configuración de Hoja Membretada'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Crear usuario */}
      {showCreateModal && (
        <UserModal
          editUser={null}
          onClose={() => setShowCreateModal(false)}
          onSaved={fetchData}
        />
      )}

      {/* Modal: Editar usuario */}
      {editingUser && (
        <UserModal
          editUser={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={fetchData}
        />
      )}

      {/* Modal: Confirmar eliminación */}
      {deletingUser && (
        <DeleteConfirmModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={fetchData}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .users-page { display: flex; flex-direction: column; gap: 2rem; }
      `}} />
    </div>
  );
};

export default Users;
