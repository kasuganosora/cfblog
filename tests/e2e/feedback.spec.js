import { test, expect } from '@playwright/test';

test.describe('留言板', () => {
  test('表单包含所有字段', async ({ page }) => {
    await page.goto('/feedback');
    await expect(page.locator('[data-testid="feedback-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-content-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-submit-button"]')).toBeVisible();
  });

  test('可以提交留言', async ({ page }) => {
    await page.goto('/feedback');

    await page.fill('[data-testid="feedback-name-input"]', '测试用户');
    await page.fill('[data-testid="feedback-content-input"]', '这是一条测试留言');
    await page.click('[data-testid="feedback-submit-button"]');

    // Wait for success message
    await page.waitForFunction(() => {
      const el = document.getElementById('message');
      return el && el.style.display !== 'none' && el.classList.contains('success');
    }, { timeout: 10000 });

    const message = page.locator('#message');
    await expect(message).toContainText('成功');
  });

  test('空字段提交显示错误', async ({ page }) => {
    await page.goto('/feedback');

    // Remove required attributes to bypass browser validation and test JS validation
    await page.evaluate(() => {
      document.getElementById('name').removeAttribute('required');
      document.getElementById('content').removeAttribute('required');
    });

    // Click submit without filling
    await page.click('[data-testid="feedback-submit-button"]');

    // Wait for error message
    await page.waitForFunction(() => {
      const el = document.getElementById('message');
      return el && el.style.display !== 'none' && el.classList.contains('error');
    }, { timeout: 10000 });

    const message = page.locator('#message');
    await expect(message).toBeVisible();
  });

  test('页面结构正确', async ({ page }) => {
    await page.goto('/feedback');
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
  });
});
