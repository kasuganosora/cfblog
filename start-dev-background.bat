@echo off
chcp 65001 >nul
REM Cloudflare Blog Dev Environment Background Startup Script (Windows)
REM Start development server in background

echo === Cloudflare Blog Dev Environment Background Startup ===
echo Starting development server in background...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed, please install Node.js first
    exit /b 1
)

REM Check if server is already running
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8787') do (
    echo [WARNING] Port 8787 is already in use (PID: %%a)
    echo   If this is an old dev server, please run stop-dev.bat first
    echo   Or manually kill process: taskkill /PID %%a /F
    echo.
    choice /C YN /M "Force kill and restart? (Y/N)"
    if errorlevel 2 (
        echo Startup cancelled
        exit /b 0
    )
    echo Killing process PID: %%a
    taskkill /PID %%a /F >nul 2>nul
    timeout /t 2 /nobreak >nul
)

REM 创建日志目录
if not exist "logs" mkdir logs

REM 获取当前日期时间用于日志文件名
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set currentDate=%%a%%b%%c%%d
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set currentTime=%%a%%b
set logFile=logs\server-%currentDate%-%currentTime%.log

echo Starting development server...
echo Log file: %logFile%
echo.

REM Start development server in background
start "Cloudflare Blog Dev Server" /B cmd /c "node start-dev.js > "%logFile%" 2>&1"

REM Wait for server startup
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

REM Check if server started successfully
curl -s -o nul -w "%%{http_code}" http://localhost:8787 >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Development server started successfully!
    echo.
    echo Access URLs:
    echo   Blog frontend: http://localhost:8787
    echo   Admin panel: http://localhost:8787/admin
    echo   Login credentials: admin / admin123
    echo.
    echo View logs: type "%logFile%"
    echo Stop server: stop-dev.bat
) else (
    echo [ERROR] Server startup failed, please check log file
    echo View errors: type "%logFile%"
    exit /b 1
)