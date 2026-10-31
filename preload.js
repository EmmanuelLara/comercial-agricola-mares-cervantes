const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura a la aplicación web (React)
contextBridge.exposeInMainWorld('electron', {
    print: () => ipcRenderer.send('print-document')
});
