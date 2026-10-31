@echo off
title Comercial Agricola Mares Cervantes - Docker
color 0A
echo.
echo ====================================================
echo   COMERCIAL AGRICOLA MARES CERVANTES (DOCKER)
echo ====================================================
echo.
echo [1/3] Iniciando contenedores (MongoDB y Aplicacion)...
docker compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudieron iniciar los contenedores.
    echo Asegurate de que Docker Desktop este abierto y ejecutandose.
    pause
    exit /b 1
)

echo [2/3] Esperando que los servicios esten listos...
timeout /t 5 /nobreak >nul

echo [3/3] Abriendo aplicacion en el navegador...
start http://localhost:3000

echo.
echo ====================================================
echo   Aplicacion lista en: http://localhost:3000
echo   Usuario: admin
echo   Contrasena: admin123
echo ====================================================
echo.
echo Para detener la aplicacion, ejecuta DETENER_DOCKER.bat
echo.
pause
