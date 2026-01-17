/**
 * CFBlog Test Data Importer
 * Imports test data into local D1 database using wrangler commands
 *
 * Usage:
 *   node scripts/import-test-data.js
 */

const { execSync, spawn } = require('child_process');
const { randomInt } = require('crypto');
const path = require('path');

// Configuration
const CONFIG = {
  databaseName: 'cfblog-database',
  env: '--local',
  batchSize: 10, // Process in batches
  delayBetweenInserts: 100, // ms
};

// Test data generators
function generatePasswordHash(password) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function randomDate(daysBack) {
  const now = new Date();
  const past = new Date(now - daysBack * 24 * 60 * 60 * 1000);
  return formatDate(new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime())));
}

// Data templates
const USERS = [
  // Admins (already exists from migration, skip ID 1)
  { username: 'alex', email: 'alex@cfblog.local', password: generatePasswordHash('password123'), display_name: 'Alex Thompson', role: 'admin', bio: 'Tech enthusiast and blogger' },
  { username: 'sarah', email: 'sarah@cfblog.local', password: generatePasswordHash('password123'), display_name: 'Sarah Chen', role: 'admin', bio: 'Full-stack developer' },
  { username: 'mike', email: 'mike@cfblog.local', password: generatePasswordHash('password123'), display_name: 'Mike Johnson', role: 'admin', bio: 'Open source contributor' },
  // Contributors
  { username: 'john', email: 'john@cfblog.local', password: generatePasswordHash('password123'), display_name: 'John Smith', role: 'contributor', bio: 'Freelance writer' },
  { username: 'emma', email: 'emma@cfblog.local', password: generatePasswordHash('password123'), display_name: 'Emma Wilson', role: 'contributor', bio: 'Digital nomad' },
  { username: 'david', email: 'david@cfblog.local', password: generatePasswordHash('password123'), display_name: 'David Brown', role: 'contributor', bio: 'Software engineer' },
  { username: 'lisa', email: 'lisa@cfblog.local', password: generatePasswordHash('password123'), display_name: 'Lisa Anderson', role: 'contributor', bio: 'UX designer' },
  { username: 'james', email: 'james@cfblog.local', password: generatePasswordHash('password123'), display_name: 'James Taylor', role: 'contributor', bio: 'Product manager' },
  { username: 'amy', email: 'amy@cfblog.local', password: generatePasswordHash('password123'), display_name: 'Amy Martinez', role: 'contributor', bio: 'Content creator' },
  { username: 'robert', email: 'robert@cfblog.local', password: generatePasswordHash('password123'), display_name: 'Robert Davis', role: 'contributor', bio: 'Technical writer' },
  // Members
  { username: 'alice', email: 'alice@cfblog.local', password: generatePasswordHash('password123'), display_name: 'Alice White', role: 'member', bio: 'Blog reader' },
  { username: 'bob', email: 'bob@cfblog.local', password: generatePasswordHash('password123'), display_name: 'Bob Martin', role: 'member', bio: 'Tech enthusiast' },
  { username: 'charlie', email: 'charlie@cfblog.local', password: generatePasswordHash('password123'), display_name: 'Charlie Garcia', role: 'member', bio: 'Developer' },
  { username: 'diana', email: 'diana@cfblog.local', password: generatePasswordHash('password123'), display_name: 'Diana Robinson', role: 'member', bio: 'Designer' },
  { username: 'eric', email: 'eric@cfblog.local', password: generatePasswordHash('password123'), display_name: 'Eric Clark', role: 'member', bio: 'Engineer' },
];

const CATEGORIES = [
  { name: 'Technology', slug: 'technology', description: 'Technology and tech-related articles', parent_id: 'NULL', sort_order: 10 },
  { name: 'Programming', slug: 'programming', description: 'Programming tutorials and tips', parent_id: 'NULL', sort_order: 20 },
  { name: 'Web Development', slug: 'web-development', description: 'Web development topics', parent_id: 'NULL', sort_order: 30 },
  { name: 'Cloud Computing', slug: 'cloud-computing', description: 'Cloud computing services', parent_id: 'NULL', sort_order: 40 },
  { name: 'JavaScript', slug: 'javascript', description: 'JavaScript framework and libraries', parent_id: '2', sort_order: 10 },
  { name: 'Python', slug: 'python', description: 'Python programming language', parent_id: '2', sort_order: 20 },
  { name: 'Cloudflare Workers', slug: 'cloudflare-workers', description: 'Cloudflare Workers tutorials', parent_id: '3', sort_order: 10 },
  { name: 'D1 Database', slug: 'd1-database', description: 'D1 database guides', parent_id: '3', sort_order: 20 },
  { name: 'R2 Storage', slug: 'r2-storage', description: 'R2 storage solutions', parent_id: '3', sort_order: 30 },
];

const TAGS = [
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

const POSTS = [
  {
    title: 'Getting Started with Cloudflare Workers',
    slug: 'getting-started-with-cloudflare-workers',
    content: '# Getting Started with Cloudflare Workers\n\n## Introduction\nCloudflare Workers is a serverless platform that allows you to run JavaScript at the edge.',
    excerpt: 'Learn the basics of Cloudflare Workers serverless platform',
    featured: 1,
    comment_status: 1
  },
  {
    title: 'Building a Serverless Blog with D1 and R2',
    slug: 'building-a-serverless-blog-with-d1-and-r2',
    content: '# Building a Serverless Blog\n\nLearn how to build a complete blog platform using Cloudflare D1 database and R2 storage.',
    excerpt: 'Build a complete blog platform with Cloudflare services',
    featured: 1,
    comment_status: 1
  },
  {
    title: 'Introduction to Edge Computing',
    slug: 'introduction-to-edge-computing',
    content: '# Introduction to Edge Computing\n\nEdge computing brings computation closer to the data source.',
    excerpt: 'Understand edge computing and its benefits',
    featured: 0,
    comment_status: 1
  },
  {
    title: 'Understanding Cloudflare KV Storage',
    slug: 'understanding-cloudflare-kv-storage',
    content: '# Understanding Cloudflare KV Storage\n\nKV is a key-value storage service perfect for caching.',
    excerpt: 'Learn about Cloudflare KV key-value storage',
    featured: 0,
    comment_status: 1
  },
  {
    title: 'Best Practices for Cloudflare D1 Database',
    slug: 'best-practices-for-cloudflare-d1-database',
    content: '# D1 Database Best Practices\n\nD1 is SQLite-compatible. Here are best practices.',
    excerpt: 'Best practices for using Cloudflare D1 database',
    featured: 0,
    comment_status: 1
  },
  {
    title: 'A Guide to Cloudflare R2 Object Storage',
    slug: 'a-guide-to-cloudflare-r2-object-storage',
    content: '# R2 Object Storage Guide\n\nR2 is S3-compatible object storage.',
    excerpt: 'Complete guide to Cloudflare R2 object storage',
    featured: 1,
    comment_status: 1
  },
  {
    title: 'Building RESTful APIs with Workers',
    slug: 'building-restful-apis-with-workers',
    content: '# RESTful APIs with Workers\n\nCreate powerful APIs using Cloudflare Workers.',
    excerpt: 'Create RESTful APIs with Cloudflare Workers',
    featured: 1,
    comment_status: 1
  },
  {
    title: 'Implementing Authentication in Serverless Apps',
    slug: 'implementing-authentication-in-serverless-apps',
    content: '# Authentication in Serverless Apps\n\nAuthentication is crucial for security.',
    excerpt: 'Implement secure authentication in serverless applications',
    featured: 0,
    comment_status: 1
  },
  {
    title: 'Caching Strategies for Edge Applications',
    slug: 'caching-strategies-for-edge-applications',
    content: '# Caching Strategies\n\nEffective caching improves performance.',
    excerpt: 'Learn effective caching strategies for edge apps',
    featured: 0,
    comment_status: 1
  },
  {
    title: 'Security Best Practices for Cloudflare Workers',
    slug: 'security-best-practices-for-cloudflare-workers',
    content: '# Security Best Practices\n\nSecurity is paramount in serverless apps.',
    excerpt: 'Essential security practices for Cloudflare Workers',
    featured: 1,
    comment_status: 1
  },
];

const COMMENTS = [
  'Great article! Very informative.',
  'Thanks for sharing this valuable information.',
  'I learned a lot from this post.',
  'Excellent explanation! Keep up the good work.',
  'This is exactly what I was looking for.',
  'Very helpful tutorial. Thank you!',
  'Clear and concise explanation.',
  'I implemented this and it works great!',
  'Looking forward to more articles like this.',
  'One of the best articles on this topic.',
];

const FEEDBACK = [
  'Love the blog design! Very clean and modern.',
  'Great content, keep it up!',
  'The search functionality is excellent.',
  'Loading speed is impressive!',
  'Mobile experience is great.',
  'The blog is very easy to navigate.',
  'Looking forward to more content.',
  'This is my go-to tech blog now!',
];

// Helper function to execute SQL
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    try {
      // Write SQL to a temporary file to avoid issues with special characters
      const fs = require('fs');
      const tempFile = path.join(__dirname, '.temp-sql.sql');
      fs.writeFileSync(tempFile, sql);

      const result = execSync(
        `npx wrangler d1 execute ${CONFIG.databaseName} ${CONFIG.env} --file="${tempFile}"`,
        { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
      );

      // Clean up temp file
      fs.unlinkSync(tempFile);
      resolve({ success: true, result });
    } catch (error) {
      reject({ success: false, error: error.message });
    }
  });
}

// Helper function to delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Progress tracker
const progress = {
  users: { total: 0, success: 0, failed: 0 },
  categories: { total: 0, success: 0, failed: 0 },
  tags: { total: 0, success: 0, failed: 0 },
  posts: { total: 0, success: 0, failed: 0 },
  comments: { total: 0, success: 0, failed: 0 },
  feedback: { total: 0, success: 0, failed: 0 },
  postCategories: { total: 0, success: 0, failed: 0 },
  postTags: { total: 0, success: 0, failed: 0 },
};

function printProgress() {
  console.log('\n=== Progress Summary ===');
  console.log(`Users: ${progress.users.success}/${progress.users.total} (${progress.users.failed} failed)`);
  console.log(`Categories: ${progress.categories.success}/${progress.categories.total} (${progress.categories.failed} failed)`);
  console.log(`Tags: ${progress.tags.success}/${progress.tags.total} (${progress.tags.failed} failed)`);
  console.log(`Posts: ${progress.posts.success}/${progress.posts.total} (${progress.posts.failed} failed)`);
  console.log(`Comments: ${progress.comments.success}/${progress.comments.total} (${progress.comments.failed} failed)`);
  console.log(`Feedback: ${progress.feedback.success}/${progress.feedback.total} (${progress.feedback.failed} failed)`);
  console.log(`Post-Categories: ${progress.postCategories.success}/${progress.postCategories.total} (${progress.postCategories.failed} failed)`);
  console.log(`Post-Tags: ${progress.postTags.success}/${progress.postTags.total} (${progress.postTags.failed} failed)`);
}

// Import functions
async function importUsers() {
  console.log('\n=== Importing Users ===');
  progress.users.total = USERS.length;

  for (let i = 0; i < USERS.length; i++) {
    const user = USERS[i];
    const sql = `INSERT INTO users (username, email, password_hash, display_name, role, bio, status, created_at, updated_at) VALUES ('${user.username}', '${user.email}', '${user.password}', '${user.display_name}', '${user.role}', '${user.bio}', 1, '${randomDate(200)}', '${randomDate(200)}');`;

    try {
      await executeSQL(sql);
      progress.users.success++;
      console.log(`  ✓ User ${user.username} imported (${i + 1}/${USERS.length})`);
    } catch (error) {
      progress.users.failed++;
      console.error(`  ✗ User ${user.username} failed: ${error.error}`);
    }

    await delay(CONFIG.delayBetweenInserts);
  }
}

async function importCategories() {
  console.log('\n=== Importing Categories ===');
  progress.categories.total = CATEGORIES.length;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const sql = `INSERT INTO categories (name, slug, description, parent_id, sort_order, created_at, updated_at) VALUES ('${cat.name}', '${cat.slug}', '${cat.description}', ${cat.parent_id}, ${cat.sort_order}, '${randomDate(300)}', '${randomDate(300)}');`;

    try {
      await executeSQL(sql);
      progress.categories.success++;
      console.log(`  ✓ Category ${cat.name} imported (${i + 1}/${CATEGORIES.length})`);
    } catch (error) {
      progress.categories.failed++;
      console.error(`  ✗ Category ${cat.name} failed: ${error.error}`);
    }

    await delay(CONFIG.delayBetweenInserts);
  }
}

async function importTags() {
  console.log('\n=== Importing Tags ===');
  progress.tags.total = TAGS.length;

  for (let i = 0; i < TAGS.length; i++) {
    const tag = TAGS[i];
    const sql = `INSERT INTO tags (name, slug, created_at, updated_at) VALUES ('${tag.name}', '${tag.slug}', '${randomDate(300)}', '${randomDate(300)}');`;

    try {
      await executeSQL(sql);
      progress.tags.success++;
      console.log(`  ✓ Tag ${tag.name} imported (${i + 1}/${TAGS.length})`);
    } catch (error) {
      progress.tags.failed++;
      console.error(`  ✗ Tag ${tag.name} failed: ${error.error}`);
    }

    await delay(CONFIG.delayBetweenInserts);
  }
}

async function importPosts() {
  console.log('\n=== Importing Posts ===');
  progress.posts.total = POSTS.length;

  // First, get user IDs
  let userIds = [2]; // Start with existing admin (ID 2 after migration)
  const result = await executeSQL("SELECT id FROM users WHERE role IN ('admin', 'contributor');");
  
  // Parse user IDs from result
  const lines = result.result.split('\n').filter(line => line.trim());
  lines.forEach(line => {
    const match = line.match(/\d+/);
    if (match) userIds.push(parseInt(match[0]));
  });

  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i];
    const authorId = randomChoice(userIds);
    const viewCount = Math.floor(Math.random() * 5000) + 100;
    const sql = `INSERT INTO posts (title, slug, content, excerpt, author_id, status, featured, comment_status, view_count, published_at, created_at, updated_at) VALUES ('${post.title.replace(/'/g, "\\'")}', '${post.slug}', '${post.content.replace(/'/g, "\\'")}', '${post.excerpt.replace(/'/g, "\\'")}', ${authorId}, 1, ${post.featured}, ${post.comment_status}, ${viewCount}, '${randomDate(60)}', '${randomDate(70)}', '${randomDate(60)}');`;

    try {
      await executeSQL(sql);
      progress.posts.success++;
      console.log(`  ✓ Post "${post.title}" imported (${i + 1}/${POSTS.length})`);
    } catch (error) {
      progress.posts.failed++;
      console.error(`  ✗ Post "${post.title}" failed: ${error.error}`);
    }

    await delay(CONFIG.delayBetweenInserts);
  }
}

async function importComments() {
  console.log('\n=== Importing Comments ===');

  // Get post IDs
  const result = await executeSQL("SELECT id FROM posts WHERE status = 1 AND comment_status = 1;");
  const lines = result.result.split('\n').filter(line => line.trim());
  const postIds = [];
  lines.forEach(line => {
    const match = line.match(/\d+/);
    if (match) postIds.push(parseInt(match[0]));
  });

  progress.comments.total = Math.min(postIds.length * 3, 30); // Limit to 30 comments

  for (let i = 0; i < progress.comments.total; i++) {
    const postId = randomChoice(postIds);
    const comment = randomChoice(COMMENTS);
    const authorName = `User${Math.floor(Math.random() * 100)}`;
    const authorEmail = `user${Math.floor(Math.random() * 100)}@example.com`;
    const status = Math.random() > 0.2 ? 1 : 0;
    const sql = `INSERT INTO comments (post_id, author_name, author_email, content, status, created_at) VALUES (${postId}, '${authorName}', '${authorEmail}', '${comment}', ${status}, '${randomDate(30)}');`;

    try {
      await executeSQL(sql);
      progress.comments.success++;
      console.log(`  ✓ Comment imported (${i + 1}/${progress.comments.total})`);
    } catch (error) {
      progress.comments.failed++;
      console.error(`  ✗ Comment failed: ${error.error}`);
    }

    await delay(CONFIG.delayBetweenInserts);
  }
}

async function importFeedback() {
  console.log('\n=== Importing Feedback ===');
  progress.feedback.total = FEEDBACK.length;

  for (let i = 0; i < FEEDBACK.length; i++) {
    const fb = FEEDBACK[i];
    const hasEmail = Math.random() > 0.4;
    const status = Math.random() > 0.4 ? 1 : 0;
    const email = hasEmail ? `visitor${i}@example.com` : null;
    const sql = `INSERT INTO feedback (name, email, content, status, created_at) VALUES ('Visitor${i + 1}', ${email ? `'${email}'` : 'NULL'}, '${fb}', ${status}, '${randomDate(180)}');`;

    try {
      await executeSQL(sql);
      progress.feedback.success++;
      console.log(`  ✓ Feedback imported (${i + 1}/${FEEDBACK.length})`);
    } catch (error) {
      progress.feedback.failed++;
      console.error(`  ✗ Feedback failed: ${error.error}`);
    }

    await delay(CONFIG.delayBetweenInserts);
  }
}

async function importPostCategories() {
  console.log('\n=== Importing Post-Category Relationships ===');

  const postsResult = await executeSQL("SELECT id FROM posts WHERE status = 1;");
  const postsLines = postsResult.result.split('\n').filter(line => line.trim());
  const postIds = [];
  postsLines.forEach(line => {
    const match = line.match(/\d+/);
    if (match) postIds.push(parseInt(match[0]));
  });

  const catsResult = await executeSQL("SELECT id FROM categories;");
  const catsLines = catsResult.result.split('\n').filter(line => line.trim());
  const catIds = [];
  catsLines.forEach(line => {
    const match = line.match(/\d+/);
    if (match) catIds.push(parseInt(match[0]));
  });

  progress.postCategories.total = postIds.length;

  for (let i = 0; i < postIds.length; i++) {
    const postId = postIds[i];
    const numCats = Math.floor(Math.random() * 2) + 1; // 1-2 categories per post

    for (let j = 0; j < numCats; j++) {
      const catId = randomChoice(catIds);
      const sql = `INSERT INTO post_categories (post_id, category_id) VALUES (${postId}, ${catId});`;

      try {
        await executeSQL(sql);
        progress.postCategories.success++;
        console.log(`  ✓ Post-Category relationship imported (${i + 1}/${progress.postCategories.total})`);
      } catch (error) {
        progress.postCategories.failed++;
        console.error(`  ✗ Post-Category relationship failed: ${error.error}`);
      }

      await delay(CONFIG.delayBetweenInserts);
    }
  }
}

async function importPostTags() {
  console.log('\n=== Importing Post-Tag Relationships ===');

  const postsResult = await executeSQL("SELECT id FROM posts WHERE status = 1;");
  const postsLines = postsResult.result.split('\n').filter(line => line.trim());
  const postIds = [];
  postsLines.forEach(line => {
    const match = line.match(/\d+/);
    if (match) postIds.push(parseInt(match[0]));
  });

  const tagsResult = await executeSQL("SELECT id FROM tags;");
  const tagsLines = tagsResult.result.split('\n').filter(line => line.trim());
  const tagIds = [];
  tagsLines.forEach(line => {
    const match = line.match(/\d+/);
    if (match) tagIds.push(parseInt(match[0]));
  });

  progress.postTags.total = postIds.length;

  for (let i = 0; i < postIds.length; i++) {
    const postId = postIds[i];
    const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags per post

    for (let j = 0; j < numTags; j++) {
      const tagId = randomChoice(tagIds);
      const sql = `INSERT INTO post_tags (post_id, tag_id) VALUES (${postId}, ${tagId});`;

      try {
        await executeSQL(sql);
        progress.postTags.success++;
        console.log(`  ✓ Post-Tag relationship imported (${i + 1}/${progress.postTags.total})`);
      } catch (error) {
        progress.postTags.failed++;
        console.error(`  ✗ Post-Tag relationship failed: ${error.error}`);
      }

      await delay(CONFIG.delayBetweenInserts);
    }
  }
}

// Main function
async function main() {
  console.log('CFBlog Test Data Importer');
  console.log('=========================\n');
  console.log('Database:', CONFIG.databaseName);
  console.log('Environment: Local');
  console.log('Delay between inserts:', CONFIG.delayBetweenInserts, 'ms\n');

  try {
    // Check if wrangler is available
    await executeSQL('SELECT 1;');
    console.log('✓ Database connection successful\n');
  } catch (error) {
    console.error('✗ Failed to connect to database:', error.error);
    console.error('\nMake sure you have:');
    console.error('1. Created the D1 database: npx wrangler d1 create cfblog-database');
    console.error('2. Updated the database_id in wrangler.toml');
    console.error('3. Run migrations: npm run db:local');
    process.exit(1);
  }

  try {
    await importUsers();
    await importCategories();
    await importTags();
    await importPosts();
    await importComments();
    await importFeedback();
    await importPostCategories();
    await importPostTags();

    printProgress();

    const totalSuccess = Object.values(progress).reduce((sum, p) => sum + p.success, 0);
    const totalFailed = Object.values(progress).reduce((sum, p) => sum + p.failed, 0);

    console.log('\n=== Import Complete ===');
    console.log(`Total records: ${totalSuccess} successful, ${totalFailed} failed`);

    if (totalFailed === 0) {
      console.log('\n✓ All data imported successfully!');
    } else {
      console.log('\n⚠ Some records failed to import. Check the errors above.');
    }

  } catch (error) {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
  }
}

// Run the importer
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
