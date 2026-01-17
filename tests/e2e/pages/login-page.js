/**
 * Login Page - 登录页面对象
 */

class LoginPage {
  constructor(page) {
    this.page = page;
    this.url = '/login';
  }

  async goto() {
    await this.page.goto('http://localhost:8787/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  // 登录
  async login(username, password) {
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');
  }

  // 获取错误消息
  async getErrorMessage() {
    const errorElement = await this.page.$('[data-testid="error-message"]');
    if (errorElement) {
      return await errorElement.textContent();
    }
    return null;
  }

  // 检查是否登录成功
  async isLoggedIn() {
    return !this.page.url().includes('/login');
  }

  // 导航到注册页
  async goToRegister() {
    await this.page.click('[data-testid="register-link"]');
    await this.page.waitForLoadState('networkidle');
  }

  // 导航到忘记密码页
  async goToForgotPassword() {
    await this.page.click('[data-testid="forgot-password-link"]');
    await this.page.waitForLoadState('networkidle');
  }

  // 返回首页
  async goHome() {
    await this.page.click('[data-testid="home-link"]');
    await this.page.waitForLoadState('networkidle');
  }
}

export default LoginPage;
