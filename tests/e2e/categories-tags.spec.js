import { test, expect } from '@playwright/test';

test.describe('分类和标签', () => {
  test('分类页面加载', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForSelector('.category-item', { timeout: 10000 });
    const items = page.locator('.category-item');
    expect(await items.count()).toBeGreaterThanOrEqual(1);
  });

  test('分类详情页加载', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForSelector('.category-item', { timeout: 10000 });

    // Click the first category
    const firstLink = page.locator('.category-item a').first();
    await firstLink.click();

    await expect(page).toHaveURL(/\/category\//);
    // Heading should show category name
    const heading = page.locator('h1');
    await expect(heading).toContainText('分类:');
  });

  test('标签页面加载', async ({ page }) => {
    await page.goto('/tags');
    await page.waitForSelector('.tag-cloud a', { timeout: 10000 });
    const tagLinks = page.locator('.tag-cloud a');
    expect(await tagLinks.count()).toBeGreaterThanOrEqual(1);
  });

  test('标签详情页加载', async ({ page }) => {
    await page.goto('/tags');
    await page.waitForSelector('.tag-cloud a', { timeout: 10000 });

    // Click the first tag
    const firstTag = page.locator('.tag-cloud a').first();
    await firstTag.click();

    await expect(page).toHaveURL(/\/tag\//);
    const heading = page.locator('h1');
    await expect(heading).toContainText('标签:');
  });

  test('不存在的页面返回404', async ({ request }) => {
    const response = await request.get('/this-page-does-not-exist-at-all');
    expect(response.status()).toBe(404);
  });
});
