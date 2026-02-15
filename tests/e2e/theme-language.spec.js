import { test, expect } from '@playwright/test';

test.describe('主题和语言切换', () => {
  test('主题切换生效', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="theme-switcher"]');

    // Click theme switcher
    await page.click('[data-testid="theme-switcher"]');

    // Check localStorage and body attribute
    const theme = await page.evaluate(() => localStorage.getItem('userTheme'));
    expect(theme).toBe('dark');

    const bodyTheme = await page.getAttribute('body', 'data-theme');
    expect(bodyTheme).toBe('dark');
  });

  test('主题切换可以循环', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="theme-switcher"]');

    // Click twice to cycle back
    await page.click('[data-testid="theme-switcher"]');
    await page.click('[data-testid="theme-switcher"]');

    const theme = await page.evaluate(() => localStorage.getItem('userTheme'));
    expect(theme).toBe('default');
  });

  test('语言切换生效', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="language-switcher"]');

    // Click language switcher
    await page.click('[data-testid="language-switcher"]');

    const lang = await page.evaluate(() => localStorage.getItem('userLanguage'));
    expect(lang).toBe('en-us');

    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('en-us');
  });

  test('主题在重载后保持', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="theme-switcher"]');

    // Set dark theme
    await page.click('[data-testid="theme-switcher"]');

    // Reload
    await page.reload();

    // localStorage should still have dark
    const theme = await page.evaluate(() => localStorage.getItem('userTheme'));
    expect(theme).toBe('dark');
  });

  test('移动端显示菜单按钮', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(menuButton).toBeVisible();

    // Desktop nav should be hidden
    const desktopNav = page.locator('[data-testid="desktop-navigation"]');
    await expect(desktopNav).not.toBeVisible();
  });
});
