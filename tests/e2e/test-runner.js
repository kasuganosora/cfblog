#!/usr/bin/env node

/**
 * E2E Test Runner
 * 自动启动服务器并运行所有E2E测试
 */

const { spawn } = require('child_process');
const ServerCheck = require('../helpers/server-check');

console.log('🎬 CFBlog E2E Test Runner');
console.log('==============================\n');

let serverCheck = null;

async function main() {
  // 步骤 1: 确保服务器运行
  console.log('[步骤 1/3] 检查并启动服务器...\n');
  
  serverCheck = new ServerCheck();
  
  try {
    await serverCheck.ensureServer();
  } catch (error) {
    console.error('\n❌ 服务器启动失败:', error.message);
    console.error('请检查:');
    console.error('  1. 确保端口 8787 未被占用');
    console.error('  2. 检查 test-results/server-logs/ 目录下的日志文件');
    console.error('  3. 尝试手动运行: npm run dev\n');
    process.exit(1);
  }

  console.log('\n[步骤 2/3] 运行 E2E 测试...\n');

  // 步骤 2: 运行 Playwright 测试
  try {
    const testProcess = spawn('npx', ['playwright', 'test', 'tests/e2e/specs'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true
    });

    await new Promise((resolve, reject) => {
      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      testProcess.on('error', (error) => {
        reject(error);
      });
    });

    console.log('\n✅ 所有测试通过！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    
    // 步骤 3: 停止服务器
    console.log('\n[步骤 3/3] 停止服务器...');
    await serverCheck.stopServer();
    
    process.exit(1);
  }

  // 步骤 3: 停止服务器
  console.log('\n[步骤 3/3] 停止服务器...');
  await serverCheck.stopServer();
  
  console.log('\n✅ 测试完成！');
}

// 处理 Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n\n正在停止测试...');
  if (serverCheck) {
    await serverCheck.stopServer();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (serverCheck) {
    await serverCheck.stopServer();
  }
  process.exit(0);
});

main().catch(error => {
  console.error('测试运行器错误:', error);
  if (serverCheck) {
    serverCheck.stopServer().catch(() => {});
  }
  process.exit(1);
});
