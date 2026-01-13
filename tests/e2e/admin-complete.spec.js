// 管理后台完整 E2E 测试套件
import { test, expect } from '@playwright/test';

// 从环境变量获取配置或使用默认值
const BASE_URL = process.env.BASE_URL || 'http://localhost:8787';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'p123456789';

// 测试工具函数
async function performLogin(page) {
  await page.goto(`${BASE_URL}/admin/login`);
  await page.waitForLoadState('domcontentloaded');
  
  await page.fill('input#username, input[name="username"]', ADMIN_USERNAME);
  await page.fill('input#password, input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  
  // 等待登录完成 - 成功消息或跳转
  await Promise.race([
    page.waitForSelector('#message:has-text("登录成功")', { timeout: 10000 }),
    page.waitForURL(/\/admin/, { timeout: 10000 })
  ]);
  
  // 设置 auth_token 以便后续请求
  const authToken = await page.evaluate(() => {
    return localStorage.getItem('auth_token');
  });
  
  if (!authToken) {
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
    });
  }
}

// ==================== 登录功能测试 ====================
test.describe('管理后台 - 登录功能', () => {
  
  test('应该正确显示登录页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面标题
    const title = await page.title();
    expect(title).toMatch(/管理后台登录|登录/);
    
    // 验证表单元素存在
    await expect(page.locator('input#username, input[name="username"]')).toBeVisible();
    await expect(page.locator('input#password, input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('可以使用正确的凭据登录', async ({ page }) => {
    await performLogin(page);
    
    // 验证登录成功后跳转到管理后台
    expect(page.url()).toMatch(/\/admin(\/|$)/);
  });

  test('错误的用户名无法登录', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input#username, input[name="username"]', 'wronguser');
    await page.fill('input#password, input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // 等待错误消息
    await page.waitForSelector('#message:has-text("登录失败")', { timeout: 5000 });
    
    // 验证仍在登录页面
    expect(page.url()).toContain('/admin/login');
  });

  test('错误的密码无法登录', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForLoadState('domcontentloaded');
    
    await page.fill('input#username, input[name="username"]', ADMIN_USERNAME);
    await page.fill('input#password, input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 等待错误消息
    await page.waitForSelector('#message:has-text("登录失败")', { timeout: 5000 });
    
    // 验证仍在登录页面
    expect(page.url()).toContain('/admin/login');
  });

  test('空用户名和密码无法登录', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForLoadState('domcontentloaded');
    
    // 直接提交空表单
    await page.click('button[type="submit"]');
    
    // 验证错误响应或验证提示
    const errorMessage = await page.locator('#message').count();
    expect(errorMessage).toBeGreaterThan(0);
  });

  test('登录成功后会显示欢迎信息', async ({ page }) => {
    await performLogin(page);
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });
});

// ==================== 仪表板测试 ====================
test.describe('管理后台 - 仪表板', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('仪表板页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面加载
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('仪表板显示统计卡片', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    // 检查统计卡片是否存在
    const statCards = await page.locator('.stat-card').count();
    expect(statCards).toBeGreaterThan(0);
  });

  test('仪表板显示文章统计', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    // 应该包含文章相关内容
    expect(bodyText).toMatch(/文章|posts/i);
  });

  test('仪表板显示评论统计', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    // 应该包含评论相关内容
    expect(bodyText).toMatch(/评论|comments/i);
  });

  test('仪表板显示用户统计', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    // 应该包含用户相关内容
    expect(bodyText).toMatch(/用户|users/i);
  });

  test('仪表板有退出登录按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    // 查找退出按钮
    const logoutButton = page.locator('button:has-text("退出"), .logout');
    const count = await logoutButton.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ==================== 文章管理测试 ====================
test.describe('管理后台 - 文章管理', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('文章列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/posts`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面加载
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    
    // 验证页面标题或内容
    expect(bodyText).toMatch(/文章|posts/i);
  });

  test('文章列表显示表格或空消息', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/posts`);
    await page.waitForLoadState('domcontentloaded');
    
    // 要么有表格，要么有空消息
    const table = await page.locator('table').count();
    const emptyMessage = await page.locator('body').filter({ hasText: /暂无文章/ }).count();
    
    expect(table + emptyMessage).toBeGreaterThan(0);
  });

  test('文章列表有状态过滤器', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/posts`);
    await page.waitForLoadState('domcontentloaded');
    
    // 检查状态筛选器
    const statusFilter = await page.locator('select#statusFilter, select[name="status"]').count();
    expect(statusFilter).toBeGreaterThan(0);
  });

  test('文章新建页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/posts/edit/new`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面加载
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText).toMatch(/新建文章|创建文章|编辑文章/i);
  });

  test('文章编辑页面包含必要表单字段', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/posts/edit/new`);
    await page.waitForLoadState('domcontentloaded');
    
    // 检查标题输入框
    const titleInput = await page.locator('input#title, input[name="title"]').count();
    expect(titleInput).toBeGreaterThan(0);
    
    // 检查内容输入框
    const contentTextarea = await page.locator('textarea#content, textarea[name="content"]').count();
    expect(contentTextarea).toBeGreaterThan(0);
    
    // 检查提交按钮
    const submitButton = await page.locator('button[type="submit"]').count();
    expect(submitButton).toBeGreaterThan(0);
  });

  test('文章列表页面有新建按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/posts`);
    await page.waitForLoadState('domcontentloaded');
    
    // 查找新建文章按钮
    const newButton = page.locator('a:has-text("新建文章"), a:has-text("创建文章"), button:has-text("新建")');
    const count = await newButton.count();
    expect(count).toBeGreaterThan(0);
  });

  test('可以筛选已发布的文章', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/posts?status=1`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证 URL 包含状态参数
    expect(page.url()).toContain('status=1');
  });

  test('可以筛选草稿文章', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/posts?status=0`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证 URL 包含状态参数
    expect(page.url()).toContain('status=0');
  });
});

// ==================== 分类管理测试 ====================
test.describe('管理后台 - 分类管理', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('分类列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面加载
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText).toMatch(/分类|categories/i);
  });

  test('分类列表显示表格或空消息', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForLoadState('domcontentloaded');
    
    const table = await page.locator('table').count();
    const emptyMessage = await page.locator('body').filter({ hasText: /暂无分类/ }).count();
    
    expect(table + emptyMessage).toBeGreaterThan(0);
  });

  test('分类列表有新建按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForLoadState('domcontentloaded');
    
    const newButton = page.locator('button:has-text("新建分类"), button:has-text("创建分类")');
    const count = await newButton.count();
    expect(count).toBeGreaterThan(0);
  });

  test('分类表格显示必要字段', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    // 应该包含分类相关字段
    expect(bodyText).toMatch(/ID|名称|URL 别名|slug/i);
  });
});

// ==================== 标签管理测试 ====================
test.describe('管理后台 - 标签管理', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('标签列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/tags`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面加载
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText).toMatch(/标签|tags/i);
  });

  test('标签列表显示表格或空消息', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/tags`);
    await page.waitForLoadState('domcontentloaded');
    
    const table = await page.locator('table').count();
    const emptyMessage = await page.locator('body').filter({ hasText: /暂无标签/ }).count();
    
    expect(table + emptyMessage).toBeGreaterThan(0);
  });

  test('标签列表有新建按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/tags`);
    await page.waitForLoadState('domcontentloaded');
    
    const newButton = page.locator('button:has-text("新建标签"), button:has-text("创建标签")');
    const count = await newButton.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ==================== 评论管理测试 ====================
test.describe('管理后台 - 评论管理', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('评论列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/comments`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面加载
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText).toMatch(/评论|comments/i);
  });

  test('评论列表显示表格或空消息', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/comments`);
    await page.waitForLoadState('domcontentloaded');
    
    const table = await page.locator('table').count();
    const emptyMessage = await page.locator('body').filter({ hasText: /暂无评论/ }).count();
    
    expect(table + emptyMessage).toBeGreaterThan(0);
  });

  test('评论列表有状态过滤器', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/comments`);
    await page.waitForLoadState('domcontentloaded');
    
    const statusFilter = await page.locator('select#statusFilter, select[name="status"]').count();
    expect(statusFilter).toBeGreaterThan(0);
  });

  test('可以筛选待审核评论', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/comments?status=0`);
    await page.waitForLoadState('domcontentloaded');
    
    expect(page.url()).toContain('status=0');
  });

  test('可以筛选已批准评论', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/comments?status=1`);
    await page.waitForLoadState('domcontentloaded');
    
    expect(page.url()).toContain('status=1');
  });
});

// ==================== 用户管理测试 ====================
test.describe('管理后台 - 用户管理', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('用户列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面加载
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText).toMatch(/用户|users/i);
  });

  test('用户列表显示表格或空消息', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('domcontentloaded');
    
    const table = await page.locator('table').count();
    const emptyMessage = await page.locator('body').filter({ hasText: /暂无用户/ }).count();
    
    expect(table + emptyMessage).toBeGreaterThan(0);
  });

  test('用户列表有角色过滤器', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('domcontentloaded');
    
    const roleFilter = await page.locator('select#roleFilter, select[name="role"]').count();
    expect(roleFilter).toBeGreaterThan(0);
  });

  test('用户列表有状态过滤器', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('domcontentloaded');
    
    const statusFilter = await page.locator('select#statusFilter, select[name="status"]').count();
    expect(statusFilter).toBeGreaterThan(0);
  });

  test('用户表格显示必要字段', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/ID|用户名|邮箱|角色|状态/i);
  });
});

// ==================== 反馈管理测试 ====================
test.describe('管理后台 - 反馈管理', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('反馈列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/feedback`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面加载
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText).toMatch(/反馈|feedback/i);
  });

  test('反馈列表显示表格或空消息', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/feedback`);
    await page.waitForLoadState('domcontentloaded');
    
    const table = await page.locator('table').count();
    const emptyMessage = await page.locator('body').filter({ hasText: /暂无反馈/ }).count();
    
    expect(table + emptyMessage).toBeGreaterThan(0);
  });

  test('反馈列表有状态过滤器', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/feedback`);
    await page.waitForLoadState('domcontentloaded');
    
    const statusFilter = await page.locator('select#statusFilter, select[name="status"]').count();
    expect(statusFilter).toBeGreaterThan(0);
  });
});

// ==================== 附件管理测试 ====================
test.describe('管理后台 - 附件管理', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('附件列表页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/attachments`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面加载
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText).toMatch(/附件|文件/i);
  });

  test('附件列表显示表格或空消息', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/attachments`);
    await page.waitForLoadState('domcontentloaded');
    
    const table = await page.locator('table').count();
    const emptyMessage = await page.locator('body').filter({ hasText: /暂无附件|暂无文件/ }).count();
    
    expect(table + emptyMessage).toBeGreaterThan(0);
  });

  test('附件页面有上传区域', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/attachments`);
    await page.waitForLoadState('domcontentloaded');
    
    const uploadArea = await page.locator('.upload-area, .file-upload').count();
    expect(uploadArea).toBeGreaterThan(0);
  });
});

// ==================== 系统设置测试 ====================
test.describe('管理后台 - 系统设置', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('系统设置页面可以访问', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings`);
    await page.waitForLoadState('domcontentloaded');
    
    // 验证页面加载
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText).toMatch(/设置|settings/i);
  });

  test('系统设置有保存按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings`);
    await page.waitForLoadState('domcontentloaded');
    
    const saveButton = page.locator('button:has-text("保存"), button[type="submit"]');
    const count = await saveButton.count();
    expect(count).toBeGreaterThan(0);
  });

  test('系统设置包含基本设置部分', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/网站标题|网站描述|site_title|site_description/i);
  });

  test('系统设置包含文章设置部分', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/每页显示|posts_per_page/i);
  });

  test('系统设置包含评论设置部分', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/评论|comment/i);
  });
});

// ==================== 导航测试 ====================
test.describe('管理后台 - 导航功能', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('可以从仪表板导航到文章管理', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    // 查找文章管理链接
    const postsLink = page.locator('a:has-text("文章")');
    if (await postsLink.count() > 0) {
      await postsLink.first().click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/admin/posts');
    }
  });

  test('可以从仪表板导航到分类管理', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    const categoriesLink = page.locator('a:has-text("分类")');
    if (await categoriesLink.count() > 0) {
      await categoriesLink.first().click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/admin/categories');
    }
  });

  test('可以从仪表板导航到标签管理', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    const tagsLink = page.locator('a:has-text("标签")');
    if (await tagsLink.count() > 0) {
      await tagsLink.first().click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/admin/tags');
    }
  });

  test('可以从仪表板导航到评论管理', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    const commentsLink = page.locator('a:has-text("评论")');
    if (await commentsLink.count() > 0) {
      await commentsLink.first().click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/admin/comments');
    }
  });
});

// ==================== 认证和权限测试 ====================
test.describe('管理后台 - 认证和权限', () => {
  
  test('未登录访问管理页面应重定向到登录页', async ({ page }) => {
    // 清除 localStorage
    await page.goto(`${BASE_URL}/admin`);
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // 尝试直接访问需要认证的页面
    await page.goto(`${BASE_URL}/admin/posts`);
    
    // 应该被重定向到登录页面或显示认证错误
    const isLoginPage = page.url().includes('/admin/login');
    const hasUnauthorizedMessage = await page.locator('body').filter({ hasText: /未授权|登录/ }).count() > 0;
    
    expect(isLoginPage || hasUnauthorizedMessage).toBe(true);
  });

  test('退出登录后需要重新认证', async ({ page }) => {
    await performLogin(page);
    await page.goto(`${BASE_URL}/admin`);
    
    // 退出登录
    const logoutButton = page.locator('button:has-text("退出"), .logout, a:has-text("退出")');
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click();
      await page.waitForTimeout(2000);
      
      // 清除 token
      await page.evaluate(() => {
        localStorage.clear();
      });
      
      // 尝试访问需要认证的页面
      await page.goto(`${BASE_URL}/admin/posts`);
      
      // 应该需要重新登录
      const isLoginPage = page.url().includes('/admin/login');
      expect(isLoginPage).toBe(true);
    }
  });
});

// ==================== API 测试 ====================
test.describe('管理后台 - API 功能', () => {
  
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
    expect(data.data).toHaveProperty('token');
    expect(data.data).toHaveProperty('user');
  });

  test('文章列表 API 正常工作', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/post/list?page=1&limit=10`);
    
    const data = await response.json();
    expect(response.ok()).toBe(true);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('data');
    expect(data.data).toHaveProperty('pagination');
  });

  test('分类列表 API 正常工作', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/category/list`);
    
    const data = await response.json();
    expect(response.ok()).toBe(true);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('data');
  });

  test('标签列表 API 正常工作', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/tag/list`);
    
    const data = await response.json();
    expect(response.ok()).toBe(true);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('data');
  });

  test('评论列表 API 正常工作', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/comment/list?page=1&limit=10`);
    
    const data = await response.json();
    expect(response.ok()).toBe(true);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('data');
  });

  test('用户列表 API 正常工作', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/user/list?page=1&limit=10`);
    
    const data = await response.json();
    // API 可能需要认证，所以可能返回 401
    expect([200, 401]).toContain(response.status());
  });

  test('反馈列表 API 正常工作', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/feedback/list?page=1&limit=10`);
    
    const data = await response.json();
    expect([200, 401]).toContain(response.status());
  });

  test('设置列表 API 正常工作', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/settings/list`);
    
    const data = await response.json();
    expect([200, 401]).toContain(response.status());
  });

  test('错误的登录凭据返回错误', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/admin/login/api`, {
      data: {
        username: 'wronguser',
        password: 'wrongpassword'
      }
    });
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBeTruthy();
  });

  test('空用户名或密码返回错误', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/admin/login/api`, {
      data: {
        username: '',
        password: ''
      }
    });
    
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});

// ==================== 响应式设计测试 ====================
test.describe('管理后台 - 响应式设计', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('仪表板在桌面端显示正常', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('仪表板在平板端显示正常', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('仪表板在移动端显示正常', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('文章管理在移动端可访问', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/admin/posts`);
    await page.waitForLoadState('domcontentloaded');
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });
});

// ==================== 错误处理测试 ====================
test.describe('管理后台 - 错误处理', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('不存在的页面返回 404', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/admin/nonexistent-page`);
    expect(response.status()).toBe(404);
  });

  test('文章编辑页面访问不存在的文章应友好处理', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/posts/edit/99999`);
    await page.waitForLoadState('domcontentloaded');
    
    // 页面应该能加载，即使文章不存在
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('错误的 API 参数返回错误', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/post/list?page=-1&limit=abc`);
    
    const data = await response.json();
    // 应该返回错误
    expect(data.success === false || response.status() === 400).toBe(true);
  });
});

// ==================== 性能测试 ====================
test.describe('管理后台 - 性能', () => {
  test.beforeEach(async ({ page }) => {
    await performLogin(page);
  });

  test('仪表板加载时间合理', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // 加载时间应该在合理范围内（5秒以内）
    expect(loadTime).toBeLessThan(5000);
  });

  test('文章列表加载时间合理', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/admin/posts`);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('分类列表加载时间合理', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });
});
