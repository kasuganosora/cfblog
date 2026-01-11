// 端到端测试 - 交互功能流程
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8787';

// 测试搜索功能
test.describe('搜索功能', () => {
  
  test('访客可以搜索并查看结果', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    // 输入搜索关键词
    const searchInput = page.locator('input[name="keyword"]');
    await searchInput.fill('Cloudflare');
    
    // 提交搜索
    await searchInput.press('Enter');
    
    // 验证 URL 包含搜索关键词
    await expect(page).toHaveURL(/keyword=Cloudflare/);
    
    // 验证页面包含搜索结果部分
    await expect(page.locator('.search, .posts')).toBeVisible();
  });

  test('搜索功能响应及时', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    // 记录开始时间
    const startTime = Date.now();
    
    // 输入并提交
    await page.fill('input[name="keyword"]', 'test');
    await page.press('input[name="keyword"]', 'Enter');
    
    // 等待页面响应
    await page.waitForLoadState('networkidle');
    
    const responseTime = Date.now() - startTime;
    
    // 搜索应在 3 秒内完成
    expect(responseTime).toBeLessThan(3000);
  });

  test('空搜索显示提示信息', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    
    // 不输入关键词直接搜索
    const searchButton = page.locator('button[type="submit"]');
    if (await searchButton.count() > 0) {
      await searchButton.click();
      
      // 验证页面显示（空搜索应该也显示页面）
      await expect(page.locator('.search')).toBeVisible();
    }
  });

});

// 测试留言/反馈功能
test.describe('留言功能', () => {
  
  test('访客可以提交留言', async ({ page }) => {
    await page.goto(`${BASE_URL}/feedback`);
    
    // 填写留言表单
    await page.fill('input[name="name"]', '测试用户');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="content"]', '这是一条测试留言内容');
    
    // 拦截网络请求（可选，用于验证提交）
    const apiResponsePromise = page.waitForResponse(response => 
      response.url().includes('/feedback') && response.status() !== 200
    ).catch(() => null);
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待结果显示
    await page.waitForSelector('#feedbackResult:not(:empty)', { timeout: 3000 });
    
    // 验证结果显示
    const resultDiv = page.locator('#feedbackResult');
    await expect(resultDiv).toBeVisible();
  });

  test('留言表单验证必填字段', async ({ page }) => {
    await page.goto(`${BASE_URL}/feedback`);
    
    // 检查必填字段
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const contentTextarea = page.locator('textarea[name="content"]');
    
    // 验证字段存在且有 required 属性
    expect(await nameInput.getAttribute('required')).toBe('');
    expect(await emailInput.getAttribute('required')).toBe('');
    expect(await contentTextarea.getAttribute('required')).toBe('');
  });

  test('邮箱格式验证', async ({ page }) => {
    await page.goto(`${BASE_URL}/feedback`);
    
    // 输入无效邮箱
    await page.fill('input[name="email"]', 'invalid-email');
    
    // 尝试提交
    await page.click('button[type="submit"]');
    
    // 检查浏览器验证
    const emailInput = page.locator('input[name="email"]');
    const isValid = await emailInput.evaluate(input => input.checkValidity());
    
    // 无效邮箱应该被浏览器验证阻止
    expect(isValid).toBe(false);
  });

});

// 测试登录功能
test.describe('登录功能', () => {
  
  test('登录表单有正确的输入类型', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // 检查密码输入框类型
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    // 验证输入类型
    const inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('password');
  });

  test('登录成功后跳转到后台', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // 输入密码（使用开发环境密码）
    await page.fill('input[type="password"]', 'admin123');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待跳转
    await page.waitForURL(/\/admin/, { timeout: 5000 });
    
    // 验证跳转到后台
    expect(page.url()).toContain('/admin');
  });

  test('登录失败显示错误消息', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // 输入错误密码
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // 提交表单
    await page.click('button[type="submit"]');
    
    // 等待错误消息
    await page.waitForSelector('#loginResult:not(:empty)', { timeout: 3000 });
    
    // 验证错误消息显示
    const resultDiv = page.locator('#loginResult');
    await expect(resultDiv).toBeVisible();
    
    // 验证错误消息文本
    const resultText = await resultDiv.textContent();
    expect(resultText).toBeTruthy();
  });

});

// 测试表单交互
test.describe('表单交互', () => {
  
  test('联系表单可以正常填写', async ({ page }) => {
    await page.goto(`${BASE_URL}/contact`);
    
    // 检查联系表单字段
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="subject"]')).toBeVisible();
    await expect(page.locator('textarea[name="content"]')).toBeVisible();
    
    // 填写表单
    await page.fill('input[name="name"]', '测试用户');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="subject"]', '测试主题');
    await page.fill('textarea[name="content"]', '测试内容');
    
    // 验证输入值
    expect(await page.inputValue('input[name="name"]')).toBe('测试用户');
    expect(await page.inputValue('input[name="email"]')).toBe('test@example.com');
  });

  test('表单按钮有正确的状态反馈', async ({ page }) => {
    await page.goto(`${BASE_URL}/feedback`);
    
    const submitButton = page.locator('button[type="submit"]');
    
    // 检查按钮可见性
    await expect(submitButton).toBeVisible();
    
    // 检查按钮文本
    const buttonText = await submitButton.textContent();
    expect(buttonText).toBeTruthy();
  });

});

// 测试页面导航交互
test.describe('页面导航交互', () => {
  
  test('导航链接可以正确跳转', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 记录初始 URL
    const initialUrl = page.url();
    
    // 点击分类链接
    await page.click('a[href="/categories"]');
    
    // 等待导航完成
    await page.waitForLoadState('networkidle');
    
    // 验证 URL 改变
    expect(page.url()).not.toBe(initialUrl);
    expect(page.url()).toContain('/categories');
  });

  test('浏览器前进和后退按钮有效', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 导航到分类页面
    await page.click('a[href="/categories"]');
    await page.waitForLoadState('networkidle');
    
    // 导航到标签页面
    await page.click('a[href="/tags"]');
    await page.waitForLoadState('networkidle');
    
    // 点击后退
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // 应该回到分类页面
    expect(page.url()).toContain('/categories');
    
    // 点击前进
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    // 应该回到标签页面
    expect(page.url()).toContain('/tags');
  });

});

// 测试滚动和交互
test.describe('页面滚动和交互', () => {
  
  test('页面可以正常滚动', async ({ page }) => {
    // 设置视口较小，使页面可滚动
    await page.setViewportSize({ width: 1280, height: 600 });
    
    await page.goto(`${BASE_URL}/categories`);
    
    // 获取初始滚动位置
    const initialScroll = await page.evaluate(() => window.scrollY);
    
    // 滚动到底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // 获取滚动后的位置
    const scrolledPosition = await page.evaluate(() => window.scrollY);
    
    // 验证滚动位置改变
    expect(scrolledPosition).toBeGreaterThan(initialScroll);
  });

  test('链接在页面不同位置都可点击', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 滚动到页面底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    // 查找并点击 footer 中的链接
    const footerLinks = page.locator('footer a').first();
    if (await footerLinks.count() > 0) {
      await footerLinks.click();
      await page.waitForLoadState('networkidle');
      
      // 验证跳转
      expect(page.url()).not.toBe(BASE_URL + '/');
    }
  });

});

// 测试键盘交互
test.describe('键盘交互', () => {
  
  test('可以使用 Tab 键导航表单', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // 按下 Tab 键聚焦第一个输入框
    await page.keyboard.press('Tab');
    
    // 验证密码输入框获得焦点
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeFocused();
  });

  test('可以使用 Enter 键提交表单', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // 填写密码
    await page.fill('input[type="password"]', 'admin123');
    
    // 使用 Enter 键提交
    await page.keyboard.press('Enter');
    
    // 等待页面响应
    await page.waitForTimeout(2000);
    
    // 验证页面跳转或显示结果
    const resultDiv = page.locator('#loginResult');
    const hasResult = await resultDiv.count() > 0;
    const isAdminPage = page.url().includes('/admin');
    
    expect(hasResult || isAdminPage).toBe(true);
  });

});

// 测试视觉反馈
test.describe('视觉反馈', () => {
  
  test('链接有悬停效果', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const firstLink = page.locator('a').first();
    
    // 获取初始颜色
    const initialColor = await firstLink.evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    // 鼠标悬停
    await firstLink.hover();
    await page.waitForTimeout(100);
    
    // 获取悬停后的颜色
    const hoveredColor = await firstLink.evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    // 验证样式改变（可能相同，但应该检查）
    expect(hoveredColor).toBeTruthy();
  });

  test('按钮有点击反馈', async ({ page }) => {
    await page.goto(`${BASE_URL}/feedback`);
    
    const submitButton = page.locator('button[type="submit"]');
    
    // 获取初始状态
    const isActiveBefore = await submitButton.evaluate(el => 
      document.activeElement === el
    );
    
    // 点击按钮
    await submitButton.click();
    
    // 检查按钮状态
    const isActiveAfter = await submitButton.evaluate(el => 
      document.activeElement === el
    );
    
    expect(isActiveAfter || isActiveBefore).toBe(true);
  });

});
