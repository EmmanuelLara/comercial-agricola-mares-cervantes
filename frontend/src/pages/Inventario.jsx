import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Edit, 
  Trash, 
  Box, 
  Search, 
  BoxSelect, 
  X, 
  ScanLine, 
  CheckCircle,
  Eye,
  Printer,
  AlertTriangle,
  Save,
  MapPin,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Droplets
} from 'lucide-react';


export const CATEGORIAS_PRODUCTO = [
  'General',
  'Retenes y Sellos',
  'Filtros de Aceite',
  'Filtros de Aire',
  'Filtros Hidráulicos',
  'Filtros de Combustible',
  'Aceites y Lubricantes',
  'Baleros y Rodamientos',
  'Tornillería y Empaques',
  'Motor y Transmisión',
  'Otro'
];

export const MARCAS_TRACTOR = [
  'Universal / Multimarca',
  'John Deere',
  'Massey Ferguson',
  'Ford / New Holland',
  'Case IH',
  'Otro'
];

const EMPTY_FORM = {
  Codigo_Barras: '',
  Nombre: '',
  Descripcion: '',
  Categoria: 'General',
  Marca_Tractor: 'Universal / Multimarca',
  Ubicacion: '',
  Stock: 0,
  Stock_Minimo: 2,
  Precio_Compra: '',
  Precio_venta: '',
  Estado: 'Activo'
};

import { exportToExcel } from '../utils/exportToExcel';
import { readExcelFile } from '../utils/excelUtils';

// ─────────────────────────────────────────────
// Componente: Modal de Detalles e Impresión de Producto + Kardex
// ─────────────────────────────────────────────
const ProductDetailModal = ({ product, onClose }) => {
  const [activeTab, setActiveTab] = useState('ficha'); // 'ficha' | 'kardex'
  const [kardexData, setKardexData] = useState(null);
  const [loadingKardex, setLoadingKardex] = useState(false);

  useEffect(() => {
    if (activeTab === 'kardex' && !kardexData && product) {
      fetchKardex();
    }
  }, [activeTab]);

  const fetchKardex = async () => {
    if (!product) return;
    try {
      setLoadingKardex(true);
      const res = await api.get(`/inventory/${product._id}/kardex`);
      setKardexData(res.data);
    } catch (err) {
      console.error('Error al cargar kardex:', err);
    } finally {
      setLoadingKardex(false);
    }
  };

  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  const ganancia = Number(product.Precio_venta) - Number(product.Precio_Compra);
  const margen = Number(product.Precio_Compra) > 0 
    ? ((ganancia / Number(product.Precio_Compra)) * 100).toFixed(1) 
    : '0.0';

  const stockMin = product.Stock_Minimo !== undefined ? product.Stock_Minimo : 2;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: activeTab === 'kardex' ? '850px' : '650px', transition: 'max-width 0.3s ease' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2>Ficha & Kardex</h2>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
              <button 
                type="button"
                onClick={() => setActiveTab('ficha')}
                style={{
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'ficha' ? 'white' : 'transparent',
                  color: activeTab === 'ficha' ? 'var(--primary-dark)' : 'var(--text-muted)',
                  boxShadow: activeTab === 'ficha' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                📄 Ficha Técnica
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('kardex')}
                style={{
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'kardex' ? 'white' : 'transparent',
                  color: activeTab === 'kardex' ? 'var(--primary-dark)' : 'var(--text-muted)',
                  boxShadow: activeTab === 'kardex' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                📜 Kardex / Movimientos
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab === 'ficha' && (
              <button className="btn btn-primary" onClick={handlePrint}>
                <Printer size={16} /> Imprimir Ficha
              </button>
            )}
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* ── VISTA 1: FICHA TÉCNICA ── */}
        {activeTab === 'ficha' && (
          <div className="product-print-card" id="product-to-print" style={{ padding: '0.5rem 0' }}>
            <div style={{ borderBottom: '2px solid #10b981', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Comercial Agrícola Mares Cervantes
                </span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>{product.Nombre}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{product.Descripcion || 'Sin descripción adicional'}</p>
              </div>
              <span className={`badge ${product.Estado === 'Activo' ? 'success' : 'secondary'}`} style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                {product.Estado}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ID Sistema</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-dark)', marginTop: '4px' }}>#{product.Numero}</div>
              </div>
              <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>Estantería / Ubic.</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <MapPin size={15} /> {product.Ubicacion || 'Sin asignar'}
                </div>
              </div>
              <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stock Mínimo</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px', color: '#64748b' }}>{stockMin} u.</div>
              </div>
            </div>

            {product.Codigo_Barras && (
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '1rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Código de Barras</span>
                <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '3px', margin: '0.5rem 0', color: '#0f172a' }}>
                  {product.Codigo_Barras}
                </div>
                <small style={{ color: '#94a3b8' }}>EAN / Código escaneable</small>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '10px' }}>
                <small className="text-muted">Stock Actual</small>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: product.Stock <= stockMin ? '#ef4444' : '#10b981' }}>
                  {product.Stock} u.
                </div>
              </div>
              <div style={{ border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '10px' }}>
                <small className="text-muted">P. Compra</small>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  ${Number(product.Precio_Compra).toFixed(2)}
                </div>
              </div>
              <div style={{ border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '10px' }}>
                <small className="text-muted">P. Venta</small>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                  ${Number(product.Precio_venta).toFixed(2)}
                </div>
              </div>
              <div style={{ border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '10px' }}>
                <small className="text-muted">Margen Est.</small>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0284c7' }}>
                  +{margen}%
                </div>
              </div>
            </div>

            {product.Numero_Origen && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Código Origen / Referencia:</strong> {product.Numero_Origen}
              </p>
            )}
          </div>
        )}

        {/* ── VISTA 2: KARDEX DE MOVIMIENTOS ── */}
        {activeTab === 'kardex' && (
          <div style={{ padding: '0.5rem 0' }}>
            {loadingKardex ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Cargando historial de entradas y salidas...
              </div>
            ) : kardexData ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <small style={{ color: '#047857', fontWeight: 600 }}>Entradas Acumuladas</small>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#065f46' }}>+{kardexData.totalEntradas} u.</div>
                  </div>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <small style={{ color: '#b91c1c', fontWeight: 600 }}>Salidas Acumuladas</small>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#991b1b' }}>-{kardexData.totalSalidas} u.</div>
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <small style={{ color: '#1d4ed8', fontWeight: 600 }}>Saldo Actual Registrado</small>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e40af' }}>{product.Stock} u.</div>
                  </div>
                </div>

                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Historial de Movimientos ({kardexData.movimientos?.length || 0})
                </h4>

                {kardexData.movimientos && kardexData.movimientos.length > 0 ? (
                  <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Fecha</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Tipo</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Folio / Doc</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Tercero / Contacto</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Cant.</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>P. Unit ($)</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kardexData.movimientos.map((mov, idx) => (
                          <tr key={mov.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 12px' }}>{new Date(mov.fecha).toLocaleDateString('es-MX')}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <span className={`badge ${mov.tipo === 'ENTRADA' ? 'success' : 'danger'}`} style={{ fontSize: '0.75rem' }}>
                                {mov.tipo}
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{mov.folio} ({mov.documento})</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{mov.contacto}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: mov.tipo === 'ENTRADA' ? '#10b981' : '#ef4444' }}>
                              {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>${mov.precioUnitario?.toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800 }}>{mov.saldo} u.</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '10px', color: 'var(--text-muted)' }}>
                    No se han registrado compras o ventas asociadas a esta refacción.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente: Modal de Confirmación de Eliminación
// ─────────────────────────────────────────────
const DeleteConfirmModal = ({ product, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/inventory/${product._id}`);
      onConfirm();
      onClose();
    } catch (error) {
      alert('Error al eliminar producto: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Eliminar Producto
          </h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ padding: '1rem 0 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            ¿Estás seguro de que deseas eliminar este producto del inventario?
          </p>
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '0.75rem', color: '#991b1b', fontWeight: 700 }}>
            {product.Nombre} (#{product.Numero})
          </div>
          <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Esta acción no se puede deshacer.
          </small>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn danger" onClick={handleDelete} disabled={deleting} style={{ background: '#ef4444', color: '#fff' }}>
            <Trash size={16} /> {deleting ? 'Eliminando...' : 'Sí, Eliminar Producto'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente Principal: Inventory
// ─────────────────────────────────────────────
const Inventory = () => {
  const canManage = true;
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nombre-asc');
  const [filterReorderOnly, setFilterReorderOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('Todas');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [formData, setFormData] = useState(EMPTY_FORM);

  // ── Salida rápida de aceite / insumos ────────────────────────
  const [showSalidaModal, setShowSalidaModal] = useState(false);
  const [salidaForm, setSalidaForm] = useState({
    TipoSalida: 'Despacho de Aceite a Granel',
    Id_Producto: '',
    Nombre_Producto: '',
    Cantidad: 1,
    UnidadMedida: 'Litros',
    PrecioUnitario: '',
    DestinoTrabajo: '',
    Solicitante: 'Taller Principal',
    Observaciones: ''
  });

  const handleSalidaSubmit = async (e) => {
    e.preventDefault();
    if (!salidaForm.Nombre_Producto.trim()) {
      alert('Debe especificar el producto o lubricante a despachar');
      return;
    }
    const cant = parseFloat(salidaForm.Cantidad);
    if (!cant || cant <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    try {
      const res = await api.post('/salidas', salidaForm);
      setShowSalidaModal(false);
      setSalidaForm({
        TipoSalida: 'Despacho de Aceite a Granel',
        Id_Producto: '',
        Nombre_Producto: '',
        Cantidad: 1,
        UnidadMedida: 'Litros',
        PrecioUnitario: '',
        DestinoTrabajo: '',
        Solicitante: 'Taller Principal',
        Observaciones: ''
      });
      fetchProducts();
      alert(res.data?.message || '¡Salida registrada y stock actualizado con éxito!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al registrar salida');
    }
  };

  // ── Lector de código de barras ──────────────────────────────
  const [scannerActive, setScannerActive] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const barcodeRef = useRef('');
  const lastKeyTime = useRef(0);
  const scanTimeout = useRef(null);

  const handleBarcodeKeyDown = useCallback((e) => {
    if (!scannerActive) return;
    const now = Date.now();
    const delta = now - lastKeyTime.current;
    lastKeyTime.current = now;

    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeRef.current.trim();
      if (code.length > 2) {
        setFormData(prev => ({ ...prev, Codigo_Barras: code }));
        setScanSuccess(true);
        setScannerActive(false);
        setTimeout(() => setScanSuccess(false), 2500);
      }
      barcodeRef.current = '';
      return;
    }

    if (e.key.length > 1) return;

    if (delta < 80) {
      barcodeRef.current += e.key;
    } else {
      barcodeRef.current = e.key;
    }

    clearTimeout(scanTimeout.current);
    scanTimeout.current = setTimeout(() => {
      if (barcodeRef.current.length > 3) {
        setFormData(prev => ({ ...prev, Codigo_Barras: barcodeRef.current }));
      }
    }, 400);
  }, [scannerActive]);

  useEffect(() => {
    if (scannerActive) {
      window.addEventListener('keydown', handleBarcodeKeyDown);
      return () => window.removeEventListener('keydown', handleBarcodeKeyDown);
    }
  }, [scannerActive, handleBarcodeKeyDown]);
  // ───────────────────────────────────────────────────────────

  const fetchProducts = async () => {
    try {
      const response = await api.get('/inventory');
      setProducts(Array.isArray(response.data) ? response.data : (response.data?.productos || []));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setScannerActive(false);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      Numero_Origen: product.Numero_Origen || '',
      Codigo: product.Codigo || '',
      Codigo_Pieza: product.Codigo_Pieza || '',
      Codigo_Barras: product.Codigo_Barras || '',
      Nombre: product.Nombre || '',
      Descripcion: product.Descripcion || '',
      Categoria: product.Categoria || 'General',
      Marca_Tractor: product.Marca_Tractor || 'Universal / Multimarca',
      Ubicacion: product.Ubicacion || '',
      Stock: product.Stock || 0,
      Precio_Compra: product.Precio_Compra || '',
      Precio_venta: product.Precio_venta || '',
      Estado: product.Estado || 'Activo'
    });
    setScannerActive(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/inventory/${editingProduct._id}`, formData);
      } else {
        const res = await api.post('/inventory', formData);
        if (res.data?.merged) {
          alert(`✅ ${res.data.message}`);
        }
      }
      setShowModal(false);
      setEditingProduct(null);
      setScannerActive(false);
      setFormData(EMPTY_FORM);
      fetchProducts();
    } catch (error) {
      alert('Error al guardar el producto: ' + (error.response?.data?.message || error.message));
    }
  };

  const filteredProducts = products
    .filter(p => {
      const matchesSearch =
        (p.Nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.Numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.Ubicacion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.Codigo_Barras || '').includes(searchTerm);

      if (!matchesSearch) return false;

      if (filterReorderOnly) {
        const stockMin = p.Stock_Minimo !== undefined ? p.Stock_Minimo : 2;
        if (Number(p.Stock || 0) > stockMin) return false;
      }

      if (selectedBrand !== 'Todas') {
        const pBrand = (p.Marca_Tractor || 'Universal').toLowerCase();
        const sBrand = selectedBrand.toLowerCase();
        if (!pBrand.includes(sBrand) && !sBrand.includes(pBrand)) return false;
      }

      if (selectedCategory !== 'Todas') {
        const pCat = (p.Categoria || 'General').toLowerCase();
        const sCat = selectedCategory.toLowerCase();
        if (!pCat.includes(sCat) && !sCat.includes(pCat)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'nombre-asc') {
        return (a.Nombre || '').localeCompare(b.Nombre || '', 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'nombre-desc') {
        return (b.Nombre || '').localeCompare(a.Nombre || '', 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'stock-desc') {
        return (Number(b.Stock) || 0) - (Number(a.Stock) || 0);
      }
      if (sortBy === 'stock-asc') {
        return (Number(a.Stock) || 0) - (Number(b.Stock) || 0);
      }
      if (sortBy === 'precio-desc') {
        return (Number(b.Precio_venta) || 0) - (Number(a.Precio_venta) || 0);
      }
      return 0;
    });

  const handleExportExcel = () => {
    const columns = [
      { key: 'Numero', label: 'ID Sistema' },
      { key: 'Codigo_Barras', label: 'Cód. Barras' },
      { key: 'Nombre', label: 'Nombre de Refacción' },
      { key: 'Categoria', label: 'Categoría' },
      { key: 'Marca_Tractor', label: 'Marca Tractor' },
      { key: 'Ubicacion', label: 'Estantería / Ubicación' },
      { key: 'Descripcion', label: 'Descripción' },
      { key: 'Stock', label: 'Stock Actual' },
      { key: 'Stock_Minimo', label: 'Stock Mínimo' },
      { key: 'Precio_Compra', label: 'Precio Compra ($)' },
      { key: 'Precio_venta', label: 'Precio Venta ($)' },
      { key: 'Estado', label: 'Estado' }
    ];
    exportToExcel(filteredProducts, columns, 'inventario_refacciones_mares');
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

      if (!window.confirm(`Se leyeron ${rawJson.length} filas del archivo Excel. ¿Deseas importarlas al inventario?`)) return;

      const res = await api.post('/inventory/bulk', { productos: rawJson });
      alert(res.data.message || '¡Importación desde Excel completada!');
      fetchProducts();
    } catch (err) {
      alert('Error al leer o importar el archivo de Excel: ' + (err.response?.data?.message || err.message));
    } finally {
      e.target.value = '';
    }
  };

  const lowStockCount = products.filter(p => Number(p.Stock || 0) <= (p.Stock_Minimo !== undefined ? p.Stock_Minimo : 2)).length;

  return (
    <div className="inventory fade-in">
      <div className="no-print">
        <div className="header-actions">
          <div>
            <h1>Inventario de Productos & Refacciones</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Catálogo activo, control de estanterías y trazabilidad de piezas
            </p>
          </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="file"
            id="import-excel-input"
            accept=".xlsx, .xls, .csv"
            onChange={handleImportExcel}
            style={{ display: 'none' }}
          />
          <button className="btn secondary" onClick={() => document.getElementById('import-excel-input').click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
            <FileSpreadsheet size={18} color="#1d4ed8" /> Importar Excel
          </button>
          <button className="btn secondary" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
            <FileSpreadsheet size={18} color="#166534" /> Exportar Excel
          </button>
          <button 
            type="button"
            className="btn" 
            onClick={() => setShowSalidaModal(true)} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0284c7', color: 'white' }}
          >
            <Droplets size={18} /> Salida de Aceite / Material
          </button>
          {canManage && (
            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={18} /> Nueva Refacción
            </button>
          )}
        </div>
      </div>

      
      {/* ── BARRA 1: FILTROS RÁPIDOS POR MARCA DE TRACTOR ── */}
      <div style={{ background: '#f8fafc', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🚜 Tractor:
          </span>
          {[
            { id: 'Todas', label: 'Todas las Marcas' },
            { id: 'John Deere', label: '🚜 John Deere' },
            { id: 'Massey Ferguson', label: '🚜 Massey Ferguson' },
            { id: 'Ford / New Holland', label: '🚜 Ford / New Holland' },
            { id: 'Case IH', label: '🚜 Case IH' },
            { id: 'Universal', label: '🌐 Universal / Multimarca' }
          ].map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBrand(b.id)}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: selectedBrand === b.id ? '#16a34a' : '#cbd5e1',
                background: selectedBrand === b.id ? '#dcfce7' : '#ffffff',
                color: selectedBrand === b.id ? '#15803d' : '#475569',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BARRA 2: FILTROS RÁPIDOS POR CATEGORÍA / TIPO DE PIEZA ── */}
      <div style={{ background: '#ffffff', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🏷️ Tipo / Pieza:
          </span>
          {[
            { id: 'Todas', label: 'Todos los tipos' },
            { id: 'Retenes', label: '⭕ Retenes y Sellos' },
            { id: 'Filtros de Aceite', label: '🛢️ Filtros Aceite' },
            { id: 'Filtros de Aire', label: '💨 Filtros Aire' },
            { id: 'Filtros Hidráulicos', label: '💧 Filtros Hidráulicos' },
            { id: 'Filtros de Combustible', label: '⛽ Filtros Diésel' },
            { id: 'Aceites', label: '🛢️ Aceites / Lubricantes' },
            { id: 'Baleros', label: '⚙️ Baleros / Rodamientos' },
            { id: 'Tornillería', label: '🔩 Tornillos y Empaques' }
          ].map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: selectedCategory === c.id ? '#d97706' : '#cbd5e1',
                background: selectedCategory === c.id ? '#fef3c7' : '#ffffff',
                color: selectedCategory === c.id ? '#b45309' : '#475569',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: '1 1 auto' }}>
          <div className="search-bar" style={{ width: '320px', maxWidth: '100%', margin: 0 }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, código de barras, estante..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Botón Filtro Rápido Reabastecer */}
          <button 
            type="button" 
            onClick={() => setFilterReorderOnly(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: filterReorderOnly ? '#fef2f2' : '#ffffff',
              color: filterReorderOnly ? '#dc2626' : '#475569',
              border: '1px solid ' + (filterReorderOnly ? '#fca5a5' : '#cbd5e1'),
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: filterReorderOnly ? '0 0 0 2px rgba(220,38,38,0.15)' : 'none'
            }}
          >
            <AlertTriangle size={15} color={filterReorderOnly ? '#dc2626' : '#eab308'} />
            {filterReorderOnly ? 'Ver Todos' : `⚠️ Reabastecer (${lowStockCount})`}
          </button>

          {/* Selector de orden A-Z */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '8px' }}>
            <ArrowUpDown size={15} color="#10b981" />
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
              <option value="stock-desc">Mayor Stock (u)</option>
              <option value="stock-asc">Menor Stock (Bajo)</option>
              <option value="precio-desc">Mayor Precio ($)</option>
            </select>
          </div>
        </div>

        {/* Indicador de cantidad de registros de productos */}
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
            background: '#10b981',
            color: '#ffffff',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <Box size={14} />
          </span>
          {searchTerm.trim() || filterReorderOnly ? (
            <span>
              Mostrando <strong style={{ color: '#059669' }}>{filteredProducts.length}</strong> de <strong style={{ color: '#0f172a' }}>{products.length}</strong> productos
            </span>
          ) : (
            <span>
              Total: <strong style={{ color: '#059669', fontSize: '0.95rem' }}>{products.length.toLocaleString('es-MX')}</strong> productos registrados
            </span>
          )}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID Sistema</th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setSortBy(prev => prev === 'nombre-asc' ? 'nombre-desc' : 'nombre-asc')}
                title="Ordenar A-Z / Z-A"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: sortBy.startsWith('nombre') ? '#059669' : 'inherit' }}>
                  Nombre
                  {sortBy === 'nombre-asc' && <ArrowUp size={14} color="#059669" />}
                  {sortBy === 'nombre-desc' && <ArrowDown size={14} color="#059669" />}
                  {!sortBy.startsWith('nombre') && <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                </div>
              </th>
              <th>Cód. Barras</th>
              <th>Estantería / Ubic.</th>
              <th>Descripción</th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setSortBy(prev => prev === 'stock-desc' ? 'stock-asc' : 'stock-desc')}
                title="Ordenar por stock"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Stock
                  {sortBy === 'stock-desc' && <ArrowDown size={14} color="#10b981" />}
                  {sortBy === 'stock-asc' && <ArrowUp size={14} color="#10b981" />}
                </div>
              </th>
              <th>P. Compra</th>
              <th 
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setSortBy('precio-desc')}
                title="Ordenar por precio de venta"
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  P. Venta
                  {sortBy === 'precio-desc' && <ArrowDown size={14} color="#10b981" />}
                </div>
              </th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => {
                const stockMin = product.Stock_Minimo !== undefined ? product.Stock_Minimo : 2;
                const isOutOfStock = Number(product.Stock || 0) === 0;
                const isLowStock = Number(product.Stock || 0) <= stockMin;
                const badgeClass = isOutOfStock ? 'danger' : (isLowStock ? 'warning' : 'success');

                return (
                  <tr key={product._id}>
                    <td><span className="badge secondary">#{product.Numero}</span></td>
                    <td>
                      <div><strong>{product.Nombre}</strong></div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                        {product.Marca_Tractor && product.Marca_Tractor !== 'Universal / Multimarca' && (
                          <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontWeight: 700, border: '1px solid #bbf7d0' }}>
                            🚜 {product.Marca_Tractor}
                          </span>
                        )}
                        {product.Categoria && product.Categoria !== 'General' && (
                          <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', fontWeight: 700, border: '1px solid #fde68a' }}>
                            🏷️ {product.Categoria}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {product.Codigo_Barras ? (
                        <span className="badge secondary" style={{ fontFamily: 'monospace' }}>
                          ||| {product.Codigo_Barras}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className="badge secondary" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}>
                        <MapPin size={13} color="var(--primary)" /> {product.Ubicacion || 'Sin estante'}
                      </span>
                    </td>
                    <td><span className="text-muted">{product.Descripcion || 'Sin descripción'}</span></td>
                    <td>
                      <span className={`badge ${badgeClass}`} title={`Mínimo sugerido: ${stockMin} u.`}>
                        <Box size={14} style={{ marginRight: '4px' }} /> {product.Stock}
                        {isLowStock && <small style={{ marginLeft: '4px', opacity: 0.85 }}>(Min: {stockMin})</small>}
                      </span>
                    </td>
                  <td>${Number(product.Precio_Compra).toFixed(2)}</td>
                  <td><strong className="text-primary">${Number(product.Precio_venta).toFixed(2)}</strong></td>
                  <td>
                    <span className={`badge ${product.Estado === 'Activo' ? 'info' : 'secondary'}`}>
                      {product.Estado}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        className="btn-icon" 
                        title="Ver Ficha / Imprimir"
                        onClick={() => setViewingProduct(product)}
                      >
                        <Eye size={16} />
                      </button>
                      {canManage && (
                        <>
                          <button 
                            className="btn-icon" 
                            title="Editar"
                            onClick={() => openEditModal(product)}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn-icon danger" 
                            title="Eliminar"
                            onClick={() => setDeletingProduct(product)}
                          >
                            <Trash size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    <BoxSelect size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p>{loading ? 'Cargando productos...' : 'No hay productos que coincidan con la búsqueda'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal Crear / Editar Producto ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? `Editar Producto #${editingProduct.Numero}` : 'Añadir Nuevo Producto'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
                {/* ── Código de Barras ── */}
                <div className="form-group">
                  <label style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <ScanLine size={16} /> Código de Barras
                  </label>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <input
                      type="text"
                      name="Codigo_Barras"
                      placeholder={scannerActive ? '🔴 Apunte el lector y escanee...' : 'Escanea o escribe el código'}
                      value={formData.Codigo_Barras}
                      onChange={handleInputChange}
                      style={{
                        flex: 1,
                        borderColor: scanSuccess ? '#10b981' : scannerActive ? '#f59e0b' : undefined,
                        boxShadow: scanSuccess ? '0 0 0 3px rgba(16,185,129,0.3)' : scannerActive ? '0 0 0 3px rgba(245,158,11,0.3)' : undefined,
                        transition: 'all 0.3s'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => { setScannerActive(a => !a); barcodeRef.current = ''; }}
                      style={{
                        padding: '0 1.2rem',
                        borderRadius: '10px',
                        border: '2px solid ' + (scannerActive ? '#f59e0b' : '#10b981'),
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        background: scanSuccess ? '#10b981' : scannerActive ? '#f59e0b' : '#10b981',
                        color: '#fff',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        minHeight: '42px'
                      }}
                    >
                      {scanSuccess
                        ? <><CheckCircle size={16} /> ¡Leído!</>
                        : scannerActive
                          ? <><ScanLine size={16} /> Escaneando...</>
                          : <><ScanLine size={16} /> Activar lector</>
                      }
                    </button>
                  </div>
                </div>

                {/* ── Ubicación en Estantería ── */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={15} color="var(--primary)" /> Estantería / Ubicación
                  </label>
                  <input 
                    type="text" 
                    name="Ubicacion" 
                    placeholder="Ej: Estante A-3, Pasillo 2"
                    value={formData.Ubicacion}
                    onChange={handleInputChange}
                  />
                </div>
              
              <div className="form-group">
                <label>Nombre del Producto</label>
                <input 
                  type="text" 
                  name="Nombre" 
                  required 
                  placeholder="Nombre descriptivo"
                  value={formData.Nombre}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Descripción / Medidas (Ej: 35x52x8 mm)</label>
                <textarea 
                  name="Descripcion" 
                  rows="2" 
                  placeholder="Detalles, medidas o aplicaciones..."
                  value={formData.Descripcion}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Categoría / Tipo de Pieza</label>
                  <select
                    name="Categoria"
                    value={formData.Categoria || 'General'}
                    onChange={handleInputChange}
                  >
                    {CATEGORIAS_PRODUCTO.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Marca de Tractor / Maquinaria</label>
                  <select
                    name="Marca_Tractor"
                    value={formData.Marca_Tractor || 'Universal / Multimarca'}
                    onChange={handleInputChange}
                  >
                    {MARCAS_TRACTOR.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Stock Actual</label>
                  <input 
                    type="number" 
                    name="Stock"
                    value={formData.Stock}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Stock Mínimo (Alerta)</label>
                  <input 
                    type="number" 
                    name="Stock_Minimo"
                    placeholder="2"
                    value={formData.Stock_Minimo}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Precio Compra</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="Precio_Compra" 
                    required 
                    placeholder="0.00"
                    value={formData.Precio_Compra}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Precio Venta</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="Precio_venta" 
                    required 
                    placeholder="0.00"
                    value={formData.Precio_venta}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {editingProduct && (
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
                  <Save size={16} /> {editingProduct ? 'Guardar Cambios' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* ── Modal Registrar Salida de Aceite / Insumo ── */}
      {showSalidaModal && (
        <div className="modal-overlay" onClick={() => setShowSalidaModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Droplets size={22} color="#0284c7" />
                <h2>Despacho y Salida de Aceite / Material</h2>
              </div>
              <button className="close-button" onClick={() => setShowSalidaModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalidaSubmit} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tipo de Salida</label>
                <select
                  value={salidaForm.TipoSalida}
                  onChange={e => setSalidaForm({ ...salidaForm, TipoSalida: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="Despacho de Aceite a Granel">Despacho de Aceite a Granel (Litros)</option>
                  <option value="Salida para Trabajo en Taller">Salida para Trabajo en Taller</option>
                  <option value="Salida para Trabajo en Campo">Salida para Trabajo en Campo (Tractor)</option>
                  <option value="Material para Torno">Material para Torno y Maquinado</option>
                  <option value="Venta a Granel">Venta Mostrador a Granel</option>
                  <option value="Consumo Interno / Merma">Consumo Interno / Limpieza</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Seleccionar Producto / Aceite</label>
                <select
                  value={salidaForm.Id_Producto}
                  onChange={e => {
                    const id = e.target.value;
                    const prod = products.find(p => p._id === id);
                    setSalidaForm({
                      ...salidaForm,
                      Id_Producto: id,
                      Nombre_Producto: prod ? prod.Nombre : salidaForm.Nombre_Producto,
                      PrecioUnitario: prod ? (prod.Precio_venta || 0) : salidaForm.PrecioUnitario,
                      UnidadMedida: prod && prod.Unidad_Medida ? prod.Unidad_Medida : 'Litros'
                    });
                  }}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">-- O escribir libremente abajo --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.Nombre} (Stock: {p.Stock} {p.Unidad_Medida || 'pzas'})
                    </option>
                  ))}
                </select>
              </div>

              {!salidaForm.Id_Producto && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Nombre del Aceite / Insumo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Aceite Hidráulico ISO 68 a granel, 15W40 Diesel..."
                    value={salidaForm.Nombre_Producto}
                    onChange={e => setSalidaForm({ ...salidaForm, Nombre_Producto: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Cantidad a Despachar *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    value={salidaForm.Cantidad}
                    onChange={e => setSalidaForm({ ...salidaForm, Cantidad: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Unidad de Medida</label>
                  <select
                    value={salidaForm.UnidadMedida}
                    onChange={e => setSalidaForm({ ...salidaForm, UnidadMedida: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Litros">Litros</option>
                    <option value="Pieza">Pieza</option>
                    <option value="Cubeta 19L">Cubeta 19L</option>
                    <option value="Tambor 208L">Tambor 208L</option>
                    <option value="Metros">Metros</option>
                    <option value="Kilos">Kilos</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Destino / Trabajo / Máquina</label>
                <input
                  type="text"
                  placeholder="Ej. Tractor John Deere 6110D de Juan Pérez, Trabajo en Rancho El Freno..."
                  value={salidaForm.DestinoTrabajo}
                  onChange={e => setSalidaForm({ ...salidaForm, DestinoTrabajo: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Mecánico / Solicitante</label>
                  <input
                    type="text"
                    value={salidaForm.Solicitante}
                    onChange={e => setSalidaForm({ ...salidaForm, Solicitante: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Precio Venta / Ref ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={salidaForm.PrecioUnitario}
                    onChange={e => setSalidaForm({ ...salidaForm, PrecioUnitario: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                <button type="button" className="btn secondary" onClick={() => setShowSalidaModal(false)}>Cancelar</button>
                <button type="submit" className="btn" style={{ background: '#0284c7', color: 'white' }}>
                  Registrar Salida y Descontar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Ver Detalles / Imprimir ── */}
      {viewingProduct && (
        <ProductDetailModal product={viewingProduct} onClose={() => setViewingProduct(null)} />
      )}

      {/* ── Modal Eliminar ── */}
      {deletingProduct && (
        <DeleteConfirmModal 
          product={deletingProduct} 
          onClose={() => setDeletingProduct(null)} 
          onConfirm={fetchProducts} 
        />
      )}
    </div>
  );
};

export default Inventory;
