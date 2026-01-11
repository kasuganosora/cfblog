# PowerShell 测试运行器
Write-Host "Running tests..." -ForegroundColor Green

# 运行响应测试
Write-Host "`n=== Running Response Tests ===" -ForegroundColor Cyan
& "node" "tests/test-response-standalone.mjs"

# 运行认证测试
Write-Host "`n=== Running Auth Tests ===" -ForegroundColor Cyan
& "node" "tests/test-auth-standalone.mjs"

Write-Host "`n=== All Tests Complete ===" -ForegroundColor Green
