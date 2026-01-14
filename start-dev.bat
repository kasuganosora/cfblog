@echo off
chcp 65001 >nul
REM Cloudflare Blog Dev Environment Startup Script (Windows)
REM Interactive foreground startup, background version recommended

echo === Cloudflare Blog Dev Environment Startup ===
echo Windows Version - Interactive Foreground Startup
echo.

echo Recommended to use background startup scripts, which can:
echo   1. Run server in background
echo   2. View real-time logs
echo   3. Easily stop and restart
echo.
echo Available scripts:
echo   start-dev-background.bat - Background startup (recommended)
echo   stop-dev.bat             - Stop server
echo   restart-dev.bat          - Restart server
echo.
choice /C YN /M "Continue with interactive foreground startup? (Y/N)"

if errorlevel 2 (
    echo.
    echo Please use: start-dev-background.bat
    timeout /t 3 /nobreak >nul
    exit /b 0
)

echo.
echo Starting interactive development server...
echo Press Ctrl+C to stop server
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed, please install Node.js first
    pause
    exit /b 1
)

REM Run cross-platform startup script
node start-dev.js

REM If script execution fails, show error message
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Startup failed, please check above error messages
    pause
    exit /b %errorlevel%
)