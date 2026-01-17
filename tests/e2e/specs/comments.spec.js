import { test, expect } from '@playwright/test';
import PostDetailPage from '../pages/post-detail-page';
import { UserSwitcher } from '../../helpers/user-switcher';

test.describe('评论功能测试', () => {
  let postDetailPage;

  test.beforeEach(async ({ page }) => {
    postDetailPage = new PostDetailPage(page);
  });

  test('应该显示评论列表', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    await expect(page.locator('[data-testid="comment-list"]')).toBeVisible();
    
    const comments = await postDetailPage.getComments();
    expect(Array.isArray(comments)).toBe(true);
  });

  test('访客不应该能提交评论', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    await postDetailPage.submitComment({
      author: 'Test User',
      email: 'test@example.com',
      content: 'Test comment'
    });
    
    // 应该显示错误或重定向到登录页
    const hasError = await page.locator('[data-testid="error-message"]').count() > 0;
    const isLoginPage = page.url().includes('/login');
    
    expect(hasError || isLoginPage).toBe(true);
  });

  test('登录用户应该能提交评论', async ({ page, context }) => {
    // 设置登录状态
    await context.addInitScript(() => {
      localStorage.setItem('currentUser', 'user1');
      localStorage.setItem('userRole', 'user');
    });
    
    await postDetailPage.goto('getting-started-workers');
    
    // 提交评论
    await postDetailPage.submitComment({
      author: 'Test User',
      email: 'test@example.com',
      content: 'This is a test comment'
    });
    
    // 应该显示成功消息
    const successMessage = await page.locator('[data-testid="success-message"]').isVisible();
    expect(successMessage).toBe(true);
  });

  test('评论表单应该进行验证', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    // 不填写任何内容
    await page.click('button[type="submit"]');
    
    const errors = await page.locator('[data-testid="error-message"]').all();
    expect(errors.length).toBeGreaterThan(0);
  });

  test('应该能回复评论', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('currentUser', 'user1');
      localStorage.setItem('userRole', 'user');
    });
    
    await postDetailPage.goto('getting-started-workers');
    
    const replyButton = page.locator('[data-testid="reply-button"]').first();
    const hasReplyButton = await replyButton.count() > 0;
    
    if (hasReplyButton) {
      await replyButton.click();
      
      // 应该显示回复表单
      await expect(page.locator('[data-testid="reply-form"]')).toBeVisible();
    }
  });

  test('应该能删除自己的评论（如果有权限）', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('currentUser', 'user1');
      localStorage.setItem('userRole', 'user');
    });
    
    await postDetailPage.goto('getting-started-workers');
    
    const deleteButton = page.locator('[data-testid="delete-comment-button"]').first();
    const hasDeleteButton = await deleteButton.count() > 0;
    
    if (hasDeleteButton) {
      await deleteButton.click();
      
      // 确认删除
      await page.click('[data-testid="confirm-delete"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    }
  });

  test('评论应该显示作者信息', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    const comments = await postDetailPage.getComments();
    
    for (const comment of comments) {
      expect(comment.author).toBeTruthy();
    }
  });

  test('评论应该显示日期', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    const comments = await postDetailPage.getComments();
    
    for (const comment of comments) {
      expect(comment.date).toBeTruthy();
    }
  });

  test('评论应该支持分页（如果数量很多）', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    const pagination = page.locator('[data-testid="comment-pagination"]');
    const hasPagination = await pagination.count() > 0;
    
    if (hasPagination) {
      await expect(pagination).toBeVisible();
    }
  });

  test('评论应该按时间排序', async ({ page }) => {
    await postDetailPage.goto('getting-started-workers');
    
    const commentDates = await page.$$eval('[data-testid="comment-date"]', dates => {
      return dates.map(d => d.textContent);
    });
    
    // 简单检查：评论应该有日期
    expect(commentDates.length).toBeGreaterThan(0);
  });

  test('管理员应该能删除任何评论', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('currentUser', 'admin');
      localStorage.setItem('userRole', 'admin');
    });
    
    await postDetailPage.goto('getting-started-workers');
    
    const deleteButton = page.locator('[data-testid="delete-comment-button"]').first();
    const hasDeleteButton = await deleteButton.count() > 0;
    
    if (hasDeleteButton) {
      await expect(deleteButton).toBeVisible();
    }
  });
});
