// 端到端测试 - 用户完整流程
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8787';

// 测试访客浏览流程
test.describe('访客浏览流程', () => {
  
  test('访客可以浏览首页', async ({ page }) => {
    await page.goto(BASE_URL);

    // 检查页面标题
    const title = await page.title();
    expect(title).toBeTruthy();

    // 检查主要内容区域
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // 检查导航链接（多种方式查找）
    const hasHomeLink = await page.locator('a:has-text("首页")').count() > 0;
    const hasCategoriesLink = await page.locator('a:has-text("分类")').count() > 0;
    const hasTagsLink = await page.locator('a:has-text("标签")').count() > 0;

    // 至少应该有导航链接
    expect(hasHomeLink || hasCategoriesLink || hasTagsLink).toBe(true);

    // 检查搜索框（如果存在）
    const searchInput = page.locator('input[placeholder*="搜索"], input[type="search"]');
    const hasSearch = await searchInput.count() > 0;
    if (hasSearch) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('访客可以浏览分类列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/categories`);

    // 检查页面标题
    const title = await page.title();
    expect(title).toBeTruthy();

    // 检查分类标题（可能是 h1 或 h2）
    const hasHeading = await page.locator('h1:has-text("分类"), h2:has-text("分类")').count() > 0;
    expect(hasHeading).toBe(true);
  });

  test('访客可以浏览标签列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/tags`);

    // 检查页面标题
    const title = await page.title();
    expect(title).toBeTruthy();

    // 检查标签标题
    const hasHeading = await page.locator('h1:has-text("标签"), h2:has-text("标签")').count() > 0;
    expect(hasHeading).toBe(true);
  });

  test('访客可以搜索文章', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);

    // 检查搜索表单
    const searchInput = page.locator('input[name="keyword"]');
    await expect(searchInput).toBeVisible();

    // 输入搜索关键词
    await searchInput.fill('test');

    // 提交搜索
    await searchInput.press('Enter');

    // 等待导航完成
    await page.waitForLoadState('networkidle');

    // 验证 URL 包含搜索关键词
    expect(page.url()).toContain('keyword=test');
  });

  test('访客可以访问关于页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/about`);

    // 检查页面标题
    const title = await page.title();
    expect(title).toBeTruthy();

    // 检查关于内容（多种可能的标题）
    const hasHeading = await page.locator('h1:has-text("关于"), h2:has-text("关于"), h1:has-text("关于我们"), h2:has-text("关于我们")').count() > 0;
    expect(hasHeading).toBe(true);
  });

  test('访客可以访问联系页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);

    // 检查页面标题
    const title = await page.title();
    expect(title).toBeTruthy();

    // 检查联系表单
    const hasHeading = await page.locator('h1:has-text("联系"), h2:has-text("联系"), h1:has-text("联系我们"), h2:has-text("联系我们")').count() > 0;
    expect(hasHeading).toBe(true);
  });

  test('访客可以访问留言页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/feedback`);

    // 检查页面标题
    const title = await page.title();
    expect(title).toBeTruthy();

    // 检查留言表单
    const hasHeading = await page.locator('h1:has-text("留言"), h2:has-text("留言"), h1:has-text("反馈"), h2:has-text("反馈"), h1:has-text("留言反馈"), h2:has-text("留言反馈")').count() > 0;
    expect(hasHeading).toBe(true);

    // 检查表单字段
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea[name="content"]')).toBeVisible();
  });

  test('访客可以访问登录页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // 检查页面标题
    const title = await page.title();
    expect(title).toBeTruthy();

    // 检查登录表单
    const hasHeading = await page.locator('h1:has-text("登录"), h2:has-text("登录"), h1:has-text("管理员登录"), h2:has-text("管理员登录")').count() > 0;
    expect(hasHeading).toBe(true);

    // 检查密码输入框
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // 检查登录按钮
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

});

// 测试导航流程
test.describe('导航流程', () => {
  
  test('访客可以在不同页面间导航', async ({ page }) => {
    // 从首页开始
    await page.goto(BASE_URL);
    
    // 点击分类链接
    await page.getByRole('link', { name: '分类' }).click();
    await expect(page).toHaveURL(/\/categories/);
    
    // 点击标签链接
    await page.getByRole('link', { name: '标签' }).click();
    await expect(page).toHaveURL(/\/tags/);
    
    // 点击首页链接
    await page.getByRole('link', { name: '首页' }).click();
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('访客可以使用导航栏的 logo 返回首页', async ({ page }) => {
    await page.goto(`${BASE_URL}/categories`);
    
    // 点击 logo（博客标题）
    await page.locator('header h1 a').click();
    
    // 验证返回首页
    await expect(page).toHaveURL(BASE_URL + '/');
  });

});

// 测试响应式设计
test.describe('响应式设计', () => {
  
  test('网站在移动设备上正常显示', async ({ page }) => {
    // 设置移动设备视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    // 检查主要内容可见
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('网站在平板设备上正常显示', async ({ page }) => {
    // 设置平板设备视口
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    
    // 检查主要内容可见
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('网站在桌面设备上正常显示', async ({ page }) => {
    // 设置桌面设备视口
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);
    
    // 检查主要内容可见
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

});

// 测试页面加载性能
test.describe('页面性能', () => {
  
  test('首页在合理时间内加载', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    const loadTime = Date.now() - startTime;
    
    // 页面应在 3 秒内加载完成
    expect(loadTime).toBeLessThan(3000);
  });

  test('搜索页面在合理时间内加载', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/search`);
    const loadTime = Date.now() - startTime;
    
    // 页面应在 3 秒内加载完成
    expect(loadTime).toBeLessThan(3000);
  });

});

// 测试可访问性
test.describe('可访问性', () => {
  
  test('页面有正确的语义化 HTML 结构', async ({ page }) => {
    await page.goto(BASE_URL);

    // 检查语义化标签
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // nav 标签可能不存在，检查即可
    const navExists = await page.locator('nav').count() > 0;
    if (!navExists) {
      // 如果没有 nav，检查是否有导航链接
      const hasLinks = await page.locator('nav a, header a').count() > 0;
      expect(hasLinks).toBe(true);
    }
  });

  test('表单元素有关联的标签', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // 检查密码输入框有标签
    const passwordLabel = page.locator('label[for="password"]');
    await expect(passwordLabel).toBeVisible();
    
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toBeVisible();
  });

});
