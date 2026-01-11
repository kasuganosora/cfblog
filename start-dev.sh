#!/bin/bash

# Cloudflare Blog 开发环境启动脚本

echo "=== Cloudflare Blog 开发环境启动 ==="
echo

# 检查 wrangler 是否已安装
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler 未安装，请先安装："
    echo "npm install -g wrangler"
    exit 1
fi

# 检查是否已登录 Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "❌ 未登录 Cloudflare，请先登录："
    echo "wrangler login"
    exit 1
fi

echo "✅ 环境检查通过"
echo

# 检查 D1 数据库是否已创建
if [ -z "$(wrangler d1 list | grep cfblog-database)" ]; then
    echo "🔧 创建 D1 数据库..."
    wrangler d1 create cfblog-database
    
    echo "⚠️  请将返回的 database_id 更新到 wrangler.toml 文件中"
    echo "然后再次运行此脚本"
    exit 1
else
    echo "✅ D1 数据库已存在"
fi

# 检查 R2 存储桶是否已创建
if [ -z "$(wrangler r2 bucket list | grep cfblog-storage)" ]; then
    echo "🔧 创建 R2 存储桶..."
    wrangler r2 bucket create cfblog-storage
    echo "✅ R2 存储桶已创建"
else
    echo "✅ R2 存储桶已存在"
fi

# 检查 KV 命名空间是否已创建
if ! grep -q 'id = "[^"]*"' wrangler.toml; then
    echo "🔧 创建 KV 命名空间..."
    wrangler kv:namespace create "CACHE"
    echo "⚠️  请将返回的 id 更新到 wrangler.toml 文件中"
    echo "然后再次运行此脚本"
    exit 1
else
    echo "✅ KV 命名空间已存在"
fi

# 应用数据库迁移
echo "🔧 应用数据库迁移..."
wrangler d1 migrations apply cfblog-database --local
echo "✅ 数据库迁移完成"

echo
echo "🚀 启动开发服务器..."
echo "博客前台: http://localhost:8787"
echo "管理后台: http://localhost:8787/admin"
echo
echo "按 Ctrl+C 停止服务器"
echo

npm run dev