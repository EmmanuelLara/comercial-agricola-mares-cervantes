@echo off
title Comercial Agricola Mares Cervantes
color 0A

:: 1. Iniciar MongoDB si no esta activo
node "%~dp0utils\startMongo.js" >nul 2>&1

:: 2. Iniciar Servidor Express si no esta corriendo
powershell -Command "try { $t=(New-Object Net.Sockets.TcpClient('127.0.0.1',3000)); $t.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    powershell -WindowStyle Hidden -Command "Start-Process node -ArgumentList 'app.js' -WorkingDirectory '%~dp0' -WindowStyle Hidden"
    ping 127.0.0.1 -n 3 >nul
)

:: 3. Abrir en Modo Aplicacion de Escritorio
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://127.0.0.1:3000 --window-size=1280,820
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://127.0.0.1:3000 --window-size=1280,820
) else (
    start http://127.0.0.1:3000
)

exit
