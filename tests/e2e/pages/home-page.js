/**
 * Home Page - 首页页面对象
 */

class HomePage {
  constructor(page) {
    this.page = page;
    this.url = '/';
  }

  async goto() {
    await this.page.goto('http://localhost:8787/');
    // Wait for content to load
    await this.page.waitForLoadState('domcontentloaded');
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
    // Wait for posts to be rendered with longer timeout
    try {
      await this.page.waitForSelector('[data-testid="post-card"]', { timeout: 20000 });
    } catch (error) {
      console.log('Timeout waiting for posts, using whatever is available');
      // Continue anyway
    }

    const cards = await this.page.locator('[data-testid="post-card"]').all();
    const posts = [];

    for (const card of cards) {
      try {
        const href = await card.locator('a').getAttribute('href');
        // Extract slug from href (e.g., "/post/api" -> "api")
        const slug = href ? href.replace('/post/', '') : '';
        posts.push({
          title: await card.locator('[data-testid="post-title"]').textContent(),
          slug: slug,
          excerpt: await card.locator('[data-testid="post-excerpt"]').textContent()
        });
      } catch (error) {
        console.log('Error reading post card:', error);
      }
    }

    console.log('Total posts found:', posts.length);
    return posts;
  }

  // 点击文章
  async clickPost(slug) {
    const postLink = this.page.locator(`[data-testid="post-card"] a[href*="${slug}"]`);
    await postLink.click();
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
    // The toggle switches between 'zh-cn' and 'en-us'
    // We need to verify it switched to the target language
    const currentLang = await this.page.evaluate(() => localStorage.getItem('userLanguage'));
    // If we didn't get the expected language, click again
    if (currentLang !== lang) {
      await this.page.click('[data-testid="language-switcher"]');
    }
  }

  // 导航到分类
  async goToCategory(categorySlug) {
    const categoryLink = this.page.locator(`[data-testid="category-link"][data-slug="${categorySlug}"]`);
    await categoryLink.click();
  }

  // 导航到标签
  async goToTag(tagSlug) {
    const tagLink = this.page.locator(`[data-testid="tag-link"][data-slug="${tagSlug}"]`);
    await tagLink.click();
  }
}

export default HomePage;
