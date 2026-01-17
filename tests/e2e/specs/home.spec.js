import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home-page';
import { PostDetailPage } from '../pages/post-detail-page';
import testData from '../../fixtures/test-data';

test.describe('首页功能测试', () => {
  let homePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('应该成功加载首页', async ({ page }) => {
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
  });

  test('应该显示文章列表', async ({ page }) => {
    const posts = await homePage.getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    
    for (const post of posts) {
      expect(post.title).toBeTruthy();
      expect(post.slug).toBeTruthy();
      expect(post.excerpt).toBeTruthy();
    }
  });

  test('应该显示导航菜单', async ({ page }) => {
    await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
    
    const links = await page.locator('[data-testid="navigation"] a').all();
    expect(links.length).toBeGreaterThan(0);
  });

  test('应该显示页脚', async ({ page }) => {
    await expect(page.locator('[data-testid="footer"]')).toBeVisible();
    await expect(page.locator('[data-testid="footer"]')).toContainText('CFBlog');
  });

  test('应该能点击文章进入详情页', async ({ page }) => {
    const posts = await homePage.getAllPosts();
    if (posts.length > 0) {
      await homePage.clickPost(posts[0].slug);
      await expect(page).toHaveURL(new RegExp(`/post/${posts[0].slug}`));
    }
  });

  test('应该能使用搜索功能', async ({ page }) => {
    await homePage.search('test');
    
    await expect(page).toHaveURL(/search/);
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('应该显示主题切换按钮', async ({ page }) => {
    await expect(page.locator('[data-testid="theme-switcher"]')).toBeVisible();
  });

  test('应该能切换主题', async ({ page }) => {
    await homePage.switchTheme('dark');
    
    // 检查localStorage是否更新
    const theme = await page.evaluate(() => localStorage.getItem('userTheme'));
    expect(theme).toBe('dark');
  });

  test('应该显示语言切换按钮', async ({ page }) => {
    await expect(page.locator('[data-testid="language-switcher"]')).toBeVisible();
  });

  test('应该能切换语言', async ({ page }) => {
    await homePage.switchLanguage('en-us');
    
    // 检查localStorage是否更新
    const lang = await page.evaluate(() => localStorage.getItem('userLanguage'));
    expect(lang).toBe('en-us');
    
    // 检查页面语言是否改变
    const title = await page.textContent('h1');
    // 应该显示英文标题
  });

  test('应该显示分类列表', async ({ page }) => {
    await expect(page.locator('[data-testid="categories-list"]')).toBeVisible();
    
    const categories = await page.locator('[data-testid="category-link"]').all();
    expect(categories.length).toBeGreaterThan(0);
  });

  test('应该能点击分类进入分类页', async ({ page }) => {
    const categoryLink = page.locator('[data-testid="category-link"]').first();
    const slug = await categoryLink.getAttribute('data-slug');
    
    await categoryLink.click();
    await expect(page).toHaveURL(new RegExp(`/category/${slug}`));
  });

  test('应该显示标签云', async ({ page }) => {
    await expect(page.locator('[data-testid="tags-list"]')).toBeVisible();
    
    const tags = await page.locator('[data-testid="tag-link"]').all();
    expect(tags.length).toBeGreaterThan(0);
  });

  test('应该能点击标签进入标签页', async ({ page }) => {
    const tagLink = page.locator('[data-testid="tag-link"]').first();
    const slug = await tagLink.getAttribute('data-slug');
    
    await tagLink.click();
    await expect(page).toHaveURL(new RegExp(`/tag/${slug}`));
  });

  test('应该响应式设计 - 移动端', async ({ page }) => {
    await page.setViewportSize(testData.viewport.mobile);
    
    // 检查移动端导航
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
  });

  test('应该响应式设计 - 桌面端', async ({ page }) => {
    await page.setViewportSize(testData.viewport.desktop);
    
    // 检查桌面端导航
    await expect(page.locator('[data-testid="desktop-navigation"]')).toBeVisible();
  });

  test('应该有正确的页面标题', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('CFBlog');
  });
});
