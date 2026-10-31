const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const auth = require('../middleware/auth');

// API para obtener productos para búsqueda o listas
router.get('/productos', async (req, res) => {
    try {
        const productos = await Producto.find({ Estado: 'Activo' });
        res.json(productos);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API para obtener proveedores
router.get('/proveedores', async (req, res) => {
    try {
        const Proveedor = require('../models/Proveedor');
        const proveedores = await Proveedor.find({ Estado: 'Activo' });
        res.json(proveedores);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API para registrar usuarios - Solo Administrador
router.post('/usuarios', auth(['Administrador']), async (req, res) => {
    try {
        const { Matricula_Usuario, Nombre_completo, Usuario: username, Clave, Rol } = req.body;
        
        // Verificar si el usuario ya existe
        const existingUser = await Usuario.findOne({ Usuario: username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'El nombre de usuario ya existe' });
        }

        const newUser = new Usuario({
            Matricula_Usuario,
            Nombre_completo,
            Usuario: username,
            Clave,
            Rol
        });

        await newUser.save();
        res.status(201).json({ success: true, message: 'Usuario registrado exitosamente', user: { usuario: username, rol: Rol } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const Venta = require('../models/Venta');
const Compra = require('../models/Compra');
const Cliente = require('../models/Cliente');
const Proveedor = require('../models/Proveedor');
const Negocio = require('../models/Negocio');
const Counter = require('../models/Counter');

// GET /api/business - Obtener datos del negocio y membrete
const getBusinessHandler = async (req, res) => {
    try {
        let negocio = await Negocio.findOne();
        if (!negocio) {
            negocio = await Negocio.create({
                Nombre: 'COMERCIAL AGRÍCOLA MARES CERVANTES',
                RazonSocial: 'ERNESTO MARES DE LA CRUZ',
                RFC: 'MACE900101XYZ',
                RegimenFiscal: '612 - Personas Físicas con Actividades Empresariales y Profesionales',
                Direccion: 'Salamanca - Celaya, Guanajuato, México',
                Telefono: '(464) 640-0000',
                Email: 'ventas@marescervantes.com',
                TerminosCotizacion: 'Precios sujetos a cambio sin previo aviso. Tiempo de entrega según disponibilidad de almacén.'
            });
        }
        res.json(negocio);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

router.get('/business', getBusinessHandler);
router.get('/negocio', getBusinessHandler);

// POST /api/business - Actualizar datos del negocio, CSD e Imagen Membretada (Solo Admin / Jefe)
const updateBusinessHandler = async (req, res) => {
    try {
        const { 
            Nombre, RazonSocial, RFC, RegimenFiscal, Direccion, Telefono, Email, Logo, HeaderImage, TerminosCotizacion,
            TipoPersona, Calle, NoExterior, NoInterior, Colonia, Municipio, EstadoProv, CodigoPostal,
            CertificadoCerName, CertificadoCerBase64, LlaveKeyName, LlaveKeyBase64, PasswordCSD, FacturapiApiKey
        } = req.body;
        
        let negocio = await Negocio.findOne();
        if (!negocio) {
            negocio = new Negocio({});
        }

        if (Nombre !== undefined) negocio.Nombre = Nombre;
        if (RazonSocial !== undefined) negocio.RazonSocial = RazonSocial;
        if (RFC !== undefined) negocio.RFC = RFC;
        if (RegimenFiscal !== undefined) negocio.RegimenFiscal = RegimenFiscal;
        if (Direccion !== undefined) negocio.Direccion = Direccion;
        if (Telefono !== undefined) negocio.Telefono = Telefono;
        if (Email !== undefined) negocio.Email = Email;
        if (Logo !== undefined) negocio.Logo = Logo;
        if (HeaderImage !== undefined) negocio.HeaderImage = HeaderImage;
        if (TerminosCotizacion !== undefined) negocio.TerminosCotizacion = TerminosCotizacion;

        if (TipoPersona !== undefined) negocio.TipoPersona = TipoPersona;
        if (Calle !== undefined) negocio.Calle = Calle;
        if (NoExterior !== undefined) negocio.NoExterior = NoExterior;
        if (NoInterior !== undefined) negocio.NoInterior = NoInterior;
        if (Colonia !== undefined) negocio.Colonia = Colonia;
        if (Municipio !== undefined) negocio.Municipio = Municipio;
        if (EstadoProv !== undefined) negocio.EstadoProv = EstadoProv;
        if (CodigoPostal !== undefined) negocio.CodigoPostal = CodigoPostal;

        if (CertificadoCerName !== undefined) negocio.CertificadoCerName = CertificadoCerName;
        if (CertificadoCerBase64 !== undefined) negocio.CertificadoCerBase64 = CertificadoCerBase64;
        if (LlaveKeyName !== undefined) negocio.LlaveKeyName = LlaveKeyName;
        if (LlaveKeyBase64 !== undefined) negocio.LlaveKeyBase64 = LlaveKeyBase64;
        if (PasswordCSD !== undefined) negocio.PasswordCSD = PasswordCSD;
        if (FacturapiApiKey !== undefined) negocio.FacturapiApiKey = FacturapiApiKey.trim();

        await negocio.save();
        res.json({ success: true, message: 'Configuración fiscal y Facturapi guardadas exitosamente', negocio });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

router.post('/business', auth(['Administrador', 'Jefe']), updateBusinessHandler);
router.post('/negocio', auth(['Administrador', 'Jefe']), updateBusinessHandler);

// POST /api/business/test-facturapi - Probar validez de API Key de Facturapi
router.post('/business/test-facturapi', auth(['Administrador', 'Jefe']), async (req, res) => {
    try {
        const { apiKey } = req.body;
        const keyToTest = apiKey ? apiKey.trim() : (process.env.FACTURAPI_KEY || '');
        if (!keyToTest) {
            return res.status(400).json({ success: false, message: 'No se proporcionó ninguna clave de Facturapi' });
        }

        const Facturapi = require('facturapi').default || require('facturapi');
        const facturapi = new Facturapi(keyToTest);
        
        // Consultar organizaciones para verificar credenciales
        const orgs = await facturapi.organizations.list({ limit: 1 });
        const isLive = keyToTest.startsWith('sk_live');

        return res.json({
            success: true,
            isLive,
            modo: isLive ? 'Producción Oficial (SAT)' : 'Pruebas (Sandbox)',
            message: `¡Conexión exitosa con Facturapi en modo ${isLive ? 'Producción Oficial' : 'Pruebas Sandbox'}!`,
            organizationsCount: orgs?.data?.length || 0
        });
    } catch (err) {
        console.error('Error probando Facturapi:', err.message);
        return res.status(400).json({ 
            success: false, 
            message: 'Error al conectar con Facturapi: ' + (err.message || 'Clave no válida')
        });
    }
});

// GET /api/backup/export - Exportar todas las colecciones en formato JSON (Solo Administrador / Jefe)
router.get('/backup/export', auth(['Administrador', 'Jefe']), async (req, res) => {
    try {
        const Cotizacion = require('../models/Cotizacion');
        const Factura = require('../models/Factura');
        const Servicio = require('../models/Servicio');

        const [
            productos,
            ventas,
            compras,
            clientes,
            proveedores,
            usuarios,
            negocios,
            counters,
            cotizaciones,
            facturas,
            servicios
        ] = await Promise.all([
            Producto.find(),
            Venta.find(),
            Compra.find(),
            Cliente.find(),
            Proveedor.find(),
            Usuario.find().select('-Clave'), // Excluir contraseñas por seguridad
            Negocio.find(),
            Counter.find(),
            Cotizacion.find(),
            Factura.find(),
            Servicio.find()
        ]);

        const backupData = {
            metadata: {
                sistema: 'Comercial Agrícola Mares Cervantes',
                fechaExportacion: new Date().toISOString(),
                generadoPor: req.user.nombre || req.user.usuario,
                version: '2.0.5',
                conteos: {
                    productos: productos.length,
                    ventas: ventas.length,
                    compras: compras.length,
                    clientes: clientes.length,
                    proveedores: proveedores.length,
                    usuarios: usuarios.length,
                    cotizaciones: cotizaciones.length,
                    facturas: facturas.length,
                    servicios: servicios.length
                }
            },
            data: {
                productos,
                ventas,
                compras,
                clientes,
                proveedores,
                usuarios,
                negocios,
                counters,
                cotizaciones,
                facturas,
                servicios
            }
        };

        const filename = `backup_mares_cervantes_${new Date().toISOString().slice(0, 10)}.json`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');
        return res.json(backupData);
    } catch (error) {
        console.error('Error al generar respaldo:', error);
        return res.status(500).json({ success: false, message: 'Error al exportar respaldo: ' + error.message });
    }
});

// POST /api/backup/import - Restaurar base de datos a partir de un archivo JSON (Solo Administrador / Jefe)
router.post('/backup/import', auth(['Administrador', 'Jefe']), async (req, res) => {
    try {
        const Cotizacion = require('../models/Cotizacion');
        const Factura = require('../models/Factura');
        const Servicio = require('../models/Servicio');

        const { backup } = req.body;
        if (!backup || !backup.data) {
            return res.status(400).json({ success: false, message: 'Formato de archivo de respaldo inválido.' });
        }

        const { productos, ventas, compras, clientes, proveedores, counters, cotizaciones, facturas, servicios } = backup.data;

        if (Array.isArray(productos) && productos.length > 0) {
            await Producto.deleteMany({});
            await Producto.insertMany(productos);
        }

        if (Array.isArray(clientes) && clientes.length > 0) {
            await Cliente.deleteMany({});
            await Cliente.insertMany(clientes);
        }

        if (Array.isArray(proveedores) && proveedores.length > 0) {
            await Proveedor.deleteMany({});
            await Proveedor.insertMany(proveedores);
        }

        if (Array.isArray(ventas) && ventas.length > 0) {
            await Venta.deleteMany({});
            await Venta.insertMany(ventas);
        }

        if (Array.isArray(compras) && compras.length > 0) {
            await Compra.deleteMany({});
            await Compra.insertMany(compras);
        }

        if (Array.isArray(counters) && counters.length > 0) {
            await Counter.deleteMany({});
            await Counter.insertMany(counters);
        }

        if (Array.isArray(cotizaciones) && cotizaciones.length > 0) {
            await Cotizacion.deleteMany({});
            await Cotizacion.insertMany(cotizaciones);
        }

        if (Array.isArray(facturas) && facturas.length > 0) {
            await Factura.deleteMany({});
            await Factura.insertMany(facturas);
        }

        if (Array.isArray(servicios) && servicios.length > 0) {
            await Servicio.deleteMany({});
            await Servicio.insertMany(servicios);
        }

        return res.json({
            success: true,
            message: 'Base de datos restaurada exitosamente desde el archivo de respaldo.',
            restaurados: {
                productos: productos?.length || 0,
                ventas: ventas?.length || 0,
                compras: compras?.length || 0,
                clientes: clientes?.length || 0,
                proveedores: proveedores?.length || 0,
                cotizaciones: cotizaciones?.length || 0,
                facturas: facturas?.length || 0,
                servicios: servicios?.length || 0
            }
        });
    } catch (error) {
        console.error('Error al restaurar respaldo:', error);
        return res.status(500).json({ success: false, message: 'Error al restaurar respaldo: ' + error.message });
    }
});

module.exports = router;
