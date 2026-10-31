@echo off
title Modo Produccion - Comercial Agricola Mares Cervantes
color 0A

echo ====================================================
echo   CAMBIANDO A MODO PRODUCCION (MONGODB ATLAS)
echo ====================================================
echo.

(
echo PORT=3000
echo MONGODB_URI=mongodb+srv://laraemmanuel872_db_user:PU2pgRtBdUFNQqMe@cluster0.b0qvf0w.mongodb.net/comercial_agricola_db?retryWrites=true^&w=majority^&appName=Cluster0
echo JWT_SECRET=ares_secret_key_2024
echo NODE_ENV=production
) > "%~dp0.env"

echo [OK] El sistema ahora esta en MODO PRODUCCION.
echo      Base de datos: MongoDB Atlas (Nube)
echo.
echo Para iniciar el sistema ejecuta: INICIAR.bat
echo ====================================================
pause
