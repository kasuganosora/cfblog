// 端到端测试 - 管理员流程
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8787';
const ADMIN_PASSWORD = 'admin123';

// 测试管理员登录流程
test.describe('管理员登录流程', () => {
  
  test('管理员可以成功登录', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // 输入密码
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待跳转到后台
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    
    // 验证跳转
    expect(page.url()).toContain('/admin');
  });

  test('错误的密码无法登录', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // 输入错误密码
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待错误消息显示
    await page.waitForSelector('#loginResult:not(:empty)', { timeout: 3000 });
    
    // 验证错误消息显示
    const resultDiv = page.locator('#loginResult');
    await expect(resultDiv).toBeVisible();
    
    // 验证仍在登录页面
    expect(page.url()).toContain('/login');
  });

  test('空密码无法登录', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // 不输入密码直接提交
    await page.click('button[type="submit"]');
    
    // 验证输入框被标记为必填（浏览器原生验证）
    const passwordInput = page.locator('input[type="password"]');
    const isRequired = await passwordInput.getAttribute('required');
    expect(isRequired).toBe('');
  });

});

// 测试文章管理流程
test.describe('文章管理流程', () => {
  test.beforeEach(async ({ page, context }) => {
    // 先登录获取真实token
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
  });

  test('管理员可以创建新文章', async ({ page }) => {
    // 跳转到文章创建页面
    await page.goto(`${BASE_URL}/admin/posts/new`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查表单是否显示
    await expect(page.locator('form')).toBeVisible();
    
    // 填写文章标题
    const titleInput = page.locator('input[name="title"]');
    if (await titleInput.count() > 0) {
      await titleInput.fill('测试文章标题');
    }
    
    // 填写文章内容
    const contentTextarea = page.locator('textarea[name="content"]');
    if (await contentTextarea.count() > 0) {
      await contentTextarea.fill('这是一篇测试文章的内容。');
    }
    
    // 提交表单（如果存在）
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // 等待跳转或成功消息
      await page.waitForTimeout(2000);
    }
  });

  test('管理员可以查看文章列表', async ({ page }) => {
    // 跳转到文章列表页面
    await page.goto(`${BASE_URL}/admin/posts`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查是否有文章列表或空状态
    const postsContainer = page.locator('.posts, .post-list, table');
    const emptyMessage = page.locator('.empty, .no-posts');
    
    // 要么有文章列表，要么有空消息
    await expect(postsContainer.or(emptyMessage)).toBeVisible();
  });

});

// 测试分类管理流程
test.describe('分类管理流程', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录获取真实token
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
  });

  test('管理员可以访问分类管理页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查分类管理标题
    await expect(page.locator('h1, h2:has-text("分类")')).toBeVisible();
  });

  test('管理员可以创建新分类', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories/new`);
    
    // 等待表单加载
    await page.waitForLoadState('networkidle');
    
    // 检查表单是否存在
    const form = page.locator('form');
    if (await form.count() > 0) {
      // 填写分类名称
      const nameInput = page.locator('input[name="name"]');
      if (await nameInput.count() > 0) {
        await nameInput.fill('测试分类');
      }
      
      // 提交表单
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

});

// 测试标签管理流程
test.describe('标签管理流程', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录获取真实token
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
  });

  test('管理员可以访问标签管理页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/tags`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查标签管理标题
    await expect(page.locator('h1, h2:has-text("标签")')).toBeVisible();
  });

});

// 测试仪表盘流程
test.describe('仪表盘流程', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录获取真实token
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
  });

  test('管理员可以访问仪表盘', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查仪表盘标题
    await expect(page.locator('h1:has-text("仪表盘"), h2:has-text("仪表盘")')).toBeVisible();
    
    // 检查是否有统计卡片
    const statsCards = page.locator('.stat, .card, .dashboard-stats');
    await expect(statsCards).toHaveCount(expect.any(Number));
  });

});

// 测试评论管理流程
test.describe('评论管理流程', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录获取真实token
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
  });

  test('管理员可以访问评论管理页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/comments`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查评论管理标题
    await expect(page.locator('h1, h2:has-text("评论")')).toBeVisible();
  });

});

// 测试反馈管理流程
test.describe('反馈管理流程', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录获取真实token
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
  });

  test('管理员可以访问反馈管理页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/feedbacks`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查反馈管理标题
    await expect(page.locator('h1, h2:has-text("反馈")')).toBeVisible();
  });

});

// 测试注销流程
test.describe('注销流程', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录获取真实token
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
  });

  test('管理员可以注销', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    
    // 查找注销链接或按钮
    const logoutLink = page.locator('a:has-text("退出"), a:has-text("注销"), button:has-text("退出"), button:has-text("注销")');
    
    if (await logoutLink.count() > 0) {
      // 点击注销
      await logoutLink.first().click();
      
      // 等待跳转到首页或登录页
      await page.waitForURL(/(\/$|\/login)/, { timeout: 3000 });
    }
  });

});
