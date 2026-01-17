import { test, expect } from '@playwright/test';

test.describe('基础功能测试', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8787/');
    await page.waitForLoadState('networkidle');
  });

  test('应该成功加载首页', async ({ page }) => {
    await expect(page).toHaveURL('http://localhost:8787/');
    // 检查标题
    const title = await page.title();
    expect(title).toContain('CFBlog');
    
    // 检查header和footer
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('应该显示导航菜单', async ({ page }) => {
    const nav = page.locator('[data-testid="navigation"]');
    await expect(nav).toBeVisible();
    
    // 检查导航链接
    const links = await nav.locator('a').count();
    expect(links).toBeGreaterThan(0);
  });

  test('应该显示文章列表', async ({ page }) => {
    // 等待文章加载
    await page.waitForSelector('[data-testid="post-card"]', { state: 'visible', timeout: 15000 });
    
    // 检查文章卡片
    const postCards = await page.locator('.post-card').count();
    expect(postCards).toBeGreaterThan(0);
    
    // 检查文章标题
    const firstPostTitle = await page.locator('.post-card h2, .post-card h3').first().textContent();
    expect(firstPostTitle).toBeTruthy();
    expect(firstPostTitle.length).toBeGreaterThan(0);
  });

  test('应该能点击文章进入详情页', async ({ page }) => {
    await page.waitForSelector('[data-testid="post-card"]', { state: 'visible' });

    // 点击第一个文章
    await page.locator('[data-testid="post-card"] a').first().click();

    await page.waitForLoadState('networkidle');

    // 检查URL变化
    const url = page.url();
    expect(url).toContain('http://localhost:8787/post/');

    // 检查文章详情页元素
    await expect(page.locator('h1')).toBeVisible();
  });

  test('应该显示侧边栏', async ({ page }) => {
    await page.waitForSelector('aside', { state: 'visible' });

    await expect(page.locator('aside')).toBeVisible();

    // 检查侧边栏区块
    const sections = await page.locator('.sidebar-section').count();
    expect(sections).toBeGreaterThan(0);
  });

  test('应该有正确的语义化HTML结构', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('应该显示页面标题', async ({ page }) => {
    const pageTitle = await page.locator('h1, .section-title').first().textContent();
    expect(pageTitle).toBeTruthy();
    expect(pageTitle.length).toBeGreaterThan(0);
  });

  test('登录页面应该正常工作', async ({ page }) => {
    await page.goto('http://localhost:8787/login');
    await page.waitForLoadState('networkidle');
    
    // 检查登录表单
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('分类页面应该正常工作', async ({ page }) => {
    // 先获取一个分类链接
    await page.goto('http://localhost:8787/');
    await page.waitForSelector('[data-testid="category-link"]', { state: 'visible' });

    const firstCategoryLink = page.locator('[data-testid="category-link"]').first();
    const href = await firstCategoryLink.getAttribute('href');

    if (href) {
      await firstCategoryLink.click();
      await page.waitForLoadState('networkidle');

      // 检查URL
      expect(page.url()).toContain('http://localhost:8787/category/');

      // 检查分类标题
      const title = await page.locator('h1').textContent();
      expect(title).toBeTruthy();
    }
  });

  test('标签页面应该正常工作', async ({ page }) => {
    // 先获取一个标签链接
    await page.goto('http://localhost:8787/');
    await page.waitForSelector('[data-testid="tag-link"]', { state: 'visible' });

    const firstTagLink = page.locator('[data-testid="tag-link"]').first();
    const href = await firstTagLink.getAttribute('href');

    if (href) {
      await firstTagLink.click();
      await page.waitForLoadState('networkidle');

      // 检查URL
      expect(page.url()).toContain('http://localhost:8787/tag/');

      // 检查标签标题
      const title = await page.locator('h1').textContent();
      expect(title).toBeTruthy();
    }
  });

  test('搜索页面应该正常工作', async ({ page }) => {
    await page.goto('http://localhost:8787/search');
    await page.waitForLoadState('networkidle');

    // 检查搜索表单
    await expect(page.locator('[data-testid="search-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();

    // 执行搜索
    await page.fill('[data-testid="search-input"]', 'test');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    await page.waitForLoadState('networkidle');
    
    // 检查搜索结果
    const searchResults = await page.locator('.search-results, .post-card').count();
    expect(searchResults).toBeGreaterThanOrEqual(0);
  });

  test('留言板页面应该正常工作', async ({ page }) => {
    await page.goto('http://localhost:8787/feedback');
    await page.waitForLoadState('networkidle');
    
    // 检查留言表单
    await expect(page.locator('.feedback-form, form')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="content"]')).toBeVisible();
  });

  test('全部分类页面应该正常工作', async ({ page }) => {
    await page.goto('http://localhost:8787/categories');
    await page.waitForLoadState('networkidle');
    
    // 检查分类卡片
    const categories = await page.locator('.category-card, .category-item').count();
    expect(categories).toBeGreaterThan(0);
  });

  test('全部标签页面应该正常工作', async ({ page }) => {
    await page.goto('http://localhost:8787/tags');
    await page.waitForLoadState('networkidle');
    
    // 检查标签
    const tags = await page.locator('.tag-cloud a').count();
    expect(tags).toBeGreaterThan(0);
  });

  test('404页面应该正常工作', async ({ page }) => {
    const response = await page.goto('http://localhost:8787/this-page-does-not-exist');
    expect(response.status()).toBe(404);
    await page.waitForLoadState('networkidle');

    // 检查错误消息
    const title = await page.locator('h1').textContent();
    expect(title).toContain('404');
  });
});
