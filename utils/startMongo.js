const net = require('net');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function checkPort(port = 27017, host = '127.0.0.1') {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(800);
        socket
            .connect(port, host, () => {
                socket.destroy();
                resolve(true);
            })
            .on('error', () => {
                socket.destroy();
                resolve(false);
            })
            .on('timeout', () => {
                socket.destroy();
                resolve(false);
            });
    });
}

async function startMongo() {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/comercial_agricola_db';
    const isCloud = uri.includes('mongodb+srv://') || (!uri.includes('127.0.0.1') && !uri.includes('localhost'));

    if (isCloud) {
        console.log('MongoDB configurado para conexion remota/nube.');
        return true;
    }

    if (await checkPort(27017, '127.0.0.1')) {
        console.log('MongoDB ya esta en ejecucion en el puerto 27017.');
        return true;
    }

    // Intentar arrancar servicio de Windows
    try {
        execSync('net start MongoDB', { stdio: 'ignore' });
    } catch (e) {}

    if (await checkPort(27017, '127.0.0.1')) {
        console.log('Servicio MongoDB iniciado con exito.');
        return true;
    }

    // Intentar arrancar binario mongod directamente
    const candidates = [
        'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
        'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
        'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
        'C:\\MongoDB\\bin\\mongod.exe'
    ];

    const exe = candidates.find(c => fs.existsSync(c));
    if (!exe) {
        console.warn('No se encontro el ejecutable mongod.exe en las rutas estandar.');
        return false;
    }

    let dbPath = 'D:\\data\\db';
    if (!fs.existsSync(dbPath)) {
        try { fs.mkdirSync(dbPath, { recursive: true }); } catch (e) { dbPath = 'C:\\data\\db'; }
    }
    if (!fs.existsSync(dbPath)) {
        try { fs.mkdirSync(dbPath, { recursive: true }); } catch (e) {
            dbPath = path.join(__dirname, '..', 'data', 'db');
            try { fs.mkdirSync(dbPath, { recursive: true }); } catch (err) {}
        }
    }

    console.log(`Iniciando mongod localmente (${dbPath})...`);
    try {
        const child = spawn(exe, ['--dbpath', dbPath, '--bind_ip_all'], {
            detached: true,
            stdio: 'ignore'
        });
        child.unref();
    } catch (err) {
        console.error('Error al lanzar mongod.exe:', err.message);
        return false;
    }

    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
        if (await checkPort(27017, '127.0.0.1')) {
            console.log('MongoDB conectado y respondiendo en el puerto 27017.');
            return true;
        }
    }

    return false;
}

if (require.main === module) {
    startMongo().then(success => {
        if (success) {
            console.log('Base de datos lista.');
            process.exit(0);
        } else {
            console.warn('No se pudo verificar MongoDB localmente, continuando...');
            process.exit(0);
        }
    });
}

module.exports = { startMongo, checkPort };
