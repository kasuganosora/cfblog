import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  
  // 并发运行测试
  fullyParallel: true,
  
  // CI 环境中失败后重试
  retries: process.env.CI ? 2 : 0,
  
  // 在 CI 中使用报告器
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/e2e-results.json' }]
  ],
  
  // 全局设置
  use: {
    // 基础 URL（从环境变量或默认值）
    baseURL: process.env.BASE_URL || 'http://localhost:8787',
    
    // 收集失败测试的追踪信息
    trace: 'on-first-retry',
    
    // 捕获失败测试的截图
    screenshot: 'only-on-failure',
    
    // 视频记录（仅在失败时）
    video: 'retain-on-failure',
    
    // 超时设置
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 配置不同浏览器
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // 移动设备测试
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 运行测试前启动开发服务器
  webServer: {
    command: './start-dev-server.sh',
    url: 'http://localhost:8787',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 分钟
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
