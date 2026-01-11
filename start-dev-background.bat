@echo off
echo 启动 Cloudflare Blog 开发服务器...
echo 请保持此窗口打开，开发服务器将一直运行
echo.
echo 访问地址:
echo - 前台: http://localhost:8787
echo - 后台: http://localhost:8787/admin
echo - 登录账号: admin / admin123
echo.
echo 按任意键启动开发服务器...
pause > nul

cd /d "%~dp0"
start "Cloudflare Blog Dev Server" cmd /k "npm run dev"

echo.
echo 开发服务器已在新窗口中启动
echo 现在可以在另一个窗口运行: npm run test:all
pause