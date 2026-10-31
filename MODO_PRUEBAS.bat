@echo off
title Modo Pruebas - Comercial Agricola Mares Cervantes
color 0E

echo ====================================================
echo   CAMBIANDO A MODO PRUEBAS / DESARROLLO (LOCAL)
echo ====================================================
echo.

(
echo PORT=3000
echo MONGODB_URI=mongodb://127.0.0.1:27017/comercial_agricola_db
echo JWT_SECRET=ares_secret_key_2024
echo NODE_ENV=development
) > "%~dp0.env"

echo [OK] El sistema ahora esta en MODO PRUEBAS.
echo      Base de datos: MongoDB Local (127.0.0.1:27017)
echo.
echo Para iniciar el sistema ejecuta: INICIAR.bat
echo ====================================================
pause
