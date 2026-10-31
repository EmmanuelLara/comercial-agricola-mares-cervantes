const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

const { startMongo } = require('./utils/startMongo');

// Connect to Database (auto-inicia MongoDB si es local y conecta)
(async () => {
    try {
        await startMongo();
    } catch (e) {
        console.warn('[MongoDB] Verificacion de inicio:', e.message);
    }
    await connectDB();
})();

const cookieParser = require('cookie-parser');
const auth = require('./middleware/auth');

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// CORS configurado para permitir acceso desde cualquier dispositivo en cualquier red (LAN, Wi-Fi, Nube)
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(cookieParser());

// Set View Engine (Keeping for compatibility during migration)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/inventory', auth(), require('./routes/productRoutes'));
app.use('/api/suppliers', auth(), require('./routes/supplierRoutes'));
app.use('/api/sales', auth(), require('./routes/salesRoutes'));
app.use('/api/purchases', auth(), require('./routes/purchaseRoutes'));
app.use('/api/clients', auth(), require('./routes/clientRoutes'));
app.use('/api/quotes', auth(), require('./routes/cotizacionRoutes'));
app.use('/api/invoices', auth(), require('./routes/facturaRoutes'));
app.use('/api/facturas', auth(), require('./routes/facturaRoutes'));
app.use('/api/services', auth(), require('./routes/servicioRoutes'));
app.use('/api/salidas', auth(), require('./routes/salidaRoutes'));
app.use('/api/personal', auth(), require('./routes/personalRoutes'));
app.use('/api/users', auth(['Administrador']), require('./routes/userRoutes'));
app.use('/api', auth(), require('./routes/apiRoutes'));

// Serve React Frontend (debe ir DESPUÉS de las rutas API)
const distPath = path.join(__dirname, 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

const os = require('os');
function getNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push({ name, ip: iface.address });
            }
        }
    }
    return addresses;
}

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`\n====================================================`);
    console.log(`  COMERCIAL AGRICOLA MARES CERVANTES - SERVIDOR ACTIVO`);
    console.log(`====================================================`);
    console.log(`  > Local:            http://localhost:${PORT}`);
    console.log(`  > En esta maquina:  http://127.0.0.1:${PORT}`);
    const netInterfaces = getNetworkAddresses();
    if (netInterfaces.length > 0) {
        netInterfaces.forEach(net => {
            console.log(`  > En Red (${net.name}): http://${net.ip}:${PORT}`);
        });
    }
    console.log(`====================================================\n`);
    if (process.send) {
        process.send('server-ready');
    }
});
