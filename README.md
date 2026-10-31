# 🚜 Comercial Agrícola Mares Cervantes - Sistema de Gestión Integral

Sistema ERP y Punto de Venta completo para refaccionarias agrícolas, talleres mecánicos de maquinaria pesada/tractores y servicios de torno/maquinados.

Incluye control de inventario de refacciones, facturación electrónica SAT CFDI 4.0, libreta digital de trabajos, cuentas por cobrar, reloj checador con cálculo de horas/nómina y control de salidas de lubricantes/aceite.

---

## 🚀 Requisitos Previos

Antes de instalar, asegúrate de tener en tu computadora:

1. **[Node.js](https://nodejs.org/)** (Versión 18 o superior recomendada).
2. **[MongoDB](https://www.mongodb.com/try/download/community)** (Servidor local Community Edition) o una cuenta de **MongoDB Atlas** en la nube.
3. **Git** (Opcional, para clonar el proyecto).

---

## ⚡ Instalación Rápida en Windows (1 Clic)

Si estás en Windows, el proyecto ya incluye scripts automáticos para que no tengas que escribir comandos:

1. **Clona o descarga** este repositorio:
   ```bash
   git clone https://github.com/EmmanuelLara/comercial-agricola-mares-cervantes.git
   ```
2. Entra a la carpeta del proyecto y haz doble clic en:
   * **`SETUP.bat`** (Instala automáticamente las dependencias del backend y frontend).
3. Para abrir y usar el sistema, haz doble clic en:
   * **`INICIAR_APP.bat`** o **`ABRIR_MARES_APP.vbs`**

El sistema abrirá automáticamente el navegador en `http://localhost:3000`.

---

## 🛠️ Instalación Manual (Paso a Paso)

Si prefieres instalarlo desde la terminal o estás en Linux / macOS:

### 1. Clonar el repositorio
```bash
git clone https://github.com/EmmanuelLara/comercial-agricola-mares-cervantes.git
cd comercial-agricola-mares-cervantes
```

### 2. Configurar variables de entorno
Copia la plantilla `.env.example` para crear tu `.env`:
```bash
cp .env.example .env
```
*(En Windows puedes copiar el archivo manualmente y renombrarlo a `.env`)*

Asegúrate de que tu `.env` tenga la conexión a MongoDB:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/comercial_agricola_db
JWT_SECRET=tu_clave_secreta_aqui
NODE_ENV=development
```

### 3. Instalar dependencias
Instala las dependencias del servidor backend:
```bash
npm install
```

Instala y compila el frontend (React + Vite):
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Iniciar el sistema
```bash
npm start
```

Abre tu navegador en: **`http://localhost:3000`**

---

## 🔑 Usuario Inicial y Cuentas de Acceso

Para crear el usuario Administrador inicial por primera vez, corre en la terminal:
```bash
node crear_admin.js
```
o
```bash
node seed_datos.js
```

---

## 📦 Módulos Principales del Sistema

| Módulo | Descripción |
|---|---|
| 📦 **Inventario & Refacciones** | Control de stock, alertas de stock mínimo, kardex de movimientos, códigos de barras y analizador con rechazo automático de códigos duplicados. |
| 🛒 **Punto de Venta (Ventas)** | Cobro rápido con escáner USB, ticket de venta con impresora térmica, soporte para efectivo, tarjeta y transferencias SPEI. |
| 🧾 **Facturación SAT CFDI 4.0** | Timbrado fiscal con PAC (Facturapi / SAT), catálogo de claves de producto/unidad y descarga de XML/PDF. |
| 🚜 **Taller & Torno Combinado** | Órdenes de servicio mecánico para tractores con desglose independiente de costos de mano de obra de taller y piezas de maquinado en torno. |
| 📒 **Libreta Digital de Trabajos** | Registro rápido en 3 clics de notas para clientes frecuentes con desglose de refacciones, litros de aceite y mano de obra. |
| 📋 **Historial por Cliente** | Panel deslizable con el historial completo de trabajos, maquinaria conocida y saldo pendiente por cliente. |
| 💰 **Cuentas por Cobrar** | Semáforo de días de vencimiento (7 y 14 días), lista ordenada por antigüedad y cobro directo desde la pantalla. |
| 🕒 **Personal & Reloj Checador** | Registro en vivo de entradas y salidas, cálculo de horas regulares, horas extras y nómina a pagar por trabajador. |
| 🛢️ **Salidas de Almacén** | Control y registro de despachos de aceite a granel e insumos usados en el taller. |

---

## 🐳 Despliegue con Docker (Opcional)

Si utilizas Docker y Docker Compose:
```bash
docker-compose up -d --build
```

---

## 👨‍💻 Autor y Contacto
* **Comercial Agrícola Mares Cervantes**
* Desarrollado por: **Emmanuel Eduardo Lara Mares**
* Repositorio: [https://github.com/EmmanuelLara/comercial-agricola-mares-cervantes](https://github.com/EmmanuelLara/comercial-agricola-mares-cervantes)
