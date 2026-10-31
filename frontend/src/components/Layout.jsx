import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Users,
  UserCheck,
  Clock, 
  Factory, 
  ShieldCheck, 
  Power,
  Search,
  Warehouse,
  Bell,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Boxes,
  FileText,
  Receipt,
  Wrench,
  BarChart2
} from 'lucide-react';
import Logo from './Logo';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('all'); // all, critical, low
  const dropdownRef = useRef(null);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/inventory');
      const products = res.data || [];
      const lowStock = products.filter(p => Number(p.Stock) <= 10);
      setAlerts(lowStock);
    } catch (err) {
      console.error('Error fetching inventory alerts in Layout:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const criticalCount = alerts.filter(p => Number(p.Stock) <= 5).length;
  const filteredAlerts = alerts.filter(p => {
    if (notificationFilter === 'critical') return Number(p.Stock) <= 5;
    if (notificationFilter === 'low') return Number(p.Stock) > 5 && Number(p.Stock) <= 10;
    return true;
  });

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo" style={{ padding: '0.5rem 0' }}>
          <Logo size={36} />
        </div>
        <nav>
          <ul>
            <li>
              <Link to="/" className={isActive('/') ? 'active' : ''}>
                <LayoutDashboard size={20} />
                Panel de Control
              </Link>
            </li>
            <li>
              <Link to="/sales" className={isActive('/sales') ? 'active' : ''}>
                <ShoppingCart size={20} />
                Ventas
              </Link>
            </li>
            <li>
              <Link to="/quotes" className={isActive('/quotes') ? 'active' : ''}>
                <FileText size={20} />
                Cotizaciones
              </Link>
            </li>
            <li>
              <Link to="/invoices" className={isActive('/invoices') ? 'active' : ''}>
                <Receipt size={20} />
                Facturación
              </Link>
            </li>
            <li>
              <Link to="/services" className={isActive('/services') ? 'active' : ''}>
                <Wrench size={20} />
                Taller y Libreta de Trabajos
              </Link>
            </li>
            <li>
              <Link to="/reports" className={isActive('/reports') ? 'active' : ''}>
                <BarChart2 size={20} />
                Reportes
              </Link>
            </li>
            <li>
              <Link to="/inventory" className={isActive('/inventory') ? 'active' : ''}>
                <Package size={20} />
                Inventario
              </Link>
            </li>
            <li>
              <Link to="/purchases" className={isActive('/purchases') ? 'active' : ''}>
                <Truck size={20} />
                Compras
              </Link>
            </li>
            <li>
              <Link to="/clients" className={isActive('/clients') ? 'active' : ''}>
                <Users size={20} />
                Clientes
              </Link>
            </li>
            <li>
              <Link to="/suppliers" className={isActive('/suppliers') ? 'active' : ''}>
                <Factory size={20} />
                Proveedores
              </Link>
            </li>
            
            {user?.rol === 'Administrador' && (
              <>
                <div style={{ margin: '1.5rem 0 0.5rem 1.2rem', fontSize: '0.65rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Administración</div>
                <li>
                  <Link to="/users" className={isActive('/users') ? 'active' : ''}>
                    <ShieldCheck size={20} />
                    Usuarios
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        
        <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                <small style={{ color: '#94a3b8', fontWeight: '600' }}>Sistema en línea</small>
            </div>
            <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Versión 2.0.4 - 2024</small>
        </div>
      </aside>
      
      <main className="content">
        <header className="top-bar">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Buscar productos, ventas o clientes..." />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* ── Centro de Notificaciones Interactivo ── */}
            <div className="notification-trigger-wrapper" ref={dropdownRef}>
              <button 
                className="notification-bell-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                title="Centro de Alertas de Stock"
              >
                <Bell size={20} />
                {alerts.length > 0 && (
                  <span className={`notification-badge-count ${criticalCount > 0 ? 'pulse-badge' : ''}`}>
                    {alerts.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>
                      <AlertCircle size={18} color="var(--primary)" /> 
                      Centro de Alertas
                    </h4>
                    <span className="badge danger" style={{ fontSize: '0.7rem' }}>
                      {alerts.length} activa{alerts.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="notifications-filter-bar">
                    <button 
                      className={`filter-pill-btn ${notificationFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setNotificationFilter('all')}
                    >
                      Todas ({alerts.length})
                    </button>
                    <button 
                      className={`filter-pill-btn ${notificationFilter === 'critical' ? 'active-danger' : ''}`}
                      onClick={() => setNotificationFilter('critical')}
                    >
                      Crítico ≤5 ({criticalCount})
                    </button>
                    <button 
                      className={`filter-pill-btn ${notificationFilter === 'low' ? 'active-warning' : ''}`}
                      onClick={() => setNotificationFilter('low')}
                    >
                      Bajo 6-10 ({alerts.length - criticalCount})
                    </button>
                  </div>

                  <div className="notifications-list">
                    {filteredAlerts.length > 0 ? (
                      filteredAlerts.map(prod => (
                        <div key={prod._id} className="notification-item">
                          <div 
                            className="notification-icon-box"
                            style={{
                              background: Number(prod.Stock) <= 5 ? '#fee2e2' : '#fef3c7',
                              color: Number(prod.Stock) <= 5 ? '#ef4444' : '#d97706'
                            }}
                          >
                            <AlertTriangle size={18} />
                          </div>
                          <div className="notification-content">
                            <div className="notification-title">{prod.Nombre}</div>
                            <div className="notification-desc">
                              Quedan <strong style={{ color: Number(prod.Stock) <= 5 ? '#ef4444' : '#d97706' }}>{prod.Stock} unidades</strong> • Cód: #{prod.Numero}
                            </div>
                            <div className="notification-actions">
                              <Link 
                                to="/purchases" 
                                className="notification-btn-sm primary"
                                onClick={() => setShowNotifications(false)}
                              >
                                <Truck size={12} /> Comprar
                              </Link>
                              <Link 
                                to="/inventory" 
                                className="notification-btn-sm secondary"
                                onClick={() => setShowNotifications(false)}
                              >
                                <ExternalLink size={12} /> Ficha
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px', display: 'block' }} />
                        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>¡Todo en orden!</p>
                        <small>No hay alertas con este filtro.</small>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ padding: '8px 12px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <Link 
                      to="/" 
                      onClick={() => setShowNotifications(false)}
                      style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}
                    >
                      Ver Panel de Control y Reabastecer →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── Usuario ── */}
            <div className="user-info">
              <div className="user-details">
                  <span className="user-name">{user?.Nombre_completo || user?.nombre}</span>
                  <span className="user-role">{user?.Rol || user?.rol}</span>
              </div>
              <div className="user-dropdown">
                  <img
                      src={`https://ui-avatars.com/api/?name=${user?.Nombre_completo || user?.nombre}&background=10b981&color=fff&bold=true&rounded=true`}
                      alt={user?.Nombre_completo || user?.nombre}
                      className="user-avatar"
                  />
                  <button onClick={handleLogout} className="logout-btn" title="Cerrar Sesión">
                      <Power size={18} />
                  </button>
              </div>
            </div>
          </div>
        </header>

        <div className="fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

