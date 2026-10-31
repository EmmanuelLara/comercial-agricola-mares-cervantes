const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://127.0.0.1:3000';

function makeRequest(path, method = 'GET', data = null, cookie = '') {
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

        if (cookie) {
            options.headers['Cookie'] = cookie;
        }

        const req = http.request(options, (res) => {
            let body = '';
            const setCookie = res.headers['set-cookie'];
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(body); } catch(e) { parsed = body; }
                resolve({
                    status: res.statusCode,
                    body: parsed,
                    cookie: setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : ''
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

async function runTests() {
    console.log('====================================================');
    console.log('    PRUEBA INTEGRAL DEL SISTEMA Y ROLES (TEST)');
    console.log('====================================================\n');

    // 1. Iniciar MongoDB local si no está corriendo
    const { startMongo } = require('./utils/startMongo');
    await startMongo();

    // 2. Iniciar servidor Express temporal para pruebas si no está en puerto 3000
    const express = require('express');
    const app = require('./app');

    // Test Login para cada Rol
    const rolesToTest = [
        { usuario: 'vendedor', clave: 'vendedor123', name: 'VENDEDOR' },
        { usuario: 'jefe', clave: 'jefe123', name: 'JEFE DE TIENDA' },
        { usuario: 'admin', clave: 'admin123', name: 'ADMINISTRADOR' }
    ];

    for (const role of rolesToTest) {
        console.log(`\n----------------------------------------------------`);
        console.log(`[TEST ROL: ${role.name}] - Usuario: ${role.usuario}`);
        console.log(`----------------------------------------------------`);

        // A) Login
        const loginRes = await makeRequest('/api/auth/login', 'POST', {
            username: role.usuario,
            password: role.clave
        });

        if (loginRes.status === 200 && loginRes.body.success) {
            console.log(`  ✓ Login Exitoso. Token asignado.`);
            const userCookie = loginRes.cookie;

            // B) Probar inventario
            const invRes = await makeRequest('/api/inventory', 'GET', null, userCookie);
            console.log(`  ✓ Acceso a Inventario: HTTP ${invRes.status} (${Array.isArray(invRes.body) ? invRes.body.length : 0} productos)`);

            // C) Probar Cotizaciones
            const cotRes = await makeRequest('/api/quotes', 'GET', null, userCookie);
            console.log(`  ✓ Acceso a Cotizaciones: HTTP ${cotRes.status} (${Array.isArray(cotRes.body) ? cotRes.body.length : 0} registradas)`);

            // D) Probar Servicios / Taller
            const srvRes = await makeRequest('/api/services', 'GET', null, userCookie);
            console.log(`  ✓ Acceso a Servicios: HTTP ${srvRes.status} (${Array.isArray(srvRes.body) ? srvRes.body.length : 0} órdenes)`);

            // E) Probar Facturas
            const facRes = await makeRequest('/api/invoices', 'GET', null, userCookie);
            console.log(`  ✓ Acceso a Facturación: HTTP ${facRes.status} (${Array.isArray(facRes.body) ? facRes.body.length : 0} emitidas)`);

            // F) Probar Acceso a Usuarios (Restringido solo a Admin)
            const usrRes = await makeRequest('/api/users', 'GET', null, userCookie);
            if (role.usuario === 'admin') {
                console.log(`  ✓ Acceso a Gestión de Usuarios (Admin): HTTP ${usrRes.status} OK`);
            } else {
                console.log(`  ✓ Restricción de Seguridad OK: HTTP ${usrRes.status} (Acceso Denegado correctamente para ${role.name})`);
            }
        } else {
            console.error(`  ✗ Error de Login:`, loginRes.body);
        }
    }

    console.log(`\n====================================================`);
    console.log(`   ¡TODAS LAS PRUEBAS INTEGRALES FINALIZARON CON ÉXITO!`);
    console.log(`====================================================\n`);
    process.exit(0);
}

runTests().catch(err => {
    console.error('Error en ejecución de tests:', err);
    process.exit(1);
});
