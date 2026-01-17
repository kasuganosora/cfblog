/**
 * CFBlog Test Data Importer v3 - Simplified
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'cfblog-database';
const ENV = '--local';

function executeSQL(sql) {
  const tempFile = path.join(__dirname, '.temp-sql.sql');
  fs.writeFileSync(tempFile, sql);

  try {
    const result = execSync(
      `npx wrangler d1 execute ${DB_NAME} ${ENV} --file="${tempFile}" --json`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.stdout || error.message };
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

function escapeString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.toString().replace(/'/g, "''")}'`;
}

function randomDate(daysBack) {
  const now = new Date();
  const past = new Date(now - daysBack * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime).toISOString().slice(0, 19).replace('T', ' ');
}

function hashPassword(password) {
  return require('crypto').createHash('sha256').update(password).digest('hex');
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function clearAndImport() {
  console.log('CFBlog Test Data Importer v3');
  console.log('==============================\n');

  // Clear all tables
  console.log('=== Clearing existing data ===');
  const tables = ['post_tags', 'post_categories', 'comments', 'feedback', 'posts', 'tags', 'categories', 'attachments', 'settings'];
  for (const table of tables) {
    executeSQL(`DELETE FROM ${table};`);
    console.log(`  ✓ Cleared ${table}`);
  }
  executeSQL(`DELETE FROM users WHERE id > 1;`);
  console.log(`  ✓ Cleared test users`);
  console.log('');

  // Import Categories (with correct IDs)
  console.log('=== Importing Categories ===');
  const categories = [
    `INSERT INTO categories (name, slug, description, parent_id, sort_order, created_at, updated_at) VALUES ('Technology', 'technology', 'Technology and tech-related articles', NULL, 10, '${randomDate(300)}', '${randomDate(300)}');`,
    `INSERT INTO categories (name, slug, description, parent_id, sort_order, created_at, updated_at) VALUES ('Programming', 'programming', 'Programming tutorials and tips', NULL, 20, '${randomDate(300)}', '${randomDate(300)}');`,
    `INSERT INTO categories (name, slug, description, parent_id, sort_order, created_at, updated_at) VALUES ('Web Development', 'web-development', 'Web development topics', NULL, 30, '${randomDate(300)}', '${randomDate(300)}');`,
    `INSERT INTO categories (name, slug, description, parent_id, sort_order, created_at, updated_at) VALUES ('Cloud Computing', 'cloud-computing', 'Cloud computing services', NULL, 40, '${randomDate(300)}', '${randomDate(300)}');`,
  ];

  for (const sql of categories) {
    const result = executeSQL(sql);
    console.log(result.success ? '  ✓ Imported category' : '  ✗ Failed');
  }

  // Import sub-categories (after getting parent IDs)
  const subCats = [
    { name: 'JavaScript', slug: 'javascript', description: 'JavaScript framework and libraries', parent_slug: 'programming', sort_order: 10 },
    { name: 'Python', slug: 'python', description: 'Python programming language', parent_slug: 'programming', sort_order: 20 },
    { name: 'Cloudflare Workers', slug: 'cloudflare-workers', description: 'Cloudflare Workers tutorials', parent_slug: 'web-development', sort_order: 10 },
    { name: 'D1 Database', slug: 'd1-database', description: 'D1 database guides', parent_slug: 'web-development', sort_order: 20 },
    { name: 'R2 Storage', slug: 'r2-storage', description: 'R2 storage solutions', parent_slug: 'web-development', sort_order: 30 },
  ];

  // Get category IDs by slug
  const catResult = executeSQL("SELECT id, slug FROM categories;");
  const slugToId = {};
  for (const line of catResult.result.split('\n')) {
    const idMatch = line.match(/"id":\s*(\d+)/);
    const slugMatch = line.match(/"slug":\s*"([^"]+)"/);
    if (idMatch && slugMatch) {
      slugToId[slugMatch[1]] = parseInt(idMatch[1]);
    }
  }

  for (const cat of subCats) {
    const parentId = slugToId[cat.parent_slug];
    if (!parentId) {
      console.log(`  ✗ Parent not found for ${cat.name}`);
      continue;
    }
    const sql = `INSERT INTO categories (name, slug, description, parent_id, sort_order, created_at, updated_at) VALUES ('${cat.name}', '${cat.slug}', '${cat.description}', ${parentId}, ${cat.sort_order}, '${randomDate(300)}', '${randomDate(300)}');`;
    const result = executeSQL(sql);
    console.log(result.success ? `  ✓ Imported ${cat.name}` : `  ✗ Failed ${cat.name}`);
  }

  // Import Tags
  console.log('\n=== Importing Tags ===');
  const tags = ['JavaScript', 'Python', 'Cloudflare', 'Workers', 'R2', 'D1', 'KV', 'Node.js', 'React', 'Vue.js', 'TypeScript', 'SQL', 'Git', 'Docker', 'API'];
  for (const tag of tags) {
    const slug = tag.toLowerCase().replace(/\./g, '').replace(/\s+/g, '-');
    const sql = `INSERT INTO tags (name, slug, created_at, updated_at) VALUES ('${tag}', '${slug}', '${randomDate(300)}', '${randomDate(300)}');`;
    const result = executeSQL(sql);
    console.log(result.success ? `  ✓ Tag ${tag}` : `  ✗ Tag ${tag} failed`);
  }

  // Import Users
  console.log('\n=== Importing Users ===');
  const users = [
    { username: 'alex', email: 'alex@cfblog.local', name: 'Alex Thompson', role: 'admin', bio: 'Tech enthusiast' },
    { username: 'sarah', email: 'sarah@cfblog.local', name: 'Sarah Chen', role: 'admin', bio: 'Full-stack developer' },
    { username: 'mike', email: 'mike@cfblog.local', name: 'Mike Johnson', role: 'admin', bio: 'Open source contributor' },
    { username: 'john', email: 'john@cfblog.local', name: 'John Smith', role: 'contributor', bio: 'Freelance writer' },
    { username: 'emma', email: 'emma@cfblog.local', name: 'Emma Wilson', role: 'contributor', bio: 'Digital nomad' },
  ];

  for (const user of users) {
    const sql = `INSERT INTO users (username, email, password_hash, display_name, role, bio, status, created_at, updated_at) VALUES ('${user.username}', '${user.email}', '${hashPassword('password123')}', '${user.name}', '${user.role}', '${user.bio}', 1, '${randomDate(200)}', '${randomDate(200)}');`;
    const result = executeSQL(sql);
    console.log(result.success ? `  ✓ User ${user.username}` : `  ✗ User ${user.username} failed`);
  }

  // Import Posts
  console.log('\n=== Importing Posts ===');
  const posts = [
    { title: 'Getting Started with Cloudflare Workers', slug: 'getting-started-with-cloudflare-workers', content: '# Getting Started\n\nLearn Workers basics.', excerpt: 'Workers basics', featured: 1 },
    { title: 'Building a Serverless Blog', slug: 'building-a-serverless-blog', content: '# Serverless Blog\n\nBuild with D1 and R2.', excerpt: 'Build with D1/R2', featured: 1 },
    { title: 'Introduction to Edge Computing', slug: 'introduction-to-edge-computing', content: '# Edge Computing\n\nEdge brings computation closer.', excerpt: 'Edge computing intro', featured: 0 },
    { title: 'Understanding KV Storage', slug: 'understanding-kv-storage', content: '# KV Storage\n\nKey-value storage for caching.', excerpt: 'KV caching', featured: 0 },
    { title: 'D1 Database Best Practices', slug: 'd1-best-practices', content: '# D1 Best Practices\n\nSQLite-compatible database.', excerpt: 'D1 practices', featured: 0 },
  ];

  // Get user IDs
  const userResult = executeSQL("SELECT id FROM users WHERE role IN ('admin', 'contributor');");
  const userIds = [];
  for (const line of userResult.result.split('\n')) {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) userIds.push(parseInt(match[1]));
  }

  for (const post of posts) {
    const authorId = randomChoice(userIds) || 1;
    const viewCount = randomInt(100, 5000);
    const sql = `INSERT INTO posts (title, slug, content, excerpt, author_id, status, featured, comment_status, view_count, published_at, created_at, updated_at) VALUES ('${post.title}', '${post.slug}', '${post.content}', '${post.excerpt}', ${authorId}, 1, ${post.featured}, 1, ${viewCount}, '${randomDate(60)}', '${randomDate(70)}', '${randomDate(60)}');`;
    const result = executeSQL(sql);
    console.log(result.success ? `  ✓ Post "${post.title}"` : `  ✗ Post "${post.title}" failed`);
  }

  // Import Comments
  console.log('\n=== Importing Comments ===');
  const postResult = executeSQL("SELECT id FROM posts WHERE status = 1;");
  const postIds = [];
  for (const line of postResult.result.split('\n')) {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) postIds.push(parseInt(match[1]));
  }

  const commentTemplates = ['Great article!', 'Thanks for sharing!', 'Very helpful!', 'Excellent!', 'Learned a lot!'];
  const numComments = Math.min(postIds.length * 2, 10);

  for (let i = 0; i < numComments; i++) {
    const postId = randomChoice(postIds) || 1;
    const comment = randomChoice(commentTemplates);
    const sql = `INSERT INTO comments (post_id, author_name, author_email, content, status, created_at) VALUES (${postId}, 'User${i}', 'user${i}@example.com', '${comment}', 1, '${randomDate(30)}');`;
    const result = executeSQL(sql);
    console.log(result.success ? `  ✓ Comment ${i + 1}` : `  ✗ Comment ${i + 1} failed`);
  }

  // Import Feedback
  console.log('\n=== Importing Feedback ===');
  const feedbacks = ['Great design!', 'Love the blog!', 'Fast loading!', 'Nice content!'];
  for (let i = 0; i < feedbacks.length; i++) {
    const sql = `INSERT INTO feedback (name, email, content, status, created_at) VALUES ('Visitor${i + 1}', NULL, '${feedbacks[i]}', 1, '${randomDate(180)}');`;
    const result = executeSQL(sql);
    console.log(result.success ? `  ✓ Feedback ${i + 1}` : `  ✗ Feedback ${i + 1} failed`);
  }

  // Import Post-Category Relationships
  console.log('\n=== Importing Post-Category Relationships ===');
  const postCatResult = executeSQL("SELECT id FROM posts WHERE status = 1;");
  const allPostIds = [];
  for (const line of postCatResult.result.split('\n')) {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) allPostIds.push(parseInt(match[1]));
  }

  const allCatResult = executeSQL("SELECT id FROM categories;");
  const allCatIds = [];
  for (const line of allCatResult.result.split('\n')) {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) allCatIds.push(parseInt(match[1]));
  }

  for (const postId of allPostIds) {
    const catId = randomChoice(allCatIds) || 1;
    const sql = `INSERT INTO post_categories (post_id, category_id) VALUES (${postId}, ${catId});`;
    const result = executeSQL(sql);
    console.log(result.success ? `  ✓ Post-Category link` : `  ✗ Post-Category link failed`);
  }

  // Import Post-Tag Relationships
  console.log('\n=== Importing Post-Tag Relationships ===');
  const allTagResult = executeSQL("SELECT id FROM tags;");
  const allTagIds = [];
  for (const line of allTagResult.result.split('\n')) {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) allTagIds.push(parseInt(match[1]));
  }

  for (const postId of allPostIds) {
    const numTags = randomInt(1, 2);
    for (let j = 0; j < numTags; j++) {
      const tagId = randomChoice(allTagIds) || 1;
      const sql = `INSERT INTO post_tags (post_id, tag_id) VALUES (${postId}, ${tagId});`;
      const result = executeSQL(sql);
      console.log(result.success ? `  ✓ Post-Tag link` : `  ✗ Post-Tag link failed`);
    }
  }

  // Verify data
  console.log('\n=== Verifying Data ===');
  const tables = ['users', 'categories', 'tags', 'posts', 'comments', 'feedback', 'post_categories', 'post_tags'];
  for (const table of tables) {
    const result = executeSQL(`SELECT COUNT(*) as count FROM ${table};`);
    const match = result.result.match(/"count":\s*(\d+)/);
    const count = match ? match[1] : '0';
    console.log(`  ✓ ${table}: ${count} records`);
  }

  console.log('\n=== Import Complete ===');
  console.log('✓ Test data imported successfully!');
}

if (require.main === module) {
  clearAndImport().catch(console.error);
}

module.exports = { clearAndImport };
