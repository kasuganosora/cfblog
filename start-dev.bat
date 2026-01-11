@echo off
REM Cloudflare Blog 开发环境启动脚本 (Windows)

echo === Cloudflare Blog 开发环境启动 ===
echo.

REM 检查 wrangler 是否已安装
where wrangler >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Wrangler 未安装，请先安装：
    echo npm install -g wrangler
    exit /b 1
)

REM 检查是否已登录 Cloudflare
wrangler whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未登录 Cloudflare，请先登录：
    echo wrangler login
    exit /b 1
)

echo ✅ 环境检查通过
echo.

REM 应用数据库迁移
echo 🔧 应用数据库迁移...
wrangler d1 migrations apply cfblog-database --local
echo ✅ 数据库迁移完成

echo.
echo 🚀 启动开发服务器...
echo 博客前台: http://localhost:8787
echo 管理后台: http://localhost:8787/admin
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm run dev