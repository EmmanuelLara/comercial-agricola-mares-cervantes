@echo off
title Comercial Agricola Mares Cervantes
color 0A

echo ====================================================
echo     COMERCIAL AGRICOLA MARES CERVANTES - v2.1.0
echo ====================================================
echo.

:: 1. Iniciar MongoDB si es necesario
echo [1/3] Verificando Base de Datos MongoDB...
node "%~dp0utils\startMongo.js"
echo       OK - Base de datos lista.

:: 2. Iniciar Servidor Express
echo [2/3] Iniciando Servidor del Sistema...
start /B "Express-API" node "%~dp0app.js"
timeout /t 3 /nobreak >nul

:: Obtener IP de red local
set LOCAL_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4" /c:"Direccion IPv4" /c:"Direccin IPv4"') do (
    if not defined LOCAL_IP set LOCAL_IP=%%a
)
if defined LOCAL_IP set LOCAL_IP=%LOCAL_IP: =%

echo       OK - Servidor conectado.

:: 3. Abrir en Ventana de Aplicacion Independiente
echo [3/3] Abriendo ventana de la aplicacion...
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://127.0.0.1:3000/login --window-size=1280,820
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://127.0.0.1:3000/login --window-size=1280,820
) else (
    start http://127.0.0.1:3000/login
)

echo.
echo ====================================================
echo   SISTEMA ACTIVO Y FUNCIONANDO EN CUALQUIER RED
echo ====================================================
echo.
echo   [+] En esta computadora:
echo       http://localhost:3000
echo.
if defined LOCAL_IP (
    echo   [+] Desde otros dispositivos en tu red (Wi-Fi/LAN):
    echo       http://%LOCAL_IP%:3000
    echo.
)
echo   - Manten esta ventana minimizada mientras trabajes.
echo   - Para detener el sistema, ejecuta DETENER_APP.bat
echo.
echo ====================================================
pause
