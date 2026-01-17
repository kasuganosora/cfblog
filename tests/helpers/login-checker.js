/**
 * Login Checker - 登录状态检查组件
 * 用于验证用户的登录和权限状态
 */

class LoginChecker {
  constructor(page) {
    this.page = page;
  }

  /**
   * 检查是否已登录
   */
  async isLoggedIn() {
    try {
      const username = await this.page.evaluate(() => {
        return localStorage.getItem('currentUser') || '';
      });
      return username !== '';
    } catch {
      return false;
    }
  }

  /**
   * 获取当前登录用户名
   */
  async getCurrentUsername() {
    try {
      return await this.page.evaluate(() => {
        return localStorage.getItem('currentUser') || '';
      });
    } catch {
      return '';
    }
  }

  /**
   * 获取当前用户角色
   */
  async getCurrentRole() {
    try {
      return await this.page.evaluate(() => {
        return localStorage.getItem('userRole') || 'visitor';
      });
    } catch {
      return 'visitor';
    }
  }

  /**
   * 检查是否为管理员
   */
  async isAdmin() {
    const role = await this.getCurrentRole();
    return role === 'admin';
  }

  /**
   * 检查是否可以访问管理功能
   */
  async canAccessAdmin() {
    const isAdmin = await this.isAdmin();
    
    // 尝试访问管理页面
    await this.page.goto('/admin');
    await this.page.waitForLoadState('networkidle');

    const currentUrl = this.page.url();
    const hasAccess = !currentUrl.includes('/login');

    return isAdmin && hasAccess;
  }

  /**
   * 检查是否可以创建文章
   */
  async canCreatePost() {
    const role = await this.getCurrentRole();
    const allowedRoles = ['admin', 'contributor', 'author'];
    return allowedRoles.includes(role);
  }

  /**
   * 检查是否可以评论
   */
  async canComment() {
    const isLoggedIn = await this.isLoggedIn();
    return isLoggedIn;
  }

  /**
   * 验证页面显示的用户信息
   */
  async verifyUserDisplay(expectedUsername) {
    const userMenuButton = await this.page.$('[data-testid="user-menu-button"]');
    
    if (!expectedUsername) {
      // 访客模式：不应有用户菜单
      return !userMenuButton;
    }

    // 已登录：应有用户菜单
    if (!userMenuButton) {
      return false;
    }

    const buttonText = await userMenuButton.textContent();
    return buttonText.includes(expectedUsername);
  }

  /**
   * 验证登录状态一致性
   * 检查 localStorage、页面UI和API响应是否一致
   */
  async verifyLoginConsistency() {
    const results = {
      localStorage: false,
      ui: false,
      api: false
    };

    // 检查 localStorage
    results.localStorage = await this.isLoggedIn();

    // 检查 UI
    const userMenu = await this.page.$('[data-testid="user-menu-button"]');
    results.ui = !!userMenu;

    // 检查 API（通过获取用户信息）
    try {
      await this.page.goto('/api/user/me');
      await this.page.waitForLoadState('networkidle');
      const text = await this.page.textContent('body');
      results.api = !text.includes('Unauthorized');
    } catch {
      results.api = false;
    }

    return results;
  }

  /**
   * 等待登录状态更新
   */
  async waitForLoginState(expectedLoggedIn = true, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const isLoggedIn = await this.isLoggedIn();
      if (isLoggedIn === expectedLoggedIn) {
        return true;
      }
      await this.page.waitForTimeout(100);
    }
    
    return false;
  }

  /**
   * 验证所有认证信息
   */
  async verifyAuthentication(username, role) {
    const checks = {
      isLoggedIn: await this.isLoggedIn(),
      correctUsername: await this.getCurrentUsername() === username,
      correctRole: await this.getCurrentRole() === role,
      hasUserMenu: await this.page.$('[data-testid="user-menu-button"]') !== null
    };

    const allPassed = Object.values(checks).every(v => v === true);
    
    return {
      passed: allPassed,
      details: checks
    };
  }
}

export default LoginChecker;
