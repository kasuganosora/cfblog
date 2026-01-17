import { test, expect } from '@playwright/test';

test.describe('基础功能测试', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('应该成功加载首页', async ({ page }) => {
    await expect(page).toHaveURL('/');
    
    // 检查标题
    const title = await page.title();
    expect(title).toContain('CFBlog');
    
    // 检查header和footer
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('应该显示导航菜单', async ({ page }) => {
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();
    
    // 检查导航链接
    const links = await nav.locator('a').count();
    expect(links).toBeGreaterThan(0);
  });

  test('应该显示文章列表', async ({ page }) => {
    // 等待文章加载
    await page.waitForSelector('.posts-section', { state: 'visible', timeout: 5000 });
    
    // 检查文章卡片
    const postCards = await page.locator('.post-card').count();
    expect(postCards).toBeGreaterThan(0);
    
    // 检查文章标题
    const firstPostTitle = await page.locator('.post-card h2, .post-card h3').first().textContent();
    expect(firstPostTitle).toBeTruthy();
    expect(firstPostTitle.length).toBeGreaterThan(0);
  });

  test('应该能点击文章进入详情页', async ({ page }) => {
    await page.waitForSelector('.post-card', { state: 'visible' });
    
    // 点击第一个文章
    await page.locator('.post-card a').first().click();
    
    await page.waitForLoadState('networkidle');
    
    // 检查URL变化
    const url = page.url();
    expect(url).toContain('/post/');
    
    // 检查文章详情页元素
    await expect(page.locator('article.post-detail')).toBeVisible();
    await expect(page.locator('.post-title')).toBeVisible();
  });

  test('应该显示侧边栏', async ({ page }) => {
    await page.waitForSelector('.sidebar', { state: 'visible' });
    
    await expect(page.locator('.sidebar')).toBeVisible();
    
    // 检查侧边栏区块
    const sections = await page.locator('.sidebar-section').count();
    expect(sections).toBeGreaterThan(0);
  });

  test('应该有正确的语义化HTML结构', async ({ page }) => {
    await expect(page.locator('header[role="banner"]')).toBeVisible();
    await expect(page.locator('main, .content-primary')).toBeVisible();
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    await expect(page.locator('footer[role="contentinfo"]')).toBeVisible();
  });

  test('应该显示页面标题', async ({ page }) => {
    const pageTitle = await page.locator('h1, .section-title').first().textContent();
    expect(pageTitle).toBeTruthy();
    expect(pageTitle.length).toBeGreaterThan(0);
  });

  test('登录页面应该正常工作', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 检查登录表单
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('分类页面应该正常工作', async ({ page }) => {
    // 先获取一个分类链接
    await page.goto('/');
    await page.waitForSelector('.category-link', { state: 'visible' });
    
    const firstCategoryLink = page.locator('.category-link').first();
    const href = await firstCategoryLink.getAttribute('href');
    
    if (href) {
      await firstCategoryLink.click();
      await page.waitForLoadState('networkidle');
      
      // 检查URL
      expect(page.url()).toContain('/category/');
      
      // 检查分类标题
      const title = await page.locator('.category-title, h1').textContent();
      expect(title).toBeTruthy();
    }
  });

  test('标签页面应该正常工作', async ({ page }) => {
    // 先获取一个标签链接
    await page.goto('/');
    await page.waitForSelector('.tag-link', { state: 'visible' });
    
    const firstTagLink = page.locator('.tag-link').first();
    const href = await firstTagLink.getAttribute('href');
    
    if (href) {
      await firstTagLink.click();
      await page.waitForLoadState('networkidle');
      
      // 检查URL
      expect(page.url()).toContain('/tag/');
      
      // 检查标签标题
      const title = await page.locator('.tag-title, h1').textContent();
      expect(title).toBeTruthy();
    }
  });

  test('搜索页面应该正常工作', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    
    // 检查搜索表单
    await expect(page.locator('.search-form, form[action="/search"]')).toBeVisible();
    await expect(page.locator('input[name="q"]')).toBeVisible();
    
    // 执行搜索
    await page.fill('input[name="q"]', 'test');
    await page.press('input[name="q"]', 'Enter');
    
    await page.waitForLoadState('networkidle');
    
    // 检查搜索结果
    const searchResults = await page.locator('.search-results, .post-card').count();
    expect(searchResults).toBeGreaterThanOrEqual(0);
  });

  test('留言板页面应该正常工作', async ({ page }) => {
    await page.goto('/feedback');
    await page.waitForLoadState('networkidle');
    
    // 检查留言表单
    await expect(page.locator('.feedback-form, form')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="content"]')).toBeVisible();
  });

  test('全部分类页面应该正常工作', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    
    // 检查分类卡片
    const categories = await page.locator('.category-card, .category-item').count();
    expect(categories).toBeGreaterThan(0);
  });

  test('全部标签页面应该正常工作', async ({ page }) => {
    await page.goto('/tags');
    await page.waitForLoadState('networkidle');
    
    // 检查标签
    const tags = await page.locator('.tag-cloud-item, .tag-link').count();
    expect(tags).toBeGreaterThan(0);
  });

  test('404页面应该正常工作', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');
    
    // 检查错误消息
    await expect(page.locator('.error-page, .error-title')).toBeVisible();
    
    const title = await page.locator('h1, .error-title').textContent();
    expect(title).toContain('不存在') || expect(title).toContain('404');
  });
});
