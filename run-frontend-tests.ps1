# PowerShell 前端测试运行器（自动启动服务器版本）
Write-Host "Running Frontend Tests with Auto-Start Server..." -ForegroundColor Green

Write-Host "`n=== Testing Frontend Pages ===" -ForegroundColor Cyan
& "node" "tests/test-frontend-pages-with-server.mjs"
$frontendExitCode = $LASTEXITCODE

Write-Host "`n=== Testing Admin Pages ===" -ForegroundColor Cyan
& "node" "tests/test-admin-pages-with-server.mjs"
$adminExitCode = $LASTEXITCODE

Write-Host "`n=== Testing Interactive Features ===" -ForegroundColor Cyan
& "node" "tests/test-frontend-interactive-with-server.mjs"
$interactiveExitCode = $LASTEXITCODE

# 综合结果
Write-Host "`n=== Test Summary ===" -ForegroundColor Yellow
if ($frontendExitCode -eq 0 -and $adminExitCode -eq 0 -and $interactiveExitCode -eq 0) {
  Write-Host "✅ All frontend tests passed!" -ForegroundColor Green
} else {
  Write-Host "❌ Some frontend tests failed!" -ForegroundColor Red
  exit 1
}
