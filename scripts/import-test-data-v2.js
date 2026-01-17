/**
 * CFBlog Test Data Importer v2
 * Simplified version that clears and imports test data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_NAME = 'cfblog-database';
const ENV = '--local';

// Helper: Execute SQL via temp file (handles special characters)
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

// Helper: Escape SQL strings
function escapeString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.toString().replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

// Helper: Escape SQL integer
function escapeInt(num) {
  if (num === null || num === undefined) return 'NULL';
  return num.toString();
}

// Helper: Generate date
function randomDate(daysBack) {
  const now = new Date();
  const past = new Date(now - daysBack * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime).toISOString().slice(0, 19).replace('T', ' ');
}

// Helper: Generate password hash
function hashPassword(password) {
  return require('crypto').createHash('sha256').update(password).digest('hex');
}

// Helper: Random choice
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: Random int
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Progress tracker
const progress = {
  users: { success: 0, failed: 0 },
  categories: { success: 0, failed: 0 },
  tags: { success: 0, failed: 0 },
  posts: { success: 0, failed: 0 },
  comments: { success: 0, failed: 0 },
  feedback: { success: 0, failed: 0 },
  postCategories: { success: 0, failed: 0 },
  postTags: { success: 0, failed: 0 },
};

function printProgress() {
  console.log('\n=== Progress Summary ===');
  console.log(`Users: ${progress.users.success} success, ${progress.users.failed} failed`);
  console.log(`Categories: ${progress.categories.success} success, ${progress.categories.failed} failed`);
  console.log(`Tags: ${progress.tags.success} success, ${progress.tags.failed} failed`);
  console.log(`Posts: ${progress.posts.success} success, ${progress.posts.failed} failed`);
  console.log(`Comments: ${progress.comments.success} success, ${progress.comments.failed} failed`);
  console.log(`Feedback: ${progress.feedback.success} success, ${progress.feedback.failed} failed`);
  console.log(`Post-Categories: ${progress.postCategories.success} success, ${progress.postCategories.failed} failed`);
  console.log(`Post-Tags: ${progress.postTags.success} success, ${progress.postTags.failed} failed`);
}

async function clearExistingData() {
  console.log('=== Clearing existing test data ===');

  const tables = [
    'post_tags',
    'post_categories',
    'comments',
    'feedback',
    'posts',
    'tags',
    'categories',
    'attachments',
    'settings'
  ];

  for (const table of tables) {
    const result = executeSQL(`DELETE FROM ${table};`);
    if (result.success) {
      console.log(`  ✓ Cleared ${table}`);
    } else {
      console.error(`  ✗ Failed to clear ${table}`);
    }
  }

  // Clear users except admin (ID 1)
  const result = executeSQL(`DELETE FROM users WHERE id > 1;`);
  if (result.success) {
    console.log(`  ✓ Cleared test users (kept admin)`);
  } else {
    console.error(`  ✗ Failed to clear users`);
  }

  console.log('');
}

async function importUsers() {
  console.log('=== Importing Users ===');

  const users = [
    // Admins
    { username: 'alex', email: 'alex@cfblog.local', password: hashPassword('password123'), display_name: 'Alex Thompson', role: 'admin', bio: 'Tech enthusiast and blogger' },
    { username: 'sarah', email: 'sarah@cfblog.local', password: hashPassword('password123'), display_name: 'Sarah Chen', role: 'admin', bio: 'Full-stack developer' },
    { username: 'mike', email: 'mike@cfblog.local', password: hashPassword('password123'), display_name: 'Mike Johnson', role: 'admin', bio: 'Open source contributor' },
    // Contributors
    { username: 'john', email: 'john@cfblog.local', password: hashPassword('password123'), display_name: 'John Smith', role: 'contributor', bio: 'Freelance writer' },
    { username: 'emma', email: 'emma@cfblog.local', password: hashPassword('password123'), display_name: 'Emma Wilson', role: 'contributor', bio: 'Digital nomad' },
    { username: 'david', email: 'david@cfblog.local', password: hashPassword('password123'), display_name: 'David Brown', role: 'contributor', bio: 'Software engineer' },
    { username: 'lisa', email: 'lisa@cfblog.local', password: hashPassword('password123'), display_name: 'Lisa Anderson', role: 'contributor', bio: 'UX designer' },
    { username: 'james', email: 'james@cfblog.local', password: hashPassword('password123'), display_name: 'James Taylor', role: 'contributor', bio: 'Product manager' },
    { username: 'amy', email: 'amy@cfblog.local', password: hashPassword('password123'), display_name: 'Amy Martinez', role: 'contributor', bio: 'Content creator' },
    { username: 'robert', email: 'robert@cfblog.local', password: hashPassword('password123'), display_name: 'Robert Davis', role: 'contributor', bio: 'Technical writer' },
    // Members
    { username: 'alice', email: 'alice@cfblog.local', password: hashPassword('password123'), display_name: 'Alice White', role: 'member', bio: 'Blog reader' },
    { username: 'bob', email: 'bob@cfblog.local', password: hashPassword('password123'), display_name: 'Bob Martin', role: 'member', bio: 'Tech enthusiast' },
    { username: 'charlie', email: 'charlie@cfblog.local', password: hashPassword('password123'), display_name: 'Charlie Garcia', role: 'member', bio: 'Developer' },
    { username: 'diana', email: 'diana@cfblog.local', password: hashPassword('password123'), display_name: 'Diana Robinson', role: 'member', bio: 'Designer' },
    { username: 'eric', email: 'eric@cfblog.local', password: hashPassword('password123'), display_name: 'Eric Clark', role: 'member', bio: 'Engineer' },
  ];

  for (const user of users) {
    const sql = `INSERT INTO users (username, email, password_hash, display_name, role, bio, status, created_at, updated_at) VALUES (${escapeString(user.username)}, ${escapeString(user.email)}, ${escapeString(user.password)}, ${escapeString(user.display_name)}, ${escapeString(user.role)}, ${escapeString(user.bio)}, 1, '${randomDate(200)}', '${randomDate(200)}');`;
    const result = executeSQL(sql);

    if (result.success) {
      progress.users.success++;
      console.log(`  ✓ User ${user.username} imported`);
    } else {
      progress.users.failed++;
      console.error(`  ✗ User ${user.username} failed`);
    }
  }
}

async function importCategories() {
  console.log('\n=== Importing Categories ===');

  // Split into top-level and sub-categories
  const topCategories = [
    { name: 'Technology', slug: 'technology', description: 'Technology and tech-related articles', sort_order: 10 },
    { name: 'Programming', slug: 'programming', description: 'Programming tutorials and tips', sort_order: 20 },
    { name: 'Web Development', slug: 'web-development', description: 'Web development topics', sort_order: 30 },
    { name: 'Cloud Computing', slug: 'cloud-computing', description: 'Cloud computing services', sort_order: 40 },
  ];

  // Import top-level categories first
  for (const cat of topCategories) {
    const sql = `INSERT INTO categories (name, slug, description, parent_id, sort_order, created_at, updated_at) VALUES (${escapeString(cat.name)}, ${escapeString(cat.slug)}, ${escapeString(cat.description)}, NULL, ${cat.sort_order}, '${randomDate(300)}', '${randomDate(300)}');`;
    const result = executeSQL(sql);

    if (result.success) {
      progress.categories.success++;
      console.log(`  ✓ Category ${cat.name} imported`);
    } else {
      progress.categories.failed++;
      console.error(`  ✗ Category ${cat.name} failed: ${result.error}`);
    }
  }

  // Now import sub-categories with correct parent IDs
  const subCategories = [
    { name: 'JavaScript', slug: 'javascript', description: 'JavaScript framework and libraries', parent_name: 'Programming', sort_order: 10 },
    { name: 'Python', slug: 'python', description: 'Python programming language', parent_name: 'Programming', sort_order: 20 },
    { name: 'Cloudflare Workers', slug: 'cloudflare-workers', description: 'Cloudflare Workers tutorials', parent_name: 'Web Development', sort_order: 10 },
    { name: 'D1 Database', slug: 'd1-database', description: 'D1 database guides', parent_name: 'Web Development', sort_order: 20 },
    { name: 'R2 Storage', slug: 'r2-storage', description: 'R2 storage solutions', parent_name: 'Web Development', sort_order: 30 },
  ];

  // Get parent IDs
  const catResult = executeSQL("SELECT id, name FROM categories;");
  const catMap = {};
  const lines = catResult.result.split('\n');
  for (const line of lines) {
    const match = line.match(/"id":\s*(\d+).*?"name":\s*"([^"]+)"/);
    if (match) {
      catMap[match[2]] = parseInt(match[1]);
    }
  }

  console.log('  Category map:', Object.keys(catMap));
  console.log('  Parent name to find: Programming ->', catMap['Programming']);

  for (const cat of subCategories) {
    const parentId = catMap[cat.parent_name];
    if (!parentId) {
      console.error(`  ✗ Parent category '${cat.parent_name}' not found for ${cat.name}`);
      progress.categories.failed++;
      continue;
    }

    const sql = `INSERT INTO categories (name, slug, description, parent_id, sort_order, created_at, updated_at) VALUES (${escapeString(cat.name)}, ${escapeString(cat.slug)}, ${escapeString(cat.description)}, ${parentId}, ${cat.sort_order}, '${randomDate(300)}', '${randomDate(300)}');`;
    const result = executeSQL(sql);

    if (result.success) {
      progress.categories.success++;
      console.log(`  ✓ Category ${cat.name} imported (parent: ${cat.parent_name})`);
    } else {
      progress.categories.failed++;
      console.error(`  ✗ Category ${cat.name} failed: ${result.error}`);
    }
  }
}

async function importTags() {
  console.log('\n=== Importing Tags ===');

  const tags = [
    { name: 'JavaScript', slug: 'javascript' },
    { name: 'Python', slug: 'python' },
    { name: 'Cloudflare', slug: 'cloudflare' },
    { name: 'Workers', slug: 'workers' },
    { name: 'R2', slug: 'r2' },
    { name: 'D1', slug: 'd1' },
    { name: 'KV', slug: 'kv' },
    { name: 'Node.js', slug: 'nodejs' },
    { name: 'React', slug: 'react' },
    { name: 'Vue.js', slug: 'vuejs' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'SQL', slug: 'sql' },
    { name: 'Git', slug: 'git' },
    { name: 'Docker', slug: 'docker' },
    { name: 'API', slug: 'api' },
  ];

  for (const tag of tags) {
    const sql = `INSERT INTO tags (name, slug, created_at, updated_at) VALUES (${escapeString(tag.name)}, ${escapeString(tag.slug)}, '${randomDate(300)}', '${randomDate(300)}');`;
    const result = executeSQL(sql);

    if (result.success) {
      progress.tags.success++;
      console.log(`  ✓ Tag ${tag.name} imported`);
    } else {
      progress.tags.failed++;
      console.error(`  ✗ Tag ${tag.name} failed`);
    }
  }
}

async function importPosts() {
  console.log('\n=== Importing Posts ===');

  // Get user IDs
  const userResult = executeSQL("SELECT id FROM users WHERE role IN ('admin', 'contributor');");
  const userIds = [];
  const lines = userResult.result.split('\n');
  for (const line of lines) {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) userIds.push(parseInt(match[1]));
  }

  if (userIds.length === 0) {
    console.error('  ✗ No valid users found');
    return;
  }

  const posts = [
    { title: 'Getting Started with Cloudflare Workers', slug: 'getting-started-with-cloudflare-workers', content: '# Getting Started with Cloudflare Workers\n\n## Introduction\nCloudflare Workers is a serverless platform that allows you to run JavaScript at the edge.', excerpt: 'Learn basics of Cloudflare Workers serverless platform', featured: 1, comment_status: 1 },
    { title: 'Building a Serverless Blog with D1 and R2', slug: 'building-a-serverless-blog-with-d1-and-r2', content: '# Building a Serverless Blog\n\nLearn how to build a complete blog platform using Cloudflare D1 database and R2 storage.', excerpt: 'Build a complete blog platform with Cloudflare services', featured: 1, comment_status: 1 },
    { title: 'Introduction to Edge Computing', slug: 'introduction-to-edge-computing', content: '# Introduction to Edge Computing\n\nEdge computing brings computation closer to the data source.', excerpt: 'Understand edge computing and its benefits', featured: 0, comment_status: 1 },
    { title: 'Understanding Cloudflare KV Storage', slug: 'understanding-cloudflare-kv-storage', content: '# Understanding Cloudflare KV Storage\n\nKV is a key-value storage service perfect for caching.', excerpt: 'Learn about Cloudflare KV key-value storage', featured: 0, comment_status: 1 },
    { title: 'Best Practices for Cloudflare D1 Database', slug: 'best-practices-for-cloudflare-d1-database', content: '# D1 Database Best Practices\n\nD1 is SQLite-compatible. Here are best practices.', excerpt: 'Best practices for using Cloudflare D1 database', featured: 0, comment_status: 1 },
    { title: 'A Guide to Cloudflare R2 Object Storage', slug: 'a-guide-to-cloudflare-r2-object-storage', content: '# R2 Object Storage Guide\n\nR2 is S3-compatible object storage.', excerpt: 'Complete guide to Cloudflare R2 object storage', featured: 1, comment_status: 1 },
    { title: 'Building RESTful APIs with Workers', slug: 'building-restful-apis-with-workers', content: '# RESTful APIs with Workers\n\nCreate powerful APIs using Cloudflare Workers.', excerpt: 'Create RESTful APIs with Cloudflare Workers', featured: 1, comment_status: 1 },
    { title: 'Implementing Authentication in Serverless Apps', slug: 'implementing-authentication-in-serverless-apps', content: '# Authentication in Serverless Apps\n\nAuthentication is crucial for security.', excerpt: 'Implement secure authentication in serverless applications', featured: 0, comment_status: 1 },
    { title: 'Caching Strategies for Edge Applications', slug: 'caching-strategies-for-edge-applications', content: '# Caching Strategies\n\nEffective caching improves performance.', excerpt: 'Learn effective caching strategies for edge apps', featured: 0, comment_status: 1 },
    { title: 'Security Best Practices for Cloudflare Workers', slug: 'security-best-practices-for-cloudflare-workers', content: '# Security Best Practices\n\nSecurity is paramount in serverless apps.', excerpt: 'Essential security practices for Cloudflare Workers', featured: 1, comment_status: 1 },
  ];

  for (const post of posts) {
    const authorId = randomChoice(userIds);
    const viewCount = randomInt(100, 5000);
    const sql = `INSERT INTO posts (title, slug, content, excerpt, author_id, status, featured, comment_status, view_count, published_at, created_at, updated_at) VALUES (${escapeString(post.title)}, ${escapeString(post.slug)}, ${escapeString(post.content)}, ${escapeString(post.excerpt)}, ${authorId}, 1, ${post.featured}, ${post.comment_status}, ${viewCount}, '${randomDate(60)}', '${randomDate(70)}', '${randomDate(60)}');`;
    const result = executeSQL(sql);

    if (result.success) {
      progress.posts.success++;
      console.log(`  ✓ Post "${post.title}" imported`);
    } else {
      progress.posts.failed++;
      console.error(`  ✗ Post "${post.title}" failed`);
    }
  }
}

async function importComments() {
  console.log('\n=== Importing Comments ===');

  // Get post IDs
  const postResult = executeSQL("SELECT id FROM posts WHERE status = 1 AND comment_status = 1;");
  const postIds = [];
  const lines = postResult.result.split('\n');
  for (const line of lines) {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) postIds.push(parseInt(match[1]));
  }

  if (postIds.length === 0) {
    console.error('  ✗ No valid posts found');
    return;
  }

  const commentTemplates = [
    'Great article! Very informative.',
    'Thanks for sharing this valuable information.',
    'I learned a lot from this post.',
    'Excellent explanation! Keep up good work.',
    'This is exactly what I was looking for.',
    'Very helpful tutorial. Thank you!',
    'Clear and concise explanation.',
    'I implemented this and it works great!',
    'Looking forward to more articles like this.',
    'One of the best articles on this topic.',
  ];

  const numComments = Math.min(postIds.length * 3, 30);

  for (let i = 0; i < numComments; i++) {
    const postId = randomChoice(postIds);
    const comment = randomChoice(commentTemplates);
    const authorName = `User${randomInt(1, 100)}`;
    const authorEmail = `user${randomInt(1, 100)}@example.com`;
    const status = Math.random() > 0.2 ? 1 : 0;

    const sql = `INSERT INTO comments (post_id, author_name, author_email, content, status, created_at) VALUES (${postId}, ${escapeString(authorName)}, ${escapeString(authorEmail)}, ${escapeString(comment)}, ${status}, '${randomDate(30)}');`;
    const result = executeSQL(sql);

    if (result.success) {
      progress.comments.success++;
      console.log(`  ✓ Comment imported (${i + 1}/${numComments})`);
    } else {
      progress.comments.failed++;
      console.error(`  ✗ Comment failed`);
    }
  }
}

async function importFeedback() {
  console.log('\n=== Importing Feedback ===');

  const feedbackTemplates = [
    'Love the blog design! Very clean and modern.',
    'Great content, keep it up!',
    'The search functionality is excellent.',
    'Loading speed is impressive!',
    'Mobile experience is great.',
    'The blog is very easy to navigate.',
    'Looking forward to more content.',
    'This is my go-to tech blog now!',
  ];

  for (let i = 0; i < feedbackTemplates.length; i++) {
    const fb = feedbackTemplates[i];
    const hasEmail = Math.random() > 0.4;
    const status = Math.random() > 0.4 ? 1 : 0;
    const email = hasEmail ? `visitor${i}@example.com` : null;

    const sql = `INSERT INTO feedback (name, email, content, status, created_at) VALUES ('Visitor${i + 1}', ${escapeString(email)}, ${escapeString(fb)}, ${status}, '${randomDate(180)}');`;
    const result = executeSQL(sql);

    if (result.success) {
      progress.feedback.success++;
      console.log(`  ✓ Feedback imported (${i + 1}/${feedbackTemplates.length})`);
    } else {
      progress.feedback.failed++;
      console.error(`  ✗ Feedback failed`);
    }
  }
}

async function importPostCategories() {
  console.log('\n=== Importing Post-Category Relationships ===');

  // Get post and category IDs
  const postResult = executeSQL("SELECT id FROM posts WHERE status = 1;");
  const catResult = executeSQL("SELECT id FROM categories;");

  const postIds = [];
  const catIds = [];

  for (const line of postResult.result.split('\n')) {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) postIds.push(parseInt(match[1]));
  }

  for (const line of catResult.result.split('\n')) {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) catIds.push(parseInt(match[1]));
  }

  for (const postId of postIds) {
    const numCats = randomInt(1, 2);

    for (let j = 0; j < numCats; j++) {
      const catId = randomChoice(catIds);
      const sql = `INSERT INTO post_categories (post_id, category_id) VALUES (${postId}, ${catId});`;
      const result = executeSQL(sql);

      if (result.success) {
        progress.postCategories.success++;
        console.log(`  ✓ Post-Category relationship imported`);
      } else {
        progress.postCategories.failed++;
        console.error(`  ✗ Post-Category relationship failed`);
      }
    }
  }
}

async function importPostTags() {
  console.log('\n=== Importing Post-Tag Relationships ===');

  // Get post and tag IDs
  const postResult = executeSQL("SELECT id FROM posts WHERE status = 1;");
  const tagResult = executeSQL("SELECT id FROM tags;");

  const postIds = [];
  const tagIds = [];

  for (const line of postResult.result.split('\n')) {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) postIds.push(parseInt(match[1]));
  }

  for (const line of tagResult.result.split('\n')) {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) tagIds.push(parseInt(match[1]));
  }

  for (const postId of postIds) {
    const numTags = randomInt(1, 3);

    for (let j = 0; j < numTags; j++) {
      const tagId = randomChoice(tagIds);
      const sql = `INSERT INTO post_tags (post_id, tag_id) VALUES (${postId}, ${tagId});`;
      const result = executeSQL(sql);

      if (result.success) {
        progress.postTags.success++;
        console.log(`  ✓ Post-Tag relationship imported`);
      } else {
        progress.postTags.failed++;
        console.error(`  ✗ Post-Tag relationship failed`);
      }
    }
  }
}

async function verifyData() {
  console.log('\n=== Verifying Data ===');

  const tables = [
    { name: 'users', query: 'SELECT COUNT(*) as count FROM users' },
    { name: 'categories', query: 'SELECT COUNT(*) as count FROM categories' },
    { name: 'tags', query: 'SELECT COUNT(*) as count FROM tags' },
    { name: 'posts', query: 'SELECT COUNT(*) as count FROM posts' },
    { name: 'comments', query: 'SELECT COUNT(*) as count FROM comments' },
    { name: 'feedback', query: 'SELECT COUNT(*) as count FROM feedback' },
    { name: 'post_categories', query: 'SELECT COUNT(*) as count FROM post_categories' },
    { name: 'post_tags', query: 'SELECT COUNT(*) as count FROM post_tags' },
  ];

  for (const table of tables) {
    const result = executeSQL(table.query);
    if (result.success) {
      const match = result.result.match(/"count":\s*(\d+)/);
      if (match) {
        console.log(`  ✓ ${table.name}: ${match[1]} records`);
      }
    }
  }
}

async function main() {
  console.log('CFBlog Test Data Importer v2');
  console.log('==============================\n');

  // Test connection
  const testResult = executeSQL('SELECT 1;');
  if (!testResult.success) {
    console.error('✗ Failed to connect to database');
    console.error('Make sure you have run: npm run db:local');
    process.exit(1);
  }
  console.log('✓ Database connection successful\n');

  await clearExistingData();
  await importUsers();
  await importCategories();
  await importTags();
  await importPosts();
  await importComments();
  await importFeedback();
  await importPostCategories();
  await importPostTags();

  printProgress();
  await verifyData();

  const totalSuccess = Object.values(progress).reduce((sum, p) => sum + p.success, 0);
  const totalFailed = Object.values(progress).reduce((sum, p) => sum + p.failed, 0);

  console.log('\n=== Import Complete ===');
  console.log(`Total: ${totalSuccess} successful, ${totalFailed} failed`);

  if (totalFailed === 0) {
    console.log('\n✓ All data imported successfully!');
  } else {
    console.log('\n⚠ Some records failed to import');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
