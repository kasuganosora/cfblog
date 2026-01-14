@echo off
chcp 65001 >nul
REM Cloudflare Blog Dev Environment Stop Script (Windows)
REM Stop background development server

echo === Stop Cloudflare Blog Development Server ===
echo.

set stopped=0

REM Method 1: Find and kill process using port 8787
echo Finding process using port 8787...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8787') do (
    echo Found process PID: %%a
    taskkill /PID %%a /F >nul 2>nul
    if %errorlevel% equ 0 (
        echo [SUCCESS] Killed process PID: %%a
        set stopped=1
    ) else (
        echo [ERROR] Failed to kill process PID: %%a
    )
)

REM Method 2: Find and kill node process (fallback method)
if %stopped% equ 0 (
    echo.
    echo Trying to find node process...
    for /f "tokens=2" %%a in ('tasklist ^| findstr node') do (
        echo Found node process PID: %%a
        taskkill /PID %%a /F >nul 2>nul
        if %errorlevel% equ 0 (
            echo [SUCCESS] Killed node process PID: %%a
            set stopped=1
        )
    )
)

REM Method 3: Find and kill wrangler process
if %stopped% equ 0 (
    echo.
    echo Trying to find wrangler process...
    for /f "tokens=2" %%a in ('tasklist ^| findstr wrangler') do (
        echo Found wrangler process PID: %%a
        taskkill /PID %%a /F >nul 2>nul
        if %errorlevel% equ 0 (
            echo [SUCCESS] Killed wrangler process PID: %%a
            set stopped=1
        )
    )
)

echo.
if %stopped% equ 1 (
    echo [SUCCESS] Development server stopped
    echo.
    echo Verifying port is released:
    netstat -ano | findstr :8787
    if %errorlevel% equ 1 (
        echo [SUCCESS] Port 8787 is released
    ) else (
        echo [WARNING] Port 8787 may still be in use
    )
) else (
    echo [INFO] No running development server found
)

echo.
echo Press any key to exit...
pause >nul