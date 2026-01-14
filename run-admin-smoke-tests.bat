@echo off
REM 运行管理后台冒烟测试（关键功能）
REM 使用方法: run-admin-smoke-tests.bat

echo ========================================
echo 管理后台冒烟测试（关键功能）
echo ========================================
echo.

REM 检查开发服务器是否在运行
echo 检查开发服务器状态...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8787' -Method GET -UseBasicParsing -TimeoutSec 5; Write-Host '✓ 开发服务器正在运行 (http://localhost:8787)' -ForegroundColor Green } catch { Write-Host '✗ 开发服务器未运行，请先启动开发服务器' -ForegroundColor Red; Write-Host '  运行: start-dev.bat 或 npx wrangler dev' -ForegroundColor Yellow; exit 1 }"

if %ERRORLEVEL% neq 0 (
    exit /b %ERRORLEVEL%
)

echo.

REM 确保数据库已初始化
echo 检查数据库状态...
npx wrangler d1 migrations apply blog --local --persist-to=.wrangler/state --yes

echo.

REM 运行冒烟测试（只测试关键功能）
echo 开始运行冒烟测试...
echo.

REM 登录功能测试
echo 运行测试组: 管理后台 - 登录功能
npx playwright test tests/e2e/admin-complete.spec.js -g "管理后台 - 登录功能" --config=playwright.config.no-server.js --reporter=list
if %ERRORLEVEL% neq 0 (
    echo ✗ 测试组失败: 管理后台 - 登录功能
    goto :error
)
echo.

REM 仪表板测试
echo 运行测试组: 管理后台 - 仪表板
npx playwright test tests/e2e/admin-complete.spec.js -g "管理后台 - 仪表板" --config=playwright.config.no-server.js --reporter=list
if %ERRORLEVEL% neq 0 (
    echo ✗ 测试组失败: 管理后台 - 仪表板
    goto :error
)
echo.

REM 文章管理测试
echo 运行测试组: 管理后台 - 文章管理
npx playwright test tests/e2e/admin-complete.spec.js -g "管理后台 - 文章管理" --config=playwright.config.no-server.js --reporter=list
if %ERRORLEVEL% neq 0 (
    echo ✗ 测试组失败: 管理后台 - 文章管理
    goto :error
)
echo.

REM API 功能测试
echo 运行测试组: 管理后台 - API 功能
npx playwright test tests/e2e/admin-complete.spec.js -g "管理后台 - API 功能" --config=playwright.config.no-server.js --reporter=list
if %ERRORLEVEL% neq 0 (
    echo ✗ 测试组失败: 管理后台 - API 功能
    goto :error
)
echo.

echo ========================================
echo 所有冒烟测试通过！
echo ========================================
goto :end

:error
echo.
echo ========================================
echo 冒烟测试失败！
echo ========================================
echo.
echo 查看 HTML 报告: npx playwright show-report
exit /b 1

:end
exit /b 0
