import { test, expect } from '@playwright/test';

test.describe('快速测试', () => {

  test('首页应该能访问', async ({ page }) => {
    console.log('测试开始: 访问首页');
    console.log('baseURL:', page.context().options().baseURL);
    
    try {
      const response = await page.goto('http://localhost:8787/');
      console.log('响应状态:', response.status());
      console.log('URL:', page.url());
      
      expect(response.status()).toBeLessThan(500);
    } catch (error) {
      console.error('错误:', error.message);
      throw error;
    }
  });

  test('登录页应该能访问', async ({ page }) => {
    console.log('测试开始: 访问登录页');
    
    try {
      const response = await page.goto('http://localhost:8787/login');
      console.log('响应状态:', response.status());
      console.log('URL:', page.url());
      
      expect(response.status()).toBeLessThan(500);
    } catch (error) {
      console.error('错误:', error.message);
      throw error;
    }
  });

});
