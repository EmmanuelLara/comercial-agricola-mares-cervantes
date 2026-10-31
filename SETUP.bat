@echo off
title Setup - Comercial Agricola Mares Cervantes
color 0B
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   SETUP - COMERCIAL AGRICOLA MARES CERVANTES    ║
echo  ║   Instalacion inicial del sistema               ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  Este script realizara lo siguiente:
echo   [1] Verificar Node.js
echo   [2] Instalar dependencias del backend
echo   [3] Instalar dependencias del frontend
echo   [4] Crear el directorio de datos de MongoDB (D:\data\db)
echo   [5] Crear usuario administrador inicial
echo.
echo  Presiona cualquier tecla para continuar o Ctrl+C para cancelar...
pause >nul

:: ── PASO 1: Verificar Node.js ──────────────────────────────────
echo.
echo [PASO 1/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js no esta instalado.
    echo  Descargalo desde: https://nodejs.org  (version LTS recomendada)
    echo.
    start https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODEVER=%%v
echo  OK - Node.js %NODEVER% encontrado.

:: ── PASO 2: Backend dependencies ──────────────────────────────
echo.
echo [PASO 2/5] Instalando dependencias del backend...
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
    echo  ERROR: Fallo la instalacion de dependencias del backend.
    pause
    exit /b 1
)
echo  OK - Dependencias del backend instaladas.

:: ── PASO 3: Frontend dependencies ─────────────────────────────
echo.
echo [PASO 3/5] Instalando dependencias del frontend...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo  ERROR: Fallo la instalacion de dependencias del frontend.
    pause
    exit /b 1
)

echo.
echo  Compilando el frontend (React/Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo  ERROR: Fallo la compilacion del frontend.
    pause
    exit /b 1
)
echo  OK - Frontend compilado correctamente.
cd /d "%~dp0"

:: ── PASO 4: Preparar Base de Datos ───────────────────────────
echo.
echo [PASO 4/5] Verificando Base de Datos (Local o Nube Atlas)...
node "%~dp0utils\startMongo.js"

:: ── PASO 5: Crear usuario admin ────────────────────────────────
echo.
echo [PASO 5/5] Creando usuario administrador inicial...
node crear_admin.js
if %errorlevel% == 0 (
    echo  OK - Usuario admin creado/verificado exitosamente.
) else (
    echo  AVISO: No se pudo conectar a la base de datos para crear el admin.
    echo  Verifica tu conexion a internet o tu configuracion en .env
)

:: ── FIN ────────────────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║            SETUP COMPLETADO                     ║
echo  ╠══════════════════════════════════════════════════╣
echo  ║  Para usar la aplicacion:                       ║
echo  ║    Doble click en:  INICIAR.bat                 ║
echo  ║                                                 ║
echo  ║  Credenciales de acceso:                        ║
echo  ║    Usuario:  admin                              ║
echo  ║    Clave:    admin123                           ║
echo  ╚══════════════════════════════════════════════════╝
echo.
pause
