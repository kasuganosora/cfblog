#!/bin/bash

# Cloudflare Blog 开发环境停止脚本
# 停止后台运行的开发服务器

echo "=== 停止 Cloudflare Blog 开发服务器 ==="
echo

stopped=0

# 方法1: 查找并终止占用端口8787的进程
echo "查找占用端口 8787 的进程..."
if lsof -ti:8787 &> /dev/null; then
    for pid in $(lsof -ti:8787); do
        echo "找到进程 PID: $pid"
        if kill -9 "$pid" 2>/dev/null; then
            echo "✅ 已终止进程 PID: $pid"
            stopped=1
        else
            echo "❌ 无法终止进程 PID: $pid"
        fi
    done
fi

# 方法2: 查找并终止 node 进程（备用方法）
if [ $stopped -eq 0 ]; then
    echo
    echo "尝试查找 node 进程..."
    if pgrep -f "node.*start-dev" &> /dev/null; then
        for pid in $(pgrep -f "node.*start-dev"); do
            echo "找到 node 进程 PID: $pid"
            if kill -9 "$pid" 2>/dev/null; then
                echo "✅ 已终止 node 进程 PID: $pid"
                stopped=1
            fi
        done
    fi
fi

# 方法3: 查找并终止 wrangler 进程
if [ $stopped -eq 0 ]; then
    echo
    echo "尝试查找 wrangler 进程..."
    if pgrep -f "wrangler" &> /dev/null; then
        for pid in $(pgrep -f "wrangler"); do
            echo "找到 wrangler 进程 PID: $pid"
            if kill -9 "$pid" 2>/dev/null; then
                echo "✅ 已终止 wrangler 进程 PID: $pid"
                stopped=1
            fi
        done
    fi
fi

echo
if [ $stopped -eq 1 ]; then
    echo "✅ 开发服务器已停止"
    echo
    echo "确认端口已释放:"
    if lsof -ti:8787 &> /dev/null; then
        echo "⚠️  端口 8787 可能仍被占用"
        echo "   占用进程: $(lsof -ti:8787)"
    else
        echo "✅ 端口 8787 已释放"
    fi
else
    echo "ℹ️ 未找到运行的开发服务器"
fi

echo
read -p "按回车键退出..."