import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home-page';
import { PostDetailPage } from '../pages/post-detail-page';
import testData from '../../fixtures/test-data';

test.describe('文章详情页测试', () => {
  let postDetailPage;

  test.beforeEach(async ({ page }) => {
    postDetailPage = new PostDetailPage(page);
  });

  test('应该成功加载文章详情页', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    await expect(page.locator('[data-testid="post-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="post-content"]')).toBeVisible();
  });

  test('应该显示文章标题', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    const title = await postDetailPage.getTitle();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('应该显示文章内容', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    const content = await postDetailPage.getContent();
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(0);
  });

  test('应该显示文章元数据', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    const metadata = await postDetailPage.getMetadata();
    expect(metadata.author).toBeTruthy();
    expect(metadata.date).toBeTruthy();
  });

  test('应该显示文章标签', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    const tags = await postDetailPage.getTags();
    expect(Array.isArray(tags)).toBe(true);
  });

  test('应该显示文章分类', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    const category = await postDetailPage.getCategory();
    expect(category).toBeTruthy();
    expect(category.name).toBeTruthy();
    expect(category.slug).toBeTruthy();
  });

  test('应该能点赞文章', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    const likeButton = page.locator('[data-testid="like-button"]');
    await expect(likeButton).toBeVisible();
    
    await postDetailPage.likePost();
    
    // 检查点赞状态
    const isLiked = await likeButton.getAttribute('data-liked');
    expect(isLiked).toBeTruthy();
  });

  test('应该显示评论列表', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    await expect(page.locator('[data-testid="comment-list"]')).toBeVisible();
  });

  test('应该能提交评论（需要登录）', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    // 尝试提交评论
    await postDetailPage.submitComment({
      author: 'Test User',
      email: 'test@example.com',
      content: 'Test comment content'
    });
    
    // 应该提示需要登录
    const error = await page.locator('[data-testid="error-message"]').isVisible();
    expect(error).toBe(true);
  });

  test('应该显示分享按钮', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    await expect(page.locator('[data-testid="share-twitter"]')).toBeVisible();
    await expect(page.locator('[data-testid="share-facebook"]')).toBeVisible();
  });

  test('应该能返回首页', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    await postDetailPage.goHome();
    await expect(page).toHaveURL('/');
  });

  test('应该显示面包屑导航', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    await expect(page.locator('[data-testid="breadcrumb"]')).toBeVisible();
  });

  test('应该显示相关文章', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    const relatedPosts = await page.locator('[data-testid="related-posts"]').count();
    if (relatedPosts > 0) {
      await expect(page.locator('[data-testid="related-posts"]')).toBeVisible();
    }
  });

  test('管理员应该能看到编辑按钮', async ({ page, context }) => {
    // 设置管理员登录状态
    await context.addInitScript(() => {
      localStorage.setItem('currentUser', 'admin');
      localStorage.setItem('userRole', 'admin');
    });
    
    await postDetailPage.goto('getting-started-workers');
    
    const editButton = page.locator('[data-testid="edit-post-button"]');
    const isVisible = await editButton.isVisible();
    expect(isVisible).toBe(true);
  });

  test('访客不应该看到编辑按钮', async ({ page, context }) => {
    // 清除登录状态
    await context.addInitScript(() => {
      localStorage.clear();
    });
    
    await postDetailPage.goto('getting-started-workers');
    
    const editButton = page.locator('[data-testid="edit-post-button"]');
    const isVisible = await editButton.isVisible();
    expect(isVisible).toBe(false);
  });

  test('应该有正确的页面结构（语义化HTML）', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });
});
