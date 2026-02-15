/**
 * E2E Test Global Setup
 * Seeds the local D1 database with test data using PBKDF2-compatible passwords.
 */

const { execSync } = require('child_process');
const { pbkdf2Sync, randomBytes } = require('crypto');
const { existsSync, readdirSync } = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

/**
 * Generate a PBKDF2 hash compatible with src/utils/auth.js
 * Format: pbkdf2:100000:salt_hex:hash_hex
 */
function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  return `pbkdf2:100000:${salt.toString('hex')}:${hash.toString('hex')}`;
}

module.exports = async function globalSetup() {
  console.log('[global-setup] Applying migrations...');

  // Apply migrations
  execSync('npx wrangler d1 migrations apply cfblog-database --local', {
    cwd: ROOT,
    stdio: 'pipe',
  });

  console.log('[global-setup] Seeding test data...');

  const adminHash = hashPassword('admin123');

  const statements = [
    // Clear existing test data
    `DELETE FROM post_tags`,
    `DELETE FROM post_categories`,
    `DELETE FROM comments`,
    `DELETE FROM feedback`,
    `DELETE FROM posts`,
    `DELETE FROM categories`,
    `DELETE FROM tags`,
    `DELETE FROM users`,

    // Insert admin user with PBKDF2 hash
    `INSERT INTO users (id, username, email, password_hash, display_name, role, status) VALUES (1, 'admin', 'admin@example.com', '${adminHash}', 'Admin', 'admin', 1)`,

    // Insert categories
    `INSERT INTO categories (id, name, slug, description, sort_order) VALUES (1, '技术', 'tech', '技术相关文章', 1)`,
    `INSERT INTO categories (id, name, slug, description, sort_order) VALUES (2, '生活', 'life', '生活随笔', 2)`,

    // Insert tags
    `INSERT INTO tags (id, name, slug) VALUES (1, 'JavaScript', 'javascript')`,
    `INSERT INTO tags (id, name, slug) VALUES (2, 'Cloudflare', 'cloudflare')`,

    // Insert posts (status=1 means published)
    `INSERT INTO posts (id, title, slug, excerpt, author_id, status, comment_status, view_count, published_at, created_at) VALUES (1, 'Cloudflare Workers 入门', 'cloudflare-workers-intro', '学习如何使用 Cloudflare Workers 构建无服务器应用', 1, 1, 1, 100, datetime('now'), datetime('now'))`,
    `INSERT INTO posts (id, title, slug, excerpt, author_id, status, comment_status, view_count, published_at, created_at) VALUES (2, 'JavaScript 最佳实践', 'javascript-best-practices', '分享 JavaScript 开发中的最佳实践和技巧', 1, 1, 1, 50, datetime('now'), datetime('now'))`,
    `INSERT INTO posts (id, title, slug, excerpt, author_id, status, comment_status, view_count, published_at, created_at) VALUES (3, '评论已关闭的文章', 'closed-comments', '这篇文章已关闭评论', 1, 1, 0, 10, datetime('now'), datetime('now'))`,

    // Link posts to categories
    `INSERT INTO post_categories (post_id, category_id) VALUES (1, 1)`,
    `INSERT INTO post_categories (post_id, category_id) VALUES (2, 1)`,
    `INSERT INTO post_categories (post_id, category_id) VALUES (3, 2)`,

    // Link posts to tags
    `INSERT INTO post_tags (post_id, tag_id) VALUES (1, 2)`,
    `INSERT INTO post_tags (post_id, tag_id) VALUES (2, 1)`,

    // Insert comments for post 1
    `INSERT INTO comments (id, post_id, author_name, author_email, content, status, created_at) VALUES (1, 1, '张三', 'zhangsan@example.com', '写得不错，学到很多！', 1, datetime('now'))`,
    `INSERT INTO comments (id, post_id, author_name, author_email, content, status, created_at) VALUES (2, 1, '李四', 'lisi@example.com', '期待更多这样的文章', 1, datetime('now'))`,
  ];

  for (const stmt of statements) {
    try {
      execSync(
        `npx wrangler d1 execute cfblog-database --local --command="${stmt.replace(/"/g, '\\"')}"`,
        { cwd: ROOT, stdio: 'pipe' }
      );
    } catch (err) {
      // Ignore errors for DELETE on non-existent data
      if (!stmt.startsWith('DELETE')) {
        console.error(`[global-setup] Failed to execute: ${stmt.substring(0, 80)}...`);
        console.error(err.stderr?.toString() || err.message);
      }
    }
  }

  console.log('[global-setup] Test data seeded successfully');
};
