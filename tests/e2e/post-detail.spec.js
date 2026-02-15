import { test, expect } from '@playwright/test';

test.describe('文章详情页', () => {
  test('加载并显示文章标题', async ({ page }) => {
    await page.goto('/post/cloudflare-workers-intro');
    // Wait for title to change from placeholder
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="post-title"]');
      return el && el.textContent !== '加载中...';
    }, { timeout: 10000 });

    const title = page.locator('[data-testid="post-title"]');
    await expect(title).not.toHaveText('加载中...');
    await expect(title).toContainText('Cloudflare Workers');
  });

  test('显示文章元数据', async ({ page }) => {
    await page.goto('/post/cloudflare-workers-intro');
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="post-meta"]');
      return el && el.textContent.trim().length > 0;
    }, { timeout: 10000 });

    const meta = page.locator('[data-testid="post-meta"]');
    await expect(meta).toContainText('作者');
  });

  test('显示评论区域和表单', async ({ page }) => {
    await page.goto('/post/cloudflare-workers-intro');
    await page.waitForSelector('[data-testid="comments-section"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="comments-section"]')).toBeVisible();
    await expect(page.locator('#comment-form')).toBeVisible();
  });

  test('显示已有评论', async ({ page }) => {
    await page.goto('/post/cloudflare-workers-intro');
    await page.waitForSelector('.comment-item', { timeout: 10000 });
    const comments = page.locator('.comment-item');
    expect(await comments.count()).toBeGreaterThanOrEqual(1);
  });

  test('可以提交评论', async ({ page }) => {
    await page.goto('/post/cloudflare-workers-intro');
    await page.waitForSelector('#comment-form', { timeout: 10000 });

    await page.fill('#author', '测试用户');
    await page.fill('#comment-content', '这是一条测试评论');
    await page.click('#comment-form button[type="submit"]');

    // Wait for success message
    await page.waitForFunction(() => {
      const el = document.getElementById('comment-message');
      return el && el.style.display !== 'none' && el.classList.contains('success');
    }, { timeout: 10000 });

    const message = page.locator('#comment-message');
    await expect(message).toContainText('成功');
  });

  test('关闭评论的文章显示提示', async ({ page }) => {
    await page.goto('/post/closed-comments');
    await page.waitForSelector('.comments-disabled', { timeout: 10000 });
    await expect(page.locator('.comments-disabled')).toBeVisible();
    await expect(page.locator('.comments-disabled')).toContainText('关闭评论');
  });

  test('页面结构正确', async ({ page }) => {
    await page.goto('/post/cloudflare-workers-intro');
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="main"]')).toBeVisible();
    await expect(page.locator('[data-testid="post-article"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
  });
});
