import { test, expect } from '@playwright/test';

test.describe('搜索页', () => {
  test('搜索表单可见', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('[data-testid="search-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-button"]')).toBeVisible();
  });

  test('搜索关键词显示结果', async ({ page }) => {
    await page.goto('/search?keyword=Workers');
    // Wait for search results to load
    await page.waitForFunction(() => {
      const el = document.getElementById('results');
      return el && el.children.length > 0;
    }, { timeout: 10000 });

    const results = page.locator('[data-testid="search-results"]');
    await expect(results).not.toBeEmpty();
    // Should contain result items
    await expect(results.locator('.result-item').first()).toBeVisible();
  });

  test('空搜索显示提示', async ({ page }) => {
    await page.goto('/search');
    const results = page.locator('[data-testid="search-results"]');
    // Without a keyword, results area should be empty (no search performed)
    await expect(results).toBeEmpty();
  });

  test('搜索结果链接指向文章', async ({ page }) => {
    await page.goto('/search?keyword=Workers');
    await page.waitForSelector('.result-item', { timeout: 10000 });

    const firstLink = page.locator('.result-item a').first();
    const href = await firstLink.getAttribute('href');
    expect(href).toContain('/post/');
  });
});
