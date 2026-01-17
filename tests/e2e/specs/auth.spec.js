import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { UserSwitcher } from '../../helpers/user-switcher';
import { LoginChecker } from '../../helpers/login-checker';
import testCredentials from '../../fixtures/test-credentials';

test.describe('认证和权限测试', () => {
  let loginPage, userSwitcher, loginChecker;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    userSwitcher = new UserSwitcher(page);
    loginChecker = new LoginChecker(page);
  });

  test('应该能成功登录', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(
      testCredentials.admin.username,
      testCredentials.admin.password
    );
    
    await expect(page).not.toHaveURL(/login/);
    const isLoggedIn = await loginChecker.isLoggedIn();
    expect(isLoggedIn).toBe(true);
  });

  test('错误密码应该登录失败', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(
      testCredentials.admin.username,
      'wrongpassword'
    );
    
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
    
    const isLoggedIn = await loginChecker.isLoggedIn();
    expect(isLoggedIn).toBe(false);
  });

  test('不存在用户应该登录失败', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login(
      'nonexistent',
      testCredentials.admin.password
    );
    
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  test('管理员应该能访问管理后台', async ({ page }) => {
    await userSwitcher.loginAs('admin');
    
    await page.goto('/admin');
    await expect(page).toHaveURL(/admin/);
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  });

  test('普通用户不应该能访问管理后台', async ({ page }) => {
    await userSwitcher.loginAs('user1');
    
    await page.goto('/admin');
    await expect(page).toHaveURL(/login/);
  });

  test('投稿者应该能创建文章', async ({ page }) => {
    await userSwitcher.loginAs('contributor');
    
    await page.goto('/admin/posts/new');
    await expect(page.locator('[data-testid="post-form"]')).toBeVisible();
  });

  test('访客不能创建文章', async ({ page }) => {
    await page.goto('/admin/posts/new');
    await expect(page).toHaveURL(/login/);
  });

  test('应该能注销', async ({ page }) => {
    await userSwitcher.loginAs('admin');
    
    const isLoggedInBefore = await loginChecker.isLoggedIn();
    expect(isLoggedInBefore).toBe(true);
    
    await userSwitcher.logout();
    
    const isLoggedInAfter = await loginChecker.isLoggedIn();
    expect(isLoggedInAfter).toBe(false);
    
    await expect(page).toHaveURL(/login/);
  });

  test('应该保持登录状态刷新页面', async ({ page }) => {
    await userSwitcher.loginAs('admin');
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const isLoggedIn = await loginChecker.isLoggedIn();
    expect(isLoggedIn).toBe(true);
  });

  test('应该正确验证用户权限', async ({ page }) => {
    const userTypes = ['admin', 'contributor', 'author1', 'user1'];
    
    for (const userType of userTypes) {
      await userSwitcher.loginAs(userType);
      
      const expectedRole = testCredentials[userType].role;
      const currentRole = await loginChecker.getCurrentRole();
      
      expect(currentRole).toBe(expectedRole);
      
      await userSwitcher.logout();
    }
  });

  test('应该检查登录状态一致性', async ({ page }) => {
    await userSwitcher.loginAs('admin');
    
    const consistency = await loginChecker.verifyLoginConsistency();
    
    expect(consistency.localStorage).toBe(true);
    expect(consistency.ui).toBe(true);
    expect(consistency.api).toBe(true);
  });

  test('表单验证应该工作', async ({ page }) => {
    await loginPage.goto();
    
    // 不填写任何内容直接提交
    await page.click('button[type="submit"]');
    
    const errorMessages = await page.locator('[data-testid="error-message"]').all();
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  test('应该能导航到注册页面', async ({ page }) => {
    await loginPage.goto();
    await loginPage.goToRegister();
    
    await expect(page).toHaveURL(/register/);
  });

  test('应该能导航到忘记密码页面', async ({ page }) => {
    await loginPage.goto();
    await loginPage.goToForgotPassword();
    
    await expect(page).toHaveURL(/forgot-password/);
  });
});
