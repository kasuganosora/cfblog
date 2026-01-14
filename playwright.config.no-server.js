import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  
  // 并发运行测试
  fullyParallel: false,
  
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
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // 配置不同浏览器
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 不启动 webServer，假设服务器已经在运行
  webServer: undefined,
});
