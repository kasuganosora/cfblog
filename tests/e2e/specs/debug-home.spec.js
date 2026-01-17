import { test, expect } from '@playwright/test';

test.describe('Debug Home Page', () => {
  test('should load homepage and check elements', async ({ page }) => {
    // Go to homepage
    await page.goto('http://localhost:8787/');
    await page.waitForLoadState('networkidle');

    console.log('Page loaded');
    console.log('Title:', await page.title());

    // Check header
    const header = page.locator('[data-testid="header"]');
    console.log('Header visible:', await header.isVisible());

    // Check navigation
    const nav = page.locator('[data-testid="navigation"]');
    console.log('Navigation visible:', await nav.isVisible());

    // Check main content
    const main = page.locator('[data-testid="main"]');
    console.log('Main visible:', await main.isVisible());

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 5000 });
    console.log('Posts loaded');

    // Check post cards
    const posts = page.locator('[data-testid="post-card"]');
    const postCount = await posts.count();
    console.log('Post count:', postCount);
    expect(postCount).toBeGreaterThan(0);

    // Check footer
    const footer = page.locator('[data-testid="footer"]');
    console.log('Footer visible:', await footer.isVisible());
  });

  test('should load categories', async ({ page }) => {
    await page.goto('http://localhost:8787/');
    await page.waitForLoadState('networkidle');

    // Wait for categories to load
    await page.waitForSelector('[data-testid="category-link"]', { timeout: 5000 });
    console.log('Categories loaded');

    const categories = page.locator('[data-testid="category-link"]');
    const categoryCount = await categories.count();
    console.log('Category count:', categoryCount);
    expect(categoryCount).toBeGreaterThan(0);
  });

  test('should load tags', async ({ page }) => {
    await page.goto('http://localhost:8787/');
    await page.waitForLoadState('networkidle');

    // Wait for tags to load
    await page.waitForSelector('[data-testid="tag-link"]', { timeout: 5000 });
    console.log('Tags loaded');

    const tags = page.locator('[data-testid="tag-link"]');
    const tagCount = await tags.count();
    console.log('Tag count:', tagCount);
    expect(tagCount).toBeGreaterThan(0);
  });
});
