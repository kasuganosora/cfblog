# 运行管理后台完整 E2E 测试套件
# 使用方法: .\run-admin-e2e-tests.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "管理后台完整 E2E 测试套件" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否设置了环境变量
if (-not $env:BASE_URL) {
    Write-Host "未设置 BASE_URL 环境变量，使用默认值: http://localhost:8787" -ForegroundColor Yellow
    $env:BASE_URL = "http://localhost:8787"
} else {
    Write-Host "BASE_URL: $env:BASE_URL" -ForegroundColor Green
}

if (-not $env:ADMIN_USERNAME) {
    Write-Host "未设置 ADMIN_USERNAME 环境变量，使用默认值: admin" -ForegroundColor Yellow
    $env:ADMIN_USERNAME = "admin"
} else {
    Write-Host "ADMIN_USERNAME: $env:ADMIN_USERNAME" -ForegroundColor Green
}

if (-not $env:ADMIN_PASSWORD) {
    Write-Host "未设置 ADMIN_PASSWORD 环境变量，使用默认值: admin123" -ForegroundColor Yellow
    $env:ADMIN_PASSWORD = "admin123"
} else {
    Write-Host "ADMIN_PASSWORD: [已设置]" -ForegroundColor Green
}

Write-Host ""

# 检查开发服务器是否在运行
Write-Host "检查开发服务器状态..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$env:BASE_URL" -Method GET -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ 开发服务器正在运行 ($env:BASE_URL)" -ForegroundColor Green
} catch {
    Write-Host "✗ 开发服务器未运行，请先启动开发服务器" -ForegroundColor Red
    Write-Host "  运行: .\start-dev.bat 或 npx wrangler dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 运行测试
Write-Host "开始运行管理后台 E2E 测试..." -ForegroundColor Cyan
Write-Host ""

# 运行完整的 admin-complete.spec.js 测试文件
npx playwright test tests/e2e/admin-complete.spec.js --reporter=list

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "所有测试通过！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "部分测试失败，请查看详细报告" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "查看 HTML 报告: npx playwright show-report" -ForegroundColor Yellow
    exit $LASTEXITCODE
}
