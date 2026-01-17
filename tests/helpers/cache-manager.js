/**
 * Cache Manager - 清空所有缓存
 * 用于确保测试环境的干净状态
 */

const fs = require('fs');
const path = require('path');

class CacheManager {
  constructor() {
    this.cachePaths = [
      path.join(process.cwd(), '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject'),
      path.join(process.cwd(), '.wrangler', 'state', 'v3', 'kv', 'miniflare-KVNamespace'),
      path.join(process.cwd(), '.wrangler', 'state', 'v3', 'r2', 'miniflare-R2Bucket'),
      path.join(process.cwd(), 'node_modules', '.cache'),
    ];
  }

  /**
   * 清空所有缓存
   */
  async clearAllCaches() {
    console.log('🧹 Clearing all caches...');
    
    for (const cachePath of this.cachePaths) {
      if (fs.existsSync(cachePath)) {
        try {
          fs.rmSync(cachePath, { recursive: true, force: true });
          console.log(`  ✓ Cleared: ${path.basename(cachePath)}`);
        } catch (error) {
          console.warn(`  ✗ Failed to clear ${cachePath}: ${error.message}`);
        }
      }
    }

    // 清空 localStorage（需要在浏览器中执行）
    console.log('  ✓ LocalStorage will be cleared in browser');
    
    console.log('✅ All caches cleared!\n');
  }

  /**
   * 清空数据库测试数据
   */
  async clearTestData() {
    console.log('🗄️  Clearing test data from database...');
    
    const { execSync } = require('child_process');
    
    try {
      const commands = [
        'DELETE FROM comments;',
        'DELETE FROM feedback;',
        'DELETE FROM post_tags;',
        'DELETE FROM post_categories;',
        'DELETE FROM posts WHERE author_id > 1;',
        'DELETE FROM tags;',
        'DELETE FROM categories;',
        'DELETE FROM users WHERE id > 1;',
        'DELETE FROM settings WHERE key LIKE "test%";'
      ];

      for (const sql of commands) {
        execSync(`npx wrangler d1 execute cfblog-database --local --command="${sql}"`, {
          encoding: 'utf-8',
          stdio: ['ignore', 'ignore', 'pipe']
        });
      }

      console.log('✅ Test data cleared from database!\n');
    } catch (error) {
      console.warn(`⚠️  Warning: Could not clear database: ${error.message}\n`);
    }
  }

  /**
   * 重置缓存为干净状态（在浏览器上下文中使用）
   */
  static async clearBrowserCache(page) {
    await page.goto('about:blank');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    });
  }
}

export default CacheManager;
