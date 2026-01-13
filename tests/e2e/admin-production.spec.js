// 管理后台生产环境 E2E 测试
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://cfblog.sakurakouji.workers.dev';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'p123456789';

// 测试登录页面
test.describe('管理后台登录', () => {
  
  test('登录页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面标题
    const title = await page.title();
    expect(title).toContain('管理后台登录');
    
    // 检查登录表单元素
    await expect(page.locator('input#username, input[name="username"]')).toBeVisible();
    await expect(page.locator('input#password, input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], #loginForm button')).toBeVisible();
  });

  test('可以使用正确的凭据登录', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 输入用户名和密码
    await page.fill('input#username, input[name="username"]', ADMIN_USERNAME);
    await page.fill('input#password, input[name="password"]', ADMIN_PASSWORD);
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待登录成功消息
    await page.waitForSelector('#message:has-text("登录成功")', { timeout: 10000 });
    
    // 等待跳转到管理后台
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    
    // 验证跳转成功
    expect(page.url()).toContain('/admin');
  });

  test('错误的凭据无法登录', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 输入错误的用户名和密码
    await page.fill('input#username, input[name="username"]', 'wronguser');
    await page.fill('input#password, input[name="password"]', 'wrongpassword');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待错误消息
    await page.waitForSelector('#message:has-text("登录失败")', { timeout: 5000 });
    
    // 验证仍在登录页面
    expect(page.url()).toContain('/admin/login');
  });

});

// 测试仪表盘
test.describe('仪表盘', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input#username, input[name="username"]', ADMIN_USERNAME);
    await page.fill('input#password, input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    
    // 设置 localStorage token（模拟登录后的状态）
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
    });
  });

  test('仪表盘页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面是否包含内容
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('仪表盘显示统计卡片', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    // 检查统计卡片是否存在
    const statCards = await page.locator('.stat-card').count();
    expect(statCards).toBeGreaterThan(0);
  });

});

// 测试文章管理
test.describe('文章管理', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input#username, input[name="username"]', ADMIN_USERNAME);
    await page.fill('input#password, input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    
    // 设置 localStorage token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
    });
  });

  test('文章列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/posts`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面是否加载成功（没有错误消息）
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    // 检查是否有表格
    const tableExists = await page.locator('table').count() > 0;
    const hasEmptyMessage = bodyText.includes('暂无文章');
    expect(tableExists || hasEmptyMessage).toBe(true);
  });

  test('文章编辑页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/posts/edit/new`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面是否加载成功
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

});

// 测试分类管理
test.describe('分类管理', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input#username, input[name="username"]', ADMIN_USERNAME);
    await page.fill('input#password, input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    
    // 设置 localStorage token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
    });
  });

  test('分类列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面是否加载成功
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    // 检查是否有分类管理标题
    const hasCategoryHeading = await page.locator('h1, h2').filter({ hasText: /分类/ }).count() > 0;
    expect(hasCategoryHeading).toBe(true);
  });

});

// 测试标签管理
test.describe('标签管理', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input#username, input[name="username"]', ADMIN_USERNAME);
    await page.fill('input#password, input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    
    // 设置 localStorage token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
    });
  });

  test('标签列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/tags`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面是否加载成功
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    // 检查是否有标签管理标题
    const hasTagHeading = await page.locator('h1, h2').filter({ hasText: /标签/ }).count() > 0;
    expect(hasTagHeading).toBe(true);
  });

});

// 测试评论管理
test.describe('评论管理', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input#username, input[name="username"]', ADMIN_USERNAME);
    await page.fill('input#password, input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    
    // 设置 localStorage token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
    });
  });

  test('评论列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/comments`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面是否加载成功
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    // 检查是否有评论管理标题
    const hasCommentHeading = await page.locator('h1, h2').filter({ hasText: /评论/ }).count() > 0;
    expect(hasCommentHeading).toBe(true);
  });

});

// 测试用户管理
test.describe('用户管理', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input#username, input[name="username"]', ADMIN_USERNAME);
    await page.fill('input#password, input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    
    // 设置 localStorage token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
    });
  });

  test('用户列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面是否加载成功
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    // 检查是否有用户管理标题
    const hasUserHeading = await page.locator('h1, h2').filter({ hasText: /用户/ }).count() > 0;
    expect(hasUserHeading).toBe(true);
  });

});

// 测试反馈管理
test.describe('反馈管理', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input#username, input[name="username"]', ADMIN_USERNAME);
    await page.fill('input#password, input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    
    // 设置 localStorage token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
    });
  });

  test('反馈列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/feedback`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面是否加载成功
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    // 检查是否有反馈管理标题
    const hasFeedbackHeading = await page.locator('h1, h2').filter({ hasText: /反馈/ }).count() > 0;
    expect(hasFeedbackHeading).toBe(true);
  });

});

// 测试附件管理
test.describe('附件管理', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input#username, input[name="username"]', ADMIN_USERNAME);
    await page.fill('input#password, input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    
    // 设置 localStorage token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
    });
  });

  test('附件列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/attachments`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面是否加载成功
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    // 检查是否有附件管理标题
    const hasAttachmentHeading = await page.locator('h1, h2').filter({ hasText: /附件/ }).count() > 0;
    expect(hasAttachmentHeading).toBe(true);
  });

});

// 测试系统设置
test.describe('系统设置', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto(`${BASE_URL}/admin/login`);
    await page.fill('input#username, input[name="username"]', ADMIN_USERNAME);
    await page.fill('input#password, input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    
    // 设置 localStorage token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
    });
  });

  test('系统设置页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings`);
    
    // 等待页面加载
    await page.waitForLoadState('domcontentloaded');
    
    // 检查页面是否加载成功
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    // 检查是否有设置标题
    const hasSettingsHeading = await page.locator('h1, h2').filter({ hasText: /设置/ }).count() > 0;
    expect(hasSettingsHeading).toBe(true);
  });

});

// API 测试
test.describe('管理后台 API', () => {
  
  test('登录 API 正常工作', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/admin/login/api`, {
      data: {
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      }
    });
    
    const data = await response.json();
    expect(response.ok()).toBe(true);
    expect(data.success).toBe(true);
    expect(data.data.token).toBeTruthy();
  });

  test('获取文章列表 API 正常工作', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/post/list?page=1&limit=10`);
    
    const data = await response.json();
    expect(response.ok()).toBe(true);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('data');
    expect(data.data).toHaveProperty('pagination');
  });

  test('获取分类列表 API 正常工作', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/category/list`);
    
    const data = await response.json();
    expect(response.ok()).toBe(true);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('data');
  });

  test('获取标签列表 API 正常工作', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/tag/list`);
    
    const data = await response.json();
    expect(response.ok()).toBe(true);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('data');
  });

  test('获取评论列表 API 正常工作', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/comment/list?page=1&limit=10`);
    
    const data = await response.json();
    expect(response.ok()).toBe(true);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('data');
  });

});
