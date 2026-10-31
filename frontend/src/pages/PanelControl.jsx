import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Boxes, 
  ShoppingCart, 
  AlertTriangle, 
  Truck, 
  Calendar,
  Plus,
  ShoppingBag,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Package,
  DollarSign,
  Receipt,
  Eye,
  Zap,
  CheckCircle2,
  X,
  Search,
  Printer,
  Sparkles,
  Award,
  FileSpreadsheet,
  Layers,
  Users
} from 'lucide-react';
import { exportToExcel } from '../utils/exportToExcel';

const Dashboard = () => {
  const { user } = useAuth();
  const isVendedor = user?.rol === 'Vendedor';
  const canManagePurchases = true;

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Estados para Alertas Interactivas y Reabastecimiento Rápido ──
  const [tableFilter, setTableFilter] = useState('all'); // all, critical, low, out
  const [searchQuery, setSearchQuery] = useState('');
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockForm, setRestockForm] = useState({
    supplierId: '',
    docType: 'Remisión',
    quantity: 10,
    purchasePrice: 0,
    salePrice: 0
  });
  const [submittingRestock, setSubmittingRestock] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // ── Estado para Pedido Masivo Sugerido ──
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchList, setBatchList] = useState([]);
  const [batchSupplierId, setBatchSupplierId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const prodReq = api.get('/inventory').then(r => r.data).catch(() => []);
      const salesReq = api.get('/sales').then(r => r.data).catch(() => []);
      const clientsReq = api.get('/clients').then(r => r.data).catch(() => []);
      const purchasesReq = canManagePurchases 
        ? api.get('/purchases').then(r => r.data).catch(() => []) 
        : Promise.resolve([]);
      const suppliersReq = canManagePurchases 
        ? api.get('/suppliers').then(r => r.data).catch(() => []) 
        : Promise.resolve([]);

      const [prodData, salesData, clientsData, purchasesData, suppliersData] = await Promise.all([
        prodReq,
        salesReq,
        clientsReq,
        purchasesReq,
        suppliersReq
      ]);

      setProducts(prodData || []);
      setSales(salesData || []);
      setClients(clientsData || []);
      setPurchases(purchasesData || []);
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.rol]);

  const today = new Date().toLocaleDateString('es-MX', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // ── Alertas de Stock Bajo y Crítico (basadas en Stock_Mínimo de cada refacción) ──
  const lowStockProducts = products.filter(p => Number(p.Stock) <= (p.Stock_Minimo !== undefined ? p.Stock_Minimo : 2));
  const criticalStockProducts = products.filter(p => Number(p.Stock) <= 1);
  const outOfStockProducts = products.filter(p => Number(p.Stock) <= 0);

  // ── Estadísticas Globales & Financieras ──
  const totalVentasMonto = sales.reduce((acc, s) => acc + (Number(s.MontoTotal) || 0), 0);

  // ── Cálculo de Utilidad Neta y Margen Global ──
  const totalCostOfSales = sales.reduce((acc, sale) => {
    let saleCost = 0;
    (sale.Detalles || []).forEach(det => {
      const prod = products.find(p => p._id === (det.Id_Producto?._id || det.Id_Producto));
      const cost = prod ? Number(prod.Precio_Compra) : 0;
      saleCost += cost * (Number(det.Cantidad) || 1);
    });
    return acc + saleCost;
  }, 0);

  const utilidadNeta = totalVentasMonto - totalCostOfSales;
  const margenGlobal = totalVentasMonto > 0 ? ((utilidadNeta / totalVentasMonto) * 100).toFixed(1) : '0.0';

  // ── Top 5 Refacciones Más Vendidas (Mayor Rotación) ──
  const getTopSellingProducts = () => {
    const map = {};
    sales.forEach(sale => {
      (sale.Detalles || []).forEach(det => {
        const id = det.Id_Producto?._id || det.Id_Producto;
        if (!id) return;
        if (!map[id]) {
          const prod = products.find(p => p._id === id);
          map[id] = {
            id,
            nombre: prod?.Nombre || det.Nombre_Producto || 'Refacción',
            codigo: prod?.Numero ? `#${prod.Numero}` : (prod?.Codigo || '—'),
            ubicacion: prod?.Ubicacion || 'Sin asignar',
            cantidadVendida: 0,
            montoTotal: 0
          };
        }
        map[id].cantidadVendida += Number(det.Cantidad) || 0;
        map[id].montoTotal += Number(det.MontoTotal) || 0;
      });
    });

    const list = Object.values(map).sort((a, b) => b.cantidadVendida - a.cantidadVendida);
    const maxQty = list.length > 0 ? Math.max(...list.map(i => i.cantidadVendida), 1) : 1;
    return list.slice(0, 5).map((item, idx) => ({
      ...item,
      rank: idx + 1,
      progressPercent: Math.min(100, Math.round((item.cantidadVendida / maxQty) * 100))
    }));
  };

  const topProducts = getTopSellingProducts();

  const handleExportDashboardExcel = () => {
    const summaryData = [
      { Indicador: 'Total de Refacciones y Productos en Catálogo', Resultado: products.length },
      { Indicador: 'Refacciones con Stock Crítico (≤ 5)', Resultado: criticalStockProducts.length },
      { Indicador: 'Refacciones con Stock Bajo (≤ 10)', Resultado: lowStockProducts.length },
      { Indicador: 'Monto Total de Ventas Registradas', Resultado: `$${totalVentasMonto.toFixed(2)}` },
      { Indicador: 'Costo Total de Mercancía Vendida', Resultado: `$${totalCostOfSales.toFixed(2)}` },
      { Indicador: 'Utilidad Neta del Negocio', Resultado: `$${utilidadNeta.toFixed(2)}` },
      { Indicador: 'Margen Global Promedio', Resultado: `+${margenGlobal}%` },
      { Indicador: 'Total de Proveedores Registrados', Resultado: suppliers.length }
    ];
    exportToExcel(summaryData, [
      { key: 'Indicador', label: 'Indicador del Negocio' },
      { key: 'Resultado', label: 'Valor / Resultado' }
    ], 'resumen_financiero_mares');
  };

  // ── Gráfica de ventas de los últimos 7 días ──
  const getDaysChartData = () => {
    const days = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const label = dayNames[d.getDay()];

      const daySales = sales.filter(s => new Date(s.FechaRegistro).toDateString() === dateStr);
      const totalDay = daySales.reduce((acc, s) => acc + (Number(s.MontoTotal) || 0), 0);
      days.push({ label, dateStr, total: totalDay, count: daySales.length });
    }

    const maxTotal = Math.max(...days.map(d => d.total), 100);
    return days.map(d => ({
      ...d,
      heightPercent: Math.max((d.total / maxTotal) * 100, d.total > 0 ? 15 : 6)
    }));
  };

  const chartData = getDaysChartData();

  // ── Feed de Actividad Reciente ──
  const recentActivities = [
    ...sales.slice(0, 3).map(s => ({
      type: 'sale',
      icon: <ShoppingBag size={16} />,
      iconBg: '#dcfce7',
      iconColor: '#059669',
      title: `Venta #${s.Folio} registrada`,
      detail: `${s.Nombre_Cliente || 'Cliente'} — $${Number(s.MontoTotal).toFixed(2)}`,
      time: new Date(s.FechaRegistro).toLocaleDateString('es-MX', { hour: '2-digit', minute: '2-digit' })
    })),
    ...purchases.slice(0, 2).map(p => ({
      type: 'purchase',
      icon: <Truck size={16} />,
      iconBg: '#dbeafe',
      iconColor: '#1d4ed8',
      title: `Entrada Compra #${p.Folio}`,
      detail: `${p.Id_Proveedor?.RazonSocial || 'Proveedor'} — $${Number(p.MontoTotal).toFixed(2)}`,
      time: new Date(p.FechaRegistro).toLocaleDateString('es-MX', { hour: '2-digit', minute: '2-digit' })
    }))
  ].slice(0, 5);

  // ── Manejo de Reabastecimiento Rápido 1-Clic ──
  const handleOpenRestock = (product) => {
    setRestockProduct(product);
    setRestockForm({
      supplierId: suppliers.length > 0 ? suppliers[0]._id : '',
      docType: 'Remisión',
      quantity: product.Stock <= 0 ? 15 : Math.max(10 - Number(product.Stock), 5),
      purchasePrice: Number(product.Precio_Compra) || 0,
      salePrice: Number(product.Precio_venta) || 0
    });
  };

  const handleConfirmRestock = async (e) => {
    e.preventDefault();
    if (!restockProduct || !restockForm.supplierId) {
      alert('Por favor selecciona un proveedor');
      return;
    }

    try {
      setSubmittingRestock(true);
      const totalPurchase = Number(restockForm.quantity) * Number(restockForm.purchasePrice);
      
      const payload = {
        Id_Proveedor: restockForm.supplierId,
        Tipodedocumento: restockForm.docType,
        MontoTotal: totalPurchase,
        Detalles: [
          {
            Id_Producto: restockProduct._id,
            Stock: Number(restockForm.quantity),
            Precio_Compra: Number(restockForm.purchasePrice),
            Precio_venta: Number(restockForm.salePrice),
            Total: totalPurchase
          }
        ]
      };

      await api.post('/purchases', payload);
      
      setToastMessage(`¡Stock reabastecido con éxito! +${restockForm.quantity} unidades para ${restockProduct.Nombre}`);
      setTimeout(() => setToastMessage(null), 5000);
      setRestockProduct(null);
      await fetchData(); // Refresh all stats, alerts and tables
    } catch (err) {
      console.error('Error al registrar reabastecimiento rápido:', err);
      alert('Hubo un problema al registrar la entrada de stock.');
    } finally {
      setSubmittingRestock(false);
    }
  };

  // ── Manejo de Pedido Masivo Sugerido ──
  const handleOpenBatchModal = () => {
    const list = lowStockProducts.map(p => ({
      ...p,
      suggestedQty: Math.max(20 - Number(p.Stock), 10),
      purchaseCost: Number(p.Precio_Compra) || 0,
      included: true
    }));
    setBatchList(list);
    setBatchSupplierId(suppliers.length > 0 ? suppliers[0]._id : '');
    setShowBatchModal(true);
  };

  const handleConfirmBatchPurchase = async () => {
    const selectedItems = batchList.filter(item => item.included && item.suggestedQty > 0);
    if (selectedItems.length === 0) {
      alert('Selecciona al menos un producto con cantidad válida.');
      return;
    }
    if (!batchSupplierId) {
      alert('Por favor selecciona un proveedor.');
      return;
    }

    try {
      setSubmittingRestock(true);
      const totalAmount = selectedItems.reduce((acc, item) => acc + (item.suggestedQty * item.purchaseCost), 0);
      
      const payload = {
        Id_Proveedor: batchSupplierId,
        Tipodedocumento: 'Factura',
        MontoTotal: totalAmount,
        Detalles: selectedItems.map(item => ({
          Id_Producto: item._id,
          Stock: Number(item.suggestedQty),
          Precio_Compra: Number(item.purchaseCost),
          Precio_venta: Number(item.Precio_venta) || 0,
          Total: Number(item.suggestedQty) * Number(item.purchaseCost)
        }))
      };

      await api.post('/purchases', payload);
      setShowBatchModal(false);
      setToastMessage(`¡Pedido masivo de ${selectedItems.length} productos procesado correctamente!`);
      setTimeout(() => setToastMessage(null), 5000);
      await fetchData();
    } catch (err) {
      console.error('Error en pedido masivo:', err);
      alert('Ocurrió un error al procesar la compra masiva.');
    } finally {
      setSubmittingRestock(false);
    }
  };

  // ── Filtrado interactivo de tabla ──
  const filteredProducts = lowStockProducts.filter(p => {
    const matchesSearch = p.Nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          String(p.Numero).includes(searchQuery) ||
                          (p.Codigo && p.Codigo.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (tableFilter === 'critical') return Number(p.Stock) <= 5 && Number(p.Stock) > 0;
    if (tableFilter === 'out') return Number(p.Stock) <= 0;
    if (tableFilter === 'low') return Number(p.Stock) > 5 && Number(p.Stock) <= 10;
    return true;
  });

  return (
    <div className="dashboard fade-in">
      {/* ── Toast de Éxito Interactivo ── */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#065f46',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 1100,
          animation: 'fadeIn 0.3s ease'
        }}>
          <CheckCircle2 size={22} color="#34d399" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{toastMessage}</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="header-actions">
        <div>
          <h1>{isVendedor ? 'Panel de Ventas & Mostrador' : 'Panel de Control & Inteligencia'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
            {isVendedor 
              ? 'Resumen de ventas realizadas, catálogo disponible y piezas con mayor demanda' 
              : 'Visión general de inventario, ventas, utilidades y rotación de refacciones'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!isVendedor && (
            <button 
              onClick={handleExportDashboardExcel}
              className="btn secondary" 
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
            >
              <FileSpreadsheet size={16} color="#166534" /> Exportar Resumen Excel
            </button>
          )}
          <div className="date-display badge secondary" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
            <Calendar size={14} style={{ marginRight: '8px' }} /> {today}
          </div>
        </div>
      </div>

      {/* ── Accesos Rápidos Exclusivos para Vendedor ── */}
      {isVendedor && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <Link 
            to="/sales" 
            style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '1.25rem 1.5rem',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 20px rgba(16, 185, 129, 0.25)',
              transition: 'transform 0.2s'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Punto de Venta</span>
              <h3 style={{ margin: '4px 0 2px 0', fontSize: '1.2rem', fontWeight: 800 }}>+ Nueva Venta</h3>
              <small style={{ opacity: 0.85 }}>Cobrar y emitir ticket de venta</small>
            </div>
            <ShoppingCart size={36} style={{ opacity: 0.9 }} />
          </Link>

          <Link 
            to="/inventory" 
            style={{
              textDecoration: 'none',
              background: 'white',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              padding: '1.25rem 1.5rem',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--primary)' }}>Catálogo</span>
              <h3 style={{ margin: '4px 0 2px 0', fontSize: '1.15rem', fontWeight: 800 }}>Consultar Stock</h3>
              <small style={{ color: 'var(--text-muted)' }}>Buscar piezas, precios y estantes</small>
            </div>
            <Boxes size={32} color="var(--primary)" />
          </Link>

          <Link 
            to="/clients" 
            style={{
              textDecoration: 'none',
              background: 'white',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              padding: '1.25rem 1.5rem',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2563eb' }}>Clientes</span>
              <h3 style={{ margin: '4px 0 2px 0', fontSize: '1.15rem', fontWeight: 800 }}>Directorio Clientes</h3>
              <small style={{ color: 'var(--text-muted)' }}>Alta y consulta de clientes</small>
            </div>
            <Users size={32} color="#2563eb" />
          </Link>
        </div>
      )}

      {/* ── Banner de Alerta Crítica Interactivo (Para Jefe y Admin) ── */}
      {canManagePurchases && criticalStockProducts.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1px solid #fca5a5',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.1)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 style={{ color: '#991b1b', fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                ¡Atención! {criticalStockProducts.length} producto{criticalStockProducts.length > 1 ? 's' : ''} con stock crítico (≤ 5 unidades)
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {criticalStockProducts.map(p => (
                  <button 
                    key={p._id}
                    onClick={() => handleOpenRestock(p)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#991b1b',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Haz clic para reabastecer al instante"
                  >
                    <Zap size={11} /> {p.Nombre} ({p.Stock} u.)
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleOpenBatchModal}
              className="btn btn-primary"
              style={{ background: '#059669', fontSize: '0.85rem', padding: '8px 14px' }}
            >
              <Zap size={16} /> Reordenar Todo
            </button>
            <Link to="/inventory" className="btn danger" style={{ background: '#ef4444', color: 'white', textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 14px' }}>
              Revisar Inventario <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* ── Tarjetas de Estadísticas Principales ── */}
      <div className="stats-summary" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="dashboard-stat-card">
          <div className="icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <Boxes size={26} />
          </div>
          <div className="details">
            <h3>Total Refacciones</h3>
            <p>{products.length}</p>
            <small className="text-muted">En catálogo activo</small>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <ShoppingCart size={26} />
          </div>
          <div className="details">
            <h3>{isVendedor ? 'Total Ventas' : 'Ingresos Ventas'}</h3>
            <p>{isVendedor ? `${sales.length} ventas` : `$${totalVentasMonto.toFixed(2)}`}</p>
            <small className="text-muted">{isVendedor ? `$${totalVentasMonto.toFixed(2)} facturado` : `${sales.length} ventas realizadas`}</small>
          </div>
        </div>

        {!isVendedor ? (
          <div className="dashboard-stat-card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
            <div className="icon" style={{ background: '#dcfce7', color: '#059669' }}>
              <DollarSign size={26} />
            </div>
            <div className="details">
              <h3>Utilidad Neta Est.</h3>
              <p style={{ color: '#059669' }}>${utilidadNeta.toFixed(2)}</p>
              <small style={{ color: '#059669', fontWeight: 700 }}>Margen: +{margenGlobal}%</small>
            </div>
          </div>
        ) : (
          <div className="dashboard-stat-card">
            <div className="icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Users size={26} />
            </div>
            <div className="details">
              <h3>Clientes Cartera</h3>
              <p>{clients.length}</p>
              <small className="text-muted">Clientes registrados</small>
            </div>
          </div>
        )}

        <div 
          className="dashboard-stat-card" 
          style={{ cursor: 'pointer' }}
          onClick={() => {
            const tableEl = document.getElementById('seccion-reabastecimiento');
            if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
          }}
          title="Ver productos con stock bajo"
        >
          <div className="icon" style={{ background: lowStockProducts.length > 0 ? '#fef2f2' : '#f8fafc', color: lowStockProducts.length > 0 ? '#ef4444' : '#64748b' }}>
            <AlertTriangle size={26} />
          </div>
          <div className="details">
            <h3>Stock Bajo</h3>
            <p style={{ color: lowStockProducts.length > 0 ? '#ef4444' : 'inherit' }}>
              {lowStockProducts.length}
            </p>
            <small className="text-muted">≤ 10 u. (Ver ↓)</small>
          </div>
        </div>

        {!isVendedor && (
          <div className="dashboard-stat-card">
            <div className="icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
              <Truck size={26} />
            </div>
            <div className="details">
              <h3>Proveedores</h3>
              <p>{suppliers.length}</p>
              <small className="text-muted">Socios comerciales</small>
            </div>
          </div>
        )}
      </div>

      {/* ── Gráfica y Actividad ── */}
      <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        
        {/* Gráfica de Ventas */}
        <div className="chart-box" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow)', border: '1px solid rgba(226, 232, 240, 0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--primary)" /> Rendimiento de Ventas
              </h3>
              <small className="text-muted">Monto vendido por día (Últimos 7 días)</small>
            </div>
            <div className="badge success" style={{ fontWeight: 700 }}>
              Semana Actual
            </div>
          </div>
          
          <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: '1rem', borderBottom: '2px solid #f1f5f9' }}>
            {chartData.map((d, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '48px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: d.total > 0 ? '#10b981' : '#94a3b8', marginBottom: '4px' }}>
                  {d.total > 0 ? `$${d.total >= 1000 ? (d.total/1000).toFixed(1)+'k' : d.total.toFixed(0)}` : '$0'}
                </div>
                <div style={{ width: '36px', background: '#ecfdf5', height: `${d.heightPercent}%`, borderRadius: '8px 8px 0 0', position: 'relative', transition: 'height 0.5s ease' }} title={`${d.dateStr}: $${d.total.toFixed(2)} (${d.count} ventas)`}>
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    position: 'absolute', 
                    bottom: 0, 
                    background: d.total > 0 ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' : '#cbd5e1', 
                    borderRadius: '8px 8px 0 0' 
                  }}></div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700 }}>
            {chartData.map((d, i) => (
              <span key={i} style={{ width: '48px', textAlign: 'center' }}>{d.label.toUpperCase()}</span>
            ))}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="chart-box" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow)', border: '1px solid rgba(226, 232, 240, 0.7)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.5rem' }}>Actividad Reciente</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {recentActivities.length > 0 ? (
                recentActivities.map((act, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: act.iconBg, color: act.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {act.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>{act.title}</p>
                      <small className="text-muted" style={{ display: 'block', fontSize: '0.8rem' }}>{act.detail}</small>
                      <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{act.time}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                  No hay actividad registrada aún
                </p>
              )}
            </div>
          </div>
          
          <Link to="/sales" className="btn secondary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Ver Todas las Ventas <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Top 5 Refacciones Más Vendidas (Mayor Rotación) ── */}
      <div style={{ marginTop: '1.75rem', background: 'white', padding: '1.75rem', borderRadius: '16px', boxShadow: 'var(--shadow)', border: '1px solid rgba(226, 232, 240, 0.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={22} color="#f59e0b" /> Top Refacciones Más Vendidas (Mayor Rotación)
            </h3>
            <small className="text-muted">Piezas clave con mayor demanda en el mostrador</small>
          </div>
          <Link to="/inventory" style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', fontWeight: 700, textDecoration: 'none' }}>
            Ver catálogo completo →
          </Link>
        </div>

        {topProducts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {topProducts.map((p) => (
              <div key={p.id} style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      width: '24px', height: '24px', borderRadius: '50%', 
                      background: p.rank === 1 ? '#fef3c7' : (p.rank === 2 ? '#f1f5f9' : '#fed7aa'), 
                      color: p.rank === 1 ? '#b45309' : (p.rank === 2 ? '#475569' : '#c2410c'),
                      fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      #{p.rank}
                    </span>
                    <strong style={{ fontSize: '0.95rem' }}>{p.nombre}</strong>
                  </div>
                  <span className="badge secondary" style={{ fontSize: '0.72rem' }}>{p.ubicacion}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>Vendidas: <strong style={{ color: '#0f172a' }}>{p.cantidadVendida} u.</strong></span>
                  <span>Ingreso: <strong style={{ color: 'var(--primary-dark)' }}>${p.montoTotal.toFixed(2)}</strong></span>
                </div>

                {/* Barra de progreso de rotación */}
                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${p.progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            No hay registros de ventas para clasificar la rotación de refacciones aún.
          </p>
        )}
      </div>

      {/* ── Tabla de Productos con Stock Bajo / Crítico con Controles Interactivos ── */}
      {lowStockProducts.length > 0 && (
        <div id="seccion-reabastecimiento" style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <AlertCircle size={22} color="#ef4444" /> Productos que Requieren Reabastecimiento
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '3px' }}>
                Acciones rápidas para reposición de inventario en 1 clic
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                onClick={handleOpenBatchModal}
                className="btn secondary"
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}
              >
                <Sparkles size={16} /> Pedido Masivo Sugerido
              </button>
              <Link to="/purchases" className="btn btn-primary" style={{ textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={16} /> Comprar Inventario
              </Link>
            </div>
          </div>

          {/* ── Barra de Filtros y Búsqueda Interactiva ── */}
          <div style={{
            background: 'white',
            padding: '0.85rem 1.25rem',
            borderRadius: '14px',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                className={`filter-pill-btn ${tableFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTableFilter('all')}
              >
                Todos ({lowStockProducts.length})
              </button>
              <button 
                className={`filter-pill-btn ${tableFilter === 'critical' ? 'active-danger' : ''}`}
                onClick={() => setTableFilter('critical')}
              >
                🚨 Crítico ≤ 5 ({criticalStockProducts.length - outOfStockProducts.length})
              </button>
              <button 
                className={`filter-pill-btn ${tableFilter === 'low' ? 'active-warning' : ''}`}
                onClick={() => setTableFilter('low')}
              >
                ⚠️ Stock Bajo 6-10 ({lowStockProducts.length - criticalStockProducts.length})
              </button>
              {outOfStockProducts.length > 0 && (
                <button 
                  className={`filter-pill-btn ${tableFilter === 'out' ? 'active-danger' : ''}`}
                  onClick={() => setTableFilter('out')}
                >
                  ⭕ Agotados ({outOfStockProducts.length})
                </button>
              )}
            </div>

            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Filtrar por nombre o cód..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 12px 6px 32px',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.82rem',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Stock Actual</th>
                  <th>P. Compra</th>
                  <th>P. Venta</th>
                  <th>Estado</th>
                  <th>Acción Rápida</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => (
                  <tr key={product._id}>
                    <td><span className="badge secondary">#{product.Numero}</span></td>
                    <td><strong>{product.Nombre}</strong></td>
                    <td>
                      <span className={`badge ${product.Stock <= 5 ? 'danger' : 'warning'}`} style={{ fontWeight: 800, padding: '4px 10px' }}>
                        <Boxes size={14} style={{ marginRight: '4px' }} /> {product.Stock} unidades
                      </span>
                    </td>
                    <td>${Number(product.Precio_Compra).toFixed(2)}</td>
                    <td><strong className="text-primary">${Number(product.Precio_venta).toFixed(2)}</strong></td>
                    <td>
                      <span className={`badge ${product.Stock <= 0 ? 'danger' : 'warning'}`}>
                        {product.Stock <= 0 ? 'Agotado' : product.Stock <= 5 ? 'Crítico' : 'Stock Bajo'}
                      </span>
                    </td>
                    <td>
                      {canManagePurchases ? (
                        <button 
                          onClick={() => handleOpenRestock(product)}
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Reabastecer en 1 clic"
                        >
                          <Zap size={14} /> + Reabastecer
                        </button>
                      ) : (
                        <Link 
                          to="/inventory" 
                          className="btn secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                        >
                          <Eye size={14} /> Ver Catálogo
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL INTERACTIVO: REABASTECIMIENTO RÁPIDO 1-CLIC (Jefe / Admin) ── */}
      {canManagePurchases && restockProduct && (
        <div className="modal-overlay" onClick={() => setRestockProduct(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Entrada Rápida de Inventario
                </span>
                <h2 style={{ fontSize: '1.35rem', margin: '4px 0 0 0' }}>{restockProduct.Nombre}</h2>
              </div>
              <button className="close-btn" onClick={() => setRestockProduct(null)}><X size={20} /></button>
            </div>

            <form onSubmit={handleConfirmRestock}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <small style={{ color: '#64748b' }}>Stock actual:</small>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: restockProduct.Stock <= 5 ? '#ef4444' : '#f59e0b' }}>
                    {restockProduct.Stock} unidades
                  </div>
                </div>
                <div>
                  <small style={{ color: '#64748b' }}>Nuevo Stock Resultante:</small>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                    {Number(restockProduct.Stock) + Number(restockForm.quantity || 0)} unidades
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Proveedor:</label>
                <select 
                  value={restockForm.supplierId} 
                  onChange={e => setRestockForm({ ...restockForm, supplierId: e.target.value })}
                  required
                >
                  <option value="">-- Selecciona un proveedor --</option>
                  {suppliers.map(sup => (
                    <option key={sup._id} value={sup._id}>{sup.RazonSocial || sup.Nombre_Contacto}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Tipo Documento:</label>
                  <select 
                    value={restockForm.docType} 
                    onChange={e => setRestockForm({ ...restockForm, docType: e.target.value })}
                  >
                    <option value="Remisión">Remisión</option>
                    <option value="Factura">Factura</option>
                    <option value="Ticket">Ticket</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Cantidad a Ingresar:</label>
                  <input 
                    type="number" 
                    min="1"
                    value={restockForm.quantity} 
                    onChange={e => setRestockForm({ ...restockForm, quantity: Number(e.target.value) })}
                    required
                  />
                  <div className="quick-shortcuts">
                    <button type="button" className="shortcut-pill" onClick={() => setRestockForm({ ...restockForm, quantity: 5 })}>+5</button>
                    <button type="button" className="shortcut-pill" onClick={() => setRestockForm({ ...restockForm, quantity: 10 })}>+10</button>
                    <button type="button" className="shortcut-pill" onClick={() => setRestockForm({ ...restockForm, quantity: 20 })}>+20</button>
                    <button type="button" className="shortcut-pill" onClick={() => setRestockForm({ ...restockForm, quantity: 50 })}>+50</button>
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Precio Compra ($):</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={restockForm.purchasePrice} 
                    onChange={e => setRestockForm({ ...restockForm, purchasePrice: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Precio Venta ($):</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={restockForm.salePrice} 
                    onChange={e => setRestockForm({ ...restockForm, salePrice: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <small style={{ color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Inversión Total</small>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                    ${(Number(restockForm.quantity || 0) * Number(restockForm.purchasePrice || 0)).toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <small style={{ color: '#065f46' }}>Ganancia estimada:</small>
                  <div style={{ fontWeight: 700, color: '#047857' }}>
                    +${((Number(restockForm.salePrice) - Number(restockForm.purchasePrice)) * Number(restockForm.quantity || 0)).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setRestockProduct(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingRestock}>
                  <Zap size={16} /> {submittingRestock ? 'Guardando...' : 'Confirmar Entrada de Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL INTERACTIVO: PEDIDO MASIVO SUGERIDO (Jefe / Admin) ── */}
      {canManagePurchases && showBatchModal && (
        <div className="modal-overlay" onClick={() => setShowBatchModal(false)}>
          <div className="modal-content" style={{ maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Asistente Inteligente de Reabastecimiento
                </span>
                <h2 style={{ fontSize: '1.4rem', margin: '4px 0 0 0' }}>Generar Pedido Masivo Sugerido</h2>
              </div>
              <button className="close-btn" onClick={() => setShowBatchModal(false)}><X size={20} /></button>
            </div>

            <div className="form-group">
              <label>Proveedor para la orden:</label>
              <select 
                value={batchSupplierId} 
                onChange={e => setBatchSupplierId(e.target.value)}
                required
              >
                {suppliers.map(sup => (
                  <option key={sup._id} value={sup._id}>{sup.RazonSocial || sup.Nombre_Contacto}</option>
                ))}
              </select>
            </div>

            <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>✓</th>
                    <th>Producto</th>
                    <th>Stock Act.</th>
                    <th>Cant. Sugerida</th>
                    <th>Costo U.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {batchList.map((item, idx) => (
                    <tr key={item._id} style={{ opacity: item.included ? 1 : 0.5 }}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={item.included} 
                          onChange={e => {
                            const updated = [...batchList];
                            updated[idx].included = e.target.checked;
                            setBatchList(updated);
                          }}
                        />
                      </td>
                      <td><strong>{item.Nombre}</strong></td>
                      <td>
                        <span className={`badge ${item.Stock <= 5 ? 'danger' : 'warning'}`}>
                          {item.Stock} u.
                        </span>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          min="1" 
                          value={item.suggestedQty}
                          disabled={!item.included}
                          onChange={e => {
                            const updated = [...batchList];
                            updated[idx].suggestedQty = Number(e.target.value);
                            setBatchList(updated);
                          }}
                          style={{ width: '70px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </td>
                      <td>${item.purchaseCost.toFixed(2)}</td>
                      <td>
                        <strong>
                          ${((item.included ? item.suggestedQty : 0) * item.purchaseCost).toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
              <div>
                <small className="text-muted">Total Productos a reordenar:</small>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                  {batchList.filter(i => i.included).length} productos
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <small className="text-muted">Total Estimado de Compra:</small>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ${batchList.filter(i => i.included).reduce((acc, i) => acc + (i.suggestedQty * i.purchaseCost), 0).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={() => setShowBatchModal(false)}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleConfirmBatchPurchase}
                disabled={submittingRestock}
              >
                <Sparkles size={16} /> {submittingRestock ? 'Procesando...' : 'Confirmar y Guardar Entrada Masiva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
