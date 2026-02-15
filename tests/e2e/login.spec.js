import { test, expect } from '@playwright/test';

test.describe('登录页', () => {
  test('表单包含所有字段', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="username-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('页面结构正确', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
  });

  test('API接受有效的登录凭据', async ({ request }) => {
    const response = await request.post('/api/user/login', {
      data: {
        username: 'admin',
        password: 'admin123',
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);

    // Should set session cookie
    const cookies = response.headers()['set-cookie'];
    expect(cookies).toBeTruthy();
    expect(cookies).toContain('session=');
  });
});
