$ErrorActionPreference = "Continue"
Write-Host "Running Frontend Tests..." -ForegroundColor Green

try {
  & "node" "tests/test-frontend-pages.mjs"
  $exitCode = $LASTEXITCODE

  Write-Host "`n=== Test Summary ===" -ForegroundColor Yellow
  if ($exitCode -eq 0) {
    Write-Host "Frontend tests passed!" -ForegroundColor Green
  } else {
    Write-Host "Frontend tests failed!" -ForegroundColor Red
    exit 1
  }
} catch {
  Write-Host "Error: $_" -ForegroundColor Red
  exit 1
}
