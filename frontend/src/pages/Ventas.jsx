import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../services/api';
import { 
  ShoppingBasket, 
  DollarSign, 
  Users, 
  LineChart, 
  RefreshCcw, 
  Plus, 
  Eye, 
  Printer, 
  Receipt,
  PlusCircle,
  X,
  ShoppingCart,
  Barcode,
  Phone,
  Search,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  CreditCard,
  Wallet,
  ArrowRightLeft,
  Percent,
  FileSpreadsheet,
  Tag
} from 'lucide-react';
import { exportToExcel } from '../utils/exportToExcel';

// ─────────────────────────────────────────────
// Componente: Ticket para impresión
// ─────────────────────────────────────────────
const TicketPrint = ({ venta, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  if (!venta) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ticket-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header no-print">
          <h2>Vista Previa del Ticket</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} /> Imprimir
            </button>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Ticket area — solo esto se imprime */}
        <div className="ticket-print-area" ref={printRef} id="ticket-to-print">
          <div className="ticket-header">
            <h2 className="ticket-store-name">Comercial Agrícola</h2>
            <h3 className="ticket-store-sub">Mares Cervantes</h3>
            <p className="ticket-info" style={{ fontSize: '10px' }}>Refacciones para Tractores e Implementos</p>
            <p className="ticket-info">─────────────────</p>
            <p className="ticket-info">Folio: <strong>{venta.Folio}</strong></p>
            <p className="ticket-info">
              {new Date(venta.FechaRegistro).toLocaleDateString('es-MX', {
                day: '2-digit', month: '2-digit', year: 'numeric'
              })} &nbsp;
              {new Date(venta.FechaRegistro).toLocaleTimeString('es-MX', {
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
            <p className="ticket-info">─────────────────</p>
            <p className="ticket-info">Cliente: <strong>{venta.Nombre_Cliente || 'Cliente General'}</strong></p>
            {venta.Numero_Cliente && (
              <p className="ticket-info">Tel: {venta.Numero_Cliente}</p>
            )}
            <p className="ticket-info">Doc: {venta.Tipodedocumento || 'Ticket'}</p>
          </div>

          <div className="ticket-divider">─────────────────</div>

          <table className="ticket-items">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>PRODUCTO</th>
                <th style={{ textAlign: 'center' }}>CANT</th>
                <th style={{ textAlign: 'right' }}>PRECIO</th>
                <th style={{ textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {(venta.Detalles || []).map((det, i) => (
                <tr key={i}>
                  <td style={{ textAlign: 'left', maxWidth: '120px', wordBreak: 'break-word' }}>
                    {det.Nombre_Producto || `Producto ${i+1}`}
                  </td>
                  <td style={{ textAlign: 'center' }}>{det.Cantidad}</td>
                  <td style={{ textAlign: 'right' }}>${Number(det.Precio_Venta).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>${Number(det.MontoTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ticket-divider">─────────────────</div>

          <div className="ticket-totals">
            {venta.Descuento > 0 && (
              <>
                <div className="ticket-total-row">
                  <span>SUBTOTAL:</span>
                  <span>${Number(venta.Subtotal || (Number(venta.MontoTotal) + Number(venta.Descuento))).toFixed(2)}</span>
                </div>
                <div className="ticket-total-row" style={{ color: '#059669' }}>
                  <span>DESCUENTO:</span>
                  <span>-${Number(venta.Descuento).toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="ticket-total-row">
              <span>TOTAL:</span>
              <strong>${Number(venta.MontoTotal).toFixed(2)}</strong>
            </div>
            <div className="ticket-total-row">
              <span>MÉTODO PAGO:</span>
              <span style={{ fontWeight: 700 }}>{venta.MetodoPago || 'Efectivo'}</span>
            </div>
            {venta.PagoDetalles?.Referencia && (
              <div className="ticket-total-row">
                <span>REF / SPEI:</span>
                <span>{venta.PagoDetalles.Referencia}</span>
              </div>
            )}
            <div className="ticket-total-row">
              <span>PAGO:</span>
              <span>${Number(venta.MontoPago || venta.MontoTotal).toFixed(2)}</span>
            </div>
            {Number(venta.MontoCambio) > 0 && (
              <div className="ticket-total-row cambio">
                <span>CAMBIO:</span>
                <strong>${Number(venta.MontoCambio).toFixed(2)}</strong>
              </div>
            )}
          </div>

          <div className="ticket-divider">─────────────────</div>
          <p className="ticket-footer">¡Gracias por su compra!</p>
          <p className="ticket-footer small">Conserve este ticket para cualquier garantía</p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente: Modal de Detalles de Venta
// ─────────────────────────────────────────────
const SaleDetailModal = ({ saleId, onClose, onPrint }) => {
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/sales/${saleId}`);
        setVenta(res.data.venta);
      } catch (err) {
        console.error('Error al cargar detalles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [saleId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Receipt size={20} style={{ marginRight: 8 }} />Detalle de Venta</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {venta && (
              <button className="btn btn-primary" onClick={() => onPrint(venta)}>
                <Printer size={16} /> Ver Ticket
              </button>
            )}
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando detalles...</div>
        ) : venta ? (
          <div>
            {/* Info de la venta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
              <div>
                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Folio</small>
                <p style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>#{venta.Folio}</p>
              </div>
              <div>
                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Fecha</small>
                <p style={{ fontWeight: 600 }}>{new Date(venta.FechaRegistro).toLocaleString('es-MX')}</p>
              </div>
              <div>
                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Cliente</small>
                <p style={{ fontWeight: 600 }}>{venta.Nombre_Cliente || 'Cliente General'}</p>
              </div>
              <div>
                <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Tipo Doc.</small>
                <p style={{ fontWeight: 600 }}>{venta.Tipodedocumento}</p>
              </div>
              {venta.Numero_Cliente && (
                <div>
                  <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Teléfono</small>
                  <p style={{ fontWeight: 600 }}>{venta.Numero_Cliente}</p>
                </div>
              )}
            </div>

            {/* Tabla de productos */}
            <div className="table-container" style={{ boxShadow: 'none', border: '1px solid #e2e8f0' }}>
              <table>
                <thead>
                  <tr style={{ fontSize: '0.75rem' }}>
                    <th>Producto</th>
                    <th style={{ textAlign: 'center' }}>Cant.</th>
                    <th style={{ textAlign: 'right' }}>Precio Unit.</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.Detalles.map((det, i) => (
                    <tr key={i}>
                      <td><strong>{det.Nombre_Producto}</strong></td>
                      <td style={{ textAlign: 'center' }}>{det.Cantidad}</td>
                      <td style={{ textAlign: 'right' }}>${Number(det.Precio_Venta).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>${Number(det.MontoTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen de pago */}
            <div style={{ marginTop: '1.5rem', padding: '1rem 1.5rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total:</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--primary-dark)' }}>${Number(venta.MontoTotal).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pagó:</span>
                <span>${Number(venta.MontoPago).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cambio:</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>${Number(venta.MontoCambio).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--danger)', textAlign: 'center', padding: '2rem' }}>No se pudo cargar la venta.</p>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente: Modal de Confirmación de Eliminación de Venta
// ─────────────────────────────────────────────
const SaleDeleteConfirmModal = ({ sale, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/sales/${sale._id}`);
      onConfirm();
      onClose();
    } catch (error) {
      alert('Error al cancelar la venta: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Cancelar / Eliminar Venta
          </h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div style={{ padding: '1rem 0 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            ¿Estás seguro de que deseas cancelar la venta <strong>#{sale.Folio}</strong>?
          </p>
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '0.75rem', color: '#991b1b', fontWeight: 700 }}>
            Cliente: {sale.Nombre_Cliente || 'Cliente General'}<br />
            Total: ${Number(sale.MontoTotal).toFixed(2)}
          </div>
          <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            El stock de los productos vendidos se repondrá automáticamente.
          </small>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn danger" onClick={handleDelete} disabled={deleting} style={{ background: '#ef4444', color: '#fff' }}>
            <Trash2 size={16} /> {deleting ? 'Cancelando...' : 'Sí, Cancelar Venta'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Página principal de Ventas
// ─────────────────────────────────────────────
const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  // Modales secundarios
  const [detailSaleId, setDetailSaleId] = useState(null);
  const [ticketVenta, setTicketVenta] = useState(null);
  const [deletingSale, setDeletingSale] = useState(null);

  // Form fields
  const [clientName, setClientName] = useState('Cliente General');
  const [clientPhone, setClientPhone] = useState('');
  const [docType, setDocType] = useState('Ticket');
  const [paidAmount, setPaidAmount] = useState('');

  // Payment methods and discounts
  const [paymentMethod, setPaymentMethod] = useState('Efectivo'); // 'Efectivo', 'Tarjeta', 'Transferencia', 'Mixto'
  const [mixedCash, setMixedCash] = useState('');
  const [mixedCardOrTransfer, setMixedCardOrTransfer] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [discountType, setDiscountType] = useState('none'); // 'none', 'monto', 'porcentaje'
  const [discountValue, setDiscountValue] = useState('');

  // Product selection
  const [selectedProductId, setSelectedProductId] = useState('');
  const [tempQty, setTempQty] = useState(1);
  const [tempPrice, setTempPrice] = useState(0);

  // Barcode scanner
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeMsg, setBarcodeMsg] = useState('');
  const barcodeRef = useRef(null);
  const barcodeBuffer = useRef('');
  const barcodeTimer = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, prodRes] = await Promise.all([
        api.get('/sales'),
        api.get('/inventory')
      ]);
      setSales(salesRes.data);
      setProducts(prodRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Barcode scanner: detecta entrada rápida de lector USB ──
  const handleBarcodeKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      const code = barcodeBuffer.current.trim();
      barcodeBuffer.current = '';
      clearTimeout(barcodeTimer.current);
      if (code) {
        searchByBarcode(code);
        setBarcodeInput('');
      }
      return;
    }
    if (e.key.length === 1) {
      barcodeBuffer.current += e.key;
      // Reset buffer si no llega más entrada en 100ms (tipeo manual)
      clearTimeout(barcodeTimer.current);
      barcodeTimer.current = setTimeout(() => {
        barcodeBuffer.current = '';
      }, 300);
    }
  }, [products]);

  const searchByBarcode = (code) => {
    const found = products.find(
      p => p.Numero === code || 
           p.Numero_Origen === code || 
           p.Codigo === code || 
           p.Codigo_Pieza === code || 
           p.Codigo_Barras === code
    );
    if (found) {
      if (found.Stock <= 0) {
        setBarcodeMsg({ type: 'error', text: `⚠️ "${found.Nombre}" está AGOTADO (Stock: 0)` });
        setTimeout(() => setBarcodeMsg(''), 3000);
        return;
      }
      addToCartById(found._id);
      setBarcodeMsg({ type: 'success', text: `✓ Agregado: ${found.Nombre} (Stock: ${found.Stock})` });
    } else {
      setBarcodeMsg({ type: 'error', text: `✗ Código "${code}" no encontrado` });
    }
    setTimeout(() => setBarcodeMsg(''), 3000);
  };

  const handleBarcodeInputChange = (e) => {
    setBarcodeInput(e.target.value);
    barcodeBuffer.current = e.target.value;
  };

  const handleBarcodeInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeInput.trim();
      if (code) {
        searchByBarcode(code);
        setBarcodeInput('');
        barcodeBuffer.current = '';
      }
    }
  };

  // ── Carrito ──
  const handleProductSelect = (id) => {
    setSelectedProductId(id);
    const p = products.find(prod => prod._id === id);
    setTempPrice(p ? p.Precio_venta : 0);
  };

  const addToCartById = (productId, qty = 1) => {
    const p = products.find(prod => prod._id === productId);
    if (!p) return;

    if (p.Stock <= 0) {
      alert(`⚠️ El producto "${p.Nombre}" está AGOTADO (Stock: 0). Reabastécelo en Compras.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === p._id);
      const currentCartQty = existing ? existing.qty : 0;
      const targetQty = currentCartQty + qty;

      if (targetQty > p.Stock) {
        alert(`⚠️ Stock insuficiente para "${p.Nombre}". Stock disponible: ${p.Stock}, intentas llevar: ${targetQty}`);
        return prev;
      }

      if (existing) {
        return prev.map(item =>
          item.id === p._id
            ? { ...item, qty: targetQty, subtotal: item.price * targetQty }
            : item
        );
      }
      return [...prev, { id: p._id, nombre: p.Nombre, codigo: p.Numero, price: p.Precio_venta, qty, subtotal: p.Precio_venta * qty }];
    });
  };

  const addToCart = () => {
    if (!selectedProductId || tempQty < 1) return;
    addToCartById(selectedProductId, tempQty);
    setSelectedProductId('');
    setTempPrice(0);
    setTempQty(1);
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQty = (index, newQty) => {
    if (newQty < 1) return;
    const item = cart[index];
    const prod = products.find(p => p._id === item.id);
    if (prod && newQty > prod.Stock) {
      alert(`⚠️ Stock insuficiente para "${prod.Nombre}". Stock disponible: ${prod.Stock}`);
      return;
    }
    setCart(prev => prev.map((it, i) =>
      i === index
        ? { ...it, qty: newQty, subtotal: it.price * newQty }
        : it
    ));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  let discountAmount = 0;
  if (discountType === 'monto') {
    discountAmount = Math.min(Number(discountValue) || 0, subtotal);
  } else if (discountType === 'porcentaje') {
    const pct = Math.min(Math.max(Number(discountValue) || 0, 0), 100);
    discountAmount = (subtotal * pct) / 100;
  }

  const total = Math.max(0, subtotal - discountAmount);

  let effectivePaid = 0;
  if (paymentMethod === 'Efectivo') {
    effectivePaid = paidAmount ? Number(paidAmount) : 0;
  } else if (paymentMethod === 'Tarjeta' || paymentMethod === 'Transferencia') {
    effectivePaid = total;
  } else if (paymentMethod === 'Mixto') {
    effectivePaid = (Number(mixedCash) || 0) + (Number(mixedCardOrTransfer) || 0);
  }

  const change = effectivePaid >= total ? effectivePaid - total : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert('El carrito está vacío');
    
    if (paymentMethod === 'Efectivo' && Number(paidAmount) < total) {
      return alert('El monto de pago en efectivo debe ser mayor o igual al total');
    }

    if (paymentMethod === 'Mixto' && effectivePaid < total) {
      return alert(`El total cubierto ($${effectivePaid.toFixed(2)}) es menor al monto de la venta ($${total.toFixed(2)})`);
    }

    try {
      const saleData = {
        Nombre_Cliente: clientName || 'Cliente General',
        Tipodedocumento: docType,
        Numero_Cliente: clientPhone,
        MetodoPago: paymentMethod,
        PagoDetalles: {
          Efectivo: paymentMethod === 'Efectivo' ? Number(paidAmount) : (paymentMethod === 'Mixto' ? Number(mixedCash) : 0),
          Tarjeta: paymentMethod === 'Tarjeta' ? total : 0,
          Transferencia: paymentMethod === 'Transferencia' ? total : (paymentMethod === 'Mixto' ? Number(mixedCardOrTransfer) : 0),
          Referencia: transferRef || ''
        },
        Subtotal: subtotal,
        Descuento: discountAmount,
        TipoDescuento: discountType,
        MontoTotal: total,
        MontoPago: effectivePaid || total,
        MontoCambio: Number(change.toFixed(2)),
        Detalles: cart.map(item => ({
          Id_Producto: item.id,
          Precio_Venta: item.price,
          Cantidad: item.qty,
          MontoTotal: item.subtotal
        }))
      };

      const res = await api.post('/sales', saleData);
      const newSaleId = res.data.venta._id;

      setShowModal(false);
      setCart([]);
      setClientName('Cliente General');
      setClientPhone('');
      setPaidAmount('');
      setPaymentMethod('Efectivo');
      setMixedCash('');
      setMixedCardOrTransfer('');
      setTransferRef('');
      setDiscountType('none');
      setDiscountValue('');
      await fetchData();

      // Mostrar ticket automáticamente después de completar venta
      const detail = await api.get(`/sales/${newSaleId}`);
      setTicketVenta(detail.data.venta);

    } catch (error) {
      alert('Error al registrar la venta: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleExportSalesExcel = () => {
    const columns = [
      { key: 'Folio', label: 'Folio' },
      { key: 'FechaRegistro', label: 'Fecha' },
      { key: 'Nombre_Cliente', label: 'Cliente' },
      { key: 'Numero_Cliente', label: 'Teléfono' },
      { key: 'Tipodedocumento', label: 'Tipo Doc.' },
      { key: 'MetodoPago', label: 'Método de Pago' },
      { key: 'Subtotal', label: 'Subtotal ($)' },
      { key: 'Descuento', label: 'Descuento ($)' },
      { key: 'MontoTotal', label: 'Total ($)' },
      { key: 'MontoPago', label: 'Monto Pagado ($)' },
      { key: 'MontoCambio', label: 'Cambio ($)' }
    ];
    exportToExcel(sales, columns, 'ventas_refacciones_mares');
  };

  // Stats
  const today = new Date().toDateString();
  const salesToday = sales.filter(s => new Date(s.FechaRegistro).toDateString() === today);
  const totalToday = salesToday.reduce((acc, s) => acc + s.MontoTotal, 0);
  const uniqueClients = new Set(sales.map(s => s.Nombre_Cliente)).size;
  const avgTicket = sales.length > 0 ? (sales.reduce((acc, s) => acc + s.MontoTotal, 0) / sales.length) : 0;

  return (
    <div className="sales-page fade-in">
      {/* ── Header ── */}
      <div className="header-actions">
        <div>
          <h1>Control de Ventas & POS</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Registro de tickets de refacciones, cobro multimetodo y descuentos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn secondary" onClick={handleExportSalesExcel} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
            <FileSpreadsheet size={18} color="#166534" /> Exportar Excel
          </button>
          <button className="btn secondary" onClick={fetchData}><RefreshCcw size={18} /> Actualizar</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><ShoppingCart size={18} /> Nueva Venta</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="sales-stats-container">
        <div className="sales-stat-card">
          <div className="icon" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}><ShoppingBasket size={24} /></div>
          <div className="details"><h3>Ventas Hoy</h3><p>{salesToday.length}</p></div>
        </div>
        <div className="sales-stat-card">
          <div className="icon" style={{ background: '#e0f2fe', color: '#0369a1' }}><DollarSign size={24} /></div>
          <div className="details"><h3>Total Hoy</h3><p>${totalToday.toFixed(2)}</p></div>
        </div>
        <div className="sales-stat-card">
          <div className="icon" style={{ background: '#fdf2f8', color: '#9d174d' }}><Users size={24} /></div>
          <div className="details"><h3>Clientes Únicos</h3><p>{uniqueClients}</p></div>
        </div>
        <div className="sales-stat-card">
          <div className="icon" style={{ background: '#fef9c3', color: '#854d0e' }}><LineChart size={24} /></div>
          <div className="details"><h3>Ticket Promedio</h3><p>${avgTicket.toFixed(2)}</p></div>
        </div>
      </div>

      {/* ── Tabla de ventas ── */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Doc.</th>
              <th>Método</th>
              <th>Fecha / Hora</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Cambio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map(sale => (
                <tr key={sale._id}>
                  <td><span className="badge info">#{sale.Folio}</span></td>
                  <td><strong>{sale.Nombre_Cliente}</strong></td>
                  <td><span className="badge secondary">{sale.Tipodedocumento}</span></td>
                  <td>
                    <span className="badge secondary" style={{ fontWeight: 600, fontSize: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      {sale.MetodoPago === 'Tarjeta' ? '💳 Tarjeta' : (sale.MetodoPago === 'Transferencia' ? '📲 SPEI' : (sale.MetodoPago === 'Mixto' ? '🔀 Mixto' : '💵 Efectivo'))}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem' }}>{new Date(sale.FechaRegistro).toLocaleDateString('es-MX')}</div>
                    <small className="text-muted">{new Date(sale.FechaRegistro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                  </td>
                  <td><strong style={{ color: 'var(--primary-dark)' }}>${sale.MontoTotal.toFixed(2)}</strong></td>
                  <td>${sale.MontoPago?.toFixed(2) ?? '0.00'}</td>
                  <td><span className="text-muted">${sale.MontoCambio?.toFixed(2) ?? '0.00'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn-icon"
                        title="Ver Detalles"
                        onClick={() => setDetailSaleId(sale._id)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Imprimir Ticket"
                        onClick={async () => {
                          try {
                            const res = await api.get(`/sales/${sale._id}`);
                            setTicketVenta(res.data.venta);
                          } catch { alert('Error al cargar el ticket'); }
                        }}
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        className="btn-icon danger"
                        title="Cancelar Venta"
                        onClick={() => setDeletingSale(sale)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '4rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    <Receipt size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p>{loading ? 'Cargando ventas...' : 'No se han registrado ventas recientemente'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Nueva Venta ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Nueva Venta</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>

              {/* Datos del cliente */}
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre del Cliente</label>
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Cliente General" />
                </div>
                <div className="form-group">
                  <label><Phone size={14} style={{ marginRight: 4 }} />Teléfono (Opcional)</label>
                  <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="614-000-0000" />
                </div>
                <div className="form-group">
                  <label>Tipo de Documento</label>
                  <select value={docType} onChange={e => setDocType(e.target.value)}>
                    <option value="Ticket">Ticket de Venta</option>
                    <option value="Factura">CFDI / Factura</option>
                  </select>
                </div>
              </div>

              {/* Sección de productos */}
              <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PlusCircle size={18} /> Agregar Productos
                </h3>

                {/* Scanner de código de barras */}
                <div className="barcode-section">
                  <div className="barcode-input-wrapper">
                    <Barcode size={18} className="barcode-icon" />
                    <input
                      ref={barcodeRef}
                      type="text"
                      className="barcode-input"
                      placeholder="Escanea o escribe el código de barras y presiona Enter..."
                      value={barcodeInput}
                      onChange={handleBarcodeInputChange}
                      onKeyDown={handleBarcodeInputKeyDown}
                      autoComplete="off"
                    />
                  </div>
                  {barcodeMsg && (
                    <div className={`barcode-msg ${barcodeMsg.type}`}>
                      {barcodeMsg.text}
                    </div>
                  )}
                </div>

                {/* Selección manual */}
                <div className="form-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr auto', alignItems: 'flex-end', marginTop: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label><Search size={14} style={{ marginRight: 4 }} />Buscar por Nombre</label>
                    <select value={selectedProductId} onChange={e => handleProductSelect(e.target.value)}>
                      <option value="">Seleccione un producto...</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.Nombre} — ${p.Precio_venta?.toFixed(2)} (Stock: {p.Stock})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Precio Unit.</label>
                    <input type="number" readOnly value={tempPrice} placeholder="0.00" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Cantidad</label>
                    <input type="number" min="1" value={tempQty} onChange={e => setTempQty(parseInt(e.target.value) || 0)} />
                  </div>
                  <button type="button" className="btn btn-primary" onClick={addToCart} style={{ padding: '0.85rem' }}>
                    <Plus size={18} />
                  </button>
                </div>

                {/* Carrito */}
                <div className="table-container" style={{ marginTop: '1.5rem', boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                  <table>
                    <thead>
                      <tr style={{ fontSize: '0.7rem' }}>
                        <th>Código</th>
                        <th>Producto</th>
                        <th style={{ textAlign: 'right' }}>Precio</th>
                        <th style={{ textAlign: 'center' }}>Cant.</th>
                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.length > 0 ? (
                        cart.map((item, index) => (
                          <tr key={index}>
                            <td><span className="badge secondary">{item.codigo}</span></td>
                            <td><strong>{item.nombre}</strong></td>
                            <td style={{ textAlign: 'right' }}>${item.price.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <button type="button" className="qty-btn" onClick={() => updateQty(index, item.qty - 1)}>−</button>
                                <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700 }}>{item.qty}</span>
                                <button type="button" className="qty-btn" onClick={() => updateQty(index, item.qty + 1)}>+</button>
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>${item.subtotal.toFixed(2)}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button type="button" className="btn-icon danger" onClick={() => removeFromCart(index)}><X size={16} /></button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="6" style={{ textAlign:'center', padding:'2rem', color:'#94a3b8' }}>El carrito está vacío — escanea un código o selecciona un producto</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumen de pago y métodos */}
              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', alignItems: 'start' }}>
                
                {/* Métodos de Pago y Descuento */}
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                    Método de Pago
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[
                      { id: 'Efectivo', label: '💵 Efectivo', icon: Wallet },
                      { id: 'Tarjeta', label: '💳 Tarjeta', icon: CreditCard },
                      { id: 'Transferencia', label: '📲 Transferencia / SPEI', icon: ArrowRightLeft },
                      { id: 'Mixto', label: '🔀 Pago Mixto', icon: DollarSign }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        style={{
                          padding: '0.65rem 0.5rem',
                          borderRadius: '8px',
                          border: paymentMethod === m.id ? '2px solid var(--primary)' : '1px solid #cbd5e1',
                          background: paymentMethod === m.id ? '#ecfdf5' : 'white',
                          color: paymentMethod === m.id ? 'var(--primary-dark)' : 'var(--text-main)',
                          fontWeight: paymentMethod === m.id ? 800 : 600,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Campos condicionales según el método */}
                  {paymentMethod === 'Transferencia' && (
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.8rem' }}>Referencia / Folio SPEI (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej: 12345678 o autorización"
                        value={transferRef}
                        onChange={e => setTransferRef(e.target.value)}
                        style={{ background: 'white' }}
                      />
                    </div>
                  )}

                  {paymentMethod === 'Mixto' && (
                    <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                      <div className="form-grid" style={{ marginBottom: 0 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>Efectivo ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={mixedCash}
                            onChange={e => setMixedCash(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.75rem' }}>Tarjeta / SPEI ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={mixedCardOrTransfer}
                            onChange={e => setMixedCardOrTransfer(e.target.value)}
                          />
                        </div>
                      </div>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>
                        Cubierto: ${((Number(mixedCash) || 0) + (Number(mixedCardOrTransfer) || 0)).toFixed(2)} de ${total.toFixed(2)}
                      </small>
                    </div>
                  )}

                  {/* Sección de Descuento */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={14} color="#059669" /> Aplicar Descuento
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => { setDiscountType('none'); setDiscountValue(''); }}
                          style={{
                            padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
                            background: discountType === 'none' ? '#0f172a' : '#e2e8f0',
                            color: discountType === 'none' ? 'white' : '#64748b', fontWeight: 600
                          }}
                        >
                          Ninguno
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('monto')}
                          style={{
                            padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
                            background: discountType === 'monto' ? '#059669' : '#e2e8f0',
                            color: discountType === 'monto' ? 'white' : '#64748b', fontWeight: 600
                          }}
                        >
                          En Pesos ($)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('porcentaje')}
                          style={{
                            padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer',
                            background: discountType === 'porcentaje' ? '#0284c7' : '#e2e8f0',
                            color: discountType === 'porcentaje' ? 'white' : '#64748b', fontWeight: 600
                          }}
                        >
                          Porcentaje (%)
                        </button>
                      </div>
                    </div>

                    {discountType !== 'none' && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          step={discountType === 'monto' ? '0.50' : '1'}
                          placeholder={discountType === 'monto' ? 'Monto en $ (Ej: 50.00)' : 'Porcentaje % (Ej: 10)'}
                          value={discountValue}
                          onChange={e => setDiscountValue(e.target.value)}
                          style={{ background: 'white' }}
                        />
                        {discountAmount > 0 && (
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>
                            -${discountAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* Desglose de Totales y Cobro */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                  
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '1rem', color: '#059669', fontWeight: 700 }}>
                      <span>Descuento aplicado:</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)', borderTop: discountAmount > 0 ? '1px dashed #e2e8f0' : 'none', paddingTop: discountAmount > 0 ? '0.5rem' : 0 }}>
                    <span>TOTAL A PAGAR:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  {paymentMethod === 'Efectivo' && (
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ fontWeight: 700 }}>Paga con Efectivo:</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        style={{ fontSize: '1.2rem', fontWeight: 700 }}
                        value={paidAmount}
                        onChange={e => setPaidAmount(e.target.value)}
                      />
                    </div>
                  )}

                  {paymentMethod === 'Efectivo' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-muted)', fontSize: '1.1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                      <span>{Number(paidAmount) < total && paidAmount > 0 ? 'FALTANTE:' : 'CAMBIO:'}</span>
                      <span style={{ color: Number(paidAmount) < total && paidAmount > 0 ? 'var(--danger)' : 'var(--primary-dark)', fontSize: '1.2rem' }}>
                        ${Math.abs(change).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {paymentMethod !== 'Efectivo' && paymentMethod !== 'Mixto' && (
                    <div style={{ background: '#ecfdf5', padding: '0.85rem', borderRadius: '8px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 700 }}>
                        Cobro exacto vía {paymentMethod}: <strong>${total.toFixed(2)}</strong>
                      </span>
                    </div>
                  )}
                </div>

              </div>

              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2.5rem' }}>
                  <CheckCircle2 size={18} /> Completar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Detalles de Venta ── */}
      {detailSaleId && (
        <SaleDetailModal
          saleId={detailSaleId}
          onClose={() => setDetailSaleId(null)}
          onPrint={(venta) => {
            setDetailSaleId(null);
            setTicketVenta(venta);
          }}
        />
      )}

      {/* ── Modal: Ticket Imprimible ── */}
      {ticketVenta && (
        <TicketPrint
          venta={ticketVenta}
          onClose={() => setTicketVenta(null)}
        />
      )}

      {/* ── Modal: Cancelar / Eliminar Venta ── */}
      {deletingSale && (
        <SaleDeleteConfirmModal
          sale={deletingSale}
          onClose={() => setDeletingSale(null)}
          onConfirm={fetchData}
        />
      )}

      {/* ── Estilos ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .sales-stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .sales-stat-card {
          background: var(--white);
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226, 232, 240, 0.5);
          transition: transform 0.2s;
        }
        .sales-stat-card:hover { transform: translateY(-3px); }
        .sales-stat-card .icon {
          width: 50px; height: 50px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .sales-stat-card .details h3 {
          font-size: 0.75rem; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.5px;
          font-weight: 700; margin-bottom: 2px;
        }
        .sales-stat-card .details p {
          font-size: 1.5rem; font-weight: 800; color: var(--text-main);
        }

        /* ── Barcode ── */
        .barcode-section { margin-bottom: 0.5rem; }
        .barcode-input-wrapper {
          position: relative; display: flex; align-items: center;
        }
        .barcode-icon {
          position: absolute; left: 1rem;
          color: var(--primary-dark); z-index: 2;
        }
        .barcode-input {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 3rem;
          border: 2px solid var(--primary-dark);
          border-radius: 12px;
          font-size: 0.95rem;
          background: white;
          transition: all 0.2s;
        }
        .barcode-input:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1);
          border-color: var(--primary-dark);
        }
        .barcode-msg {
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          animation: fadeIn 0.2s ease;
        }
        .barcode-msg.success { background: #dcfce7; color: #15803d; }
        .barcode-msg.error { background: #fee2e2; color: #dc2626; }

        /* ── Qty buttons ── */
        .qty-btn {
          width: 24px; height: 24px; border-radius: 6px;
          background: #f1f5f9; border: 1px solid #e2e8f0;
          cursor: pointer; font-weight: 700; font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .qty-btn:hover { background: #e2e8f0; }

        /* ── Ticket modal ── */
        .ticket-modal { max-width: 420px !important; }

        /* ── Ticket print area (pantalla) ── */
        .ticket-print-area {
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          padding: 1.5rem 1.5rem;
          background: #fff;
          max-width: 360px;
          margin: 0 auto;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
        }
        .ticket-header { text-align: center; margin-bottom: 0.5rem; }
        .ticket-store-name { font-size: 1.1rem; font-weight: 800; margin: 0; }
        .ticket-store-sub { font-size: 0.9rem; margin: 2px 0 6px; }
        .ticket-info { margin: 2px 0; font-size: 12px; }
        .ticket-divider { text-align: center; color: #94a3b8; margin: 6px 0; font-size: 11px; }
        .ticket-items { width: 100%; border-collapse: collapse; font-size: 11.5px; }
        .ticket-items th { font-weight: 700; padding: 3px 2px; border-bottom: 1px solid #e2e8f0; }
        .ticket-items td { padding: 3px 2px; vertical-align: top; }
        .ticket-totals { font-size: 13px; }
        .ticket-total-row {
          display: flex; justify-content: space-between;
          padding: 2px 0; margin: 2px 0;
        }
        .ticket-total-row.cambio { font-size: 1rem; margin-top: 4px; }
        .ticket-footer { text-align: center; margin: 4px 0; font-size: 12px; }
        .ticket-footer.small { font-size: 10px; color: #94a3b8; }

        /* ── Print CSS ── */
        @media print {
          body * { visibility: hidden !important; }
          #ticket-to-print, #ticket-to-print * { visibility: visible !important; }
          #ticket-to-print {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 80mm !important;
            border: none !important;
            padding: 4mm !important;
            margin: 0 !important;
            font-size: 11px !important;
          }
        }
      `}} />
    </div>
  );
};

export default Sales;
