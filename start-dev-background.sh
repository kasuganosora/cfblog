#!/bin/bash

# Cloudflare Blog Dev Environment Background Startup Script
# Start development server in background

echo "=== Cloudflare Blog Dev Environment Background Startup ==="
echo "Starting development server in background..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed, please install Node.js first"
    exit 1
fi

# 检查是否已有服务器在运行
if lsof -ti:8787 &> /dev/null; then
    echo "⚠️ 检测到端口 8787 已被占用"
    echo "   PID: $(lsof -ti:8787)"
    echo "   如果这是旧的开发服务器，请先运行 stop-dev.sh"
    echo "   或者手动终止进程: kill -9 $(lsof -ti:8787)"
    echo
    read -p "是否强制终止并重新启动? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "终止进程 PID: $(lsof -ti:8787)"
        kill -9 $(lsof -ti:8787) 2>/dev/null
        sleep 2
    else
        echo "取消启动"
        exit 0
    fi
fi

# 创建日志目录
mkdir -p logs

# 获取当前日期时间用于日志文件名
currentDate=$(date +%Y%m%d)
currentTime=$(date +%H%M)
logFile="logs/server-${currentDate}-${currentTime}.log"

echo "启动开发服务器..."
echo "日志文件: $logFile"
echo

# 启动开发服务器到后台
nohup node start-dev.js > "$logFile" 2>&1 &
SERVER_PID=$!

# 等待服务器启动
echo "等待服务器启动..."
sleep 5

# 检查服务器是否启动成功
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8787 &> /dev/null; then
    echo "✅ 开发服务器启动成功！"
    echo
    echo "访问地址:"
    echo "  博客前台: http://localhost:8787"
    echo "  管理后台: http://localhost:8787/admin"
    echo "  登录账号: admin / admin123"
    echo
    echo "服务器 PID: $SERVER_PID"
    echo "查看日志: tail -f \"$logFile\""
    echo "停止服务器: ./stop-dev.sh"
else
    echo "❌ 服务器启动失败，请检查日志文件"
    echo "查看错误: tail -n 50 \"$logFile\""
    exit 1
fi