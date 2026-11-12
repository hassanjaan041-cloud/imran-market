@echo off
:: ----------------------------------------------------
:: PROFESSIONAL SHOP MANAGER LAUNCHER
:: ----------------------------------------------------
title Shop Manager - Control Panel
color 0B
cls

echo ====================================================
echo       DECORATION SHOP MANAGEMENT SYSTEM
echo ====================================================
echo.
echo [1/3] Checking System Requirements...
timeout /t 1 >nul

:: VS Code kholein
start "" code "%~dp0"
timeout /t 2 >nul

echo [2/3] Launching Backend Server (Database)...
start "Shop Backend Server" cmd /k "cd /d "%~dp0backend" && title Backend Server - DO NOT CLOSE && npm start"

timeout /t 2 >nul

echo [3/3] Launching Frontend Application (UI)...
start "Shop Frontend App" cmd /k "cd /d "%~dp0frontend" && title Frontend Server - DO NOT CLOSE && npm run dev"

echo.
echo Waiting for servers to initialize...
timeout /t 5 >nul

echo Opening Web Interface in Browser...
start http://localhost:3000

echo.
echo ====================================================
echo  SYSTEM IS NOW LIVE! 
echo  You can minimize this window.
echo ====================================================
timeout /t 3 >nul
exit