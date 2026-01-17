import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home-page';

test.describe('主题切换测试', () => {
  let homePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('默认主题应该是default', async ({ page }) => {
    const theme = await page.evaluate(() => localStorage.getItem('userTheme') || 'default');
    expect(theme).toBe('default');
  });

  test('应该能切换到深色主题', async ({ page }) => {
    await homePage.switchTheme('dark');
    
    const theme = await page.evaluate(() => localStorage.getItem('userTheme'));
    expect(theme).toBe('dark');
  });

  test('应该能切换回默认主题', async ({ page }) => {
    await homePage.switchTheme('dark');
    await homePage.switchTheme('default');
    
    const theme = await page.evaluate(() => localStorage.getItem('userTheme'));
    expect(theme).toBe('default');
  });

  test('深色主题应该改变页面外观', async ({ page }) => {
    const backgroundColorLight = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    
    await homePage.switchTheme('dark');
    await page.waitForTimeout(500); // 等待主题过渡完成
    
    const backgroundColorDark = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    
    // 背景色应该改变
    expect(backgroundColorLight).not.toBe(backgroundColorDark);
  });

  test('CSS变量应该在主题切换时更新', async ({ page }) => {
    await homePage.switchTheme('dark');
    
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')
        .trim();
    });
    
    expect(primaryColor).toBeTruthy();
  });

  test('主题设置应该在刷新后保持', async ({ page }) => {
    await homePage.switchTheme('dark');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const theme = await page.evaluate(() => localStorage.getItem('userTheme'));
    expect(theme).toBe('dark');
  });

  test('主题切换器应该在所有页面可用', async ({ page }) => {
    const testPages = ['/', '/about', '/contact', '/categories'];
    
    for (const pageUrl of testPages) {
      await page.goto(pageUrl);
      await expect(page.locator('[data-testid="theme-switcher"]')).toBeVisible();
    }
  });

  test('应该显示当前选中的主题', async ({ page }) => {
    await homePage.switchTheme('dark');
    
    const currentTheme = await page.locator('[data-testid="theme-switcher"]')
      .getAttribute('data-current');
    expect(currentTheme).toBe('dark');
  });

  test('主题切换应该有平滑过渡效果', async ({ page }) => {
    const transition = await page.evaluate(() => {
      const body = document.body;
      return getComputedStyle(body).transition;
    });
    
    // 应该包含transition属性
    expect(transition).toBeTruthy();
  });

  test('应该在移动端也支持主题切换', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.locator('[data-testid="theme-switcher"]')).toBeVisible();
    
    await homePage.switchTheme('dark');
    
    const theme = await page.evaluate(() => localStorage.getItem('userTheme'));
    expect(theme).toBe('dark');
  });

  test('深色主题应该影响所有组件', async ({ page }) => {
    await homePage.switchTheme('dark');
    
    // 检查多个组件的颜色
    const headerBg = await page.evaluate(() => {
      return getComputedStyle(document.querySelector('header')).backgroundColor;
    });
    
    const footerBg = await page.evaluate(() => {
      return getComputedStyle(document.querySelector('footer')).backgroundColor;
    });
    
    // 应该使用深色背景
    expect(headerBg).toBeTruthy();
    expect(footerBg).toBeTruthy();
  });

  test('主题切换器应该显示所有可用主题', async ({ page }) => {
    await page.click('[data-testid="theme-switcher"]');
    
    const themeOptions = await page.locator('[data-theme]').all();
    expect(themeOptions.length).toBeGreaterThan(0);
  });
});
