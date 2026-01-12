# Simple E2E test runner
Write-Host "Starting E2E tests..." -ForegroundColor Cyan
Set-Location d:\code\cfblog

# Check if server is running
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:8787' -UseBasicParsing -TimeoutSec 2
    Write-Host "✓ Server is running (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Server is not running. Please start it first." -ForegroundColor Red
    exit 1
}

# Run tests
Write-Host "Running Chromium tests..." -ForegroundColor Cyan
& npx playwright test --project=chromium

Write-Host "Test completed." -ForegroundColor Cyan
