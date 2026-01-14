#!/usr/bin/env node

/**
 * Cloudflare Blog 跨平台开发环境启动脚本
 * 支持 Windows、Linux 和 macOS
 */

import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logInfo(message) {
  log(`ℹ️ ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      cwd: __dirname,
      ...options
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, error };
  }
}

function checkWrangler() {
  logInfo('检查 Wrangler 是否已安装...');
  const result = runCommand('wrangler --version', { silent: true });
  if (!result.success) {
    logError('Wrangler 未安装，请先安装：');
    log('npm install -g wrangler', colors.yellow);
    return false;
  }
  logSuccess('Wrangler 已安装');
  return true;
}

function checkCloudflareLogin() {
  logInfo('检查 Cloudflare 登录状态...');
  const result = runCommand('wrangler whoami', { silent: true });
  if (!result.success) {
    logError('未登录 Cloudflare，请先登录：');
    log('wrangler login', colors.yellow);
    return false;
  }
  logSuccess('Cloudflare 已登录');
  return true;
}

function checkD1Database() {
  logInfo('检查 D1 数据库...');
  const result = runCommand('wrangler d1 list', { silent: true });
  if (result.success && result.result && result.result.includes('cfblog-database')) {
    logSuccess('D1 数据库已存在');
    return true;
  }
  
  logWarning('D1 数据库不存在，正在创建...');
  const createResult = runCommand('wrangler d1 create cfblog-database');
  if (createResult.success) {
    logWarning('请将返回的 database_id 更新到 wrangler.toml 文件中，然后再次运行此脚本');
    return false;
  }
  return false;
}

function checkR2Bucket() {
  logInfo('检查 R2 存储桶...');
  const result = runCommand('wrangler r2 bucket list', { silent: true });
  if (result.success && result.result && result.result.includes('cfblog-storage')) {
    logSuccess('R2 存储桶已存在');
    return true;
  }
  
  logWarning('R2 存储桶不存在，正在创建...');
  const createResult = runCommand('wrangler r2 bucket create cfblog-storage');
  if (createResult.success) {
    logSuccess('R2 存储桶已创建');
    return true;
  }
  return false;
}

function checkKVNamespace() {
  logInfo('检查 KV 命名空间...');
  const wranglerTomlPath = join(__dirname, 'wrangler.toml');
  if (!existsSync(wranglerTomlPath)) {
    logError('wrangler.toml 文件不存在');
    return false;
  }
  
  const wranglerTomlContent = execSync(`type "${wranglerTomlPath}"`, { 
    encoding: 'utf8',
    cwd: __dirname,
    shell: true
  });
  
  if (wranglerTomlContent.includes('id = "') && wranglerTomlContent.includes('CACHE')) {
    logSuccess('KV 命名空间已配置');
    return true;
  }
  
  logWarning('KV 命名空间未配置，正在创建...');
  const createResult = runCommand('wrangler kv:namespace create "CACHE"');
  if (createResult.success) {
    logWarning('请将返回的 id 更新到 wrangler.toml 文件中，然后再次运行此脚本');
    return false;
  }
  return false;
}

function applyMigrations() {
  logInfo('应用数据库迁移...');
  const result = runCommand('wrangler d1 migrations apply cfblog-database --local');
  if (result.success) {
    logSuccess('数据库迁移完成');
    return true;
  }
  logError('数据库迁移失败');
  return false;
}

function startDevServer() {
  log('\n🚀 启动开发服务器...', colors.magenta);
  log('博客前台: http://localhost:8787', colors.blue);
  log('管理后台: http://localhost:8787/admin', colors.blue);
  log('登录账号: admin / admin123', colors.blue);
  log('\n按 Ctrl+C 停止服务器', colors.yellow);
  log('\n');
  
  // 启动开发服务器
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    cwd: __dirname,
    shell: true
  });
  
  // 处理进程退出
  devProcess.on('close', (code) => {
    if (code !== 0) {
      logError(`开发服务器异常退出，代码: ${code}`);
    }
    process.exit(code);
  });
  
  // 处理信号
  process.on('SIGINT', () => {
    logInfo('正在停止开发服务器...');
    devProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    logInfo('正在停止开发服务器...');
    devProcess.kill('SIGTERM');
  });
}

async function main() {
  log('=== Cloudflare Blog 开发环境启动 ===', colors.green);
  log('跨平台版本 - 支持 Windows、Linux、macOS\n', colors.cyan);
  
  // 检查环境
  if (!checkWrangler()) process.exit(1);
  if (!checkCloudflareLogin()) process.exit(1);
  
  // 检查资源（这些检查在本地开发时不是必须的，但会给出提示）
  try {
    checkD1Database();
    checkR2Bucket();
    checkKVNamespace();
  } catch (error) {
    logWarning('资源检查跳过，继续启动开发服务器...');
  }
  
  // 应用迁移
  if (!applyMigrations()) {
    logWarning('数据库迁移失败，但继续启动开发服务器...');
  }
  
  // 启动开发服务器
  startDevServer();
}

// 运行主函数
main().catch((error) => {
  logError(`启动失败: ${error.message}`);
  process.exit(1);
});