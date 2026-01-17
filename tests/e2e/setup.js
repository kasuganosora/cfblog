/**
 * E2E Test Setup
 * 测试前置设置和清理
 */

const { CacheManager } = require('../helpers/cache-manager');
const { ServerCheck } = require('../helpers/server-check');

let serverCheck = null;

async function setupTestEnvironment() {
  console.log('🚀 Setting up E2E test environment...\n');
  
  // 1. 清空缓存
  const cacheManager = new CacheManager();
  await cacheManager.clearAllCaches();
  await cacheManager.clearTestData();
  
  // 2. 检查并启动服务器
  serverCheck = new ServerCheck();
  await serverCheck.ensureServer();
  
  console.log('✅ E2E test environment ready!\n');
}

async function teardownTestEnvironment() {
  console.log('🧹 Cleaning up E2E test environment...\n');
  
  if (serverCheck) {
    await serverCheck.stopServer();
  }
  
  console.log('✅ Cleanup complete!\n');
}

module.exports = { setupTestEnvironment, teardownTestEnvironment };
