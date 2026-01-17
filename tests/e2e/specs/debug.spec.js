import { test, expect } from '@playwright/test';

test.describe('调试测试', () => {

  test('检查页面结构', async ({ page }) => {
    const response = await page.goto('/');
    console.log('Response status:', response.status());
    console.log('Response url:', response.url());

    // 检查页面标题
    const title = await page.title();
    console.log('Page title:', title);

    // 检查页面内容
    const bodyText = await page.body();
    console.log('Body length:', bodyText.length);
    console.log('Has header:', bodyText.includes('<header>'));
    console.log('Has nav:', bodyText.includes('<nav>'));
    console.log('Has main:', bodyText.includes('<main>'));
    console.log('Has footer:', bodyText.includes('<footer>'));

    // 检查是否有 data-testid
    console.log('Has data-testid:', bodyText.includes('data-testid='));

    // 截图
    await page.screenshot({ path: 'test-results/debug-home.png' });
  });

  test('检查登录页结构', async ({ page }) => {
    const response = await page.goto('/login');
    console.log('Response status:', response.status());

    const bodyText = await page.body();
    console.log('Has form:', bodyText.includes('<form'));
    console.log('Has input:', bodyText.includes('<input'));
    console.log('Has button:', bodyText.includes('<button'));
  });

  test('检查选择器', async ({ page }) => {
    await page.goto('/');

    // 尝试查找元素
    console.log('Looking for h1...');
    const h1 = await page.locator('h1').count();
    console.log('Found h1:', h1);

    console.log('Looking for header...');
    const header = await page.locator('header').count();
    console.log('Found header:', header);

    console.log('Looking for nav...');
    const nav = await page.locator('nav').count();
    console.log('Found nav:', nav);

    console.log('Looking for main...');
    const main = await page.locator('main').count();
    console.log('Found main:', main);

    console.log('Looking for footer...');
    const footer = await page.locator('footer').count();
    console.log('Found footer:', footer);
  });

});
