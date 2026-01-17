import { test, expect } from '@playwright/test';

test.describe('服务器连接测试', () => {

  test('应该能访问首页', async ({ page }) => {
    console.log('正在访问首页...');
    const response = await page.goto('http://localhost:8787/');
    console.log('响应状态:', response.status());
    expect(response.status()).toBeLessThan(500);
  });

  test('baseURL 应该正确配置', async ({ page }) => {
    console.log('当前 baseURL:', page.context().options().baseURL);
    const response = await page.goto('/');
    console.log('响应状态:', response.status());
    expect(response.status()).toBeLessThan(500);
  });

});
