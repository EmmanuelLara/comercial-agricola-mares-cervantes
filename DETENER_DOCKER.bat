@echo off
title Detener Comercial Agricola Mares Cervantes
color 0C
echo.
echo ====================================================
echo   DETENIENDO CONTENEDORES DE DOCKER...
echo ====================================================
echo.
docker compose down
echo.
echo Contenedores detenidos correctamente. Los datos de la base de datos se conservan.
echo.
pause
