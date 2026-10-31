const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://127.0.0.1:3000';

function request(path, method = 'GET', data = null, token = '') {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
            options.headers['Cookie'] = `token=${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(body);
                } catch(e) {
                    parsed = body;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ [PASS] ${message}`);
        passed++;
    } else {
        console.error(`  ✗ [FAIL] ${message}`);
        failed++;
    }
}

async function runFullSuite() {
    console.log('================================================================');
    console.log('   PRUEBA INTEGRAL COMPLETA DE FUNCIONALIDAD Y COMPATIBILIDAD   ');
    console.log('   Comercial Agrícola Mares Cervantes - Sistema ERP / POS       ');
    console.log('================================================================\n');

    // 1. Iniciar MongoDB y Servidor Express
    const { startMongo } = require('./utils/startMongo');
    await startMongo();
    require('./app');

    // Esperar a que el servidor esté listo
    await new Promise(r => setTimeout(r, 1000));

    // ─────────────────────────────────────────────────────────────
    // MÓDULO 1: AUTENTICACIÓN Y ROLES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 1. Pruebas de Autenticación y Control de Roles ---');
    
    // 1.1 Login Inválido
    const badLogin = await request('/api/auth/login', 'POST', { username: 'baduser', password: 'wrongpassword' });
    assert(badLogin.status === 401, 'Login con credenciales incorrectas es rechazado con 401');

    // 1.2 Login Admin
    const adminLogin = await request('/api/auth/login', 'POST', { username: 'admin', password: 'admin123' });
    assert(adminLogin.status === 200 && adminLogin.body.token, 'Login de Administrador exitoso y entrega JWT');
    const adminToken = adminLogin.body.token;

    // 1.3 Login Vendedor
    const vendLogin = await request('/api/auth/login', 'POST', { username: 'vendedor', password: 'vendedor123' });
    assert(vendLogin.status === 200 && vendLogin.body.token, 'Login de Vendedor exitoso y entrega JWT');
    const vendToken = vendLogin.body.token;

    // 1.4 Verificación de sesión /api/auth/me
    const meRes = await request('/api/auth/me', 'GET', null, adminToken);
    assert(meRes.status === 200 && meRes.body.user.usuario === 'admin', 'Endpoint de verificación de sesión (/me) activo');

    // ─────────────────────────────────────────────────────────────
    // MÓDULO 2: CLIENTES Y CRÉDITO
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 2. Pruebas del Módulo de Clientes ---');
    
    const clientPayload = {
        NombreCompleto: 'Rancho San José de Prueba',
        RFC: 'RSJ850101XYZ',
        RazonSocial: 'Rancho San José S.P.R. de R.L.',
        RegimenFiscal: '601 - General de Ley Personas Morales',
        UsoCFDI: 'G03 - Gastos en general',
        CodigoPostal: '36700',
        Calle: 'Carretera Panamericana Km 12',
        Num_Ext: 'S/N',
        Colonia: 'Centro',
        Municipio: 'Salamanca',
        EstadoGeografico: 'Guanajuato',
        Telefono: '4641234567',
        Correo: 'contacto@ranchosanjose.test',
        Total_Deuda: 1500
    };

    const newClientRes = await request('/api/clients', 'POST', clientPayload, adminToken);
    assert(newClientRes.status === 201 && newClientRes.body.cliente._id, 'Creación de cliente con campos fiscales completa');
    const testClientId = newClientRes.body.cliente._id;

    // Actualización de cliente
    const updateClientRes = await request(`/api/clients/${testClientId}`, 'PUT', {
        ...clientPayload,
        Telefono: '4649876543',
        Total_Deuda: 2000
    }, adminToken);
    assert(updateClientRes.status === 200 && updateClientRes.body.cliente.Total_Deuda === 2000, 'Actualización de cliente y saldo de crédito OK');

    // Importación masiva de clientes (Bulk)
    const bulkClientsRes = await request('/api/clients/bulk', 'POST', {
        clientes: [
            { NombreCompleto: 'Agrícola El Molino', RFC: 'AMO900101AA1', Telefono: '4640001111', Total_Deuda: 500 },
            { NombreCompleto: 'Agropecuaria El Sauz', RFC: 'ASA920202BB2', Telefono: '4640002222', Total_Deuda: 0 }
        ]
    }, adminToken);
    assert(bulkClientsRes.status === 200 && bulkClientsRes.body.success, 'Importación masiva (Bulk) de clientes completada');

    // ─────────────────────────────────────────────────────────────
    // MÓDULO 3: PROVEEDORES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 3. Pruebas del Módulo de Proveedores ---');
    
    const provPayload = {
        RazonSocial: 'Distribuidora de Refacciones Agrícolas SA',
        RFC: 'DRA950505ABC',
        Contacto: 'Ing. Carlos Mendoza',
        Correo: 'carlos@distribuidora.test',
        Telefono: '4615554321',
        Ciudad: 'Celaya',
        Estado_Prov: 'Guanajuato'
    };

    const newProvRes = await request('/api/suppliers', 'POST', provPayload, adminToken);
    assert(newProvRes.status === 201 && newProvRes.body.proveedor._id, 'Registro de proveedor exitoso');
    const testProvId = newProvRes.body.proveedor._id;

    // ─────────────────────────────────────────────────────────────
    // MÓDULO 4: INVENTARIO, REFACCIONES Y KARDEX
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 4. Pruebas de Inventario y Kardex ---');
    
    const prodPayload = {
        Nombre: 'Filtro de Aceite Donaldson P550008 Test',
        Codigo_Barras: 'TEST-BARCODE-999',
        Stock: 20,
        Precio_Compra: 180,
        Precio_venta: 290,
        Ubicacion_Estanteria: 'E-04'
    };

    const newProdRes = await request('/api/inventory', 'POST', prodPayload, adminToken);
    assert(newProdRes.status === 201 && newProdRes.body.producto._id, 'Creación de producto nuevo en inventario');
    const testProdId = newProdRes.body.producto._id;

    // Auto-merge al insertar producto duplicado por código de barras
    const mergeProdRes = await request('/api/inventory', 'POST', {
        Codigo_Barras: 'TEST-BARCODE-999',
        Stock: 10,
        Precio_venta: 300
    }, adminToken);
    assert(mergeProdRes.status === 200 && mergeProdRes.body.producto.Stock === 30, 'Auto-merge de stock en inventario (20 + 10 = 30)');

    // Kardex de producto
    const kardexRes = await request(`/api/inventory/${testProdId}/kardex`, 'GET', null, adminToken);
    assert(kardexRes.status === 200 && kardexRes.body.success, 'Consulta de Kardex / Trazabilidad de producto OK');

    // ─────────────────────────────────────────────────────────────
    // MÓDULO 5: COMPRAS / REABASTECIMIENTO
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 5. Pruebas del Módulo de Compras ---');
    
    const purchasePayload = {
        Id_Proveedor: testProvId,
        Tipodedocumento: 'Factura Compra',
        MontoTotal: 1800,
        Detalles: [
            {
                Id_Producto: testProdId,
                Stock: 10,
                Precio_Compra: 180,
                Precio_venta: 300,
                MontoTotal: 1800
            }
        ]
    };

    const newPurchaseRes = await request('/api/purchases', 'POST', purchasePayload, adminToken);
    assert(newPurchaseRes.status === 201 && newPurchaseRes.body.compra._id, 'Registro de compra con actualización automática de stock');
    const testPurchaseId = newPurchaseRes.body.compra._id;

    // Verificar que el stock subió a 40 (30 + 10)
    const checkStockAfterBuy = await request('/api/inventory', 'GET', null, adminToken);
    const updatedProdAfterBuy = checkStockAfterBuy.body.find(p => p._id === testProdId);
    assert(updatedProdAfterBuy && updatedProdAfterBuy.Stock === 40, 'Stock incrementado correctamente tras compra (40 unidades)');

    // ─────────────────────────────────────────────────────────────
    // MÓDULO 6: VENTAS / POS MOSTRADOR
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 6. Pruebas del Módulo de Ventas (Punto de Venta) ---');
    
    // 6.1 Intento de vender más del stock disponible -> Error 400
    const overSale = await request('/api/sales', 'POST', {
        Nombre_Cliente: 'Comprador Test',
        Tipodedocumento: 'Ticket',
        MontoTotal: 30000,
        Detalles: [{ Id_Producto: testProdId, Cantidad: 100, Precio_Venta: 300, MontoTotal: 30000 }]
    }, adminToken);
    assert(overSale.status === 400, 'Validación de stock insuficiente rechaza venta excesiva con 400');

    // 6.2 Venta exitosa de 5 piezas
    const salePayload = {
        Id_Cliente: testClientId,
        Nombre_Cliente: 'Rancho San José de Prueba',
        Tipodedocumento: 'Ticket',
        MetodoPago: 'Efectivo',
        Subtotal: 1500,
        Descuento: 0,
        MontoTotal: 1500,
        MontoPago: 2000,
        MontoCambio: 500,
        Detalles: [
            {
                Id_Producto: testProdId,
                Cantidad: 5,
                Precio_Venta: 300,
                MontoTotal: 1500
            }
        ]
    };

    const newSaleRes = await request('/api/sales', 'POST', salePayload, adminToken);
    assert(newSaleRes.status === 201 && newSaleRes.body.venta._id, 'Venta en mostrador registrada y stock descontado');
    const testSaleId = newSaleRes.body.venta._id;

    // Verificar que el stock bajó a 35 (40 - 5)
    const checkStockAfterSale = await request('/api/inventory', 'GET', null, adminToken);
    const updatedProdAfterSale = checkStockAfterSale.body.find(p => p._id === testProdId);
    assert(updatedProdAfterSale && updatedProdAfterSale.Stock === 35, 'Stock reducido correctamente tras venta (35 unidades)');

    // ─────────────────────────────────────────────────────────────
    // MÓDULO 7: COTIZACIONES
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 7. Pruebas de Cotizaciones y Conversión ---');
    
    const quotePayload = {
        Nombre_Cliente: 'Rancho San José de Prueba',
        Telefono_Cliente: '4641234567',
        Email_Cliente: 'contacto@ranchosanjose.test',
        Subtotal: 600,
        Descuento: 0,
        IVA: 96,
        AplicarIVA: true,
        MontoTotal: 696,
        VigenciaDias: 15,
        Notas: 'Cotización para mantenimiento preventivo',
        Detalles: [
            {
                Id_Producto: testProdId,
                Descripcion: 'Filtro Donaldson Test',
                Cantidad: 2,
                PrecioUnitario: 300,
                Subtotal: 600
            }
        ]
    };

    const newQuoteRes = await request('/api/quotes', 'POST', quotePayload, adminToken);
    assert(newQuoteRes.status === 201 && newQuoteRes.body.cotizacion._id, 'Registro de cotización formal con IVA desglosado');
    const testQuoteId = newQuoteRes.body.cotizacion._id;

    // Convertir cotización en venta
    const convertQuoteRes = await request(`/api/quotes/${testQuoteId}/convert`, 'POST', {
        MetodoPago: 'Transferencia',
        MontoPago: 696
    }, adminToken);
    assert(convertQuoteRes.status === 200 && convertQuoteRes.body.cotizacion.Estado === 'Convertida', 'Conversión de cotización a venta directa OK');

    // ─────────────────────────────────────────────────────────────
    // MÓDULO 8: TALLER MECÁNICO Y SERVICIOS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 8. Pruebas de Órdenes de Servicio y Taller Mecánico ---');
    
    // Consulta de catálogo de filtros
    const filterLookup = await request('/api/services/filters/lookup?q=John', 'GET', null, adminToken);
    assert(filterLookup.status === 200 && Array.isArray(filterLookup.body), 'Buscador de equivalencias y filtros para maquinaria');

    const servicePayload = {
        Nombre_Cliente: 'Rancho San José de Prueba',
        Telefono_Cliente: '4641234567',
        TipoEquipo: 'Tractor',
        Marca: 'John Deere',
        Modelo: '6110M',
        SeriePlacas: 'JD-6110-2022',
        HorometroKM: '3,450 hrs',
        TipoServicio: 'Servicio Mayor 500 hrs',
        TecnicoResponsable: 'Ing. Taller Principal',
        Prioridad: 'Alta',
        CostoManoDeObra: 1200,
        Descuento: 100,
        Repuestos: [
            {
                Id_Producto: testProdId,
                Codigo: 'TEST-BARCODE-999',
                Nombre: 'Filtro Donaldson P550008',
                Cantidad: 2,
                PrecioUnitario: 300,
                Subtotal: 600
            }
        ],
        DiagnosticoInicial: 'Mantenimiento preventivo general y cambio de lubricantes'
    };

    const newServiceRes = await request('/api/services', 'POST', servicePayload, adminToken);
    assert(newServiceRes.status === 201 && newServiceRes.body.servicio._id, 'Creación de orden de servicio de taller');
    const testServiceId = newServiceRes.body.servicio._id;

    // Actualizar estado a Completado
    const updateServiceRes = await request(`/api/services/${testServiceId}`, 'PUT', {
        Estado: 'Completado',
        TrabajosRealizados: 'Se realizó el cambio de filtros, purga de inyectores y revisión general.'
    }, adminToken);
    assert(updateServiceRes.status === 200 && updateServiceRes.body.servicio.Estado === 'Completado', 'Actualización de estatus técnico del servicio');

    // Entrega y cobro automático
    const deliverServiceRes = await request(`/api/services/${testServiceId}/deliver`, 'POST', {
        MetodoPago: 'Efectivo',
        MontoPago: 1700
    }, adminToken);
    assert(deliverServiceRes.status === 200 && deliverServiceRes.body.servicio.Estado === 'Entregado', 'Entrega de servicio y emisión de ticket de cobro');

    // ─────────────────────────────────────────────────────────────
    // MÓDULO 9: FACTURACIÓN CFDI 4.0 Y TIMBRADO SAT
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 9. Pruebas de Facturación Electrónica SAT (CFDI 4.0) ---');
    
    const invoicePayload = {
        RFC: 'RSJ850101XYZ',
        RazonSocial: 'Rancho San José S.P.R. de R.L.',
        RegimenFiscal: '601 - General de Ley Personas Morales',
        UsoCFDI: 'G03 - Gastos en general',
        CodigoPostal: '36700',
        Email: 'facturacion@ranchosanjose.test',
        FormaPago: '03 - Transferencia electrónica de fondos',
        MetodoPago: 'PUE - Pago en una sola exhibición',
        CondicionesDePago: 'Contado',
        Items: [
            {
                ClaveProdServ: '10151500',
                Descripcion: 'Filtro de Aceite Donaldson P550008',
                Cantidad: 2,
                ClaveUnidad: 'H87',
                Unidad: 'Pieza',
                ValorUnitario: 300,
                Descuento: 0
            }
        ]
    };

    const newInvoiceRes = await request('/api/invoices', 'POST', invoicePayload, adminToken);
    assert(newInvoiceRes.status === 201 && newInvoiceRes.body.factura.FolioFiscalUUID, 'Generación de factura CFDI 4.0 con Timbre Fiscal UUID');
    const testInvoiceId = newInvoiceRes.body.factura._id;
    const testUUID = newInvoiceRes.body.factura.FolioFiscalUUID;

    // Descarga de XML timbrado
    const xmlRes = await request(`/api/invoices/${testInvoiceId}/xml`, 'GET', null, adminToken);
    assert(xmlRes.status === 200 && typeof xmlRes.body === 'string' && xmlRes.body.includes('cfdi:Comprobante'), 'Generación y descarga de archivo XML CFDI 4.0 oficial');

    // Cancelación de factura
    const cancelInvoiceRes = await request(`/api/invoices/${testInvoiceId}/cancel`, 'PUT', {}, adminToken);
    assert(cancelInvoiceRes.status === 200 && cancelInvoiceRes.body.factura.Estado === 'Cancelada', 'Cancelación de factura en el sistema y PAC');

    // ─────────────────────────────────────────────────────────────
    // MÓDULO 10: CONFIGURACIÓN FISCAL, MEMBRETE Y RESPALDOS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 10. Pruebas de Configuración de Negocio y Respaldos ---');
    
    const bizRes = await request('/api/business', 'GET', null, adminToken);
    assert(bizRes.status === 200 && bizRes.body.Nombre, 'Consulta de datos fiscales y membrete del negocio');

    // Exportar respaldo de datos JSON
    const backupRes = await request('/api/backup/export', 'GET', null, adminToken);
    assert(backupRes.status === 200 && backupRes.body.data && backupRes.body.data.productos, 'Generación de copia de seguridad (Backup JSON) de todas las tablas');

    // ─────────────────────────────────────────────────────────────
    // MÓDULO 11: SEGURIDAD, GESTIÓN DE USUARIOS Y PERMISOS
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- 11. Pruebas de Seguridad y Permisos de Usuarios ---');
    
    // Vendedor intenta entrar a /api/users -> Bloqueado con 403
    const forbiddenRes = await request('/api/users', 'GET', null, vendToken);
    assert(forbiddenRes.status === 403, 'Restricción RBAC: Vendedor no tiene acceso a Usuarios (HTTP 403)');

    // Admin crea usuario nuevo
    const testUsername = 'test_operador_' + Date.now();
    const newUserRes = await request('/api/users', 'POST', {
        Nombre_completo: 'Operador de Pruebas',
        Usuario: testUsername,
        Clave: 'clave123',
        Rol: 'Vendedor'
    }, adminToken);
    assert(newUserRes.status === 201 && newUserRes.body.usuario._id, 'Administrador crea nuevo usuario en el sistema');
    const createdUserId = newUserRes.body.usuario._id;

    // Admin elimina usuario de pruebas
    const deleteUserRes = await request(`/api/users/${createdUserId}`, 'DELETE', null, adminToken);
    assert(deleteUserRes.status === 200 && deleteUserRes.body.success, 'Administrador elimina usuario de pruebas');

    // Limpieza de datos temporales
    await request(`/api/clients/${testClientId}`, 'DELETE', null, adminToken);
    await request(`/api/suppliers/${testProvId}`, 'DELETE', null, adminToken);
    await request(`/api/inventory/${testProdId}`, 'DELETE', null, adminToken);
    await request(`/api/sales/${testSaleId}`, 'DELETE', null, adminToken);
    await request(`/api/purchases/${testPurchaseId}`, 'DELETE', null, adminToken);
    await request(`/api/quotes/${testQuoteId}`, 'DELETE', null, adminToken);
    await request(`/api/services/${testServiceId}`, 'DELETE', null, adminToken);

    console.log('\n================================================================');
    console.log(`   RESUMEN DE PRUEBAS DEL SISTEMA:`);
    console.log(`   - Pruebas Pasadas:   ${passed}`);
    console.log(`   - Pruebas Fallidas:  ${failed}`);
    console.log('================================================================\n');

    if (failed === 0) {
        console.log('✓ ¡EL SISTEMA OPERA AL 100% EN FUNCIONALIDAD, SEGURIDAD Y COMPATIBILIDAD!\n');
        process.exit(0);
    } else {
        console.error('✗ Algunas pruebas fallaron.');
        process.exit(1);
    }
}

runFullSuite().catch(err => {
    console.error('Error fatal durante la suite de pruebas:', err);
    process.exit(1);
});
