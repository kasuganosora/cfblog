import { test, expect } from '@playwright/test';

test.describe('简单功能测试', () => {

  test('首页应该能够访问', async ({ page }) => {
    const response = await page.goto('http://localhost:8787/');
    expect(response.status()).toBe(200);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    const title = await page.title();
    console.log('页面标题:', title);
  });

  test('登录页面应该能够访问', async ({ page }) => {
    const response = await page.goto('http://localhost:8787/login');
    expect(response.status()).toBeLessThan(500);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查是否有登录表单
    const hasForm = await page.locator('form').count();
    console.log('表单数量:', hasForm);
  });

});
