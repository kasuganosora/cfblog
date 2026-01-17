import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home-page';
import testData from '../../fixtures/test-data';

test.describe('响应式设计测试', () => {
  let homePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
  });

  test('移动端布局应该正确', async ({ page }) => {
    await page.setViewportSize(testData.viewport.mobile);
    await homePage.goto();
    
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-navigation"]')).not.toBeVisible();
    
    const postCards = await page.locator('[data-testid="post-card"]').all();
    expect(postCards.length).toBeGreaterThan(0);
  });

  test('桌面端布局应该正确', async ({ page }) => {
    await page.setViewportSize(testData.viewport.desktop);
    await homePage.goto();
    
    await expect(page.locator('[data-testid="desktop-navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu-button"]')).not.toBeVisible();
  });
});
