/**
 * Test Helper - 测试辅助工具
 * 提供通用的测试辅助功能
 */

class TestHelper {
  constructor(page) {
    this.page = page;
  }

  /**
   * 等待页面完全加载
   */
  async waitForPageReady() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * 等待元素可见
   */
  async waitForVisible(selector, timeout = 5000) {
    await this.page.waitForSelector(selector, { 
      state: 'visible',
      timeout 
    });
  }

  /**
   * 等待元素消失
   */
  async waitForHidden(selector, timeout = 5000) {
    await this.page.waitForSelector(selector, {
      state: 'hidden',
      timeout
    });
  }

  /**
   * 截图并保存
   */
  async screenshot(name, options = {}) {
    const defaultOptions = {
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
      ...options
    };
    await this.page.screenshot(defaultOptions);
  }

  /**
   * 模拟移动设备
   */
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  /**
   * 模拟桌面设备
   */
  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  /**
   * 切换语言
   */
  async switchLanguage(lang) {
    await this.page.evaluate((lang) => {
      localStorage.setItem('userLanguage', lang);
      window.location.reload();
    }, lang);
    await this.waitForPageReady();
  }

  /**
   * 切换主题
   */
  async switchTheme(theme) {
    await this.page.evaluate((theme) => {
      localStorage.setItem('userTheme', theme);
      window.location.reload();
    }, theme);
    await this.waitForPageReady();
  }

  /**
   * 获取元素文本
   */
  async getText(selector) {
    const element = await this.page.$(selector);
    if (!element) return null;
    return await element.textContent();
  }

  /**
   * 检查元素是否存在
   */
  async exists(selector) {
    const element = await this.page.$(selector);
    return element !== null;
  }

  /**
   * 检查元素是否可见
   */
  async isVisible(selector) {
    const element = await this.page.$(selector);
    if (!element) return false;
    return await element.isVisible();
  }

  /**
   * 滚动到元素
   */
  async scrollToElement(selector) {
    await this.page.$eval(selector, el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }

  /**
   * 等待并点击
   */
  async clickWhenReady(selector) {
    await this.waitForVisible(selector);
    await this.page.click(selector);
  }

  /**
   * 填写表单
   */
  async fillForm(formData) {
    for (const [selector, value] of Object.entries(formData)) {
      await this.page.fill(selector, value);
    }
  }

  /**
   * 模拟文件上传
   */
  async uploadFile(selector, filePath) {
    const fileInput = await this.page.$(selector);
    if (!fileInput) {
      throw new Error(`File input ${selector} not found`);
    }
    await fileInput.setInputFiles(filePath);
  }

  /**
   * 获取页面性能指标
   */
  async getPerformanceMetrics() {
    const metrics = await this.page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        totalTime: perf.loadEventEnd - perf.fetchStart
      };
    });
    return metrics;
  }

  /**
   * 检查控制台错误
   */
  async getConsoleErrors() {
    const errors = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  /**
   * 等待指定时间
   */
  async wait(ms) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * 执行 JavaScript
   */
  async evaluate(fn, ...args) {
    return await this.page.evaluate(fn, ...args);
  }

  /**
   * 获取页面 URL
   */
  async getUrl() {
    return this.page.url();
  }

  /**
   * 导航到指定 URL
   */
  async goto(url) {
    await this.page.goto(url);
    await this.waitForPageReady();
  }
}

export default TestHelper;
