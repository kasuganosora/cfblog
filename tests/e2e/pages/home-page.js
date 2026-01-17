/**
 * Home Page - 首页页面对象
 */

class HomePage {
  constructor(page) {
    this.page = page;
    this.url = '/';
  }

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  // 获取精选文章
  async getFeaturedPosts() {
    return await this.page.$$eval('[data-testid="post-card"][data-featured="true"]', cards => {
      return cards.map(card => ({
        title: card.querySelector('[data-testid="post-title"]')?.textContent,
        slug: card.querySelector('a')?.getAttribute('href'),
        excerpt: card.querySelector('[data-testid="post-excerpt"]')?.textContent
      }));
    });
  }

  // 获取所有文章
  async getAllPosts() {
    return await this.page.$$eval('[data-testid="post-card"]', cards => {
      return cards.map(card => ({
        title: card.querySelector('[data-testid="post-title"]')?.textContent,
        slug: card.querySelector('a')?.getAttribute('href'),
        excerpt: card.querySelector('[data-testid="post-excerpt"]')?.textContent
      }));
    });
  }

  // 点击文章
  async clickPost(slug) {
    const postLink = this.page.locator(`[data-testid="post-card"] a[href*="${slug}"]`);
    await postLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  // 搜索
  async search(keyword) {
    await this.page.fill('[data-testid="search-input"]', keyword);
    await this.page.press('[data-testid="search-input"]', 'Enter');
    await this.page.waitForLoadState('networkidle');
  }

  // 切换到指定页
  async goToPage(pageNumber) {
    const pageButton = this.page.locator(`[data-testid="pagination"] a[data-page="${pageNumber}"]`);
    await pageButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  // 获取当前页码
  async getCurrentPage() {
    const activePage = await this.page.$eval('[data-testid="pagination"] a.active', el => {
      return parseInt(el.getAttribute('data-page'));
    });
    return activePage;
  }

  // 切换主题
  async switchTheme(themeName) {
    await this.page.click('[data-testid="theme-switcher"]');
    await this.page.click(`[data-theme="${themeName}"]`);
  }

  // 切换语言
  async switchLanguage(lang) {
    await this.page.click('[data-testid="language-switcher"]');
    await this.page.click(`[data-lang="${lang}"]`);
    await this.page.waitForLoadState('networkidle');
  }

  // 导航到分类
  async goToCategory(categorySlug) {
    const categoryLink = this.page.locator(`[data-testid="category-link"][data-slug="${categorySlug}"]`);
    await categoryLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  // 导航到标签
  async goToTag(tagSlug) {
    const tagLink = this.page.locator(`[data-testid="tag-link"][data-slug="${tagSlug}"]`);
    await tagLink.click();
    await this.page.waitForLoadState('networkidle');
  }
}

export default HomePage;
