# PowerShell E2E 测试运行脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   E2E 测试运行器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安装" -ForegroundColor Red
    exit 1
}

# 检查 Playwright 是否安装
try {
    $playwrightVersion = npx playwright --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Playwright 已安装" -ForegroundColor Green
    } else {
        throw "Not installed"
    }
} catch {
    Write-Host "⚠️  Playwright 未安装，正在安装..." -ForegroundColor Yellow
    npm install --save-dev @playwright/test
    npx playwright install
    Write-Host "✅ Playwright 安装完成" -ForegroundColor Green
}

Write-Host ""
Write-Host "选择运行模式:" -ForegroundColor Cyan
Write-Host "1. 运行所有测试 (Chromium, Firefox, Safari)"
Write-Host "2. 仅 Chromium 测试"
Write-Host "3. 仅 Firefox 测试"
Write-Host "4. 仅 Safari (WebKit) 测试"
Write-Host "5. 调试模式 (显示浏览器)"
Write-Host "6. 查看测试报告"
Write-Host "7. 运行特定测试文件"
Write-Host ""

$choice = Read-Host "请输入选项 (1-7)"

Write-Host ""
Write-Host "开始运行测试..." -ForegroundColor Green
Write-Host ""

switch ($choice) {
    "1" {
        Write-Host "运行所有浏览器测试..." -ForegroundColor Cyan
        npx playwright test
    }
    "2" {
        Write-Host "运行 Chromium 测试..." -ForegroundColor Cyan
        npx playwright test --project=chromium
    }
    "3" {
        Write-Host "运行 Firefox 测试..." -ForegroundColor Cyan
        npx playwright test --project=firefox
    }
    "4" {
        Write-Host "运行 Safari (WebKit) 测试..." -ForegroundColor Cyan
        npx playwright test --project=webkit
    }
    "5" {
        Write-Host "运行调试模式..." -ForegroundColor Cyan
        npx playwright test --debug
    }
    "6" {
        Write-Host "打开测试报告..." -ForegroundColor Cyan
        npx playwright show-report
    }
    "7" {
        Write-Host "可用测试文件:" -ForegroundColor Cyan
        Write-Host "  - guest-flow.spec.js (访客流程)"
        Write-Host "  - admin-flow.spec.js (管理员流程)"
        Write-Host "  - interaction-flow.spec.js (交互功能)"
        Write-Host ""
        $testFile = Read-Host "请输入测试文件名称"
        Write-Host ""
        Write-Host "运行 $testFile..." -ForegroundColor Cyan
        npx playwright test $testFile
    }
    default {
        Write-Host "❌ 无效选项" -ForegroundColor Red
        exit 1
    }
}

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ 测试完成!" -ForegroundColor Green
    Write-Host ""
    Write-Host "查看详细报告: npx playwright show-report" -ForegroundColor Cyan
} else {
    Write-Host "❌ 测试失败，退出码: $exitCode" -ForegroundColor Red
    Write-Host ""
    Write-Host "查看失败原因: npx playwright show-report" -ForegroundColor Cyan
}
