@echo off
REM 运行管理后台冒烟测试（关键功能）
REM 使用方法: run-admin-smoke-tests.bat

echo ========================================
echo 管理后台冒烟测试（关键功能）
echo ========================================
echo.

REM 设置环境变量
if "%BASE_URL%"=="" set BASE_URL=http://localhost:8787
if "%ADMIN_USERNAME%"=="" set ADMIN_USERNAME=admin
if "%ADMIN_PASSWORD%"=="" set ADMIN_PASSWORD=admin123

echo BASE_URL: %BASE_URL%
echo.

REM 运行冒烟测试（只测试关键功能）
echo 开始运行冒烟测试...
echo.

REM 登录功能测试
echo 运行测试组: 管理后台 - 登录功能
npx playwright test tests/e2e/admin-complete.spec.js -g "管理后台 - 登录功能" --reporter=list
if %ERRORLEVEL% neq 0 (
    echo ✗ 测试组失败: 管理后台 - 登录功能
    goto :error
)
echo.

REM 仪表板测试
echo 运行测试组: 管理后台 - 仪表板
npx playwright test tests/e2e/admin-complete.spec.js -g "管理后台 - 仪表板" --reporter=list
if %ERRORLEVEL% neq 0 (
    echo ✗ 测试组失败: 管理后台 - 仪表板
    goto :error
)
echo.

REM 文章管理测试
echo 运行测试组: 管理后台 - 文章管理
npx playwright test tests/e2e/admin-complete.spec.js -g "管理后台 - 文章管理" --reporter=list
if %ERRORLEVEL% neq 0 (
    echo ✗ 测试组失败: 管理后台 - 文章管理
    goto :error
)
echo.

REM API 功能测试
echo 运行测试组: 管理后台 - API 功能
npx playwright test tests/e2e/admin-complete.spec.js -g "管理后台 - API 功能" --reporter=list
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
