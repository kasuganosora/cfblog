@echo off
cd /d d:\code\cfblog

echo Checking server...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8787' -UseBasicParsing -TimeoutSec 2; Write-Host 'Server running: ' $response.StatusCode } catch { Write-Host 'Server not running'; exit 1 }"

echo.
echo Running Playwright tests...
call npx playwright test --project=chromium --reporter=list 2>&1

echo.
echo Test completed.
pause
