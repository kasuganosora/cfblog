#!/bin/bash

# Cloudflare Blog 开发环境重启脚本
# 停止并重新启动开发服务器

echo "=== 重启 Cloudflare Blog 开发服务器 ==="
echo

# 先停止服务器
echo "停止现有服务器..."
./stop-dev.sh

echo
echo "等待 3 秒..."
sleep 3

echo
echo "启动新服务器..."
./start-dev-background.sh

echo
read -p "按回车键退出..."