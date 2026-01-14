@echo off
chcp 65001 >nul
REM Cloudflare Blog Dev Environment Restart Script (Windows)
REM Stop and restart development server

echo === Restart Cloudflare Blog Development Server ===
echo.

REM First stop server
echo Stopping existing server...
call stop-dev.bat

echo.
echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo.
echo Starting new server...
call start-dev-background.bat

echo.
echo Press any key to exit...
pause >nul