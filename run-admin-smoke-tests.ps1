# 运行管理后台冒烟测试（关键功能）
# 使用方法: .\run-admin-smoke-tests.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "管理后台冒烟测试（关键功能）" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置环境变量
if (-not $env:BASE_URL) {
    $env:BASE_URL = "http://localhost:8787"
}

if (-not $env:ADMIN_USERNAME) {
    $env:ADMIN_USERNAME = "admin"
}

if (-not $env:ADMIN_PASSWORD) {
    $env:ADMIN_PASSWORD = "admin123"
}

Write-Host "BASE_URL: $env:BASE_URL" -ForegroundColor Green
Write-Host ""

# 运行冒烟测试（只测试关键功能）
Write-Host "开始运行冒烟测试..." -ForegroundColor Cyan
Write-Host ""

$tests = @(
    "管理后台 - 登录功能",
    "管理后台 - 仪表板",
    "管理后台 - 文章管理",
    "管理后台 - API 功能"
)

foreach ($testGroup in $tests) {
    Write-Host "运行测试组: $testGroup" -ForegroundColor Yellow
    npx playwright test tests/e2e/admin-complete.spec.js -g "$testGroup" --reporter=list
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ 测试组失败: $testGroup" -ForegroundColor Red
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "冒烟测试失败！" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "所有冒烟测试通过！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
