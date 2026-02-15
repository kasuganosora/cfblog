import { test, expect } from '@playwright/test';

test.describe('首页', () => {
  test('页面加载并显示正确的标题和结构', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CFBlog/);
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="main"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
  });

  test('导航链接可见', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('[data-testid="desktop-navigation"]');
    await expect(nav).toBeVisible();
    const links = nav.locator('a');
    await expect(links).toHaveCount(4); // 首页, 分类, 标签, 留言
  });

  test('文章卡片从API加载', async ({ page }) => {
    await page.goto('/');
    // Wait for posts to load from API
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });
    const cards = page.locator('[data-testid="post-card"]');
    await expect(cards.first()).toBeVisible();

    // Each card should have title and excerpt
    const firstCard = cards.first();
    await expect(firstCard.locator('[data-testid="post-title"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="post-excerpt"]')).toBeVisible();
  });

  test('侧边栏加载分类列表', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="category-link"]', { timeout: 10000 });
    const categoryLinks = page.locator('[data-testid="category-link"]');
    await expect(categoryLinks.first()).toBeVisible();
  });

  test('侧边栏加载标签列表', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="tag-link"]', { timeout: 10000 });
    const tagLinks = page.locator('[data-testid="tag-link"]');
    await expect(tagLinks.first()).toBeVisible();
  });

  test('点击文章卡片跳转到详情页', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });

    const firstCard = page.locator('[data-testid="post-card"]').first();
    const link = firstCard.locator('[data-testid="post-title"] a');
    await link.click();

    await expect(page).toHaveURL(/\/post\//);
  });

  test('搜索表单可用', async ({ page }) => {
    await page.goto('/');
    const form = page.locator('[data-testid="search-form"]');
    await expect(form).toBeVisible();

    const input = page.locator('[data-testid="search-input"]');
    await input.fill('Workers');
    await form.evaluate(f => f.submit());

    await expect(page).toHaveURL(/\/search\?keyword=Workers/);
  });

  test('页脚显示版权信息', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('[data-testid="footer"]');
    await expect(footer).toContainText('CFBlog');
  });
});
