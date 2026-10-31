import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Wrench, 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Tractor, 
  Truck, 
  Car, 
  Filter, 
  DollarSign, 
  ShoppingCart,
  Layers,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Pencil,
  Cog,
  Droplets,
  FileText,
  Receipt,
  Package,
  RotateCcw,
  Check,
  UserCheck,
  BookOpen,
  Grid,
  List
} from 'lucide-react';

const TIPOS_SERVICIO = [
  'Cambio de Filtros',
  'Cambio de Aceite y Filtros',
  'Mantenimiento Preventivo Agrícola',
  'Mantenimiento Mayor de Motor',
  'Servicio Sistema Hidráulico',
  'Servicio de Frenos y Embrague',
  'Reparación de Bomba / Inyectores',
  'Diagnóstico y Ajuste General',
  'Trabajo de Torno y Maquinado',
  'Fabricación de Buje / Flecha / Perno',
  'Rectificado y Soldadura',
  'Roscado y Barrenado'
];

const TIPOS_EQUIPO = [
  'Tractor',
  'Torno / Maquinado',
  'Cosechadora',
  'Implemento Agrícola',
  'Camión',
  'Camioneta',
  'Generador/Bomba',
  'Automóvil',
  'Otro'
];

const TIPOS_PIEZA_TORNO = [
  'Buje de Bronce / Acero',
  'Flecha / Eje de Mando',
  'Perno de Enganche / Rastra',
  'Masa / Manzana de Rueda',
  'Rosca / Tornillo Especial',
  'Rectificado de Disco / Flecha',
  'Barrenado y Roscado',
  'Soldadura y Reconstrucción',
  'Fabricación Especial a Muestra'
];

const MATERIALES_TORNO = [
  'Bronce Fosforado / SAE 64',
  'Acero 1045 Maquinable',
  'Acero 4140 Tratado',
  'Acero 1018 Suave',
  'Solera / Placa de Acero',
  'Tubo Cédula 40 / 80',
  'Nylamid / Polímero',
  'Material Proporcionado por Cliente'
];

const UNIDADES_MEDIDA = [
  'Pieza',
  'Litros',
  'Cubeta 19L',
  'Tambor 208L',
  'Metros',
  'Kilos',
  'Juego',
  'Galón'
];

const ESTADOS = ['Recibido', 'En Proceso', 'Esperando Repuestos', 'Completado', 'Entregado'];

const Servicios = () => {
  const navigate = useNavigate();

  // Pestañas principales
  // 'libreta': Libreta Digital de Trabajos y Notas (Modo Rápido / Bitácora)
  // 'taller': Órdenes de Servicio Agrícola (Tractores / Maquinaria)
  // 'torno': Trabajos de Torno y Maquinados
  // 'salidas': Salidas de Aceite y Materiales
  const [activeMainTab, setActiveMainTab] = useState('libreta');
  const [libretaViewMode, setLibretaViewMode] = useState('cards'); // 'cards' | 'table'

  const [services, setServices] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('all');

  // Modal Nueva Anotación en Libreta
  const [showLibretaModal, setShowLibretaModal] = useState(false);
  const [libretaForm, setLibretaForm] = useState({
    Nombre_Cliente: '',
    Telefono_Cliente: '',
    TipoTrabajo: 'Combinado', // 'Combinado', 'Torno', 'Tractor', 'Taller', 'Refacciones'
    Descripcion: '',
    Maquina: '',
    CostoManoDeObra: 400,
    CostoTorno: 350,
    IncluyeTorno: true,
    DetalleTorno: '',
    MaterialTorno: 'Bronce fosforado / Acero',
    Descuento: 0,
    TecnicoResponsable: 'Taller / Torno',
    Prioridad: 'Normal',
    Observaciones: ''
  });
  const [libretaRepuestos, setLibretaRepuestos] = useState([]);
  const [libretaSelectedProdId, setLibretaSelectedProdId] = useState('');
  const [libretaCustomItem, setLibretaCustomItem] = useState({
    Nombre: '',
    Cantidad: 1,
    Unidad: 'Litros',
    PrecioUnitario: ''
  });

  // Modal Rápido: Agregar Refacción / Aceite al Vuelo en un Trabajo Existente
  const [quickAddTarget, setQuickAddTarget] = useState(null);
  const [quickAddItem, setQuickAddItem] = useState({
    selectedProdId: '',
    nombre: '',
    cantidad: 1,
    unidad: 'Litros',
    precioUnitario: ''
  });

  // Buscador de Catalogo de Filtros por Maquinaria
  const [filterSearch, setFilterSearch] = useState('');
  const [catalogFilters, setCatalogFilters] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);

  // Modal Nuevo Servicio Agrícola
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    Nombre_Cliente: '',
    Telefono_Cliente: '',
    Email_Cliente: '',
    TipoEquipo: 'Tractor',
    Marca: '',
    Modelo: '',
    SeriePlacas: '',
    HorometroKM: '',
    TipoServicio: 'Cambio de Filtros',
    TecnicoResponsable: 'Taller Principal',
    Prioridad: 'Normal',
    CostoManoDeObra: 350,
    Descuento: 0,
    DiagnosticoInicial: '',
    Observaciones: ''
  });

  // Modal Nuevo Trabajo de Torno
  const [showTornoModal, setShowTornoModal] = useState(false);
  const [tornoData, setTornoData] = useState({
    Nombre_Cliente: '',
    Telefono_Cliente: '',
    Email_Cliente: '',
    TipoPieza: 'Buje de Bronce / Acero',
    MaterialUsado: 'Bronce Fosforado / SAE 64',
    Dimensiones: '',
    HorasTorno: 1,
    CostoManoDeObra: 450,
    Descuento: 0,
    TecnicoResponsable: 'Tornero Principal',
    Prioridad: 'Normal',
    DiagnosticoInicial: '',
    Observaciones: ''
  });
  const [tornoRepuestos, setTornoRepuestos] = useState([]);

  // Modal Nueva Salida de Aceite / Material
  const [showSalidaModal, setShowSalidaModal] = useState(false);
  const [salidaForm, setSalidaForm] = useState({
    TipoSalida: 'Despacho de Aceite a Granel',
    Id_Producto: '',
    Nombre_Producto: '',
    Cantidad: 1,
    UnidadMedida: 'Litros',
    PrecioUnitario: '',
    DestinoTrabajo: '',
    Nombre_Cliente: '',
    Solicitante: 'Mecánico de Taller',
    Observaciones: ''
  });

  // Repuestos para Nuevo Servicio
  const [repuestos, setRepuestos] = useState([]);
  const [selectedProdId, setSelectedProdId] = useState('');
  const [repuestoQty, setRepuestoQty] = useState(1);
  const [repuestoUnidad, setRepuestoUnidad] = useState('Pieza');
  const [repuestoPrice, setRepuestoPrice] = useState('');
  const [repuestoCustomName, setRepuestoCustomName] = useState('');

  // Modal Ver/Imprimir (Nota de Remisión / Hoja de Taller / Vale de Salida)
  const [viewService, setViewService] = useState(null);
  const [printDocType, setPrintDocType] = useState('remision'); // 'remision' | 'taller'
  const [viewSalida, setViewSalida] = useState(null);

  // Modal Entregar/Cobrar
  const [deliverModal, setDeliverModal] = useState(null);
  const [deliverPayment, setDeliverPayment] = useState({
    MetodoPago: 'Efectivo',
    MontoPago: ''
  });

  // Panel Historial por Cliente
  const [historialPanel, setHistorialPanel] = useState(false);
  const [historialNombre, setHistorialNombre] = useState('');
  const [historialData, setHistorialData] = useState(null);
  const [historialLoading, setHistorialLoading] = useState(false);

  // Tab Cuentas por Cobrar
  const [cuentasData, setCuentasData] = useState(null);
  const [cuentasLoading, setCuentasLoading] = useState(false);
  const [cuentasLoaded, setCuentasLoaded] = useState(false);

  // Modal Editar orden activa
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editRepuestos, setEditRepuestos] = useState([]);
  const [editSelectedProdId, setEditSelectedProdId] = useState('');
  const [editRepuestoQty, setEditRepuestoQty] = useState(1);
  const [editRepuestoUnidad, setEditRepuestoUnidad] = useState('Pieza');
  const [editRepuestoPrice, setEditRepuestoPrice] = useState('');
  const [editRepuestoCustomName, setEditRepuestoCustomName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [srvRes, prodRes, salidasRes, clientRes] = await Promise.all([
        api.get('/services'),
        api.get('/inventory'),
        api.get('/salidas').catch(() => ({ data: [] })),
        api.get('/clients').catch(() => ({ data: [] }))
      ]);
      setServices(srvRes.data || []);
      setProducts(prodRes.data || []);
      setSalidas(salidasRes.data || []);
      setClients(clientRes.data || []);
    } catch (err) {
      console.error('Error al cargar datos de taller:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Historial de Cliente ────────────────────────────────────────────────
  const buscarHistorialCliente = async (nombre) => {
    if (!nombre || nombre.trim().length < 2) return;
    setHistorialLoading(true);
    setHistorialData(null);
    try {
      const res = await api.get(`/services/historial-cliente?nombre=${encodeURIComponent(nombre.trim())}`);
      setHistorialData(res.data);
    } catch (err) {
      console.error('Error al buscar historial:', err);
      setHistorialData({ error: 'No se pudo obtener el historial.' });
    } finally {
      setHistorialLoading(false);
    }
  };

  const abrirHistorial = (nombreCliente) => {
    setHistorialNombre(nombreCliente);
    setHistorialPanel(true);
    buscarHistorialCliente(nombreCliente);
  };

  // ── Cuentas por Cobrar ──────────────────────────────────────────────────
  const fetchCuentasPorCobrar = async () => {
    if (cuentasLoaded) return;
    setCuentasLoading(true);
    try {
      const res = await api.get('/services/cuentas-por-cobrar');
      setCuentasData(res.data);
      setCuentasLoaded(true);
    } catch (err) {
      console.error('Error al obtener cuentas por cobrar:', err);
    } finally {
      setCuentasLoading(false);
    }
  };

  const handleMainTabChange = (tab) => {
    setActiveMainTab(tab);
    if (tab === 'cuentas') fetchCuentasPorCobrar();
  };

  const handleSearchFilters = async (q) => {
    setFilterSearch(q);
    if (!q || q.length < 2) {
      setCatalogFilters([]);
      return;
    }
    try {
      const res = await api.get(`/services/filters/lookup?q=${encodeURIComponent(q)}`);
      setCatalogFilters(res.data || []);
    } catch (err) {
      console.error('Error al buscar catálogo de filtros:', err);
    }
  };

  // Manejo de Repuestos en Formulario Servicio
  const handleAddRepuesto = () => {
    if (selectedProdId) {
      const prod = products.find(p => p._id === selectedProdId);
      if (!prod) return;
      const qty = parseFloat(repuestoQty) || 1;
      const price = parseFloat(repuestoPrice) || prod.Precio_venta || prod.Precio_Venta || 0;
      const item = {
        Id_Producto: prod._id,
        Codigo: prod.Numero || '',
        Nombre: prod.Nombre,
        Cantidad: qty,
        Unidad: repuestoUnidad || prod.Unidad_Medida || 'Pieza',
        PrecioUnitario: price,
        Subtotal: Math.round(qty * price * 100) / 100
      };
      setRepuestos([...repuestos, item]);
    } else if (repuestoCustomName.trim()) {
      const qty = parseFloat(repuestoQty) || 1;
      const price = parseFloat(repuestoPrice) || 0;
      const item = {
        Codigo: 'INS-DIRECTO',
        Nombre: repuestoCustomName.trim(),
        Cantidad: qty,
        Unidad: repuestoUnidad,
        PrecioUnitario: price,
        Subtotal: Math.round(qty * price * 100) / 100
      };
      setRepuestos([...repuestos, item]);
    }
    setSelectedProdId('');
    setRepuestoCustomName('');
    setRepuestoPrice('');
    setRepuestoQty(1);
    setRepuestoUnidad('Pieza');
  };

  const handleRemoveRepuesto = (idx) => {
    setRepuestos(repuestos.filter((_, i) => i !== idx));
  };

  // Manejo de Repuestos en Formulario Torno
  const handleAddTornoRepuesto = () => {
    if (selectedProdId) {
      const prod = products.find(p => p._id === selectedProdId);
      if (!prod) return;
      const qty = parseFloat(repuestoQty) || 1;
      const price = parseFloat(repuestoPrice) || prod.Precio_venta || prod.Precio_Venta || 0;
      const item = {
        Id_Producto: prod._id,
        Codigo: prod.Numero || '',
        Nombre: prod.Nombre,
        Cantidad: qty,
        Unidad: repuestoUnidad || prod.Unidad_Medida || 'Pieza',
        PrecioUnitario: price,
        Subtotal: Math.round(qty * price * 100) / 100
      };
      setTornoRepuestos([...tornoRepuestos, item]);
    } else if (repuestoCustomName.trim()) {
      const qty = parseFloat(repuestoQty) || 1;
      const price = parseFloat(repuestoPrice) || 0;
      const item = {
        Codigo: 'MAT-TORNO',
        Nombre: repuestoCustomName.trim(),
        Cantidad: qty,
        Unidad: repuestoUnidad,
        PrecioUnitario: price,
        Subtotal: Math.round(qty * price * 100) / 100
      };
      setTornoRepuestos([...tornoRepuestos, item]);
    }
    setSelectedProdId('');
    setRepuestoCustomName('');
    setRepuestoPrice('');
    setRepuestoQty(1);
    setRepuestoUnidad('Pieza');
  };

  const calculateServiceTotal = () => {
    const subRepuestos = repuestos.reduce((acc, r) => acc + r.Subtotal, 0);
    const mo = parseFloat(formData.CostoManoDeObra) || 0;
    const desc = parseFloat(formData.Descuento) || 0;
    return Math.max(0, subRepuestos + mo - desc);
  };

  const calculateTornoTotal = () => {
    const subRepuestos = tornoRepuestos.reduce((acc, r) => acc + r.Subtotal, 0);
    const mo = parseFloat(tornoData.CostoManoDeObra) || 0;
    const desc = parseFloat(tornoData.Descuento) || 0;
    return Math.max(0, subRepuestos + mo - desc);
  };

  // Guardar Servicio Agrícola
  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!formData.Nombre_Cliente.trim() || !formData.Marca.trim() || !formData.Modelo.trim()) {
      alert('Por favor completa el Cliente, Marca y Modelo de la maquinaria');
      return;
    }

    try {
      const payload = {
        ...formData,
        EsTrabajoTorno: false,
        Repuestos: repuestos
      };

      await api.post('/services', payload);
      setShowModal(false);
      setFormData({
        Nombre_Cliente: '',
        Telefono_Cliente: '',
        Email_Cliente: '',
        TipoEquipo: 'Tractor',
        Marca: '',
        Modelo: '',
        SeriePlacas: '',
        HorometroKM: '',
        TipoServicio: 'Cambio de Filtros',
        TecnicoResponsable: 'Taller Principal',
        Prioridad: 'Normal',
        CostoManoDeObra: 350,
        Descuento: 0,
        DiagnosticoInicial: '',
        Observaciones: ''
      });
      setRepuestos([]);
      fetchData();
      alert('¡Orden de servicio agrícola registrada exitosamente!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear orden de servicio');
    }
  };

  // Guardar Trabajo de Torno
  const handleCreateTorno = async (e) => {
    e.preventDefault();
    if (!tornoData.Nombre_Cliente.trim()) {
      alert('Por favor indica el nombre del Cliente');
      return;
    }

    try {
      const payload = {
        Nombre_Cliente: tornoData.Nombre_Cliente,
        Telefono_Cliente: tornoData.Telefono_Cliente,
        Email_Cliente: tornoData.Email_Cliente,
        EsTrabajoTorno: true,
        DetallesTorno: {
          TipoPieza: tornoData.TipoPieza,
          MaterialUsado: tornoData.MaterialUsado,
          Dimensiones: tornoData.Dimensiones,
          HorasTorno: parseFloat(tornoData.HorasTorno) || 0
        },
        TipoEquipo: 'Torno / Maquinado',
        Marca: 'Torno y Maquinados',
        Modelo: tornoData.TipoPieza,
        TipoServicio: `Trabajo de Torno: ${tornoData.TipoPieza}`,
        TecnicoResponsable: tornoData.TecnicoResponsable || 'Tornero Responsable',
        Prioridad: tornoData.Prioridad,
        CostoManoDeObra: parseFloat(tornoData.CostoManoDeObra) || 0,
        Descuento: parseFloat(tornoData.Descuento) || 0,
        DiagnosticoInicial: tornoData.DiagnosticoInicial || `Dimensiones: ${tornoData.Dimensiones}. Material: ${tornoData.MaterialUsado}`,
        Observaciones: tornoData.Observaciones,
        Repuestos: tornoRepuestos
      };

      await api.post('/services', payload);
      setShowTornoModal(false);
      setTornoData({
        Nombre_Cliente: '',
        Telefono_Cliente: '',
        Email_Cliente: '',
        TipoPieza: 'Buje de Bronce / Acero',
        MaterialUsado: 'Bronce Fosforado / SAE 64',
        Dimensiones: '',
        HorasTorno: 1,
        CostoManoDeObra: 450,
        Descuento: 0,
        TecnicoResponsable: 'Tornero Principal',
        Prioridad: 'Normal',
        DiagnosticoInicial: '',
        Observaciones: ''
      });
      setTornoRepuestos([]);
      fetchData();
      alert('¡Trabajo de torno registrado exitosamente!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al registrar trabajo de torno');
    }
  };

  // Guardar Salida de Aceite / Material
  const handleCreateSalida = async (e) => {
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
        Nombre_Cliente: '',
        Solicitante: 'Mecánico de Taller',
        Observaciones: ''
      });
      fetchData();
      alert(res.data?.message || '¡Salida de aceite/material registrada con éxito!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al registrar salida');
    }
  };

  const handleCancelSalida = async (id, folio) => {
    if (!window.confirm(`¿Deseas cancelar la salida ${folio} y reponer el stock al inventario?`)) return;
    try {
      const res = await api.delete(`/salidas/${id}`);
      fetchData();
      alert(res.data?.message || 'Salida cancelada exitosamente');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cancelar salida');
    }
  };

  const handleDeliverService = async () => {
    if (!deliverModal) return;
    try {
      await api.post(`/services/${deliverModal._id}/deliver`, {
        MetodoPago: deliverPayment.MetodoPago,
        MontoPago: parseFloat(deliverPayment.MontoPago) || deliverModal.TotalServicio
      });
      setDeliverModal(null);
      fetchData();
      alert('¡Servicio entregado y cobrado exitosamente!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al entregar servicio');
    }
  };

  // Ir a Facturación SAT CFDI 4.0 con 1 Clic
  const handleGoToFacturar = (srv) => {
    navigate('/invoices', { state: { servicioId: srv._id } });
  };

  const openEditModal = (srv) => {
    if (srv.Estado === 'Entregado') {
      alert('No se puede editar una orden ya entregada y cobrada.');
      return;
    }
    setEditModal(srv);
    setEditForm({
      Nombre_Cliente: srv.Nombre_Cliente || '',
      Telefono_Cliente: srv.Telefono_Cliente || '',
      TipoEquipo: srv.TipoEquipo || 'Tractor',
      Marca: srv.Marca || '',
      Modelo: srv.Modelo || '',
      SeriePlacas: srv.SeriePlacas || '',
      HorometroKM: srv.HorometroKM || '',
      TipoServicio: srv.TipoServicio || 'Cambio de Filtros',
      TecnicoResponsable: srv.TecnicoResponsable || 'Taller Principal',
      Prioridad: srv.Prioridad || 'Normal',
      CostoManoDeObra: srv.CostoManoDeObra ?? 0,
      CostoTorno: srv.CostoTorno ?? 0,
      IncluyeTorno: !!srv.IncluyeTorno || ((srv.CostoTorno ?? 0) > 0),
      Descuento: srv.Descuento ?? 0,
      DiagnosticoInicial: srv.DiagnosticoInicial || '',
      Observaciones: srv.Observaciones || '',
      TrabajosRealizados: srv.TrabajosRealizados || '',
      EsTrabajoTorno: !!srv.EsTrabajoTorno,
      DetallesTorno: srv.DetallesTorno || {}
    });
    setEditRepuestos((srv.Repuestos || []).map(r => ({
      Id_Producto: r.Id_Producto,
      Codigo: r.Codigo || '',
      Nombre: r.Nombre,
      Cantidad: r.Cantidad,
      Unidad: r.Unidad || 'Pieza',
      PrecioUnitario: r.PrecioUnitario,
      Subtotal: r.Subtotal
    })));
    setEditSelectedProdId('');
    setEditRepuestoQty(1);
    setEditRepuestoUnidad('Pieza');
    setEditRepuestoPrice('');
    setEditRepuestoCustomName('');
  };

  const handleAddEditRepuesto = () => {
    if (editSelectedProdId) {
      const prod = products.find(p => p._id === editSelectedProdId);
      if (!prod) return;
      const qty = parseFloat(editRepuestoQty) || 1;
      const price = parseFloat(editRepuestoPrice) || prod.Precio_venta || prod.Precio_Venta || 0;
      setEditRepuestos(prev => [...prev, {
        Id_Producto: prod._id,
        Codigo: prod.Numero || '',
        Nombre: prod.Nombre,
        Cantidad: qty,
        Unidad: editRepuestoUnidad || prod.Unidad_Medida || 'Pieza',
        PrecioUnitario: price,
        Subtotal: Math.round(qty * price * 100) / 100
      }]);
    } else if (editRepuestoCustomName.trim()) {
      const qty = parseFloat(editRepuestoQty) || 1;
      const price = parseFloat(editRepuestoPrice) || 0;
      setEditRepuestos(prev => [...prev, {
        Codigo: 'INS-DIRECTO',
        Nombre: editRepuestoCustomName.trim(),
        Cantidad: qty,
        Unidad: editRepuestoUnidad,
        PrecioUnitario: price,
        Subtotal: Math.round(qty * price * 100) / 100
      }]);
    }
    setEditSelectedProdId('');
    setEditRepuestoCustomName('');
    setEditRepuestoPrice('');
    setEditRepuestoQty(1);
    setEditRepuestoUnidad('Pieza');
  };

  const handleUpdateEditRepuesto = (idx, field, value) => {
    setEditRepuestos(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const next = { ...r, [field]: (field === 'Nombre' || field === 'Unidad') ? value : (parseFloat(value) || 0) };
      const qty = parseFloat(next.Cantidad) || 0;
      const price = parseFloat(next.PrecioUnitario) || 0;
      next.Subtotal = Math.round(qty * price * 100) / 100;
      return next;
    }));
  };

  const calculateEditTotal = () => {
    if (!editForm) return 0;
    const subRepuestos = editRepuestos.reduce((acc, r) => acc + (Number(r.Subtotal) || 0), 0);
    const mo = parseFloat(editForm.CostoManoDeObra) || 0;
    const torno = parseFloat(editForm.CostoTorno) || 0;
    const desc = parseFloat(editForm.Descuento) || 0;
    return Math.max(0, subRepuestos + mo + torno - desc);
  };

  const handleSaveEditService = async (e) => {
    e.preventDefault();
    if (!editModal || !editForm) return;
    if (!editForm.Nombre_Cliente.trim()) {
      alert('Por favor completa el nombre del Cliente');
      return;
    }
    try {
      await api.put(`/services/${editModal._id}`, {
        ...editForm,
        Repuestos: editRepuestos
      });
      setEditModal(null);
      setEditForm(null);
      setEditRepuestos([]);
      fetchData();
      alert('Orden de trabajo actualizada correctamente.');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al actualizar la orden de trabajo');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/services/${id}`, { Estado: newStatus });
      fetchData();
    } catch (err) {
      alert('Error al actualizar estado');
    }
  };

  const handleDeleteService = async (id, folio) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la orden ${folio}?`)) return;
    try {
      await api.delete(`/services/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Manejadores para la Libreta Rápida de Trabajos
  const handleAddLibretaPreset = (type) => {
    if (type === 'aceite') {
      setLibretaRepuestos(prev => [...prev, {
        Codigo: 'ACEITE',
        Nombre: 'Aceite 15W40 para Motor / Hidráulico',
        Cantidad: 5,
        Unidad: 'Litros',
        PrecioUnitario: 95,
        Subtotal: 475
      }]);
    } else if (type === 'tornillos') {
      setLibretaRepuestos(prev => [...prev, {
        Codigo: 'TORNILLERIA',
        Nombre: 'Tornillos de alta resistencia / tuercas',
        Cantidad: 4,
        Unidad: 'Pieza',
        PrecioUnitario: 25,
        Subtotal: 100
      }]);
    } else if (type === 'empaques') {
      setLibretaRepuestos(prev => [...prev, {
        Codigo: 'EMPAQUES',
        Nombre: 'Juego de empaques / O-rings',
        Cantidad: 1,
        Unidad: 'Juego',
        PrecioUnitario: 180,
        Subtotal: 180
      }]);
    }
  };

  const handleAddLibretaItem = () => {
    if (libretaSelectedProdId) {
      const prod = products.find(p => p._id === libretaSelectedProdId);
      if (!prod) return;
      const cant = parseFloat(libretaCustomItem.Cantidad) || 1;
      const prec = parseFloat(libretaCustomItem.PrecioUnitario) || prod.Precio_Venta || 0;
      setLibretaRepuestos(prev => [...prev, {
        Id_Producto: prod._id,
        Codigo: prod.Codigo || '',
        Nombre: prod.Nombre,
        Cantidad: cant,
        Unidad: libretaCustomItem.Unidad || prod.UnidadMedida || 'Pieza',
        PrecioUnitario: prec,
        Subtotal: Math.round(cant * prec * 100) / 100
      }]);
      setLibretaSelectedProdId('');
      setLibretaCustomItem({ Nombre: '', Cantidad: 1, Unidad: 'Litros', PrecioUnitario: '' });
    } else if (libretaCustomItem.Nombre.trim()) {
      const cant = parseFloat(libretaCustomItem.Cantidad) || 1;
      const prec = parseFloat(libretaCustomItem.PrecioUnitario) || 0;
      setLibretaRepuestos(prev => [...prev, {
        Codigo: 'INS-DIRECTO',
        Nombre: libretaCustomItem.Nombre.trim(),
        Cantidad: cant,
        Unidad: libretaCustomItem.Unidad || 'Pieza',
        PrecioUnitario: prec,
        Subtotal: Math.round(cant * prec * 100) / 100
      }]);
      setLibretaCustomItem({ Nombre: '', Cantidad: 1, Unidad: 'Litros', PrecioUnitario: '' });
    }
  };

  const handleUpdateLibretaRepuesto = (idx, field, value) => {
    setLibretaRepuestos(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const next = { ...r, [field]: (field === 'Nombre' || field === 'Unidad') ? value : (parseFloat(value) || 0) };
      const cant = parseFloat(next.Cantidad) || 0;
      const prec = parseFloat(next.PrecioUnitario) || 0;
      next.Subtotal = Math.round(cant * prec * 100) / 100;
      return next;
    }));
  };

  const handleRemoveLibretaRepuesto = (idx) => {
    setLibretaRepuestos(prev => prev.filter((_, i) => i !== idx));
  };

  const calculateLibretaTotal = () => {
    const subRep = libretaRepuestos.reduce((acc, r) => acc + (Number(r.Subtotal) || 0), 0);
    const mo = libretaForm.TipoTrabajo === 'Refacciones' ? 0 : (parseFloat(libretaForm.CostoManoDeObra) || 0);
    const torno = (libretaForm.TipoTrabajo === 'Combinado' || libretaForm.IncluyeTorno) 
      ? (parseFloat(libretaForm.CostoTorno) || 0) 
      : 0;
    const desc = parseFloat(libretaForm.Descuento) || 0;
    return Math.max(0, subRep + mo + torno - desc);
  };

  const handleCreateLibreta = async (e) => {
    e.preventDefault();
    if (!libretaForm.Nombre_Cliente.trim()) {
      alert('Por favor indica el nombre del Cliente (ej. Raúl de Calvillo)');
      return;
    }

    const esCombinado = libretaForm.TipoTrabajo === 'Combinado' || !!libretaForm.IncluyeTorno;
    const esTornoPuro = libretaForm.TipoTrabajo === 'Torno' && !esCombinado;
    const esRefacciones = libretaForm.TipoTrabajo === 'Refacciones';

    const costoMO = (esTornoPuro || esRefacciones) ? 0 : (parseFloat(libretaForm.CostoManoDeObra) || 0);
    const costoTorno = esTornoPuro 
      ? (parseFloat(libretaForm.CostoManoDeObra) || 0) 
      : (esCombinado ? (parseFloat(libretaForm.CostoTorno) || 0) : 0);

    const payload = {
      Nombre_Cliente: libretaForm.Nombre_Cliente.trim(),
      Telefono_Cliente: libretaForm.Telefono_Cliente || '',
      EsTrabajoTorno: esTornoPuro,
      IncluyeTorno: esCombinado || costoTorno > 0,
      TipoEquipo: libretaForm.Maquina || (esTornoPuro ? 'Torno / Maquinado' : 'Tractor / Maquinaria Agrícola'),
      Marca: esTornoPuro ? 'Torno y Maquinados' : (libretaForm.Maquina ? libretaForm.Maquina.split(' ')[0] : 'Agrícola General'),
      Modelo: libretaForm.Maquina ? (libretaForm.Maquina.split(' ').slice(1).join(' ') || 'Agrícola') : (esTornoPuro ? (libretaForm.Descripcion || 'Pieza Maquinada') : 'General'),
      TipoServicio: esCombinado 
        ? `${libretaForm.Descripcion || 'Servicio de Mantenimiento'} + Torno`
        : (libretaForm.Descripcion || (esTornoPuro ? 'Trabajo de Torno y Maquinado' : 'Mantenimiento General')),
      TecnicoResponsable: libretaForm.TecnicoResponsable || 'Taller / Torno',
      Prioridad: libretaForm.Prioridad || 'Normal',
      CostoManoDeObra: esTornoPuro ? (parseFloat(libretaForm.CostoManoDeObra) || 0) : costoMO,
      CostoTorno: esTornoPuro ? 0 : costoTorno,
      Descuento: parseFloat(libretaForm.Descuento) || 0,
      DiagnosticoInicial: esCombinado 
        ? `Taller: ${libretaForm.Descripcion || 'Servicio mecánico'}. Torno: ${libretaForm.DetalleTorno || 'Maquinado de pieza'}`
        : (libretaForm.Descripcion ? `Trabajo: ${libretaForm.Descripcion}` : ''),
      Observaciones: libretaForm.Observaciones || '',
      DetallesTorno: (esTornoPuro || esCombinado) ? {
        TipoPieza: esCombinado ? (libretaForm.DetalleTorno || 'Pieza Maquinada') : (libretaForm.Descripcion || 'Pieza de Torno'),
        MaterialUsado: libretaForm.MaterialTorno || 'Acero / Bronce',
        Dimensiones: '',
        HorasTorno: 1
      } : {},
      Repuestos: libretaRepuestos
    };

    try {
      await api.post('/services', payload);
      setShowLibretaModal(false);
      setLibretaForm({
        Nombre_Cliente: '',
        Telefono_Cliente: '',
        TipoTrabajo: 'Combinado',
        Descripcion: '',
        Maquina: '',
        CostoManoDeObra: 400,
        CostoTorno: 350,
        IncluyeTorno: true,
        DetalleTorno: '',
        MaterialTorno: 'Bronce fosforado / Acero',
        Descuento: 0,
        TecnicoResponsable: 'Taller / Torno',
        Prioridad: 'Normal',
        Observaciones: ''
      });
      setLibretaRepuestos([]);
      fetchData();
      alert('¡Anotación guardada en la Libreta de Trabajos!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar en libreta');
    }
  };

  const handleSaveQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAddTarget) return;

    let itemToAdd = null;
    if (quickAddItem.selectedProdId) {
      const prod = products.find(p => p._id === quickAddItem.selectedProdId);
      if (!prod) return;
      const cant = parseFloat(quickAddItem.cantidad) || 1;
      const prec = parseFloat(quickAddItem.precioUnitario) || prod.Precio_Venta || 0;
      itemToAdd = {
        Id_Producto: prod._id,
        Codigo: prod.Codigo || '',
        Nombre: prod.Nombre,
        Cantidad: cant,
        Unidad: quickAddItem.unidad || prod.UnidadMedida || 'Pieza',
        PrecioUnitario: prec,
        Subtotal: Math.round(cant * prec * 100) / 100
      };
    } else if (quickAddItem.nombre.trim()) {
      const cant = parseFloat(quickAddItem.cantidad) || 1;
      const prec = parseFloat(quickAddItem.precioUnitario) || 0;
      itemToAdd = {
        Codigo: 'INS-DIRECTO',
        Nombre: quickAddItem.nombre.trim(),
        Cantidad: cant,
        Unidad: quickAddItem.unidad || 'Pieza',
        PrecioUnitario: prec,
        Subtotal: Math.round(cant * prec * 100) / 100
      };
    }

    if (!itemToAdd) {
      alert('Por favor especifica el producto, refacción o aceite a agregar.');
      return;
    }

    try {
      const current = quickAddTarget.Repuestos || [];
      await api.put(`/services/${quickAddTarget._id}`, {
        Repuestos: [...current, itemToAdd]
      });
      setQuickAddTarget(null);
      setQuickAddItem({
        selectedProdId: '',
        nombre: '',
        cantidad: 1,
        unidad: 'Litros',
        precioUnitario: ''
      });
      fetchData();
      alert(`¡Material agregado a la orden ${quickAddTarget.Folio}!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al agregar material');
    }
  };

  // Filtrados según la pestaña activa
  const agriculturalServices = services.filter(s => !s.EsTrabajoTorno);
  const tornoServices = services.filter(s => s.EsTrabajoTorno);

  const filterList = (list) => {
    return list.filter(srv => {
      const matchQuery = (
        (srv.Folio || '').toLowerCase().includes(search.toLowerCase()) ||
        (srv.Nombre_Cliente || '').toLowerCase().includes(search.toLowerCase()) ||
        (srv.Marca || '').toLowerCase().includes(search.toLowerCase()) ||
        (srv.Modelo || '').toLowerCase().includes(search.toLowerCase()) ||
        (srv.TipoServicio || '').toLowerCase().includes(search.toLowerCase()) ||
        (srv.DetallesTorno?.TipoPieza || '').toLowerCase().includes(search.toLowerCase()) ||
        (srv.DetallesTorno?.MaterialUsado || '').toLowerCase().includes(search.toLowerCase()) ||
        (srv.Repuestos || []).some(r => (r.Nombre || '').toLowerCase().includes(search.toLowerCase()))
      );
      if (filterState === 'all') return matchQuery;
      return matchQuery && srv.Estado === filterState;
    });
  };

  const allLibretaServices = filterList(services);
  const filteredServices = filterList(agriculturalServices);
  const filteredTorno = filterList(tornoServices);

  const filteredSalidas = salidas.filter(sal => {
    return (
      (sal.Folio || '').toLowerCase().includes(search.toLowerCase()) ||
      (sal.Nombre_Producto || '').toLowerCase().includes(search.toLowerCase()) ||
      (sal.DestinoTrabajo || '').toLowerCase().includes(search.toLowerCase()) ||
      (sal.Solicitante || '').toLowerCase().includes(search.toLowerCase()) ||
      (sal.Nombre_Cliente || '').toLowerCase().includes(search.toLowerCase()) ||
      (sal.Folio_Servicio || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  // Métricas
  const totalLitrosDespachados = salidas
    .filter(s => s.Estado === 'Registrada' && (s.UnidadMedida === 'Litros' || (s.Nombre_Producto || '').toLowerCase().includes('aceite')))
    .reduce((acc, s) => acc + (Number(s.Cantidad) || 0), 0);

  const totalTornoMonto = tornoServices.reduce((acc, s) => acc + (s.TotalServicio || 0), 0);
  const totalAgricolaMonto = agriculturalServices.reduce((acc, s) => acc + (s.TotalServicio || 0), 0);

  const totalLibretaPendientes = services.filter(s => ['Recibido', 'En Proceso', 'Esperando Repuestos'].includes(s.Estado)).length;
  const totalLibretaListos = services.filter(s => s.Estado === 'Completado').length;
  const totalLibretaEntregados = services.filter(s => s.Estado === 'Entregado').length;
  const totalLibretaPendienteCobro = services.filter(s => s.Estado !== 'Entregado').reduce((acc, s) => acc + (s.TotalServicio || 0), 0);

  return (
    <div>
      <div className="no-print">
        {/* Top Header */}
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen color="#d97706" size={26} /> Taller, Torno y Libreta de Trabajos
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Anota trabajos de taller, maquinados de torno, refacciones y aceites para cobrar con Nota o Factura</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button 
              className="btn" 
              onClick={() => setShowLibretaModal(true)}
              style={{ 
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                color: 'white', 
                fontWeight: '800', 
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <BookOpen size={18} /> 📒 Anotar en Libreta Rápida
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowCatalog(!showCatalog)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Filter size={17} color="var(--primary)" /> 
              {showCatalog ? 'Ocultar Filtros OEM' : 'Filtros por Máquina'}
            </button>
            <button 
              className="btn" 
              onClick={() => setShowSalidaModal(true)}
              style={{ background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Droplets size={17} /> Salida de Aceite
            </button>
            <button 
              className="btn" 
              onClick={() => setShowTornoModal(true)}
              style={{ background: '#7c3aed', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Cog size={17} /> Nuevo Torno
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={17} /> Nueva Orden
            </button>
          </div>
        </div>

        {/* ── SELECTOR DE PESTAÑAS PRINCIPALES ── */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveMainTab('libreta')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.65rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.92rem',
              background: activeMainTab === 'libreta' ? '#d97706' : '#f1f5f9',
              color: activeMainTab === 'libreta' ? 'white' : '#475569',
              boxShadow: activeMainTab === 'libreta' ? '0 2px 8px rgba(217, 119, 6, 0.25)' : 'none'
            }}
          >
            <BookOpen size={18} /> 📒 Libreta de Trabajos ({services.length})
          </button>

          <button
            onClick={() => setActiveMainTab('taller')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.65rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.92rem',
              background: activeMainTab === 'taller' ? 'var(--primary)' : '#f1f5f9',
              color: activeMainTab === 'taller' ? 'white' : '#475569',
              boxShadow: activeMainTab === 'taller' ? '0 2px 8px rgba(16, 185, 129, 0.25)' : 'none'
            }}
          >
            <Tractor size={18} /> Órdenes Agrícolas ({agriculturalServices.length})
          </button>

          <button
            onClick={() => setActiveMainTab('torno')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.65rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.92rem',
              background: activeMainTab === 'torno' ? '#7c3aed' : '#f1f5f9',
              color: activeMainTab === 'torno' ? 'white' : '#475569',
              boxShadow: activeMainTab === 'torno' ? '0 2px 8px rgba(124, 58, 237, 0.25)' : 'none'
            }}
          >
            <Cog size={18} /> Trabajos de Torno y Maquinados ({tornoServices.length})
          </button>

          <button
            onClick={() => handleMainTabChange('salidas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.65rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.92rem',
              background: activeMainTab === 'salidas' ? '#0284c7' : '#f1f5f9',
              color: activeMainTab === 'salidas' ? 'white' : '#475569',
              boxShadow: activeMainTab === 'salidas' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none'
            }}
          >
            <Droplets size={18} /> Salidas de Aceite y Almacén ({salidas.length})
          </button>

          <button
            onClick={() => handleMainTabChange('cuentas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.65rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.92rem',
              background: activeMainTab === 'cuentas' ? '#dc2626' : '#fff1f2',
              color: activeMainTab === 'cuentas' ? 'white' : '#b91c1c',
              boxShadow: activeMainTab === 'cuentas' ? '0 2px 8px rgba(220, 38, 38, 0.3)' : 'none'
            }}
          >
            💰 Cuentas por Cobrar
          </button>
        </div>

        {/* ── SECCIÓN ASISTENTE: BUSCADOR DE FILTROS POR MAQUINARIA ── */}
        {showCatalog && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.8rem' }}>
              <Sparkles color="#16a34a" size={22} />
              <h3 style={{ color: '#166534', margin: 0, fontSize: '1.1rem' }}>Buscador Rápido de Filtros por Maquinaria / Tractor</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#15803d', marginBottom: '1rem' }}>
              Escribe el modelo o marca del tractor (ej. <em>John Deere 5415, New Holland, Case, Donaldson</em>) para ver los filtros recomendados:
            </p>

            <div style={{ position: 'relative', maxWidth: '600px', marginBottom: '1rem' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#16a34a' }} />
              <input 
                type="text" 
                placeholder="Buscar tractor, máquina o código de filtro..." 
                value={filterSearch}
                onChange={e => handleSearchFilters(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius)', border: '1px solid #86efac', background: 'white' }}
              />
            </div>

            {catalogFilters.length > 0 ? (
              <div style={{ background: 'white', borderRadius: 'var(--radius-sm)', border: '1px solid #dcfce7', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#dcfce7', textAlign: 'left', color: '#166534' }}>
                    <tr>
                      <th style={{ padding: '8px 12px' }}>Máquina / Tractor</th>
                      <th style={{ padding: '8px 12px' }}>Tipo / Nombre de Filtro</th>
                      <th style={{ padding: '8px 12px' }}>No. de Filtro Comercial</th>
                      <th style={{ padding: '8px 12px' }}>No. Original (OEM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalogFilters.map((f, i) => (
                      <tr key={f._id || i} style={{ borderBottom: '1px solid #f0fdf4' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{f.Nombre_Maquina}</td>
                        <td style={{ padding: '8px 12px' }}>{f.Nombre_Filtro}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--primary)', fontWeight: 700 }}>{f.Numero}</td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>{f.Numero_Original || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : filterSearch.length >= 2 ? (
              <div style={{ color: '#166534', fontSize: '0.85rem', fontStyle: 'italic' }}>No se encontraron coincidencias para "{filterSearch}".</div>
            ) : null}
          </div>
        )}

        {/* ── KPI CARDS SEGÚN PESTAÑA ── */}
        {activeMainTab === 'libreta' && (
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #d97706' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>En Taller / Activos</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#d97706' }}>{totalLibretaPendientes}</h3>
                </div>
                <div style={{ background: '#fef3c7', color: '#d97706', padding: '10px', borderRadius: '10px' }}><Clock size={24} /></div>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #0284c7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Listos para Entrega</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#0284c7' }}>{totalLibretaListos}</h3>
                </div>
                <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '10px', borderRadius: '10px' }}><CheckCircle size={24} /></div>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Entregados / Cobrados</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#10b981' }}>{totalLibretaEntregados}</h3>
                </div>
                <div style={{ background: '#d1fae5', color: '#10b981', padding: '10px', borderRadius: '10px' }}><DollarSign size={24} /></div>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #7c3aed' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Por Cobrar en Libreta</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#7c3aed' }}>
                    ${totalLibretaPendienteCobro.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
                <div style={{ background: '#ede9fe', color: '#7c3aed', padding: '10px', borderRadius: '10px' }}><Receipt size={24} /></div>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'taller' && (
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Órdenes Agrícolas</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem' }}>{agriculturalServices.length}</h3>
                </div>
                <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '10px', borderRadius: '10px' }}><Tractor size={24} /></div>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>En Proceso / Espera</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#d97706' }}>
                    {agriculturalServices.filter(s => ['Recibido', 'En Proceso', 'Esperando Repuestos'].includes(s.Estado)).length}
                  </h3>
                </div>
                <div style={{ background: '#fef3c7', color: '#d97706', padding: '10px', borderRadius: '10px' }}><Clock size={24} /></div>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Entregados</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#10b981' }}>
                    {agriculturalServices.filter(s => s.Estado === 'Entregado').length}
                  </h3>
                </div>
                <div style={{ background: '#d1fae5', color: '#10b981', padding: '10px', borderRadius: '10px' }}><CheckCircle size={24} /></div>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Facturado/Cobrado</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: 'var(--primary)' }}>
                    ${totalAgricolaMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
                <div style={{ background: '#dcfce7', color: '#16a34a', padding: '10px', borderRadius: '10px' }}><DollarSign size={24} /></div>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'torno' && (
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Trabajos de Torno</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#7c3aed' }}>{tornoServices.length}</h3>
                </div>
                <div style={{ background: '#ede9fe', color: '#7c3aed', padding: '10px', borderRadius: '10px' }}><Cog size={24} /></div>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>En Torno / Maquinado</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#d97706' }}>
                    {tornoServices.filter(s => ['Recibido', 'En Proceso', 'Esperando Repuestos'].includes(s.Estado)).length}
                  </h3>
                </div>
                <div style={{ background: '#fef3c7', color: '#d97706', padding: '10px', borderRadius: '10px' }}><Clock size={24} /></div>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Piezas Entregadas</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#10b981' }}>
                    {tornoServices.filter(s => s.Estado === 'Entregado').length}
                  </h3>
                </div>
                <div style={{ background: '#d1fae5', color: '#10b981', padding: '10px', borderRadius: '10px' }}><CheckCircle size={24} /></div>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Ingresos por Torno</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#7c3aed' }}>
                    ${totalTornoMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </h3>
                </div>
                <div style={{ background: '#ede9fe', color: '#7c3aed', padding: '10px', borderRadius: '10px' }}><DollarSign size={24} /></div>
              </div>
            </div>
          </div>
        )}

        {activeMainTab === 'salidas' && (
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Litros de Aceite Despachados</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#0284c7' }}>
                    {totalLitrosDespachados.toLocaleString('es-MX', { minimumFractionDigits: 1 })} Lts
                  </h3>
                </div>
                <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '10px', borderRadius: '10px' }}><Droplets size={24} /></div>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Salidas para Trabajos</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#16a34a' }}>
                    {salidas.filter(s => s.TipoSalida === 'Salida para Trabajo en Taller' || s.TipoSalida === 'Material para Torno').length}
                  </h3>
                </div>
                <div style={{ background: '#dcfce7', color: '#16a34a', padding: '10px', borderRadius: '10px' }}><Package size={24} /></div>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Despachos a Granel</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem', color: '#d97706' }}>
                    {salidas.filter(s => s.TipoSalida === 'Despacho de Aceite a Granel').length}
                  </h3>
                </div>
                <div style={{ background: '#fef3c7', color: '#d97706', padding: '10px', borderRadius: '10px' }}><Droplets size={24} /></div>
              </div>
            </div>

            <div className="stat-card" style={{ background: 'var(--white)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Registros</span>
                  <h3 style={{ fontSize: '1.6rem', marginTop: '0.3rem' }}>{salidas.length}</h3>
                </div>
                <div style={{ background: '#f1f5f9', color: '#475569', padding: '10px', borderRadius: '10px' }}><FileText size={24} /></div>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Search */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder={
                activeMainTab === 'libreta' ? "🔍 Buscar en la libreta (Cliente: Raúl, Calvillo, Torno, Refacción, Aceite, Folio)..." :
                activeMainTab === 'taller' ? "Buscar por Folio, Cliente, Tractor o Servicio..." :
                activeMainTab === 'torno' ? "Buscar por Folio, Cliente, Pieza (Buje, Flecha) o Material..." :
                "Buscar por Folio, Aceite, Destino o Solicitante..."
              }
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius)', border: '1px solid #cbd5e1' }}
            />
          </div>

          {activeMainTab !== 'salidas' && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {['all', ...ESTADOS].map(st => (
                <button 
                  key={st}
                  onClick={() => setFilterState(st)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    background: filterState === st ? (activeMainTab === 'libreta' ? '#d97706' : 'var(--primary)') : 'var(--white)',
                    color: filterState === st ? 'white' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem'
                  }}
                >
                  {st === 'all' ? 'Todos' : st}
                </button>
              ))}
            </div>
          )}

          {activeMainTab === 'libreta' && (
            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setLibretaViewMode('cards')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: libretaViewMode === 'cards' ? '#ffffff' : 'transparent',
                  color: libretaViewMode === 'cards' ? '#0f172a' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: libretaViewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <Grid size={15} /> Tarjetas
              </button>
              <button
                onClick={() => setLibretaViewMode('table')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: libretaViewMode === 'table' ? '#ffffff' : 'transparent',
                  color: libretaViewMode === 'table' ? '#0f172a' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: libretaViewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <List size={15} /> Tabla
              </button>
            </div>
          )}
        </div>

        {/* ── SECCIÓN 0: LIBRETA DIGITAL DE TRABAJOS ── */}
        {activeMainTab === 'libreta' && (
          <div>
            {loading ? (
              <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                Cargando libreta de trabajos...
              </div>
            ) : allLibretaServices.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: '3.5rem 2rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)', border: '2px dashed #fde68a' }}>
                <BookOpen size={52} style={{ margin: '0 auto 12px', display: 'block', color: '#f59e0b' }} />
                <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '1.3rem' }}>
                  {search ? `No se encontraron trabajos para "${search}"` : 'No hay trabajos anotados en la libreta'}
                </h3>
                <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
                  Anota aquí los trabajos de torno, cambios de aceite, tornillos y empaques para que nada se olvide ni se pierda.
                </p>
                <button 
                  className="btn" 
                  onClick={() => setShowLibretaModal(true)}
                  style={{ 
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                    color: 'white', 
                    fontWeight: 700, 
                    padding: '0.7rem 1.4rem', 
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                  }}
                >
                  <BookOpen size={18} /> Anotar Primer Trabajo
                </button>
              </div>
            ) : libretaViewMode === 'cards' ? (
              /* VISTA DE TARJETAS / FICHAS DE LIBRETA */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
                {allLibretaServices.map(srv => {
                  const esCombinado = (srv.CostoManoDeObra > 0 && srv.CostoTorno > 0) || !!srv.IncluyeTorno;
                  const esTorno = !!srv.EsTrabajoTorno && !esCombinado;
                  const borderAccent = esCombinado ? '#d97706' : esTorno ? '#7c3aed' : '#10b981';
                  const badgeBg = esCombinado ? '#fef3c7' : esTorno ? '#ede9fe' : '#d1fae5';
                  const badgeColor = esCombinado ? '#b45309' : esTorno ? '#6d28d9' : '#047857';

                  return (
                    <div 
                      key={srv._id}
                      className="libreta-card"
                      style={{
                        background: '#ffffff',
                        borderRadius: 'var(--radius)',
                        border: '1px solid #e2e8f0',
                        borderLeft: `5px solid ${borderAccent}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        padding: '1.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                      }}
                    >
                      <div>
                        {/* Cabecera de la ficha */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              padding: '3px 8px', 
                              borderRadius: '6px', 
                              background: badgeBg, 
                              color: badgeColor, 
                              fontWeight: 800, 
                              fontSize: '0.82rem' 
                            }}>
                              {srv.Folio}
                            </span>
                            {esCombinado && (
                              <span style={{ 
                                padding: '2px 7px', 
                                borderRadius: '4px', 
                                background: '#fef3c7', 
                                color: '#b45309', 
                                border: '1px solid #fde68a',
                                fontWeight: 800, 
                                fontSize: '0.72rem' 
                              }}>
                                🔀 Taller + Torno
                              </span>
                            )}
                            <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                              {new Date(srv.FechaIngreso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                            </small>
                          </div>

                          {/* Selector rápido de estado */}
                          <select
                            value={srv.Estado}
                            onChange={e => handleUpdateStatus(srv._id, e.target.value)}
                            disabled={srv.Estado === 'Entregado'}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              border: '1px solid #cbd5e1',
                              background: 
                                srv.Estado === 'Entregado' ? '#d1fae5' :
                                srv.Estado === 'Completado' ? '#e0f2fe' :
                                srv.Estado === 'En Proceso' ? '#fef3c7' : '#f1f5f9',
                              color: 
                                srv.Estado === 'Entregado' ? '#059669' :
                                srv.Estado === 'Completado' ? '#0284c7' :
                                srv.Estado === 'En Proceso' ? '#d97706' : '#475569',
                              cursor: srv.Estado === 'Entregado' ? 'default' : 'pointer'
                            }}
                          >
                            {ESTADOS.map(st => <option key={st} value={st}>{st}</option>)}
                          </select>
                        </div>

                        {/* Nombre del Cliente */}
                        <div style={{ marginBottom: '0.6rem' }}>
                          <div
                            style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => abrirHistorial(srv.Nombre_Cliente)}
                            title="Ver historial completo del cliente"
                          >
                            {srv.Nombre_Cliente}
                            <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', padding: '1px 6px', fontWeight: 600 }}>📋 ver historial</span>
                          </div>
                          {srv.Telefono_Cliente && (
                            <small style={{ color: '#64748b', fontSize: '0.8rem', display: 'block' }}>
                              Tel: {srv.Telefono_Cliente}
                            </small>
                          )}
                        </div>

                        {/* Trabajo / Máquina */}
                        <div style={{ background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '0.8rem', border: '1px solid #e2e8f0' }}>
                          {esCombinado ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#047857', marginBottom: '4px' }}>
                                <Tractor size={15} />
                                <span>{srv.TipoServicio} ({srv.Marca} {srv.Modelo})</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.86rem', color: '#7c3aed' }}>
                                <Cog size={15} />
                                <span>Torno: {srv.DetallesTorno?.TipoPieza || 'Pieza Maquinada'} {srv.DetallesTorno?.MaterialUsado ? `(${srv.DetallesTorno.MaterialUsado})` : ''}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem', color: esTorno ? '#6d28d9' : '#047857' }}>
                                {esTorno ? <Cog size={16} /> : <Tractor size={16} />}
                                <span>{esTorno ? (srv.DetallesTorno?.TipoPieza || srv.TipoServicio) : srv.TipoServicio}</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                                {esTorno 
                                  ? `Torno: ${srv.DetallesTorno?.MaterialUsado || 'Material general'} ${srv.DetallesTorno?.Dimensiones ? '• ' + srv.DetallesTorno.Dimensiones : ''}`
                                  : `Equipo: ${srv.Marca || 'Agrícola'} ${srv.Modelo || ''} (${srv.TipoEquipo})`
                                }
                              </div>
                            </>
                          )}
                        </div>

                        {/* Refacciones, Aceites y Materiales Usados */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', letterSpacing: '0.5px' }}>
                              Refacciones & Aceite ({srv.Repuestos?.length || 0}):
                            </span>
                            {srv.Estado !== 'Entregado' && (
                              <button
                                onClick={() => {
                                  setQuickAddTarget(srv);
                                  setQuickAddItem({ selectedProdId: '', nombre: '', cantidad: 1, unidad: 'Litros', precioUnitario: '' });
                                }}
                                style={{
                                  fontSize: '0.74rem',
                                  background: '#e0f2fe',
                                  color: '#0284c7',
                                  border: '1px solid #bae6fd',
                                  borderRadius: '6px',
                                  padding: '2px 8px',
                                  cursor: 'pointer',
                                  fontWeight: 700
                                }}
                              >
                                + Agregar
                              </button>
                            )}
                          </div>

                          {(srv.Repuestos || []).length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
                              Sin refacciones cargadas (haz clic en "+ Agregar" para sumar aceites o tornillos).
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {srv.Repuestos.map((r, i) => {
                                const isAceite = (r.Nombre || '').toLowerCase().includes('aceite') || r.Unidad === 'Litros';
                                const isTornillo = (r.Nombre || '').toLowerCase().includes('tornill');
                                const isEmpaque = (r.Nombre || '').toLowerCase().includes('empaque') || (r.Nombre || '').toLowerCase().includes('oring');

                                return (
                                  <div 
                                    key={i} 
                                    style={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      fontSize: '0.8rem', 
                                      background: '#fafafa', 
                                      padding: '3px 6px', 
                                      borderRadius: '4px',
                                      border: '1px solid #f1f5f9'
                                    }}
                                  >
                                    <span style={{ color: '#334155' }}>
                                      {isAceite ? '🛢️' : isTornillo ? '🔩' : isEmpaque ? '⭕' : '📦'} <strong>{r.Cantidad} {r.Unidad || ''}</strong> - {r.Nombre}
                                    </span>
                                    <span style={{ fontWeight: 600, color: '#475569' }}>
                                      ${(r.Subtotal || 0).toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Observaciones */}
                        {srv.Observaciones && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.8rem', background: '#fffbeb', border: '1px solid #fef3c7', padding: '4px 8px', borderRadius: '6px' }}>
                            <strong>Nota:</strong> {srv.Observaciones}
                          </div>
                        )}
                      </div>

                      {/* Pie de tarjeta con Totales y Botones de Acción */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid #e2e8f0', paddingTop: '0.8rem', marginBottom: '0.8rem' }}>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {esCombinado ? (
                              <>
                                <span>🔧 Taller: <strong>${(srv.CostoManoDeObra || 0).toFixed(2)}</strong></span>
                                <span>⚙️ Torno: <strong>${(srv.CostoTorno || 0).toFixed(2)}</strong></span>
                              </>
                            ) : esTorno ? (
                              <span>Mano de Obra Torno: <strong>${(srv.CostoManoDeObra || 0).toFixed(2)}</strong></span>
                            ) : (
                              <span>Mano de Obra: <strong>${(srv.CostoManoDeObra || 0).toFixed(2)}</strong></span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <small style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total a Cobrar</small>
                            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: borderAccent }}>
                              ${(srv.TotalServicio || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Acciones */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {/* 1. Cobrar y Generar Nota de Venta */}
                          {srv.Estado !== 'Entregado' && (
                            <button
                              onClick={() => {
                                setDeliverModal(srv);
                                setDeliverPayment({ MetodoPago: 'Efectivo', MontoPago: srv.TotalServicio });
                              }}
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                              title="Cobrar y entregar servicio (imprime Nota/Ticket)"
                            >
                              <ShoppingCart size={15} /> Cobrar Nota
                            </button>
                          )}

                          {/* 2. Facturar SAT CFDI 4.0 con 1 clic */}
                          <button
                            onClick={() => handleGoToFacturar(srv)}
                            style={{
                              padding: '6px 10px',
                              background: '#4f46e5',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px'
                            }}
                            title="Emitir Factura Fiscal SAT (CFDI 4.0)"
                          >
                            <Receipt size={15} /> Facturar
                          </button>

                          {/* 3. Ver / Imprimir Nota de Remisión */}
                          <button
                            onClick={() => { setViewService(srv); setPrintDocType('remision'); }}
                            style={{
                              padding: '6px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#0284c7'
                            }}
                            title="Ver / Imprimir Nota de Remisión o Taller"
                          >
                            <Printer size={16} />
                          </button>

                          {/* 4. Editar */}
                          {srv.Estado !== 'Entregado' && (
                            <button
                              onClick={() => openEditModal(srv)}
                              style={{
                                padding: '6px',
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#d97706'
                              }}
                              title="Editar orden"
                            >
                              <Pencil size={16} />
                            </button>
                          )}

                          {/* 5. Eliminar */}
                          <button
                            onClick={() => handleDeleteService(srv._id, srv.Folio)}
                            style={{
                              padding: '6px',
                              background: '#fef2f2',
                              border: '1px solid #fee2e2',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#ef4444'
                            }}
                            title="Eliminar de la libreta"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* VISTA DE TABLA UNIFICADA DE LIBRETA */
              <div className="table-responsive" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                    <tr>
                      <th style={{ padding: '1rem' }}>Folio</th>
                      <th style={{ padding: '1rem' }}>Fecha</th>
                      <th style={{ padding: '1rem' }}>Cliente</th>
                      <th style={{ padding: '1rem' }}>Trabajo / Torno / Máquina</th>
                      <th style={{ padding: '1rem' }}>Refacciones & Aceites</th>
                      <th style={{ padding: '1rem' }}>Total</th>
                      <th style={{ padding: '1rem' }}>Estado</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allLibretaServices.map(srv => {
                      const esCombinado = (srv.CostoManoDeObra > 0 && srv.CostoTorno > 0) || !!srv.IncluyeTorno;
                      const esTorno = !!srv.EsTrabajoTorno && !esCombinado;
                      return (
                        <tr key={srv._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem', fontWeight: 800, color: esCombinado ? '#d97706' : esTorno ? '#7c3aed' : 'var(--primary)' }}>
                            <div>{srv.Folio}</div>
                            {esCombinado && (
                              <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', background: '#fef3c7', color: '#b45309', fontWeight: 800, display: 'inline-block', marginTop: '2px' }}>
                                Taller + Torno
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', color: '#64748b' }}>
                            {new Date(srv.FechaIngreso).toLocaleDateString('es-MX')}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{srv.Nombre_Cliente}</div>
                            {srv.Telefono_Cliente && <small style={{ color: '#94a3b8' }}>Tel: {srv.Telefono_Cliente}</small>}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {esCombinado ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#047857' }}>
                                  <Tractor size={15} />
                                  <span>{srv.TipoServicio}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#7c3aed', fontSize: '0.82rem', marginTop: '2px' }}>
                                  <Cog size={15} />
                                  <span>Torno: {srv.DetallesTorno?.TipoPieza || 'Pieza Maquinada'}</span>
                                </div>
                                <small style={{ color: '#64748b' }}>{srv.Marca} {srv.Modelo}</small>
                              </div>
                            ) : (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                  {esTorno ? <Cog size={16} color="#7c3aed" /> : <Tractor size={16} color="var(--primary)" />}
                                  <span>{esTorno ? (srv.DetallesTorno?.TipoPieza || srv.TipoServicio) : srv.TipoServicio}</span>
                                </div>
                                <small style={{ color: '#64748b' }}>
                                  {esTorno ? `Torno: ${srv.DetallesTorno?.MaterialUsado || 'Acero'}` : `${srv.Marca} ${srv.Modelo}`}
                                </small>
                              </>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600 }}>{srv.Repuestos?.length || 0} consumos</span>
                              {srv.Estado !== 'Entregado' && (
                                <button
                                  onClick={() => {
                                    setQuickAddTarget(srv);
                                    setQuickAddItem({ selectedProdId: '', nombre: '', cantidad: 1, unidad: 'Litros', precioUnitario: '' });
                                  }}
                                  style={{
                                    fontSize: '0.72rem',
                                    background: '#e0f2fe',
                                    color: '#0284c7',
                                    border: '1px solid #bae6fd',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    cursor: 'pointer',
                                    fontWeight: 700
                                  }}
                                  title="Agregar material a esta orden"
                                >
                                  + Material
                                </button>
                              )}
                            </div>
                            <small style={{ color: '#94a3b8' }}>
                              {(srv.Repuestos || []).slice(0, 2).map(r => r.Nombre).join(', ') || 'Sin refacciones'}
                            </small>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 800, fontSize: '1.05rem', color: esTorno ? '#7c3aed' : 'var(--primary)' }}>
                            ${(srv.TotalServicio || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <select
                              value={srv.Estado}
                              onChange={e => handleUpdateStatus(srv._id, e.target.value)}
                              disabled={srv.Estado === 'Entregado'}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                border: '1px solid #cbd5e1',
                                background: 
                                  srv.Estado === 'Entregado' ? '#d1fae5' :
                                  srv.Estado === 'Completado' ? '#e0f2fe' :
                                  srv.Estado === 'En Proceso' ? '#fef3c7' : '#f1f5f9',
                                color: 
                                  srv.Estado === 'Entregado' ? '#059669' :
                                  srv.Estado === 'Completado' ? '#0284c7' :
                                  srv.Estado === 'En Proceso' ? '#d97706' : '#475569',
                                cursor: srv.Estado === 'Entregado' ? 'default' : 'pointer'
                              }}
                            >
                              {ESTADOS.map(st => <option key={st} value={st}>{st}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button 
                                className="btn-icon" 
                                title="Ver / Imprimir Nota de Remisión"
                                onClick={() => { setViewService(srv); setPrintDocType('remision'); }}
                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}
                              >
                                <Printer size={16} color="#0284c7" />
                              </button>

                              <button 
                                className="btn-icon" 
                                title="Facturar SAT (CFDI 4.0)"
                                onClick={() => handleGoToFacturar(srv)}
                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #c7d2fe', background: '#eef2ff', cursor: 'pointer' }}
                              >
                                <Receipt size={16} color="#4f46e5" />
                              </button>

                              {srv.Estado !== 'Entregado' && (
                                <button 
                                  className="btn-icon" 
                                  title="Editar"
                                  onClick={() => openEditModal(srv)}
                                  style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fde68a', background: '#fffbeb', cursor: 'pointer' }}
                                >
                                  <Pencil size={16} color="#d97706" />
                                </button>
                              )}

                              {srv.Estado !== 'Entregado' && (
                                <button 
                                  className="btn-icon" 
                                  title="Cobrar y entregar"
                                  onClick={() => {
                                    setDeliverModal(srv);
                                    setDeliverPayment({ MetodoPago: 'Efectivo', MontoPago: srv.TotalServicio });
                                  }}
                                  style={{ padding: '6px', borderRadius: '6px', border: '1px solid #a7f3d0', background: '#ecfdf5', cursor: 'pointer' }}
                                >
                                  <ShoppingCart size={16} color="#10b981" />
                                </button>
                              )}

                              <button 
                                className="btn-icon" 
                                title="Eliminar"
                                onClick={() => handleDeleteService(srv._id, srv.Folio)}
                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', cursor: 'pointer' }}
                              >
                                <Trash2 size={16} color="#ef4444" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TABLA 1: SERVICIOS AGRÍCOLAS ── */}
        {activeMainTab === 'taller' && (
          <div className="table-responsive" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '1rem' }}>Folio</th>
                  <th style={{ padding: '1rem' }}>Fecha</th>
                  <th style={{ padding: '1rem' }}>Cliente</th>
                  <th style={{ padding: '1rem' }}>Maquinaria / Equipo</th>
                  <th style={{ padding: '1rem' }}>Servicio Solicitado</th>
                  <th style={{ padding: '1rem' }}>Total</th>
                  <th style={{ padding: '1rem' }}>Estado</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ padding: '2rem', textAlign: 'center' }}>Cargando órdenes de servicio...</td></tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Tractor size={40} style={{ margin: '0 auto 10px', display: 'block', color: '#cbd5e1' }} />
                      No se encontraron órdenes de servicio agrícola.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map(srv => (
                    <tr key={srv._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{srv.Folio}</td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(srv.FechaIngreso).toLocaleDateString('es-MX')}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{srv.Nombre_Cliente}</div>
                        {srv.Telefono_Cliente && <small style={{ color: '#94a3b8' }}>Tel: {srv.Telefono_Cliente}</small>}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tractor size={16} color="#64748b" />
                          <strong>{srv.Marca} {srv.Modelo}</strong>
                        </div>
                        <small style={{ color: '#94a3b8' }}>{srv.TipoEquipo} • {srv.SeriePlacas || 'S/N'}</small>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{srv.TipoServicio}</span>
                        <br />
                        <small style={{ color: '#64748b' }}>{srv.Repuestos?.length || 0} repuestos/aceites llevados</small>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, fontSize: '1.05rem' }}>
                        ${(srv.TotalServicio || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <select
                          value={srv.Estado}
                          onChange={e => handleUpdateStatus(srv._id, e.target.value)}
                          disabled={srv.Estado === 'Entregado'}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            border: '1px solid #cbd5e1',
                            background: 
                              srv.Estado === 'Entregado' ? '#d1fae5' :
                              srv.Estado === 'Completado' ? '#e0f2fe' :
                              srv.Estado === 'En Proceso' ? '#fef3c7' : '#f1f5f9',
                            color: 
                              srv.Estado === 'Entregado' ? '#059669' :
                              srv.Estado === 'Completado' ? '#0284c7' :
                              srv.Estado === 'En Proceso' ? '#d97706' : '#475569',
                            cursor: srv.Estado === 'Entregado' ? 'default' : 'pointer'
                          }}
                        >
                          {ESTADOS.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {/* Ver / Imprimir Nota o Taller */}
                          <button 
                            className="btn-icon" 
                            title="Ver / Imprimir Nota de Remisión o Taller"
                            onClick={() => { setViewService(srv); setPrintDocType('remision'); }}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}
                          >
                            <Printer size={16} color="#0284c7" />
                          </button>

                          {/* Facturar SAT CFDI 4.0 con 1 clic */}
                          <button 
                            className="btn-icon" 
                            title="Generar Factura Fiscal SAT (CFDI 4.0)"
                            onClick={() => handleGoToFacturar(srv)}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #c7d2fe', background: '#eef2ff', cursor: 'pointer' }}
                          >
                            <Receipt size={16} color="#4f46e5" />
                          </button>

                          {srv.Estado !== 'Entregado' && (
                            <button 
                              className="btn-icon" 
                              title="Editar orden"
                              onClick={() => openEditModal(srv)}
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fde68a', background: '#fffbeb', cursor: 'pointer' }}
                            >
                              <Pencil size={16} color="#d97706" />
                            </button>
                          )}

                          {srv.Estado !== 'Entregado' && (
                            <button 
                              className="btn-icon" 
                              title="Cobrar y Entregar Servicio"
                              onClick={() => {
                                setDeliverModal(srv);
                                setDeliverPayment({ MetodoPago: 'Efectivo', MontoPago: srv.TotalServicio });
                              }}
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #a7f3d0', background: '#ecfdf5', cursor: 'pointer' }}
                            >
                              <ShoppingCart size={16} color="#10b981" />
                            </button>
                          )}

                          <button 
                            className="btn-icon" 
                            title="Eliminar"
                            onClick={() => handleDeleteService(srv._id, srv.Folio)}
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
        )}

        {/* ── TABLA 2: TRABAJOS DE TORNO Y MAQUINADOS ── */}
        {activeMainTab === 'torno' && (
          <div className="table-responsive" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#faf5ff', borderBottom: '1px solid #e9d5ff' }}>
                <tr>
                  <th style={{ padding: '1rem' }}>Folio</th>
                  <th style={{ padding: '1rem' }}>Fecha</th>
                  <th style={{ padding: '1rem' }}>Cliente</th>
                  <th style={{ padding: '1rem' }}>Pieza / Trabajo de Torno</th>
                  <th style={{ padding: '1rem' }}>Material & Medidas</th>
                  <th style={{ padding: '1rem' }}>Mano de Obra / Torno</th>
                  <th style={{ padding: '1rem' }}>Total</th>
                  <th style={{ padding: '1rem' }}>Estado</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" style={{ padding: '2rem', textAlign: 'center' }}>Cargando trabajos de torno...</td></tr>
                ) : filteredTorno.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Cog size={40} style={{ margin: '0 auto 10px', display: 'block', color: '#c084fc' }} />
                      No hay trabajos de torno registrados. Haz clic en <strong>"Nuevo Trabajo de Torno"</strong> para anotar uno.
                    </td>
                  </tr>
                ) : (
                  filteredTorno.map(srv => (
                    <tr key={srv._id} style={{ borderBottom: '1px solid #f3e8ff' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#7c3aed' }}>{srv.Folio}</td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(srv.FechaIngreso).toLocaleDateString('es-MX')}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{srv.Nombre_Cliente}</div>
                        {srv.Telefono_Cliente && <small style={{ color: '#94a3b8' }}>Tel: {srv.Telefono_Cliente}</small>}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Cog size={16} color="#7c3aed" />
                          <strong style={{ color: '#581c87' }}>{srv.DetallesTorno?.TipoPieza || srv.TipoServicio}</strong>
                        </div>
                        <small style={{ color: '#64748b' }}>{srv.Repuestos?.length || 0} insumos / barras</small>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div><strong>Material:</strong> {srv.DetallesTorno?.MaterialUsado || 'Acero general'}</div>
                        {srv.DetallesTorno?.Dimensiones && (
                          <small style={{ color: '#64748b' }}>Medidas: {srv.DetallesTorno?.Dimensiones}</small>
                        )}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>
                        ${(srv.CostoManoDeObra || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        <br />
                        <small style={{ color: '#94a3b8' }}>{srv.DetallesTorno?.HorasTorno || 1} hrs torno</small>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, fontSize: '1.05rem', color: '#7c3aed' }}>
                        ${(srv.TotalServicio || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <select
                          value={srv.Estado}
                          onChange={e => handleUpdateStatus(srv._id, e.target.value)}
                          disabled={srv.Estado === 'Entregado'}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            border: '1px solid #e9d5ff',
                            background: 
                              srv.Estado === 'Entregado' ? '#d1fae5' :
                              srv.Estado === 'Completado' ? '#e0f2fe' :
                              srv.Estado === 'En Proceso' ? '#ede9fe' : '#f1f5f9',
                            color: 
                              srv.Estado === 'Entregado' ? '#059669' :
                              srv.Estado === 'Completado' ? '#0284c7' :
                              srv.Estado === 'En Proceso' ? '#7c3aed' : '#475569',
                            cursor: srv.Estado === 'Entregado' ? 'default' : 'pointer'
                          }}
                        >
                          {ESTADOS.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button 
                            className="btn-icon" 
                            title="Imprimir Nota de Torno / Remisión"
                            onClick={() => { setViewService(srv); setPrintDocType('remision'); }}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}
                          >
                            <Printer size={16} color="#7c3aed" />
                          </button>

                          <button 
                            className="btn-icon" 
                            title="Facturar SAT (CFDI 4.0)"
                            onClick={() => handleGoToFacturar(srv)}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #c7d2fe', background: '#eef2ff', cursor: 'pointer' }}
                          >
                            <Receipt size={16} color="#4f46e5" />
                          </button>

                          {srv.Estado !== 'Entregado' && (
                            <button 
                              className="btn-icon" 
                              title="Editar trabajo de torno"
                              onClick={() => openEditModal(srv)}
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fde68a', background: '#fffbeb', cursor: 'pointer' }}
                            >
                              <Pencil size={16} color="#d97706" />
                            </button>
                          )}

                          {srv.Estado !== 'Entregado' && (
                            <button 
                              className="btn-icon" 
                              title="Cobrar y Entregar Pieza"
                              onClick={() => {
                                setDeliverModal(srv);
                                setDeliverPayment({ MetodoPago: 'Efectivo', MontoPago: srv.TotalServicio });
                              }}
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #a7f3d0', background: '#ecfdf5', cursor: 'pointer' }}
                            >
                              <ShoppingCart size={16} color="#10b981" />
                            </button>
                          )}

                          <button 
                            className="btn-icon" 
                            title="Eliminar"
                            onClick={() => handleDeleteService(srv._id, srv.Folio)}
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
        )}

        {/* ── TABLA 3: SALIDAS Y DESPACHO DE ACEITE Y ALMACÉN ── */}
        {activeMainTab === 'salidas' && (
          <div className="table-responsive" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f0f9ff', borderBottom: '1px solid #bae6fd' }}>
                <tr>
                  <th style={{ padding: '1rem' }}>Folio</th>
                  <th style={{ padding: '1rem' }}>Fecha</th>
                  <th style={{ padding: '1rem' }}>Tipo de Salida</th>
                  <th style={{ padding: '1rem' }}>Producto / Lubricante</th>
                  <th style={{ padding: '1rem' }}>Cantidad / Litros</th>
                  <th style={{ padding: '1rem' }}>Destino / Trabajo</th>
                  <th style={{ padding: '1rem' }}>Solicitante / Mecánico</th>
                  <th style={{ padding: '1rem' }}>Valor</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalidas.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Droplets size={40} style={{ margin: '0 auto 10px', display: 'block', color: '#7dd3fc' }} />
                      No hay salidas registradas. Usa el botón <strong>"Salida de Aceite"</strong> para registrar un despacho.
                    </td>
                  </tr>
                ) : (
                  filteredSalidas.map(sal => (
                    <tr key={sal._id} style={{ borderBottom: '1px solid #f0f9ff', opacity: sal.Estado === 'Cancelada' ? 0.6 : 1 }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#0284c7' }}>{sal.Folio}</td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(sal.Fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '10px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: sal.TipoSalida.includes('Aceite') ? '#e0f2fe' : '#f1f5f9',
                          color: sal.TipoSalida.includes('Aceite') ? '#0369a1' : '#475569'
                        }}>
                          {sal.TipoSalida}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <strong>{sal.Nombre_Producto}</strong>
                        {sal.Codigo_Producto && <small style={{ display: 'block', color: '#94a3b8' }}>Cód: {sal.Codigo_Producto}</small>}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '1.05rem', fontWeight: 800, color: '#0284c7' }}>
                        {sal.Cantidad} {sal.UnidadMedida}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 600 }}>{sal.DestinoTrabajo || 'Consumo General Taller'}</span>
                        {sal.Folio_Servicio && (
                          <small style={{ display: 'block', color: 'var(--primary)', fontWeight: 700 }}>Orden: {sal.Folio_Servicio}</small>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: '#475569' }}>{sal.Solicitante || 'Taller'}</td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>${(sal.Total || 0).toFixed(2)}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            title="Imprimir Vale de Salida"
                            onClick={() => setViewSalida(sal)}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}
                          >
                            <Printer size={16} color="#0284c7" />
                          </button>

                          {sal.Estado !== 'Cancelada' && (
                            <button
                              className="btn-icon"
                              title="Cancelar salida y reponer stock"
                              onClick={() => handleCancelSalida(sal._id, sal.Folio)}
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', cursor: 'pointer' }}
                            >
                              <RotateCcw size={16} color="#ef4444" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB: CUENTAS POR COBRAR ── */}
        {activeMainTab === 'cuentas' && (
          <div>
            {/* Encabezado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#dc2626' }}>💰 Cuentas por Cobrar — Taller</h2>
                <small style={{ color: '#64748b' }}>Trabajos que aún no han sido entregados / cobrados</small>
              </div>
              <button
                onClick={() => { setCuentasLoaded(false); fetchCuentasPorCobrar(); }}
                style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                🔄 Actualizar
              </button>
            </div>

            {/* Resumen general */}
            {cuentasData && !cuentasLoading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem 1.4rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#ef4444', letterSpacing: '0.5px' }}>Total por Cobrar</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>
                    ${(cuentasData.totalGeneral || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem 1.4rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#d97706', letterSpacing: '0.5px' }}>Trabajos Activos</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#b45309', marginTop: '4px' }}>{cuentasData.totalServicios || 0}</div>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem 1.4rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#16a34a', letterSpacing: '0.5px' }}>Clientes con Saldo</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>{(cuentasData.clientes || []).length}</div>
                </div>
              </div>
            )}

            {cuentasLoading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem' }}>⏳</div>
                <div>Calculando cuentas por cobrar...</div>
              </div>
            )}

            {!cuentasLoading && cuentasData && (cuentasData.clientes || []).length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '3rem' }}>✅</div>
                <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.1rem' }}>¡Todo al corriente!</div>
                <div style={{ color: '#64748b', marginTop: '6px' }}>No hay trabajos pendientes de cobro en este momento.</div>
              </div>
            )}

            {/* Tabla agrupada por cliente */}
            {!cuentasLoading && cuentasData && (cuentasData.clientes || []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(cuentasData.clientes || []).map((cliente, ci) => (
                  <div key={ci} style={{ background: 'white', border: `1px solid ${cliente.diasMaximo > 14 ? '#fecaca' : cliente.diasMaximo > 7 ? '#fde68a' : '#e2e8f0'}`, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    {/* Cabecera del cliente */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.2rem', background: cliente.diasMaximo > 14 ? '#fff1f2' : cliente.diasMaximo > 7 ? '#fffbeb' : '#f8fafc', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: cliente.diasMaximo > 14 ? '#fecaca' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: cliente.diasMaximo > 14 ? '#dc2626' : '#64748b', fontSize: '1.1rem' }}>
                          {(cliente.nombre || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                            {cliente.nombre}
                            {cliente.diasMaximo > 14 && <span style={{ marginLeft: '8px', background: '#dc2626', color: 'white', borderRadius: '4px', padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>⚠️ +{cliente.diasMaximo} días</span>}
                          </div>
                          {cliente.telefono && <div style={{ fontSize: '0.82rem', color: '#64748b' }}>📞 {cliente.telefono}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Pendiente</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#dc2626' }}>
                            ${(cliente.totalPendiente || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <button
                          onClick={() => abrirHistorial(cliente.nombre)}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', color: '#475569' }}
                        >
                          Ver Historial
                        </button>
                      </div>
                    </div>

                    {/* Lista de trabajos de ese cliente */}
                    <div style={{ padding: '0' }}>
                      {(cliente.trabajos || []).map((t, ti) => (
                        <div key={ti} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1.2rem', borderTop: ti > 0 ? '1px solid #f1f5f9' : 'none', background: ti % 2 === 0 ? 'white' : '#fafafa', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                            <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{t.Folio}</span>
                            <span style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 600 }}>{t.TipoServicio}</span>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{t.Marca} {t.Modelo}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, background: t.Estado === 'Completado' ? '#e0f2fe' : t.Estado === 'En Proceso' ? '#fef3c7' : '#f1f5f9', color: t.Estado === 'Completado' ? '#0284c7' : t.Estado === 'En Proceso' ? '#d97706' : '#64748b' }}>
                              {t.Estado}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: t.diasTranscurridos > 7 ? '#ef4444' : '#94a3b8', fontWeight: 700 }}>
                              {t.diasTranscurridos === 0 ? 'Hoy' : `Hace ${t.diasTranscurridos} día${t.diasTranscurridos !== 1 ? 's' : ''}`}
                            </span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                              ${(t.TotalServicio || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                            {t.Estado !== 'Entregado' && (
                              <button
                                onClick={() => { setDeliverModal(t); setDeliverPayment({ MetodoPago: 'Efectivo', MontoPago: t.TotalServicio }); }}
                                style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                💵 Cobrar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── MODAL 0: NUEVA ANOTACIÓN EN LIBRETA DE TRABAJOS ── */}
      {/* ── PANEL DESLIZABLE: HISTORIAL POR CLIENTE ── */}
      {historialPanel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex' }}>
          {/* Overlay oscuro */}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} onClick={() => setHistorialPanel(false)} />
          {/* Panel derecho */}
          <div style={{ width: 'min(520px, 100vw)', background: 'white', boxShadow: '-8px 0 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {/* Encabezado del panel */}
            <div style={{ padding: '1.4rem 1.6rem', borderBottom: '2px solid #e2e8f0', background: '#0f172a', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📋 Historial de Cliente</h3>
                <button onClick={() => setHistorialPanel(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
              </div>
              {/* Buscador dentro del panel */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Nombre del cliente..."
                  value={historialNombre}
                  onChange={e => setHistorialNombre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && buscarHistorialCliente(historialNombre)}
                  style={{ flex: 1, padding: '0.55rem 0.8rem', borderRadius: '6px', border: 'none', fontSize: '0.95rem' }}
                />
                <button
                  onClick={() => buscarHistorialCliente(historialNombre)}
                  style={{ background: '#d97706', color: 'white', border: 'none', borderRadius: '6px', padding: '0.55rem 1rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* Contenido del panel */}
            <div style={{ flex: 1, padding: '1.2rem 1.4rem', overflowY: 'auto' }}>
              {historialLoading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2.5rem' }}>⏳</div>
                  <div style={{ marginTop: '8px' }}>Buscando historial...</div>
                </div>
              )}

              {!historialLoading && historialData?.error && (
                <div style={{ color: '#ef4444', textAlign: 'center', padding: '2rem' }}>{historialData.error}</div>
              )}

              {!historialLoading && historialData && !historialData.error && historialData.clientes?.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2rem' }}>🔍</div>
                  <div>No se encontraron trabajos para <strong>"{historialNombre}"</strong></div>
                </div>
              )}

              {!historialLoading && historialData && !historialData.error && (historialData.clientes || []).map((cliente, ci) => (
                <div key={ci} style={{ marginBottom: '1.5rem' }}>
                  {/* Tarjeta del cliente */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem 1.2rem', border: '1px solid #e2e8f0', marginBottom: '0.8rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{cliente.nombre}</div>
                    {cliente.telefono && <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>📞 {cliente.telefono}</div>}
                    {/* Estadísticas rápidas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '10px' }}>
                      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Trabajos</div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{cliente.trabajos?.length || 0}</div>
                      </div>
                      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Gastado</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#16a34a' }}>${(cliente.totalGastado || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 })}</div>
                      </div>
                      <div style={{ background: cliente.pendientePago > 0 ? '#fff1f2' : 'white', border: `1px solid ${cliente.pendientePago > 0 ? '#fecaca' : '#e2e8f0'}`, borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: cliente.pendientePago > 0 ? '#ef4444' : '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Pendiente</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: cliente.pendientePago > 0 ? '#dc2626' : '#94a3b8' }}>
                          {cliente.pendientePago > 0 ? `$${(cliente.pendientePago).toLocaleString('es-MX', { minimumFractionDigits: 0 })}` : '✓ Al corriente'}
                        </div>
                      </div>
                    </div>
                    {/* Maquinaria conocida */}
                    {cliente.maquinaria?.length > 0 && (
                      <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#475569' }}>
                        <strong>🚜 Maquinaria:</strong> {cliente.maquinaria.join(' • ')}
                      </div>
                    )}
                  </div>

                  {/* Lista de trabajos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(cliente.trabajos || []).map((t, ti) => (
                      <div key={ti} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.82rem' }}>{t.Folio}</span>
                            <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, background: t.Estado === 'Entregado' ? '#d1fae5' : t.Estado === 'Completado' ? '#e0f2fe' : t.Estado === 'En Proceso' ? '#fef3c7' : '#f1f5f9', color: t.Estado === 'Entregado' ? '#059669' : t.Estado === 'Completado' ? '#0284c7' : t.Estado === 'En Proceso' ? '#d97706' : '#64748b' }}>
                              {t.Estado}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>{t.TipoServicio}</div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            {t.Marca} {t.Modelo} • {new Date(t.FechaIngreso).toLocaleDateString('es-MX')}
                          </div>
                          {(t.Repuestos || []).length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                              📦 {(t.Repuestos || []).map(r => `${r.Cantidad} ${r.Nombre}`).join(', ')}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 800, color: t.Estado === 'Entregado' ? '#16a34a' : '#dc2626', fontSize: '0.95rem' }}>
                            ${(t.TotalServicio || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {t.Estado === 'Entregado' ? '✅ Cobrado' : '🔴 Pendiente'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {showLibretaModal && (
        <div className="modal-backdrop no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', maxWidth: '820px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '2px solid #fde68a', paddingBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen color="#d97706" size={26} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>Nueva Anotación en Libreta de Trabajos</h3>
                  <small style={{ color: '#64748b' }}>Anota rápido el cliente, trabajo de torno y los aceites o refacciones utilizadas</small>
                </div>
              </div>
              <button onClick={() => setShowLibretaModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateLibreta}>
              {/* 1. Datos del Cliente */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.2rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  1. Cliente & Contacto
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>
                      Cliente / Nombre *
                    </label>
                    <input 
                      type="text" 
                      list="libreta-clients-list"
                      placeholder="Ej. Raúl de Calvillo"
                      required
                      value={libretaForm.Nombre_Cliente}
                      onChange={e => {
                        const val = e.target.value;
                        const match = clients.find(c => c.Nombre.toLowerCase() === val.toLowerCase());
                        setLibretaForm({
                          ...libretaForm,
                          Nombre_Cliente: val,
                          Telefono_Cliente: match ? (match.Telefono || '') : libretaForm.Telefono_Cliente
                        });
                      }}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.92rem', fontWeight: 600 }}
                    />
                    <datalist id="libreta-clients-list">
                      {clients.map(c => (
                        <option key={c._id} value={c.Nombre} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>
                      Teléfono (Opcional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej. 449 123 4567"
                      value={libretaForm.Telefono_Cliente}
                      onChange={e => setLibretaForm({ ...libretaForm, Telefono_Cliente: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Tipo de Trabajo y Detalle */}
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                  2. ¿Qué trabajo se va a realizar?
                </label>
                
                {/* Selector rápido de tipo de trabajo */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'Combinado', label: '🔀 Taller + Torno (Combinado)' },
                    { id: 'Torno', label: '⚙️ Solo Torno / Maquinado' },
                    { id: 'Tractor', label: '🚜 Servicio Agrícola / Tractor' },
                    { id: 'Taller', label: '🔧 Taller y Mecánica' },
                    { id: 'Refacciones', label: '📦 Solo Refacciones / Aceites' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setLibretaForm({ ...libretaForm, TipoTrabajo: t.id, IncluyeTorno: t.id === 'Combinado' })}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: libretaForm.TipoTrabajo === t.id ? '#d97706' : '#cbd5e1',
                        background: libretaForm.TipoTrabajo === t.id ? '#fef3c7' : '#ffffff',
                        color: libretaForm.TipoTrabajo === t.id ? '#b45309' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>
                      {libretaForm.TipoTrabajo === 'Combinado' ? 'Descripción del Servicio de Taller *' : 'Descripción del Trabajo o Pieza *'}
                    </label>
                    <input 
                      type="text" 
                      placeholder={
                        libretaForm.TipoTrabajo === 'Torno' ? "Ej. Buje de bronce para rastra / flecha" :
                        libretaForm.TipoTrabajo === 'Combinado' ? "Ej. Cambio de aceite y filtros, desarmado de diferencial..." :
                        "Ej. Cambio de aceite, filtros y engrasado"
                      }
                      required
                      value={libretaForm.Descripcion}
                      onChange={e => setLibretaForm({ ...libretaForm, Descripcion: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>
                      Máquina / Equipo (Opcional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej. Tractor John Deere 5715, o dejar vacío si es pieza suelta"
                      value={libretaForm.Maquina}
                      onChange={e => setLibretaForm({ ...libretaForm, Maquina: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.92rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Mano de Obra */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.2rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  3. Costos de Mano de Obra
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem' }}>
                  {libretaForm.TipoTrabajo !== 'Refacciones' && (
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>
                        {libretaForm.TipoTrabajo === 'Torno' ? '⚙️ Mano de Obra Torno ($)' :
                         libretaForm.TipoTrabajo === 'Combinado' ? '🔧 Mano de Obra Taller ($)' :
                         '🔧 Mano de Obra / Servicio ($)'}
                      </label>
                      <input 
                        type="number" 
                        step="any"
                        value={libretaForm.CostoManoDeObra}
                        onChange={e => setLibretaForm({ ...libretaForm, CostoManoDeObra: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}
                      />
                      <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Puedes dejar en $0 y ponerlo después</small>
                    </div>
                  )}

                  {(libretaForm.TipoTrabajo === 'Combinado') && (
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#7c3aed' }}>
                        ⚙️ Costo Trabajo de Torno ($)
                      </label>
                      <input 
                        type="number" 
                        step="any"
                        value={libretaForm.CostoTorno}
                        onChange={e => setLibretaForm({ ...libretaForm, CostoTorno: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '2px solid #c4b5fd', fontSize: '1rem', fontWeight: 700, color: '#6d28d9' }}
                      />
                      <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Se suma al taller como concepto separado</small>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#334155' }}>
                      Encargado / Tornero
                    </label>
                    <input 
                      type="text" 
                      value={libretaForm.TecnicoResponsable}
                      onChange={e => setLibretaForm({ ...libretaForm, TecnicoResponsable: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                {/* Detalle de Pieza de Torno (solo cuando aplica) */}
                {(libretaForm.TipoTrabajo === 'Torno' || libretaForm.TipoTrabajo === 'Combinado') && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px dashed #e9d5ff' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#7c3aed' }}>
                        ⚙️ {libretaForm.TipoTrabajo === 'Combinado' ? 'Pieza de Torno a Fabricar' : 'Descripción Detallada de la Pieza'}
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ej. Buje de bronce 2 pulgadas x 150mm barreno 1 pulgada, flecha, eje..."
                        value={libretaForm.DetalleTorno}
                        onChange={e => setLibretaForm({ ...libretaForm, DetalleTorno: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #c4b5fd', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#7c3aed' }}>
                        Material del Torno
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ej. Bronce fosforado, Acero 1045, 4140..."
                        value={libretaForm.MaterialTorno}
                        onChange={e => setLibretaForm({ ...libretaForm, MaterialTorno: e.target.value })}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #c4b5fd', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Refacciones, Aceites y Materiales Usados */}
              <div style={{ marginBottom: '1.2rem', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '1rem', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.5px' }}>
                      3. Refacciones, Aceites y Materiales Usados
                    </label>
                    <small style={{ display: 'block', color: '#64748b' }}>Agrega con 1 clic o selecciona del inventario</small>
                  </div>

                  {/* Botones de Presets Rápidos */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      onClick={() => handleAddLibretaPreset('aceite')}
                      style={{ fontSize: '0.78rem', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      🛢️ + 5 Lts Aceite ($95)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleAddLibretaPreset('tornillos')}
                      style={{ fontSize: '0.78rem', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      🔩 + 4 Tornillos ($25)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleAddLibretaPreset('empaques')}
                      style={{ fontSize: '0.78rem', background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ⭕ + Empaques ($180)
                    </button>
                  </div>
                </div>

                {/* Formulario para agregar producto o libre */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 80px 100px auto', gap: '0.5rem', alignItems: 'end', marginBottom: '0.8rem', background: '#f8fafc', padding: '0.7rem', borderRadius: '6px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>O buscar en inventario:</label>
                    <select 
                      value={libretaSelectedProdId}
                      onChange={e => {
                        const pid = e.target.value;
                        setLibretaSelectedProdId(pid);
                        if (pid) {
                          const p = products.find(x => x._id === pid);
                          if (p) {
                            setLibretaCustomItem({
                              Nombre: p.Nombre,
                              Cantidad: 1,
                              Unidad: p.UnidadMedida || 'Pieza',
                              PrecioUnitario: p.Precio_Venta || 0
                            });
                          }
                        }
                      }}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    >
                      <option value="">-- Seleccionar producto del almacén --</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.Nombre} (Stock: {p.Stock} - ${p.Precio_Venta})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>O escribir material libre:</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Aceite hidr., rondana, buje"
                      value={libretaCustomItem.Nombre}
                      onChange={e => setLibretaCustomItem({ ...libretaCustomItem, Nombre: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>Cant:</label>
                    <input 
                      type="number" 
                      step="any" 
                      min="0.1"
                      value={libretaCustomItem.Cantidad}
                      onChange={e => setLibretaCustomItem({ ...libretaCustomItem, Cantidad: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '2px' }}>P. Unit ($):</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="$"
                      value={libretaCustomItem.PrecioUnitario}
                      onChange={e => setLibretaCustomItem({ ...libretaCustomItem, PrecioUnitario: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>

                  <button 
                    type="button"
                    onClick={handleAddLibretaItem}
                    style={{ padding: '0.55rem 1rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
                  >
                    + Agregar
                  </button>
                </div>

                {/* Lista de refacciones agregadas */}
                {libretaRepuestos.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px' }}>Concepto</th>
                        <th style={{ padding: '6px 8px', width: '70px' }}>Cant.</th>
                        <th style={{ padding: '6px 8px', width: '80px' }}>Unidad</th>
                        <th style={{ padding: '6px 8px', width: '90px', textAlign: 'right' }}>P. Unit</th>
                        <th style={{ padding: '6px 8px', width: '90px', textAlign: 'right' }}>Subtotal</th>
                        <th style={{ padding: '6px 8px', width: '40px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {libretaRepuestos.map((r, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>{r.Nombre}</td>
                          <td style={{ padding: '6px 8px' }}>
                            <input 
                              type="number" 
                              step="any"
                              value={r.Cantidad}
                              onChange={e => handleUpdateLibretaRepuesto(idx, 'Cantidad', e.target.value)}
                              style={{ width: '60px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            <select
                              value={r.Unidad}
                              onChange={e => handleUpdateLibretaRepuesto(idx, 'Unidad', e.target.value)}
                              style={{ padding: '2px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                            >
                              {UNIDADES_MEDIDA.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                            <input 
                              type="number" 
                              step="any"
                              value={r.PrecioUnitario}
                              onChange={e => handleUpdateLibretaRepuesto(idx, 'PrecioUnitario', e.target.value)}
                              style={{ width: '70px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'right' }}
                            />
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>${(r.Subtotal || 0).toFixed(2)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <button 
                              type="button"
                              onClick={() => handleRemoveLibretaRepuesto(idx)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 5. Observaciones */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: '#64748b' }}>
                  Notas u Observaciones del Taller
                </label>
                <input 
                  type="text" 
                  placeholder="Ej. El cliente pasa el viernes / Dejar tolerancia de 2 milésimas / Urge para cosecha"
                  value={libretaForm.Observaciones}
                  onChange={e => setLibretaForm({ ...libretaForm, Observaciones: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              {/* Barra de Totales y Guardar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', border: '1px solid #fde68a', padding: '1rem 1.4rem', borderRadius: '8px', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  {libretaForm.TipoTrabajo === 'Combinado' ? (
                    <>
                      <small style={{ color: '#92400e', display: 'block' }}>
                        🔧 Taller: ${(parseFloat(libretaForm.CostoManoDeObra) || 0).toFixed(2)} &nbsp;|&nbsp; ⚙️ Torno: ${(parseFloat(libretaForm.CostoTorno) || 0).toFixed(2)} &nbsp;|&nbsp; 📦 Refacciones: ${(libretaRepuestos.reduce((acc, r) => acc + (Number(r.Subtotal) || 0), 0)).toFixed(2)}
                      </small>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>
                        Total Nota: ${calculateLibretaTotal().toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </div>
                    </>
                  ) : (
                    <>
                      <small style={{ color: '#92400e', display: 'block' }}>
                        Mano de Obra: ${(parseFloat(libretaForm.CostoManoDeObra) || 0).toFixed(2)} + Refacciones: ${(libretaRepuestos.reduce((acc, r) => acc + (Number(r.Subtotal) || 0), 0)).toFixed(2)}
                      </small>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>
                        Total Nota: ${calculateLibretaTotal().toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowLibretaModal(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn"
                    style={{ 
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                      color: 'white', 
                      fontWeight: 800, 
                      padding: '0.75rem 1.5rem', 
                      borderRadius: '8px', 
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <BookOpen size={18} /> Guardar en Libreta
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL RÁPIDO: AGREGAR MATERIAL / REFACCIÓN AL VUELO ── */}
      {quickAddTarget && (
        <div className="modal-backdrop no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', maxWidth: '560px', width: '100%', padding: '1.8rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem' }}>
                  ➕ Agregar Material a la Orden {quickAddTarget.Folio}
                </h3>
                <small style={{ color: '#64748b' }}>Cliente: <strong>{quickAddTarget.Nombre_Cliente}</strong></small>
              </div>
              <button onClick={() => setQuickAddTarget(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <form onSubmit={handleSaveQuickAdd}>
              {/* Presets de 1 clic */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setQuickAddItem({ selectedProdId: '', nombre: 'Aceite 15W40 para Motor / Hidráulico', cantidad: 5, unidad: 'Litros', precioUnitario: 95 })}
                  style={{ fontSize: '0.78rem', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                >
                  🛢️ Aceite 15W40
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAddItem({ selectedProdId: '', nombre: 'Tornillos de alta resistencia / tuercas', cantidad: 4, unidad: 'Pieza', precioUnitario: 25 })}
                  style={{ fontSize: '0.78rem', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                >
                  🔩 Tornillos
                </button>
                <button
                  type="button"
                  onClick={() => setQuickAddItem({ selectedProdId: '', nombre: 'Juego de empaques / O-rings', cantidad: 1, unidad: 'Juego', precioUnitario: 180 })}
                  style={{ fontSize: '0.78rem', background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                >
                  ⭕ Empaques
                </button>
              </div>

              {/* O buscar en almacén */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Seleccionar del Inventario (opcional):
                </label>
                <select
                  value={quickAddItem.selectedProdId}
                  onChange={e => {
                    const pid = e.target.value;
                    const p = products.find(x => x._id === pid);
                    if (p) {
                      setQuickAddItem({
                        selectedProdId: pid,
                        nombre: p.Nombre,
                        cantidad: 1,
                        unidad: p.UnidadMedida || 'Pieza',
                        precioUnitario: p.Precio_Venta || 0
                      });
                    } else {
                      setQuickAddItem({ ...quickAddItem, selectedProdId: '' });
                    }
                  }}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                >
                  <option value="">-- O escribir libremente abajo --</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.Nombre} (Stock: {p.Stock} - ${p.Precio_Venta})</option>
                  ))}
                </select>
              </div>

              {/* Concepto libre */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Concepto / Refacción / Aceite:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 10 Litros de aceite hidráulico 68, juego de retenes"
                  value={quickAddItem.nombre}
                  onChange={e => setQuickAddItem({ ...quickAddItem, nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Cantidad:</label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    value={quickAddItem.cantidad}
                    onChange={e => setQuickAddItem({ ...quickAddItem, cantidad: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Unidad:</label>
                  <select
                    value={quickAddItem.unidad}
                    onChange={e => setQuickAddItem({ ...quickAddItem, unidad: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    {UNIDADES_MEDIDA.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>P. Unit ($):</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quickAddItem.precioUnitario}
                    onChange={e => setQuickAddItem({ ...quickAddItem, precioUnitario: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '6px', marginBottom: '1.2rem', textAlign: 'right' }}>
                <small style={{ color: '#64748b', display: 'block' }}>Subtotal a sumar a la nota:</small>
                <strong style={{ fontSize: '1.2rem', color: '#0284c7' }}>
                  ${((parseFloat(quickAddItem.cantidad) || 0) * (parseFloat(quickAddItem.precioUnitario) || 0)).toFixed(2)} MXN
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setQuickAddTarget(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0284c7' }}>
                  Guardar en la Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 1: NUEVA ORDEN DE SERVICIO AGRÍCOLA ── */}
      {showModal && (
        <div className="modal-backdrop no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', maxWidth: '920px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Tractor color="var(--primary)" size={24} />
                <h3 style={{ margin: 0 }}>Registrar Orden de Servicio Agrícola</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateService}>
              {/* Cliente y Maquinaria */}
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem', color: 'var(--text-main)' }}>1. Datos del Cliente y Maquinaria</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Cliente / Propietario *</label>
                  <input 
                    type="text" 
                    placeholder="Nombre completo" 
                    required 
                    value={formData.Nombre_Cliente}
                    onChange={e => setFormData({ ...formData, Nombre_Cliente: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Teléfono</label>
                  <input 
                    type="text" 
                    placeholder="Teléfono de contacto" 
                    value={formData.Telefono_Cliente}
                    onChange={e => setFormData({ ...formData, Telefono_Cliente: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tipo de Equipo</label>
                  <select 
                    value={formData.TipoEquipo}
                    onChange={e => setFormData({ ...formData, TipoEquipo: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  >
                    {TIPOS_EQUIPO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Marca *</label>
                  <input 
                    type="text" 
                    placeholder="Ej. John Deere, New Holland, Case" 
                    required
                    value={formData.Marca}
                    onChange={e => setFormData({ ...formData, Marca: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Modelo *</label>
                  <input 
                    type="text" 
                    placeholder="Ej. 5415, 6610, TT75" 
                    required
                    value={formData.Modelo}
                    onChange={e => setFormData({ ...formData, Modelo: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Horómetro / KM</label>
                  <input 
                    type="text" 
                    placeholder="Ej. 1,450 Horas" 
                    value={formData.HorometroKM}
                    onChange={e => setFormData({ ...formData, HorometroKM: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Servicio y Asignación */}
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem', color: 'var(--text-main)' }}>2. Servicio y Mano de Obra</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Servicio Principal</label>
                  <select 
                    value={formData.TipoServicio}
                    onChange={e => setFormData({ ...formData, TipoServicio: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  >
                    {TIPOS_SERVICIO.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mecánico / Responsable</label>
                  <input 
                    type="text" 
                    value={formData.TecnicoResponsable}
                    onChange={e => setFormData({ ...formData, TecnicoResponsable: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Costo Mano de Obra ($)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={formData.CostoManoDeObra}
                    onChange={e => setFormData({ ...formData, CostoManoDeObra: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Insumos, Filtros y Litros de Aceite Llevados */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={17} color="var(--primary)" /> 3. Anotar qué se llevó para el trabajo (Filtros, Refacciones y Litros de Aceite)
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.8rem' }}>
                  Selecciona del almacén (descuenta stock automáticamente y registra la salida) o escribe insumos libres:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 110px 110px auto', gap: '0.8rem', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Producto / Aceite en Inventario</label>
                    <select 
                      value={selectedProdId}
                      onChange={e => {
                        setSelectedProdId(e.target.value);
                        const prod = products.find(p => p._id === e.target.value);
                        if (prod) {
                          setRepuestoPrice(prod.Precio_venta || prod.Precio_Venta || 0);
                          if (prod.Unidad_Medida) setRepuestoUnidad(prod.Unidad_Medida);
                        }
                      }}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">-- O escribir libremente abajo --</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.Nombre} (Stock: {p.Stock} {p.Unidad_Medida || 'pzas'}) - ${(p.Precio_venta || p.Precio_Venta || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Cantidad</label>
                    <input 
                      type="number" 
                      min="0.1" 
                      step="any"
                      value={repuestoQty}
                      onChange={e => setRepuestoQty(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Unidad</label>
                    <select
                      value={repuestoUnidad}
                      onChange={e => setRepuestoUnidad(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    >
                      {UNIDADES_MEDIDA.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>P. Unit ($)</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="0.00"
                      value={repuestoPrice}
                      onChange={e => setRepuestoPrice(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleAddRepuesto}
                    style={{ height: '42px', padding: '0 1.2rem' }}
                  >
                    <Plus size={16} /> Agregar
                  </button>
                </div>

                {!selectedProdId && (
                  <div style={{ marginTop: '0.8rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>O Insumo Manual (ej. 15 Litros Aceite Hidráulico ISO 68, Filtro LF16015, Grasa)</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Aceite 15W40 a granel, Filtro Separador, Grasa para chasis..."
                      value={repuestoCustomName}
                      onChange={e => setRepuestoCustomName(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}
              </div>

              {/* Tabla Repuestos */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Refacción / Insumo</th>
                    <th style={{ padding: '8px', width: '110px' }}>Cant. / Unidad</th>
                    <th style={{ padding: '8px', width: '110px' }}>P. Unitario</th>
                    <th style={{ padding: '8px', width: '110px' }}>Subtotal</th>
                    <th style={{ padding: '8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {repuestos.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No se han anotado insumos ni aceites para esta orden.</td></tr>
                  ) : (
                    repuestos.map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px' }}>{r.Nombre}</td>
                        <td style={{ padding: '8px' }}>{r.Cantidad} {r.Unidad || 'pzas'}</td>
                        <td style={{ padding: '8px' }}>${(r.PrecioUnitario || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', fontWeight: 600 }}>${(r.Subtotal || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button type="button" onClick={() => handleRemoveRepuesto(idx)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Diagnóstico y Totales */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Diagnóstico Inicial / Observaciones del Cliente</label>
                  <textarea 
                    rows="3"
                    placeholder="Detalles sobre el estado del tractor/máquina, motivo del servicio, ruidos o fugas..."
                    value={formData.DiagnosticoInicial}
                    onChange={e => setFormData({ ...formData, DiagnosticoInicial: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  ></textarea>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Mano de Obra:</span>
                    <strong>${(parseFloat(formData.CostoManoDeObra) || 0).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Subtotal Insumos:</span>
                    <strong>${repuestos.reduce((acc, r) => acc + r.Subtotal, 0).toFixed(2)}</strong>
                  </div>
                  <hr style={{ margin: '6px 0', borderColor: '#e2e8f0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 800 }}>
                    <span>Total Orden:</span>
                    <span>${calculateServiceTotal().toFixed(2)} MXN</span>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Orden Agrícola</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: NUEVO TRABAJO DE TORNO Y MAQUINADOS ── */}
      {showTornoModal && (
        <div className="modal-backdrop no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', maxWidth: '920px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e9d5ff', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cog color="#7c3aed" size={26} />
                <h3 style={{ margin: 0, color: '#581c87' }}>Anotar Trabajo de Torno y Maquinado</h3>
              </div>
              <button onClick={() => setShowTornoModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateTorno}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem', color: '#581c87' }}>1. Cliente y Especificaciones de la Pieza</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Cliente *</label>
                  <input 
                    type="text" 
                    placeholder="Nombre del cliente o rancho" 
                    required 
                    value={tornoData.Nombre_Cliente}
                    onChange={e => setTornoData({ ...tornoData, Nombre_Cliente: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Teléfono</label>
                  <input 
                    type="text" 
                    placeholder="Teléfono" 
                    value={tornoData.Telefono_Cliente}
                    onChange={e => setTornoData({ ...tornoData, Telefono_Cliente: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tipo de Pieza / Trabajo *</label>
                  <select 
                    value={tornoData.TipoPieza}
                    onChange={e => setTornoData({ ...tornoData, TipoPieza: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  >
                    {TIPOS_PIEZA_TORNO.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Material Empleado</label>
                  <select 
                    value={tornoData.MaterialUsado}
                    onChange={e => setTornoData({ ...tornoData, MaterialUsado: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  >
                    {MATERIALES_TORNO.map(mat => <option key={mat} value={mat}>{mat}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Medidas / Tolerancia</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Diam. 2.5 pulg x 180mm largo" 
                    value={tornoData.Dimensiones}
                    onChange={e => setTornoData({ ...tornoData, Dimensiones: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Horas de Torno Estimadas</label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0.5"
                    value={tornoData.HorasTorno}
                    onChange={e => setTornoData({ ...tornoData, HorasTorno: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Tornero y Costos */}
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem', color: '#581c87' }}>2. Tornero y Mano de Obra</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tornero Responsable</label>
                  <input 
                    type="text" 
                    value={tornoData.TecnicoResponsable}
                    onChange={e => setTornoData({ ...tornoData, TecnicoResponsable: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Costo Mano de Obra / Maquinado ($)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={tornoData.CostoManoDeObra}
                    onChange={e => setTornoData({ ...tornoData, CostoManoDeObra: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Prioridad</label>
                  <select
                    value={tornoData.Prioridad}
                    onChange={e => setTornoData({ ...tornoData, Prioridad: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente (Campo Parado)</option>
                  </select>
                </div>
              </div>

              {/* Insumos para Torno */}
              <div style={{ background: '#faf5ff', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid #e9d5ff', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: '#581c87', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={17} color="#7c3aed" /> 3. Barras, Bronce, Electrodos u Otros Materiales Utilizados
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 110px 110px auto', gap: '0.8rem', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Insumo de Almacén</label>
                    <select 
                      value={selectedProdId}
                      onChange={e => {
                        setSelectedProdId(e.target.value);
                        const prod = products.find(p => p._id === e.target.value);
                        if (prod) {
                          setRepuestoPrice(prod.Precio_venta || prod.Precio_Venta || 0);
                          if (prod.Unidad_Medida) setRepuestoUnidad(prod.Unidad_Medida);
                        }
                      }}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">-- O escribir material libre abajo --</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.Nombre} (Stock: {p.Stock}) - ${(p.Precio_venta || p.Precio_Venta || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Cantidad</label>
                    <input 
                      type="number" 
                      min="0.1" 
                      step="any"
                      value={repuestoQty}
                      onChange={e => setRepuestoQty(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Unidad</label>
                    <select
                      value={repuestoUnidad}
                      onChange={e => setRepuestoUnidad(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    >
                      {UNIDADES_MEDIDA.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>P. Unit ($)</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="0.00"
                      value={repuestoPrice}
                      onChange={e => setRepuestoPrice(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <button 
                    type="button" 
                    className="btn"
                    onClick={handleAddTornoRepuesto}
                    style={{ background: '#7c3aed', color: 'white', height: '42px', padding: '0 1.2rem' }}
                  >
                    <Plus size={16} /> Agregar
                  </button>
                </div>

                {!selectedProdId && (
                  <div style={{ marginTop: '0.8rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>O Insumo Manual (ej. 20cm Barra Bronce SAE 64, Solera 1/2", Inserto de corte)</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Barra de bronce fosforado 2 pulgadas, electrodos 7018..."
                      value={repuestoCustomName}
                      onChange={e => setRepuestoCustomName(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}
              </div>

              {/* Tabla Repuestos Torno */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ background: '#f5f3ff', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Material / Insumo</th>
                    <th style={{ padding: '8px', width: '110px' }}>Cant. / Unidad</th>
                    <th style={{ padding: '8px', width: '110px' }}>P. Unitario</th>
                    <th style={{ padding: '8px', width: '110px' }}>Subtotal</th>
                    <th style={{ padding: '8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {tornoRepuestos.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>Material proporcionado por el cliente o sin insumos adicionales.</td></tr>
                  ) : (
                    tornoRepuestos.map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f5f3ff' }}>
                        <td style={{ padding: '8px' }}>{r.Nombre}</td>
                        <td style={{ padding: '8px' }}>{r.Cantidad} {r.Unidad || 'pzas'}</td>
                        <td style={{ padding: '8px' }}>${(r.PrecioUnitario || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', fontWeight: 600 }}>${(r.Subtotal || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button type="button" onClick={() => setTornoRepuestos(tornoRepuestos.filter((_, i) => i !== idx))} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Diagnóstico y Totales */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Especificaciones Técnicas / Notas del Tornero</label>
                  <textarea 
                    rows="3"
                    placeholder="Detalles sobre rosca, pasos, barrenos, chaflanes, ajuste con balero..."
                    value={tornoData.Observaciones}
                    onChange={e => setTornoData({ ...tornoData, Observaciones: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  ></textarea>
                </div>

                <div style={{ background: '#faf5ff', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid #e9d5ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Mano de Obra Torno:</span>
                    <strong>${(parseFloat(tornoData.CostoManoDeObra) || 0).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Subtotal Materiales:</span>
                    <strong>${tornoRepuestos.reduce((acc, r) => acc + r.Subtotal, 0).toFixed(2)}</strong>
                  </div>
                  <hr style={{ margin: '6px 0', borderColor: '#e9d5ff' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: '#7c3aed', fontWeight: 800 }}>
                    <span>Total Torno:</span>
                    <span>${calculateTornoTotal().toFixed(2)} MXN</span>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTornoModal(false)}>Cancelar</button>
                <button type="submit" className="btn" style={{ background: '#7c3aed', color: 'white' }}>Registrar Trabajo de Torno</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: REGISTRAR SALIDA DE ACEITE / MATERIAL ── */}
      {showSalidaModal && (
        <div className="modal-backdrop no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', maxWidth: '640px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #bae6fd', paddingBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Droplets color="#0284c7" size={24} />
                <h3 style={{ margin: 0, color: '#0369a1' }}>Despacho y Salida de Aceite / Almacén</h3>
              </div>
              <button onClick={() => setShowSalidaModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateSalida}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tipo de Salida</label>
                  <select 
                    value={salidaForm.TipoSalida}
                    onChange={e => setSalidaForm({ ...salidaForm, TipoSalida: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Despacho de Aceite a Granel">Despacho de Aceite a Granel (Litros sueltos)</option>
                    <option value="Salida para Trabajo en Taller">Salida para Trabajo en Taller</option>
                    <option value="Salida para Trabajo en Campo">Salida para Trabajo en Campo (Tractor en rancho)</option>
                    <option value="Material para Torno">Material para Torno y Maquinados</option>
                    <option value="Venta a Granel">Venta Mostrador a Granel</option>
                    <option value="Consumo Interno / Merma">Consumo Interno / Limpieza</option>
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Seleccionar Aceite o Insumo de Inventario</label>
                  <select 
                    value={salidaForm.Id_Producto}
                    onChange={e => {
                      const prodId = e.target.value;
                      const prod = products.find(p => p._id === prodId);
                      setSalidaForm({
                        ...salidaForm,
                        Id_Producto: prodId,
                        Nombre_Producto: prod ? prod.Nombre : salidaForm.Nombre_Producto,
                        PrecioUnitario: prod ? (prod.Precio_venta || prod.Precio_Venta || 0) : salidaForm.PrecioUnitario,
                        UnidadMedida: prod && prod.Unidad_Medida ? prod.Unidad_Medida : 'Litros'
                      });
                    }}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">-- O escribir nombre manual abajo --</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.Nombre} (Stock: {p.Stock} {p.Unidad_Medida || 'pzas'}) - ${(p.Precio_venta || p.Precio_Venta || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {!salidaForm.Id_Producto && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nombre del Aceite / Insumo *</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Aceite Hidráulico ISO 68 a granel, 15W40 Diesel, Grasa..."
                      value={salidaForm.Nombre_Producto}
                      onChange={e => setSalidaForm({ ...salidaForm, Nombre_Producto: e.target.value })}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Cantidad a Despachar *</label>
                  <input 
                    type="number" 
                    step="any"
                    min="0.1" 
                    required 
                    value={salidaForm.Cantidad}
                    onChange={e => setSalidaForm({ ...salidaForm, Cantidad: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Unidad de Medida</label>
                  <select
                    value={salidaForm.UnidadMedida}
                    onChange={e => setSalidaForm({ ...salidaForm, UnidadMedida: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  >
                    {UNIDADES_MEDIDA.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Destino / Trabajo / Máquina</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Tractor John Deere 6110D de Juan Pérez, Trabajo en Rancho El Freno..."
                    value={salidaForm.DestinoTrabajo}
                    onChange={e => setSalidaForm({ ...salidaForm, DestinoTrabajo: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mecánico / Solicitante</label>
                  <input 
                    type="text" 
                    value={salidaForm.Solicitante}
                    onChange={e => setSalidaForm({ ...salidaForm, Solicitante: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Precio Venta / Ref ($)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={salidaForm.PrecioUnitario}
                    onChange={e => setSalidaForm({ ...salidaForm, PrecioUnitario: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSalidaModal(false)}>Cancelar</button>
                <button type="submit" className="btn" style={{ background: '#0284c7', color: 'white' }}>Registrar Salida y Descontar Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: COBRAR Y ENTREGAR SERVICIO / TORNO ── */}
      {deliverModal && (
        <div className="modal-backdrop no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', maxWidth: '540px', width: '100%', padding: '1.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart color="var(--primary)" /> Cobrar y Entregar Trabajo
              </h3>
              <button onClick={() => setDeliverModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Orden <strong>{deliverModal.Folio}</strong> • Cliente: <strong>{deliverModal.Nombre_Cliente}</strong>
              <br />
              <small>{deliverModal.EsTrabajoTorno ? `Torno: ${deliverModal.DetallesTorno?.TipoPieza || deliverModal.TipoServicio}` : `${deliverModal.Marca} ${deliverModal.Modelo} - ${deliverModal.TipoServicio}`}</small>
            </p>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                Resumen de Conceptos:
              </div>

              {(deliverModal.Repuestos || []).map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>📦 {r.Cantidad} {r.Unidad || ''} - {r.Nombre}</span>
                  <span style={{ fontWeight: 600 }}>${(r.Subtotal || 0).toFixed(2)}</span>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1' }}>
                <span>🔧 Mano de Obra / Maquinado:</span>
                <span style={{ fontWeight: 600 }}>${(deliverModal.CostoManoDeObra || 0).toFixed(2)}</span>
              </div>

              {deliverModal.Descuento > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ef4444', marginTop: '4px' }}>
                  <span>Descuento:</span>
                  <span>-${deliverModal.Descuento.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '8px', paddingTop: '8px', borderTop: '2px solid #e2e8f0' }}>
                <span>TOTAL A PAGAR:</span>
                <span>${deliverModal.TotalServicio.toFixed(2)} MXN</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Método de Pago</label>
                <select 
                  value={deliverPayment.MetodoPago}
                  onChange={e => setDeliverPayment({ ...deliverPayment, MetodoPago: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta de Débito/Crédito</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Monto Pagado</label>
                <input 
                  type="number" 
                  step="any"
                  value={deliverPayment.MontoPago}
                  onChange={e => setDeliverPayment({ ...deliverPayment, MontoPago: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            {parseFloat(deliverPayment.MontoPago) > deliverModal.TotalServicio && (
              <div style={{ background: '#ecfdf5', padding: '8px 12px', borderRadius: '6px', border: '1px solid #a7f3d0', color: '#065f46', fontWeight: 700, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Cambio:</span>
                <span>${(parseFloat(deliverPayment.MontoPago) - deliverModal.TotalServicio).toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeliverModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleDeliverService}>
                Confirmar Cobro y Generar Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR ORDEN (AGRÍCOLA O TORNO) ── */}
      {editModal && editForm && (
        <div className="modal-backdrop no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Editar Orden {editModal.Folio}</h3>
                <small style={{ color: 'var(--text-muted)' }}>{editModal.Estado} • {editModal.Marca} {editModal.Modelo}</small>
              </div>
              <button onClick={() => { setEditModal(null); setEditForm(null); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleSaveEditService}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem' }}>1. Cliente y Equipo / Torno</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Cliente *</label>
                  <input type="text" required value={editForm.Nombre_Cliente} onChange={e => setEditForm({ ...editForm, Nombre_Cliente: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Teléfono</label>
                  <input type="text" value={editForm.Telefono_Cliente} onChange={e => setEditForm({ ...editForm, Telefono_Cliente: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tipo de Equipo</label>
                  <select value={editForm.TipoEquipo} onChange={e => setEditForm({ ...editForm, TipoEquipo: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}>
                    {TIPOS_EQUIPO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Marca</label>
                  <input type="text" value={editForm.Marca} onChange={e => setEditForm({ ...editForm, Marca: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Modelo / Pieza</label>
                  <input type="text" value={editForm.Modelo} onChange={e => setEditForm({ ...editForm, Modelo: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem' }}>2. Mano de Obra y Técnico</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Técnico / Tornero</label>
                  <input type="text" value={editForm.TecnicoResponsable} onChange={e => setEditForm({ ...editForm, TecnicoResponsable: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mano de Obra ($)</label>
                  <input type="number" step="any" value={editForm.CostoManoDeObra} onChange={e => setEditForm({ ...editForm, CostoManoDeObra: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Descuento ($)</label>
                  <input type="number" step="any" value={editForm.Descuento} onChange={e => setEditForm({ ...editForm, Descuento: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.8rem' }}>3. Filtros, Refacciones y Aceites</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 100px 110px auto', gap: '0.8rem', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Inventario</label>
                    <select
                      value={editSelectedProdId}
                      onChange={e => {
                        setEditSelectedProdId(e.target.value);
                        const prod = products.find(p => p._id === e.target.value);
                        if (prod) {
                          setEditRepuestoPrice(prod.Precio_venta ?? prod.Precio_Venta ?? 0);
                          if (prod.Unidad_Medida) setEditRepuestoUnidad(prod.Unidad_Medida);
                        }
                      }}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">-- O escribir libremente abajo --</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.Nombre} (Stock: {p.Stock}) - ${(p.Precio_venta ?? p.Precio_Venta ?? 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Cant.</label>
                    <input type="number" step="any" min="0.1" value={editRepuestoQty} onChange={e => setEditRepuestoQty(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Unidad</label>
                    <select value={editRepuestoUnidad} onChange={e => setEditRepuestoUnidad(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }}>
                      {UNIDADES_MEDIDA.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>P. Unit ($)</label>
                    <input type="number" step="any" value={editRepuestoPrice} onChange={e => setEditRepuestoPrice(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }} />
                  </div>
                  <button type="button" className="btn btn-primary" onClick={handleAddEditRepuesto} style={{ height: '42px', padding: '0 1.2rem' }}>
                    <Plus size={16} /> Agregar
                  </button>
                </div>
                {!editSelectedProdId && (
                  <div style={{ marginTop: '0.8rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Insumo libre</label>
                    <input type="text" placeholder="Ej. Litros de Aceite 15W40, Barra Bronce..." value={editRepuestoCustomName} onChange={e => setEditRepuestoCustomName(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1' }} />
                  </div>
                )}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Insumo / Refacción</th>
                    <th style={{ padding: '8px', width: '90px' }}>Cant.</th>
                    <th style={{ padding: '8px', width: '90px' }}>Unidad</th>
                    <th style={{ padding: '8px', width: '110px' }}>P. Unit.</th>
                    <th style={{ padding: '8px', width: '110px' }}>Subtotal</th>
                    <th style={{ padding: '8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {editRepuestos.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>Sin insumos en esta orden.</td></tr>
                  ) : (
                    editRepuestos.map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px' }}>{r.Nombre}</td>
                        <td style={{ padding: '8px' }}>
                          <input type="number" min="0.01" step="any" value={r.Cantidad} onChange={e => handleUpdateEditRepuesto(idx, 'Cantidad', e.target.value)} style={{ width: '70px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input type="text" value={r.Unidad || 'Pieza'} onChange={e => handleUpdateEditRepuesto(idx, 'Unidad', e.target.value)} style={{ width: '80px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input type="number" min="0" step="any" value={r.PrecioUnitario} onChange={e => handleUpdateEditRepuesto(idx, 'PrecioUnitario', e.target.value)} style={{ width: '90px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </td>
                        <td style={{ padding: '8px', fontWeight: 600 }}>${(r.Subtotal || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button type="button" onClick={() => setEditRepuestos(editRepuestos.filter((_, i) => i !== idx))} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Diagnóstico / Especificaciones</label>
                  <textarea rows="3" value={editForm.DiagnosticoInicial} onChange={e => setEditForm({ ...editForm, DiagnosticoInicial: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginBottom: '0.8rem' }} />
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Mano de Obra:</span>
                    <strong>${(parseFloat(editForm.CostoManoDeObra) || 0).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Subtotal Insumos:</span>
                    <strong>${editRepuestos.reduce((acc, r) => acc + (Number(r.Subtotal) || 0), 0).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#ef4444' }}>
                    <span>Descuento:</span>
                    <strong>-${(parseFloat(editForm.Descuento) || 0).toFixed(2)}</strong>
                  </div>
                  <hr style={{ margin: '6px 0', borderColor: '#e2e8f0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 800 }}>
                    <span>Total:</span>
                    <span>${calculateEditTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setEditModal(null); setEditForm(null); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VISTA DE IMPRESIÓN (NOTA DE REMISIÓN / HOJA DE TALLER) ── */}
      {viewService && (
        <div className="modal-backdrop print-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', maxWidth: '850px', width: '100%', maxHeight: '95vh', overflowY: 'auto', padding: '2rem' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.8rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn" 
                  onClick={() => setPrintDocType('remision')}
                  style={{
                    background: printDocType === 'remision' ? 'var(--primary)' : '#f1f5f9',
                    color: printDocType === 'remision' ? 'white' : '#475569',
                    fontWeight: 700
                  }}
                >
                  <FileText size={16} /> Nota de Remisión / Cobro
                </button>
                <button 
                  className="btn" 
                  onClick={() => setPrintDocType('taller')}
                  style={{
                    background: printDocType === 'taller' ? '#0284c7' : '#f1f5f9',
                    color: printDocType === 'taller' ? 'white' : '#475569',
                    fontWeight: 700
                  }}
                >
                  <Wrench size={16} /> Hoja de Taller / Mecánico
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} /> Imprimir / Guardar PDF</button>
                <button className="btn btn-secondary" onClick={() => setViewService(null)}>Cerrar</button>
              </div>
            </div>

            {/* Documento Imprimible */}
            <div className="printable-service" style={{ padding: '0.5rem 0', background: '#ffffff', fontSize: '0.92rem', width: '100%', boxSizing: 'border-box' }}>
              {/* Encabezado Membretado */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid var(--primary)', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <h2 style={{ color: 'var(--primary)', fontWeight: 800, margin: '0 0 4px', fontSize: '1.5rem' }}>COMERCIAL AGRÍCOLA MARES CERVANTES</h2>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                    Taller de Servicio, Mantenimiento de Tractores, Torno & Filtros Agrícolas
                  </p>
                  <small style={{ color: '#94a3b8' }}>Venta de lubricantes, aceites a granel, refacciones y maquinados de precisión</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: printDocType === 'remision' ? '#ecfdf5' : '#e0f2fe',
                    color: printDocType === 'remision' ? '#065f46' : '#0369a1',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    textTransform: 'uppercase',
                    marginBottom: '4px'
                  }}>
                    {printDocType === 'remision' ? (viewService.EsTrabajoTorno ? 'NOTA DE REMISIÓN / TORNO' : 'NOTA DE REMISIÓN / SERVICIO') : 'ORDEN INTERNA DE TALLER'}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{viewService.Folio}</div>
                  <small style={{ color: '#64748b', fontWeight: 600, fontSize: '0.82rem' }}>
                    Fecha: {new Date(viewService.FechaIngreso || Date.now()).toLocaleDateString('es-MX')}
                  </small>
                </div>
              </div>

              {/* Bloque Cliente y Trabajo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.4rem', background: '#f8fafc', padding: '1rem 1.4rem', borderRadius: '6px', marginBottom: '1.2rem', border: '1px solid #cbd5e1' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>CLIENTE / PROPIETARIO:</span>
                  <div style={{ fontWeight: 700, fontSize: '1.15rem', color: '#0f172a' }}>{viewService.Nombre_Cliente}</div>
                  {viewService.Telefono_Cliente && <div style={{ fontSize: '0.88rem', color: '#475569', marginTop: '3px' }}>Tel: {viewService.Telefono_Cliente}</div>}
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '3px' }}>
                    Atendido por: <strong>{viewService.TecnicoResponsable || 'Taller'}</strong>
                  </div>
                </div>
                <div style={{ fontSize: '0.88rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    {viewService.EsTrabajoTorno ? 'DETALLES DEL MAQUINADO:' : 'MAQUINARIA / EQUIPO:'}
                  </span>
                  {viewService.EsTrabajoTorno ? (
                    <>
                      <div><strong>Pieza:</strong> {viewService.DetallesTorno?.TipoPieza || viewService.TipoServicio}</div>
                      <div><strong>Material:</strong> {viewService.DetallesTorno?.MaterialUsado || 'Acero'}</div>
                      {viewService.DetallesTorno?.Dimensiones && <div><strong>Medidas:</strong> {viewService.DetallesTorno?.Dimensiones}</div>}
                    </>
                  ) : (
                    <>
                      <div><strong>Equipo:</strong> {viewService.TipoEquipo}</div>
                      <div><strong>Marca/Modelo:</strong> {viewService.Marca} {viewService.Modelo}</div>
                      {viewService.HorometroKM && <div><strong>Horómetro/KM:</strong> {viewService.HorometroKM}</div>}
                    </>
                  )}
                </div>
              </div>

              {/* Diagnóstico / Especificaciones */}
              <div style={{ marginBottom: '1.2rem', border: '1px solid #e2e8f0', padding: '0.8rem 1rem', borderRadius: '6px', background: '#ffffff' }}>
                <strong style={{ fontSize: '0.9rem' }}>Trabajo Solicitado:</strong> {viewService.TipoServicio}
                {viewService.DiagnosticoInicial && (
                  <div style={{ marginTop: '4px', fontSize: '0.85rem', color: '#475569' }}>
                    <strong>Observaciones / Diagnóstico:</strong> {viewService.DiagnosticoInicial}
                  </div>
                )}
              </div>

              {/* Repuestos e Insumos Llevados */}
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                📦 Materiales, Aceites y Refacciones Utilizadas:
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.2rem', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: 'white', textAlign: 'left', fontSize: '0.82rem' }}>
                    <th style={{ padding: '8px 10px', width: '90px' }}>Cantidad</th>
                    <th style={{ padding: '8px 10px' }}>Concepto / Insumo</th>
                    <th style={{ padding: '8px 10px', width: '110px', textAlign: 'right' }}>P. Unitario</th>
                    <th style={{ padding: '8px 10px', width: '110px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewService.Repuestos || []).length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '8px', textAlign: 'center', color: '#94a3b8' }}>Sin refacciones ni aceites adicionales cargados.</td></tr>
                  ) : (
                    (viewService.Repuestos || []).map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{r.Cantidad} {r.Unidad || ''}</td>
                        <td style={{ padding: '8px 10px' }}>{r.Nombre}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>${(r.PrecioUnitario || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>${(r.Subtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                  {/* Mano de obra desglosada — puede tener 1 o 2 renglones */}
                  {(viewService.CostoManoDeObra > 0) && (
                    <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>1 Serv</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                        🔧 {viewService.EsTrabajoTorno && !viewService.CostoTorno ? 'Mano de Obra de Torno y Maquinado' : `Mano de Obra y Servicio de Taller: ${viewService.TipoServicio}`}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>${(viewService.CostoManoDeObra || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>${(viewService.CostoManoDeObra || 0).toFixed(2)}</td>
                    </tr>
                  )}
                  {(viewService.CostoTorno > 0) && (
                    <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#faf5ff' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>1 Serv</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                        ⚙️ Trabajo de Torno y Maquinado: {viewService.DetallesTorno?.TipoPieza || 'Pieza Maquinada'} {viewService.DetallesTorno?.MaterialUsado ? `(${viewService.DetallesTorno.MaterialUsado})` : ''}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>${(viewService.CostoTorno || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#7c3aed' }}>${(viewService.CostoTorno || 0).toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totales */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <div style={{ width: '300px', background: '#f8fafc', padding: '1rem 1.2rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  {viewService.CostoManoDeObra > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.88rem' }}>
                      <span>🔧 {viewService.EsTrabajoTorno && !viewService.CostoTorno ? 'Mano de Obra Torno:' : 'Mano de Obra Taller:'}</span>
                      <span>${(viewService.CostoManoDeObra || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {viewService.CostoTorno > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.88rem', color: '#7c3aed' }}>
                      <span>⚙️ Trabajo de Torno:</span>
                      <span>${(viewService.CostoTorno || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.88rem' }}>
                    <span>Insumos y Aceite:</span>
                    <span>${(viewService.SubtotalRepuestos || 0).toFixed(2)}</span>
                  </div>
                  {viewService.Descuento > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.88rem', color: '#ef4444' }}>
                      <span>Descuento:</span>
                      <span>-${(viewService.Descuento || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', marginTop: '8px', borderTop: '2px solid #cbd5e1', paddingTop: '8px' }}>
                    <span>TOTAL:</span>
                    <span>${(viewService.TotalServicio || 0).toFixed(2)} MXN</span>
                  </div>
                </div>
              </div>

              {/* Pagaré y Firmas de Conformidad */}
              {printDocType === 'remision' && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'justify', lineHeight: '1.3', margin: '0 0 1.5rem' }}>
                    Debo y pagaré incondicionalmente a la orden de COMERCIAL AGRÍCOLA MARES CERVANTES la cantidad especificada en este documento, 
                    por concepto de servicios de taller, refacciones, lubricantes y/o trabajos de torno recibidos a mi entera satisfacción.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '0.85rem' }}>
                    <div style={{ width: '230px', borderTop: '1px solid #0f172a', paddingTop: '6px' }}>
                      <strong>Firma del Cliente</strong>
                      <br /><small style={{ color: '#64748b' }}>Conformidad de entrega</small>
                    </div>
                    <div style={{ width: '230px', borderTop: '1px solid #0f172a', paddingTop: '6px' }}>
                      <strong>Firma de Taller / Torno</strong>
                      <br /><small style={{ color: '#64748b' }}>Técnico responsable</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: VISTA DE IMPRESIÓN DE VALE DE SALIDA ── */}
      {viewSalida && (
        <div className="modal-backdrop print-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="modal-content" style={{ background: 'var(--white)', borderRadius: 'var(--radius)', maxWidth: '580px', width: '100%', padding: '2rem' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <button className="btn btn-primary" onClick={handlePrint}><Printer size={16} /> Imprimir Vale de Salida</button>
              <button className="btn btn-secondary" onClick={() => setViewSalida(null)}>Cerrar</button>
            </div>

            <div style={{ border: '2px solid #0284c7', padding: '1.5rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', color: '#0369a1' }}>COMERCIAL AGRÍCOLA MARES CERVANTES</h3>
                  <small style={{ color: '#64748b' }}>VALE DE SALIDA DE ALMACÉN / DESPACHO DE ACEITE</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7' }}>{viewSalida.Folio}</div>
                  <small style={{ color: '#64748b' }}>{new Date(viewSalida.Fecha).toLocaleString('es-MX')}</small>
                </div>
              </div>

              <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '6px' }}><strong>Tipo de Salida:</strong> {viewSalida.TipoSalida}</div>
                <div style={{ marginBottom: '6px' }}><strong>Producto:</strong> {viewSalida.Nombre_Producto}</div>
                <div style={{ marginBottom: '6px', fontSize: '1.2rem', color: '#0284c7' }}>
                  <strong>Cantidad Despachada:</strong> {viewSalida.Cantidad} {viewSalida.UnidadMedida}
                </div>
                <div style={{ marginBottom: '6px' }}><strong>Destino / Trabajo:</strong> {viewSalida.DestinoTrabajo || 'Consumo taller'}</div>
                <div><strong>Solicitó / Retiró:</strong> {viewSalida.Solicitante}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginTop: '2rem', fontSize: '0.82rem' }}>
                <div style={{ width: '180px', borderTop: '1px solid #475569', paddingTop: '4px' }}>
                  Firma Solicitante
                </div>
                <div style={{ width: '180px', borderTop: '1px solid #475569', paddingTop: '4px' }}>
                  Firma Encargado Almacén
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Servicios;
