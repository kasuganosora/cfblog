$ErrorActionPreference = "Continue"

Write-Host "Running Frontend Tests..." -ForegroundColor Green

try {
  $output = & cmd /c "execute-node.bat tests/test-frontend-pages.mjs 2>&1"
  Write-Host $output
  $exitCode = $LASTEXITCODE

  Write-Host "`n=== Test Summary ===" -ForegroundColor Yellow
  if ($exitCode -eq 0) {
    Write-Host "✅ Frontend tests passed!" -ForegroundColor Green
  } else {
    Write-Host "❌ Frontend tests failed!" -ForegroundColor Red
  }
} catch {
  Write-Host "Error: $_" -ForegroundColor Red
}
