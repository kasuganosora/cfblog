import { test, expect } from '@playwright/test';
import HomePage from '../pages/home-page';

test.describe('国际化(i18n)测试', () => {
  let homePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('默认语言应该是中文', async ({ page }) => {
    const lang = await page.evaluate(() => localStorage.getItem('userLanguage') || 'zh-cn');
    expect(lang).toBe('zh-cn');
  });

  test('应该能切换到英文', async ({ page }) => {
    await homePage.switchLanguage('en-us');
    
    const lang = await page.evaluate(() => localStorage.getItem('userLanguage'));
    expect(lang).toBe('en-us');
  });

  test('应该能切换回中文', async ({ page }) => {
    await homePage.switchLanguage('en-us');
    await homePage.switchLanguage('zh-cn');
    
    const lang = await page.evaluate(() => localStorage.getItem('userLanguage'));
    expect(lang).toBe('zh-cn');
  });

  test('语言切换后页面内容应该更新', async ({ page }) => {
    const titleBefore = await page.textContent('h1');
    
    await homePage.switchLanguage('en-us');
    const titleAfter = await page.textContent('h1');
    
    // 英文和中文标题应该不同
    expect(titleBefore).not.toBe(titleAfter);
  });

  test('导航菜单应该支持多语言', async ({ page }) => {
    await homePage.switchLanguage('en-us');
    
    const homeLink = page.locator('[data-testid="navigation"] a[href="/"]');
    await expect(homeLink).toBeVisible();
    
    const homeText = await homeLink.textContent();
    expect(homeText.toLowerCase()).toBe('home');
  });

  test('日期格式应该根据语言变化', async ({ page }) => {
    await page.goto('http://localhost:8787/post/getting-started-workers');
    
    const dateZh = await page.textContent('[data-testid="post-date"]');
    
    await page.evaluate(() => localStorage.setItem('userLanguage', 'en-us'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const dateEn = await page.textContent('[data-testid="post-date"]');
    
    expect(dateZh).not.toBe(dateEn);
  });

  test('语言设置应该在刷新后保持', async ({ page }) => {
    await homePage.switchLanguage('en-us');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const lang = await page.evaluate(() => localStorage.getItem('userLanguage'));
    expect(lang).toBe('en-us');
  });

  test('应该支持RTL语言（如果需要）', async ({ page }) => {
    // 测试语言方向
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(['ltr', 'rtl']).toContain(dir);
  });

  test('表单验证消息应该支持多语言', async ({ page }) => {
    await page.goto('http://localhost:8787/login');
    
    // 不填写任何内容直接提交
    await page.click('button[type="submit"]');
    
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toBeTruthy();
    
    // 切换到英文
    await page.evaluate(() => localStorage.setItem('userLanguage', 'en-us'));
    await page.reload();
    
    // 再次提交
    await page.click('button[type="submit"]');
    
    const errorMessageEn = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessageEn).not.toBe(errorMessage);
  });

  test('语言切换器应该在首页可用', async ({ page }) => {
    await homePage.goto();
    await expect(page.locator('[data-testid="language-switcher"]')).toBeVisible();
  });

  test('应该正确显示语言切换器当前选中项', async ({ page }) => {
    await homePage.switchLanguage('en-us');
    
    const currentLang = await page.locator('[data-testid="language-switcher"]').getAttribute('data-current');
    expect(currentLang).toBe('en-us');
  });

  test('404页面应该支持多语言', async ({ page }) => {
    await page.goto('http://localhost:8787/nonexistent-page');
    
    await expect(page.locator('[data-testid="404-message"]')).toBeVisible();
    
    const messageZh = await page.textContent('[data-testid="404-message"]');
    
    await page.evaluate(() => localStorage.setItem('userLanguage', 'en-us'));
    await page.reload();
    
    const messageEn = await page.textContent('[data-testid="404-message"]');
    
    expect(messageZh).not.toBe(messageEn);
  });
});
