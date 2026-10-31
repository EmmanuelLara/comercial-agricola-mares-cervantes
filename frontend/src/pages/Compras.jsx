import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Truck as TruckIcon, 
  Plus, 
  Trash2, 
  Receipt, 
  Coins, 
  FileText, 
  Truck, 
  Boxes, 
  RefreshCcw,
  Eye,
  Printer,
  X,
  AlertTriangle,
  Search,
  ShoppingCart
} from 'lucide-react';

// ─────────────────────────────────────────────
// Componente: Modal de Detalles de Compra
// ─────────────────────────────────────────────
const PurchaseDetailModal = ({ purchaseId, onClose, onPrint }) => {
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/purchases/${purchaseId}`);
        setPurchase(res.data.compra);
      } catch (err) {
        alert('Error al cargar detalles de la compra');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [purchaseId]);

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" style={{ maxWidth: '650px', textAlign: 'center', padding: '3rem' }}>
          <p>Cargando detalles de la compra...</p>
        </div>
      </div>
    );
  }

  if (!purchase) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Detalle de Compra #{purchase.Folio}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Registrada el {new Date(purchase.FechaRegistro).toLocaleString('es-MX')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={() => onPrint(purchase)}>
              <Printer size={16} /> Imprimir
            </button>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem', background: 'var(--bg-hover)', padding: '1rem', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Proveedor</span>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '2px' }}>
              {purchase.Id_Proveedor?.RazonSocial || 'Proveedor General'}
            </div>
            <small style={{ color: 'var(--text-muted)' }}>RFC: {purchase.Id_Proveedor?.RFC || 'N/A'}</small>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tipo de Comprobante</span>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '2px' }}>
              <span className="badge warning">{purchase.Tipodedocumento || 'Factura'}</span>
            </div>
          </div>
        </div>

        <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style={{ textAlign: 'center' }}>Cant.</th>
                <th style={{ textAlign: 'right' }}>Costo U.</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(purchase.Detalles || []).map((det, i) => (
                <tr key={i}>
                  <td>
                    <strong>{det.Nombre_Producto || 'Producto'}</strong>
                    {det.Codigo_Producto && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{det.Codigo_Producto}</div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>{det.Stock}</td>
                  <td style={{ textAlign: 'right' }}>${Number(det.Precio_Compra).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}><strong>${Number(det.MontoTotal).toFixed(2)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '2px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Inversión: </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)', marginLeft: '8px' }}>
              ${Number(purchase.MontoTotal).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente: Modal de Impresión de Compra (Recibo/Orden)
// ─────────────────────────────────────────────
const PurchasePrintModal = ({ purchase, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  if (!purchase) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ticket-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header no-print">
          <h2>Vista Previa de Comprobante</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} /> Imprimir
            </button>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="ticket-print-area" id="purchase-to-print">
          <div className="ticket-header">
            <h2 className="ticket-store-name">Comercial Agrícola</h2>
            <h3 className="ticket-store-sub">Mares Cervantes</h3>
            <p className="ticket-info">--- COMPROBANTE DE COMPRA ---</p>
            <p className="ticket-info">Folio: <strong>{purchase.Folio}</strong></p>
            <p className="ticket-info">
              {new Date(purchase.FechaRegistro).toLocaleDateString('es-MX')} {new Date(purchase.FechaRegistro).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="ticket-info">-----------------</p>
            <p className="ticket-info">Proveedor: <strong>{purchase.Id_Proveedor?.RazonSocial || 'Proveedor'}</strong></p>
            {purchase.Id_Proveedor?.RFC && (
              <p className="ticket-info">RFC: {purchase.Id_Proveedor.RFC}</p>
            )}
            <p className="ticket-info">Doc: {purchase.Tipodedocumento || 'Factura'}</p>
          </div>

          <div className="ticket-divider">-----------------</div>

          <table className="ticket-items">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>PRODUCTO</th>
                <th style={{ textAlign: 'center' }}>CANT</th>
                <th style={{ textAlign: 'right' }}>COSTO</th>
                <th style={{ textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {(purchase.Detalles || []).map((det, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'left', maxWidth: '120px', wordBreak: 'break-word' }}>
                    {det.Nombre_Producto || `Item ${i+1}`}
                  </td>
                  <td style={{ textAlign: 'center' }}>{det.Stock}</td>
                  <td style={{ textAlign: 'right' }}>${Number(det.Precio_Compra).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>${Number(det.MontoTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ticket-divider">-----------------</div>

          <div className="ticket-totals">
            <div className="ticket-total-row">
              <span>TOTAL INVERSIÓN:</span>
              <strong>${Number(purchase.MontoTotal).toFixed(2)}</strong>
            </div>
          </div>

          <div className="ticket-footer">
            <p>Entrada de Mercancía al Inventario</p>
            <small>Comercial Agrícola Mares Cervantes</small>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente: Modal de Confirmación de Eliminación
// ─────────────────────────────────────────────
const DeleteConfirmModal = ({ purchase, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/purchases/${purchase._id}`);
      onConfirm();
      onClose();
    } catch (error) {
      alert('Error al eliminar compra: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Cancelar / Eliminar Compra
          </h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ padding: '1rem 0 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            ¿Estás seguro de que deseas cancelar la compra <strong>#{purchase.Folio}</strong>?
          </p>
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '0.75rem', color: '#991b1b', fontWeight: 700 }}>
            Proveedor: {purchase.Id_Proveedor?.RazonSocial || 'N/A'}<br />
            Total: ${Number(purchase.MontoTotal).toFixed(2)}
          </div>
          <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            El stock de los productos ingresados en esta compra se restará automáticamente.
          </small>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn danger" onClick={handleDelete} disabled={deleting} style={{ background: '#ef4444', color: '#fff' }}>
            <Trash2 size={16} /> {deleting ? 'Cancelando...' : 'Sí, Cancelar Compra'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente Principal: Purchases
// ─────────────────────────────────────────────
const Purchases = () => {
  const canCreate = true;

  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailPurchaseId, setDetailPurchaseId] = useState(null);
  const [printPurchase, setPrintPurchase] = useState(null);
  const [deletingPurchase, setDeletingPurchase] = useState(null);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [docType, setDocType] = useState('Factura');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState(1);
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [cart, setCart] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/inventory')
      ]);
      setPurchases(purchasesRes.data);
      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching purchases data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductSelect = (e) => {
    const prodId = e.target.value;
    setSelectedProduct(prodId);
    const prod = products.find(p => p._id === prodId);
    if (prod) {
      setCostPrice(prod.Precio_Compra);
      setSalePrice(prod.Precio_venta);
    } else {
      setCostPrice('');
      setSalePrice('');
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return alert('Seleccione un producto');
    if (qty <= 0) return alert('La cantidad debe ser mayor a 0');
    if (!costPrice) return alert('Ingrese el precio de compra');

    const prod = products.find(p => p._id === selectedProduct);
    const newItem = {
      id: prod._id,
      name: prod.Nombre,
      code: prod.Numero,
      qty: Number(qty),
      cost: Number(costPrice),
      salePrice: Number(salePrice) || prod.Precio_venta,
      subtotal: Number(qty) * Number(costPrice)
    };

    setCart([...cart, newItem]);
    setSelectedProduct('');
    setQty(1);
    setCostPrice('');
    setSalePrice('');
  };

  const handleRemoveFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('No hay productos en la compra');
    if (!supplierId) return alert('Seleccione un proveedor');

    try {
      const purchaseData = {
        Id_Proveedor: supplierId,
        Tipodedocumento: docType,
        MontoTotal: total,
        Detalles: cart.map(item => ({
          Id_Producto: item.id,
          Precio_Compra: item.cost,
          Precio_venta: item.salePrice,
          Stock: item.qty,
          MontoTotal: item.subtotal
        }))
      };

      const res = await api.post('/purchases', purchaseData);
      setShowModal(false);
      setCart([]);
      setSupplierId('');
      await fetchData();

      // Abrir recibo automáticamente para imprimir
      if (res.data?.compra?._id) {
        const detail = await api.get(`/purchases/${res.data.compra._id}`);
        setPrintPurchase(detail.data.compra);
      }
    } catch (error) {
      alert('Error al registrar la compra: ' + (error.response?.data?.message || error.message));
    }
  };

  const today = new Date().toDateString();
  const purchasesToday = purchases.filter(p => new Date(p.FechaRegistro).toDateString() === today);
  const investmentToday = purchasesToday.reduce((acc, p) => acc + p.MontoTotal, 0);
  const activeSuppliers = new Set(purchases.map(p => p.Id_Proveedor?.RazonSocial)).size;

  return (
    <div className="purchases-page fade-in">
      <div className="no-print">
        <div className="header-actions">
          <h1>Control de Compras</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn secondary" onClick={fetchData}><RefreshCcw size={18} /> Actualizar</button>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><TruckIcon size={18} /> Registrar Compra</button>
          )}
        </div>
      </div>

      <div className="purchases-stats-container">
        <div className="purchase-stat-card">
          <div className="icon" style={{ background: '#ecfdf5', color: '#10b981' }}><FileText size={24} /></div>
          <div className="details">
            <h3>Compras Hoy</h3>
            <p>{purchasesToday.length}</p>
          </div>
        </div>
        <div className="purchase-stat-card">
          <div className="icon" style={{ background: '#fffbeb', color: '#f59e0b' }}><Coins size={24} /></div>
          <div className="details">
            <h3>Inversión Hoy</h3>
            <p>${investmentToday.toFixed(2)}</p>
          </div>
        </div>
        <div className="purchase-stat-card">
          <div className="icon" style={{ background: '#e0f2fe', color: '#0369a1' }}><Truck size={24} /></div>
          <div className="details">
            <h3>Proveedores</h3>
            <p>{activeSuppliers}</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Proveedor</th>
              <th>Tipo Doc.</th>
              <th>Fecha Registro</th>
              <th>Total Inversión</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length > 0 ? (
              purchases.map(purchase => (
                <tr key={purchase._id}>
                  <td><span className="badge warning">#{purchase.Folio}</span></td>
                  <td><strong>{purchase.Id_Proveedor?.RazonSocial || 'N/A'}</strong></td>
                  <td><span className="badge secondary">{purchase.Tipodedocumento || 'Factura'}</span></td>
                  <td>
                    <div style={{ fontSize: '0.9rem' }}>{new Date(purchase.FechaRegistro).toLocaleDateString('es-MX')}</div>
                    <small className="text-muted">{new Date(purchase.FechaRegistro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                  </td>
                  <td><strong style={{ color: 'var(--primary-dark)' }}>${Number(purchase.MontoTotal).toFixed(2)}</strong></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        className="btn-icon" 
                        title="Ver Detalles"
                        onClick={() => setDetailPurchaseId(purchase._id)}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Imprimir Comprobante"
                        onClick={async () => {
                          try {
                            const res = await api.get(`/purchases/${purchase._id}`);
                            setPrintPurchase(res.data.compra);
                          } catch { alert('Error al cargar la compra'); }
                        }}
                      >
                        <Printer size={16} />
                      </button>
                      {canCreate && (
                        <button 
                          className="btn-icon danger" 
                          title="Cancelar Compra"
                          onClick={() => setDeletingPurchase(purchase)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    <Boxes size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p>{loading ? 'Cargando compras...' : 'No se han registrado compras de inventario'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal Nueva Compra ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Entrada de Mercancía</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Proveedor</label>
                  <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
                    <option value="">Seleccione proveedor...</option>
                    {suppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.RazonSocial}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tipo Comprobante</label>
                  <select value={docType} onChange={e => setDocType(e.target.value)}>
                    <option value="Factura">Factura</option>
                    <option value="Remisión">Remisión</option>
                    <option value="Nota de Entrada">Nota de Entrada</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--bg-hover)', padding: '1.25rem', borderRadius: '12px', margin: '1rem 0' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-dark)' }}>Agregar Productos a la Orden</h4>
                <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto', alignItems: 'flex-end', gap: '8px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Producto</label>
                    <select value={selectedProduct} onChange={handleProductSelect}>
                      <option value="">Seleccionar...</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.Nombre} (Stock: {p.Stock})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Cant.</label>
                    <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Costo U.</label>
                    <input type="number" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>P. Venta</label>
                    <input type="number" step="0.01" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0.00" />
                  </div>
                  <button type="button" className="btn btn-primary" onClick={handleAddToCart} style={{ height: '42px', padding: '0 15px' }}>
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <div className="cart-container" style={{ margin: '1rem 0' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Costo</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, index) => (
                      <tr key={index}>
                        <td><strong>{item.name}</strong> <small className="text-muted">#{item.code}</small></td>
                        <td>{item.qty}</td>
                        <td>${item.cost.toFixed(2)}</td>
                        <td><strong>${item.subtotal.toFixed(2)}</strong></td>
                        <td>
                          <button type="button" className="btn-icon danger" onClick={() => handleRemoveFromCart(index)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cart.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No hay productos en la lista
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  Total Compra: <span style={{ color: 'var(--primary-dark)' }}>${total.toFixed(2)}</span>
                </div>
                <div className="modal-actions" style={{ margin: 0 }}>
                  <button type="button" className="btn secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={cart.length === 0}>
                    Finalizar y Guardar Compra
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Ver Detalles ── */}
      {detailPurchaseId && (
        <PurchaseDetailModal 
          purchaseId={detailPurchaseId} 
          onClose={() => setDetailPurchaseId(null)} 
          onPrint={(p) => { setDetailPurchaseId(null); setPrintPurchase(p); }} 
        />
      )}
      </div>

      {/* ── Modal Imprimir Comprobante ── */}
      {printPurchase && (
        <PurchasePrintModal 
          purchase={printPurchase} 
          onClose={() => setPrintPurchase(null)} 
        />
      )}

      {/* ── Modal Cancelar / Eliminar Compra ── */}
      {deletingPurchase && (
        <DeleteConfirmModal 
          purchase={deletingPurchase} 
          onClose={() => setDeletingPurchase(null)} 
          onConfirm={fetchData} 
        />
      )}
    </div>
  );
};

export default Purchases;
