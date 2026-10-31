import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

// Enlace automático con Electron para eliminar IP, URL y fechas de impresión en el .exe
if (window.electron && typeof window.electron.print === 'function') {
  window.print = () => {
    window.electron.print();
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
