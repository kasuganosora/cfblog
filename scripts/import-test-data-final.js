/**
 * CFBlog Test Data Importer - Final Version
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB_NAME = 'cfblog-database';

function executeSQL(sql) {
  const tempFile = path.join(__dirname, '.temp-sql.sql');
  fs.writeFileSync(tempFile, sql);

  try {
    const result = execSync(
      `npx wrangler d1 execute ${DB_NAME} --local --file="${tempFile}" --json`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return { success: true };
  } catch (error) {
    console.error('SQL Error:', error.stdout);
    return { success: false };
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

function querySQL(sql) {
  const tempFile = path.join(__dirname, '.temp-query.sql');
  fs.writeFileSync(tempFile, sql);

  try {
    const result = execSync(
      `npx wrangler d1 execute ${DB_NAME} --local --file="${tempFile}" --json`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return result;
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.toString().replace(/'/g, "''")}'`;
}

function date(days) {
  const d = new Date(Date.now() - days * 86400000 + Math.random() * 86400000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function hash(pwd) {
  return require('crypto').createHash('sha256').update(pwd).digest('hex');
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('CFBlog Test Data Importer\n===========================\n');

  // Clear data
  console.log('Clearing existing data...');
  ['post_tags', 'post_categories', 'comments', 'feedback', 'posts', 'tags', 'categories', 'attachments', 'settings'].forEach(t => {
    executeSQL(`DELETE FROM ${t};`);
  });
  executeSQL(`DELETE FROM users WHERE id > 1;`);
  console.log('Cleared.\n');

  // Categories - Top level
  console.log('Importing top-level categories...');
  [
    { name: 'Technology', slug: 'technology', desc: 'Technology articles', order: 10 },
    { name: 'Programming', slug: 'programming', desc: 'Programming tutorials', order: 20 },
    { name: 'Web Development', slug: 'web-development', desc: 'Web development topics', order: 30 },
    { name: 'Cloud Computing', slug: 'cloud-computing', desc: 'Cloud services', order: 40 },
  ].forEach(c => {
    const sql = `INSERT INTO categories (name, slug, description, parent_id, sort_order, created_at, updated_at) VALUES (${esc(c.name)}, ${esc(c.slug)}, ${esc(c.desc)}, NULL, ${c.order}, '${date(300)}', '${date(300)}');`;
    executeSQL(sql);
  });

  // Categories - Sub level
  console.log('Importing sub-categories...');
  const catResult = querySQL("SELECT id, slug FROM categories;");
  const slugToId = {};
  catResult.split('\n').forEach(line => {
    const idMatch = line.match(/"id":\s*(\d+)/);
    const slugMatch = line.match(/"slug":\s*"([^"]+)"/);
    if (idMatch && slugMatch) {
      slugToId[slugMatch[1]] = parseInt(idMatch[1]);
    }
  });

  [
    { name: 'JavaScript', slug: 'javascript', desc: 'JavaScript libs', parent: 'programming', order: 10 },
    { name: 'Python', slug: 'python', desc: 'Python language', parent: 'programming', order: 20 },
    { name: 'Cloudflare Workers', slug: 'cloudflare-workers', desc: 'Workers tutorials', parent: 'web-development', order: 10 },
    { name: 'D1 Database', slug: 'd1-database', desc: 'D1 guides', parent: 'web-development', order: 20 },
    { name: 'R2 Storage', slug: 'r2-storage', desc: 'R2 solutions', parent: 'web-development', order: 30 },
  ].forEach(c => {
    const parentId = slugToId[c.parent];
    if (parentId) {
      const sql = `INSERT INTO categories (name, slug, description, parent_id, sort_order, created_at, updated_at) VALUES (${esc(c.name)}, ${esc(c.slug)}, ${esc(c.desc)}, ${parentId}, ${c.order}, '${date(300)}', '${date(300)}');`;
      executeSQL(sql);
    }
  });

  // Tags
  console.log('Importing tags...');
  ['JavaScript', 'Python', 'Cloudflare', 'Workers', 'R2', 'D1', 'KV', 'Node.js', 'React', 'Vue.js', 'TypeScript', 'SQL', 'Git', 'Docker', 'API'].forEach(t => {
    const slug = t.toLowerCase().replace(/\./g, '').replace(/\s+/g, '-');
    const sql = `INSERT INTO tags (name, slug, created_at, updated_at) VALUES (${esc(t)}, ${esc(slug)}, '${date(300)}', '${date(300)}');`;
    executeSQL(sql);
  });

  // Users
  console.log('Importing users...');
  [
    { username: 'alex', email: 'alex@cfblog.local', name: 'Alex Thompson', role: 'admin', bio: 'Tech enthusiast' },
    { username: 'sarah', email: 'sarah@cfblog.local', name: 'Sarah Chen', role: 'admin', bio: 'Developer' },
    { username: 'mike', email: 'mike@cfblog.local', name: 'Mike Johnson', role: 'admin', bio: 'Contributor' },
    { username: 'john', email: 'john@cfblog.local', name: 'John Smith', role: 'contributor', bio: 'Writer' },
    { username: 'emma', email: 'emma@cfblog.local', name: 'Emma Wilson', role: 'contributor', bio: 'Nomad' },
  ].forEach(u => {
    const sql = `INSERT INTO users (username, email, password_hash, display_name, role, bio, status, created_at, updated_at) VALUES (${esc(u.username)}, ${esc(u.email)}, '${hash('password123')}', ${esc(u.name)}, ${esc(u.role)}, ${esc(u.bio)}, 1, '${date(200)}', '${date(200)}');`;
    executeSQL(sql);
  });

  // Posts
  console.log('Importing posts...');
  const userResult = querySQL("SELECT id FROM users WHERE role IN ('admin', 'contributor');");
  const userIds = [];
  userResult.split('\n').forEach(line => {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) userIds.push(parseInt(match[1]));
  });

  [
    { title: 'Getting Started with Cloudflare Workers', slug: 'getting-started-workers', excerpt: 'Workers basics', featured: 1 },
    { title: 'Building a Serverless Blog', slug: 'serverless-blog', excerpt: 'D1/R2 blog', featured: 1 },
    { title: 'Edge Computing Introduction', slug: 'edge-computing', excerpt: 'Edge intro', featured: 0 },
    { title: 'Understanding KV Storage', slug: 'kv-storage', excerpt: 'KV cache', featured: 0 },
    { title: 'D1 Database Best Practices', slug: 'd1-practices', excerpt: 'D1 tips', featured: 0 },
  ].forEach(p => {
    const author = rand(userIds) || 1;
    const sql = `INSERT INTO posts (title, slug, excerpt, author_id, status, featured, comment_status, view_count, published_at, created_at, updated_at) VALUES (${esc(p.title)}, ${esc(p.slug)}, ${esc(p.excerpt)}, ${author}, 1, ${p.featured}, 1, ${randInt(100, 5000)}, '${date(60)}', '${date(70)}', '${date(60)}');`;
    executeSQL(sql);
  });

  // Comments
  console.log('Importing comments...');
  const postResult = querySQL("SELECT id FROM posts WHERE status = 1;");
  const postIds = [];
  postResult.split('\n').forEach(line => {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) postIds.push(parseInt(match[1]));
  });

  const commentTemplates = ['Great article!', 'Thanks!', 'Very helpful!', 'Excellent!', 'Learned a lot!'];
  for (let i = 0; i < Math.min(postIds.length * 2, 10); i++) {
    const post = rand(postIds) || 1;
    const comment = rand(commentTemplates);
    const sql = `INSERT INTO comments (post_id, author_name, author_email, content, status, created_at) VALUES (${post}, 'User${i}', 'user${i}@example.com', ${esc(comment)}, 1, '${date(30)}');`;
    executeSQL(sql);
  }

  // Feedback
  console.log('Importing feedback...');
  ['Great design!', 'Love the blog!', 'Fast loading!', 'Nice content!'].forEach((f, i) => {
    const sql = `INSERT INTO feedback (name, email, content, status, created_at) VALUES ('Visitor${i + 1}', NULL, ${esc(f)}, 1, '${date(180)}');`;
    executeSQL(sql);
  });

  // Post-Categories
  console.log('Importing post-category links...');
  const allCatResult = querySQL("SELECT id FROM categories;");
  const allCatIds = [];
  allCatResult.split('\n').forEach(line => {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) allCatIds.push(parseInt(match[1]));
  });

  postIds.forEach(pid => {
    const cat = rand(allCatIds) || 1;
    executeSQL(`INSERT INTO post_categories (post_id, category_id) VALUES (${pid}, ${cat});`);
  });

  // Post-Tags
  console.log('Importing post-tag links...');
  const tagResult = querySQL("SELECT id FROM tags;");
  const tagIds = [];
  tagResult.split('\n').forEach(line => {
    const match = line.match(/"id":\s*(\d+)/);
    if (match) tagIds.push(parseInt(match[1]));
  });

  postIds.forEach(pid => {
    for (let j = 0; j < randInt(1, 2); j++) {
      const tag = rand(tagIds) || 1;
      executeSQL(`INSERT INTO post_tags (post_id, tag_id) VALUES (${pid}, ${tag});`);
    }
  });

  // Verify
  console.log('\nVerifying data:');
  ['users', 'categories', 'tags', 'posts', 'comments', 'feedback', 'post_categories', 'post_tags'].forEach(t => {
    const result = querySQL(`SELECT COUNT(*) as c FROM ${t};`);
    const match = result.match(/"c":\s*(\d+)/);
    console.log(`  ${t}: ${match ? match[1] : 0} records`);
  });

  console.log('\n✓ Import complete!');
}

if (require.main === module) {
  main().catch(console.error);
}
