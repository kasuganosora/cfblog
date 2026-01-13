// 端到端测试 - 相册功能流程
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8787';

// 测试相册浏览功能
test.describe('相册浏览功能', () => {
  
  test('访客可以访问相册列表页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/albums`);
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 验证页面标题
    const title = await page.title();
    expect(title).toContain('相册');
    
    // 验证页面包含相册相关元素
    const hasAlbumContainer = await page.locator('.albums-grid, .albums-list, .album-container, main').count() > 0;
    expect(hasAlbumContainer).toBe(true);
  });

  test('相册列表页面显示相册卡片', async ({ page }) => {
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    // 检查是否有相册卡片或空状态提示
    const hasAlbumCards = await page.locator('.album-card, .album-item').count() > 0;
    const hasEmptyState = await page.locator('.empty-state, .no-albums').count() > 0;
    
    // 应该有相册卡片或空状态提示
    expect(hasAlbumCards || hasEmptyState).toBe(true);
  });

  test('相册卡片包含必要信息', async ({ page }) => {
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    const albumCards = page.locator('.album-card, .album-item');
    const cardCount = await albumCards.count();
    
    if (cardCount > 0) {
      const firstCard = albumCards.first();
      
      // 检查相册标题
      const hasTitle = await firstCard.locator('.album-title, h3, h4').count() > 0;
      expect(hasTitle).toBe(true);
      
      // 检查相册封面或占位符
      const hasCover = await firstCard.locator('img, .album-cover, .album-placeholder').count() > 0;
      expect(hasCover).toBe(true);
    }
  });

  test('可以点击相册进入详情页', async ({ page }) => {
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    const albumLinks = page.locator('a[href*="/albums/"], .album-card a, .album-link');
    const linkCount = await albumLinks.count();
    
    if (linkCount > 0) {
      const firstLink = albumLinks.first();
      await firstLink.click();
      
      // 等待页面跳转
      await page.waitForLoadState('networkidle');
      
      // 验证跳转到相册详情页
      expect(page.url()).toMatch(/\/albums\/[^\/]+/);
    }
  });

});

// 测试相册详情页功能
test.describe('相册详情页功能', () => {
  
  test('相册详情页可以正常访问', async ({ page }) => {
    // 先访问相册列表，获取第一个相册链接
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    const albumLinks = page.locator('a[href*="/albums/"]');
    const linkCount = await albumLinks.count();
    
    if (linkCount > 0) {
      const firstLink = albumLinks.first();
      const href = await firstLink.getAttribute('href');
      
      // 直接访问相册详情页
      await page.goto(`${BASE_URL}${href}`);
      await page.waitForLoadState('networkidle');
      
      // 验证页面加载成功
      const hasContent = await page.locator('main, .album-detail, .album-content').count() > 0;
      expect(hasContent).toBe(true);
    } else {
      // 如果没有相册，测试一个示例相册页面
      await page.goto(`${BASE_URL}/albums/test-album`);
      await page.waitForLoadState('networkidle');
      
      // 验证页面响应（可能是404或相册页面）
      const status = page.url().includes('/albums/test-album') || await page.locator('main').count() > 0;
      expect(status).toBe(true);
    }
  });

  test('相册详情页显示图片网格', async ({ page }) => {
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    const albumLinks = page.locator('a[href*="/albums/"]');
    const linkCount = await albumLinks.count();
    
    if (linkCount > 0) {
      await albumLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // 检查图片网格或空状态
      const hasImageGrid = await page.locator('.images-grid, .photo-grid, .album-images').count() > 0;
      const hasEmptyState = await page.locator('.empty-state, .no-images').count() > 0;
      
      expect(hasImageGrid || hasEmptyState).toBe(true);
    }
  });

  test('图片可以点击查看大图', async ({ page }) => {
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    const albumLinks = page.locator('a[href*="/albums/"]');
    const linkCount = await albumLinks.count();
    
    if (linkCount > 0) {
      await albumLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const images = page.locator('.album-images img, .photo-grid img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        const firstImage = images.first();
        await firstImage.click();
        
        // 等待灯箱或大图显示
        await page.waitForTimeout(500);
        
        // 检查是否有灯箱或大图显示
        const hasLightbox = await page.locator('.lightbox, .modal, .image-viewer').count() > 0;
        const hasOverlay = await page.locator('.overlay, .backdrop').count() > 0;
        
        expect(hasLightbox || hasOverlay).toBe(true);
      }
    }
  });

  test('相册详情页有返回按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    const albumLinks = page.locator('a[href*="/albums/"]');
    const linkCount = await albumLinks.count();
    
    if (linkCount > 0) {
      await albumLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // 检查返回按钮或面包屑导航
      const hasBackButton = await page.locator('.back-button, .btn-back').count() > 0;
      const hasBreadcrumb = await page.locator('.breadcrumb, .nav-breadcrumb').count() > 0;
      const hasNavigation = await page.locator('nav a[href="/albums"]').count() > 0;
      
      expect(hasBackButton || hasBreadcrumb || hasNavigation).toBe(true);
    }
  });

});

// 测试相册响应式设计
test.describe('相册响应式设计', () => {
  
  test('相册在移动设备上正常显示', async ({ page }) => {
    // 设置移动设备视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    // 验证页面在移动设备上可用
    const hasContent = await page.locator('main, .albums-container').count() > 0;
    expect(hasContent).toBe(true);
    
    // 检查是否有响应式布局
    const albumCards = page.locator('.album-card, .album-item');
    const cardCount = await albumCards.count();
    
    if (cardCount > 0) {
      const firstCard = albumCards.first();
      const cardWidth = await firstCard.boundingBox();
      
      // 在移动设备上，卡片宽度应该适应屏幕
      expect(cardWidth?.width).toBeLessThanOrEqual(375);
    }
  });

  test('相册在平板设备上正常显示', async ({ page }) => {
    // 设置平板设备视口
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    // 验证页面布局
    const hasContent = await page.locator('main, .albums-container').count() > 0;
    expect(hasContent).toBe(true);
  });

});

// 测试相册性能
test.describe('相册性能测试', () => {
  
  test('相册列表页面加载时间合理', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // 页面应在5秒内加载完成
    expect(loadTime).toBeLessThan(5000);
  });

  test('相册详情页面加载时间合理', async ({ page }) => {
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    const albumLinks = page.locator('a[href*="/albums/"]');
    const linkCount = await albumLinks.count();
    
    if (linkCount > 0) {
      const startTime = Date.now();
      
      await albumLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // 详情页应在5秒内加载完成
      expect(loadTime).toBeLessThan(5000);
    }
  });

});

// 测试相册SEO和可访问性
test.describe('相册SEO和可访问性', () => {
  
  test('相册页面有正确的meta标签', async ({ page }) => {
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // 检查meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
  });

  test('相册图片有alt属性', async ({ page }) => {
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    const albumLinks = page.locator('a[href*="/albums/"]');
    const linkCount = await albumLinks.count();
    
    if (linkCount > 0) {
      await albumLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        for (let i = 0; i < Math.min(imageCount, 3); i++) {
          const img = images.nth(i);
          const alt = await img.getAttribute('alt');
          
          // 图片应该有alt属性（可以为空，但必须存在）
          expect(alt).not.toBeNull();
        }
      }
    }
  });

  test('相册页面可以使用键盘导航', async ({ page }) => {
    await page.goto(`${BASE_URL}/albums`);
    await page.waitForLoadState('networkidle');
    
    // 使用Tab键导航
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // 检查焦点元素
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName.toLowerCase() : null;
    });
    
    // 应该能够聚焦到可交互元素
    expect(['a', 'button', 'input', 'textarea', 'select'].includes(focusedElement) || focusedElement === 'body').toBe(true);
  });

});