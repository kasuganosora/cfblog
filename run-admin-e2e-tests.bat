@echo off
REM 运行管理后台完整 E2E 测试套件
REM 使用方法: run-admin-e2e-tests.bat

echo ========================================
echo 管理后台完整 E2E 测试套件
echo ========================================
echo.

REM 设置默认环境变量
if "%BASE_URL%"=="" (
    echo 未设置 BASE_URL 环境变量，使用默认值: http://localhost:8787
    set BASE_URL=http://localhost:8787
) else (
    echo BASE_URL: %BASE_URL%
)

if "%ADMIN_USERNAME%"=="" (
    echo 未设置 ADMIN_USERNAME 环境变量，使用默认值: admin
    set ADMIN_USERNAME=admin
) else (
    echo ADMIN_USERNAME: %ADMIN_USERNAME%
)

if "%ADMIN_PASSWORD%"=="" (
    echo 未设置 ADMIN_PASSWORD 环境变量，使用默认值: admin123
    set ADMIN_PASSWORD=admin123
) else (
    echo ADMIN_PASSWORD: [已设置]
)

echo.

REM 检查开发服务器是否在运行
echo 检查开发服务器状态...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%BASE_URL%' -Method GET -UseBasicParsing -TimeoutSec 5; Write-Host '✓ 开发服务器正在运行 (%BASE_URL%)' -ForegroundColor Green } catch { Write-Host '✗ 开发服务器未运行，请先启动开发服务器' -ForegroundColor Red; Write-Host '  运行: start-dev.bat 或 npx wrangler dev' -ForegroundColor Yellow; exit 1 }"

if %ERRORLEVEL% neq 0 (
    exit /b %ERRORLEVEL%
)

echo.

REM 运行测试
echo 开始运行管理后台 E2E 测试...
echo.

npx playwright test tests/e2e/admin-complete.spec.js --reporter=list

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo 所有测试通过！
    echo ========================================
) else (
    echo.
    echo ========================================
    echo 部分测试失败，请查看详细报告
    echo ========================================
    echo.
    echo 查看 HTML 报告: npx playwright show-report
)

exit /b %ERRORLEVEL%
