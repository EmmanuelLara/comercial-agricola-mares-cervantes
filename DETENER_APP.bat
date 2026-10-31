@echo off
title Detener Comercial Agricola Mares Cervantes
echo Deteniendo servicios de Comercial Agricola...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM mongod.exe >nul 2>&1
echo Servicios detenidos correctamente.
timeout /t 2 >nul
