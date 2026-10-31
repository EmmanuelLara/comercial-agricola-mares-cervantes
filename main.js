const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { exec, spawn, fork } = require('child_process');
const net = require('net');
const http = require('http');
const fs = require('fs');
require('dotenv').config();

let mainWindow;

// Manejador de impresión limpio (sin encabezados, pies de página ni IP/URL)
ipcMain.on('print-document', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        win.webContents.print({
            silent: false,
            printBackground: true,
            margins: {
                marginType: 'none'
            }
        }, (success, failureReason) => {
            if (!success && failureReason !== 'cancelled') {
                console.error('Error al imprimir:', failureReason);
            }
        });
    }
});

// ─────────────────────────────────────────────────────────────
// Verifica si MongoDB está corriendo
// ─────────────────────────────────────────────────────────────
function isMongoRunning() {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(400);
        socket
            .connect(27017, '127.0.0.1', () => {
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

// ─────────────────────────────────────────────────────────────
// Verifica si Express está respondiendo
// ─────────────────────────────────────────────────────────────
function isServerListening() {
    return new Promise((resolve) => {
        const req = http.get('http://127.0.0.1:3000', (res) => {
            resolve(res.statusCode >= 200 && res.statusCode < 500);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(500, () => {
            req.destroy();
            resolve(false);
        });
    });
}

// ─────────────────────────────────────────────────────────────
// Inicia MongoDB si no está corriendo
// ─────────────────────────────────────────────────────────────
async function startMongoDB() {
    try {
        const { startMongo } = require('./utils/startMongo');
        return await startMongo();
    } catch (e) {
        return false;
    }
}

let serverProcess;

// ─────────────────────────────────────────────────────────────
// Inicia el servidor Express directamente en el proceso
// ─────────────────────────────────────────────────────────────
async function startServer() {
    const isUp = await isServerListening();
    if (isUp) return true;

    try {
        require('./app.js');
    } catch (err) {
        console.error('Error iniciando Express internamente:', err);
    }

    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 200));
        if (await isServerListening()) return true;
    }
    return false;
}

// ─────────────────────────────────────────────────────────────
// Crea la ventana principal
// ─────────────────────────────────────────────────────────────
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 840,
        minWidth: 980,
        minHeight: 600,
        title: 'Comercial Agrícola Mares Cervantes',
        icon: path.join(__dirname, 'public', 'favicon.svg'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadURL('http://127.0.0.1:3000');

    mainWindow.webContents.on('did-fail-load', () => {
        setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.loadURL('http://127.0.0.1:3000');
            }
        }, 1000);
    });

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12' && input.type === 'keyDown') {
            mainWindow.webContents.toggleDevTools();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ─────────────────────────────────────────────────────────────
// Ciclo de vida
// ─────────────────────────────────────────────────────────────
app.on('ready', async () => {
    try {
        await startMongoDB();
        await startServer();
        createWindow();
    } catch (err) {
        console.error(err);
        createWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});

app.on('will-quit', () => {
    if (serverProcess) {
        try { serverProcess.kill(); } catch (e) {}
    }
});
