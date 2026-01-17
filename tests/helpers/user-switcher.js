/**
 * User Switcher - 用户切换组件
 * 用于在不同用户角色之间切换
 */

class UserSwitcher {
  constructor(page) {
    this.page = page;
    this.users = {
      admin: {
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      },
      contributor: {
        username: 'editor',
        password: 'editor123',
        role: 'contributor'
      },
      author: {
        username: 'author1',
        password: 'author123',
        role: 'author'
      },
      visitor: null
    };
  }

  /**
   * 登录指定用户
   */
  async loginAs(userType) {
    const user = this.users[userType];
    
    if (!user) {
      console.log('👤 Remaining as visitor (not logged in)');
      return;
    }

    console.log(`🔐 Logging in as ${userType} (${user.username})...`);

    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    await this.page.fill('input[name="username"]', user.username);
    await this.page.fill('input[name="password"]', user.password);
    await this.page.click('button[type="submit"]');
    
    await this.page.waitForURL('**/');
    await this.page.waitForLoadState('networkidle');

    // 验证登录成功
    const currentUser = await this.getCurrentUser();
    if (currentUser !== user.username) {
      throw new Error(`Failed to login as ${userType}`);
    }

    console.log(`✅ Successfully logged in as ${user.username}`);
  }

  /**
   * 注销
   */
  async logout() {
    console.log('🚪 Logging out...');
    
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');

    // 点击用户菜单
    await this.page.click('[data-testid="user-menu-button"]');
    await this.page.waitForTimeout(500);
    
    // 点击注销按钮
    await this.page.click('[data-testid="logout-button"]');
    
    await this.page.waitForURL('**/login');
    await this.page.waitForLoadState('networkidle');
    
    console.log('✅ Successfully logged out');
  }

  /**
   * 获取当前登录用户
   */
  async getCurrentUser() {
    try {
      const username = await this.page.evaluate(() => {
        return localStorage.getItem('currentUser') || '';
      });
      return username;
    } catch {
      return '';
    }
  }

  /**
   * 验证当前用户角色
   */
  async verifyUserRole(expectedRole) {
    const currentUser = await this.getCurrentUser();
    
    if (!currentUser && expectedRole === 'visitor') {
      return true;
    }

    const expectedUser = Object.values(this.users).find(u => u.role === expectedRole);
    if (!expectedUser) {
      throw new Error(`Invalid role: ${expectedRole}`);
    }

    return currentUser === expectedUser.username;
  }

  /**
   * 切换到指定用户（自动注销并登录）
   */
  async switchTo(userType) {
    const currentUser = await this.getCurrentUser();
    
    // 如果已经是该用户，直接返回
    if (currentUser) {
      const expectedUser = this.users[userType];
      if (expectedUser && currentUser === expectedUser.username) {
        console.log(`ℹ️  Already logged in as ${userType}, no switch needed`);
        return;
      }
    }

    // 先注销（如果已登录）
    if (currentUser) {
      await this.logout();
    }

    // 登录新用户
    await this.loginAs(userType);
  }

  /**
   * 执行操作并验证权限
   */
  async withUser(userType, action) {
    const currentUser = await this.getCurrentUser();
    
    try {
      await this.switchTo(userType);
      await action();
    } finally {
      // 如果之前有登录，恢复之前的用户
      if (currentUser) {
        const userType = Object.entries(this.users).find(([_, u]) => u.username === currentUser)?.[0];
        if (userType) {
          await this.switchTo(userType);
        }
      } else {
        await this.logout();
      }
    }
  }
}

export default UserSwitcher;
