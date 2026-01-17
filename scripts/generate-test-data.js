/**
 * CFBlog Test Data Generator
 * Generates test data for development and testing
 *
 * Usage:
 *   node scripts/generate-test-data.js [options]
 *
 * Options:
 *   --clear      Clear existing data before generating
 *   --skip-users Skip user data generation
 *   --skip-posts Skip post data generation
 *   --help       Show help
 */

const { randomInt, randomBytes } = require('crypto');

// Configuration
const CONFIG = {
  users: {
    admins: 3,
    contributors: 7,
    members: 10
  },
  categories: {
    level1: 8,
    level2: 5,
    level3: 2
  },
  tags: {
    tech: 15,
    life: 10,
    general: 5
  },
  posts: {
    published: 120,
    draft: 60,
    archived: 40
  },
  comments: {
    total: 300,
    perPost: { min: 1, max: 10 }
  },
  feedback: 50,
  attachments: 30
};

// Data templates
const USERNAMES = {
  admin: ['alex', 'sarah', 'mike'],
  contributor: ['john', 'emma', 'david', 'lisa', 'james', 'amy', 'robert'],
  member: ['alice', 'bob', 'charlie', 'diana', 'eric', 'fiona', 'george', 'helen', 'ivan', 'julia']
};

const USER_INFO = [
  { name: 'Alex Thompson', bio: 'Tech enthusiast and blogger' },
  { name: 'Sarah Chen', bio: 'Full-stack developer' },
  { name: 'Mike Johnson', bio: 'Open source contributor' },
  { name: 'John Smith', bio: 'Freelance writer' },
  { name: 'Emma Wilson', bio: 'Digital nomad' },
  { name: 'David Brown', bio: 'Software engineer' },
  { name: 'Lisa Anderson', bio: 'UX designer' },
  { name: 'James Taylor', bio: 'Product manager' },
  { name: 'Amy Martinez', bio: 'Content creator' },
  { name: 'Robert Davis', bio: 'Technical writer' },
  { name: 'Alice White', bio: 'Blog reader' },
  { name: 'Bob Martin', bio: 'Tech enthusiast' },
  { name: 'Charlie Garcia', bio: 'Developer' },
  { name: 'Diana Robinson', bio: 'Designer' },
  { name: 'Eric Clark', bio: 'Engineer' },
  { name: 'Fiona Rodriguez', bio: 'Writer' },
  { name: 'George Lewis', bio: 'Photographer' },
  { name: 'Helen Lee', bio: 'Artist' },
  { name: 'Ivan Walker', bio: 'Musician' },
  { name: 'Julia Hall', bio: 'Traveler' }
];

const CATEGORY_NAMES = [
  { name: 'Technology', description: 'Technology and tech-related articles' },
  { name: 'Programming', description: 'Programming tutorials and tips' },
  { name: 'Web Development', description: 'Web development topics' },
  { name: 'Cloud Computing', description: 'Cloud computing services' },
  { name: 'AI & Machine Learning', description: 'AI and ML articles' },
  { name: 'Mobile Development', description: 'Mobile app development' },
  { name: 'Database', description: 'Database design and optimization' },
  { name: 'DevOps', description: 'DevOps practices and tools' },
  { name: 'JavaScript', description: 'JavaScript framework and libraries' },
  { name: 'Python', description: 'Python programming language' },
  { name: 'Go Language', description: 'Go programming language' },
  { name: 'Rust Language', description: 'Rust programming language' },
  { name: 'Cloudflare Workers', description: 'Cloudflare Workers tutorials' },
  { name: 'D1 Database', description: 'D1 database guides' },
  { name: 'R2 Storage', description: 'R2 storage solutions' }
];

const TAG_NAMES = {
  tech: [
    'JavaScript', 'Python', 'Cloudflare', 'Workers', 'R2', 'D1', 'KV',
    'Node.js', 'React', 'Vue.js', 'TypeScript', 'SQL', 'NoSQL', 'Git',
    'Docker', 'Kubernetes', 'Linux', 'Security', 'Performance', 'API'
  ],
  life: [
    '日记', '读书', '电影', '旅行', '美食', '摄影', '音乐',
    '健身', '读书笔记', '生活感悟', '职场', '创业', '理财',
    '家庭教育', '人际关系'
  ],
  general: ['随笔', '教程', '笔记', '分享', '资源']
};

const POST_TITLES = [
  'Getting Started with Cloudflare Workers',
  'Building a Serverless Blog with D1 and R2',
  'Introduction to Edge Computing',
  'How to Optimize Your Website Performance',
  'Understanding Cloudflare KV Storage',
  'Best Practices for Cloudflare D1 Database',
  'Deploying Applications to Cloudflare Pages',
  'A Guide to Cloudflare R2 Object Storage',
  'Building RESTful APIs with Workers',
  'Using Markdown-it for Content Management',
  'Implementing Authentication in Serverless Apps',
  'Caching Strategies for Edge Applications',
  'Security Best Practices for Cloudflare Workers',
  'Handling File Uploads with R2 Storage',
  'Building a Comment System with D1',
  'Search Functionality with D1 Full-Text Search',
  'Managing User Sessions in Serverless Apps',
  'Implementing Pagination in Your API',
  'Image Optimization for the Web',
  'Building Responsive Web Applications',
  'Introduction to TypeScript for JavaScript Developers',
  'Understanding CORS in Modern Web Apps',
  'Debugging Cloudflare Workers',
  'Testing Serverless Applications',
  'Deploying to Production: A Complete Guide',
  'Monitoring and Logging in Cloudflare Workers',
  'Error Handling in Serverless Applications',
  'Building a Multi-user Blog System',
  'Content Management Best Practices',
  'SEO Optimization for Blog Posts'
];

const COMMENT_TEMPLATES = [
  'Great article! Very informative.',
  'Thanks for sharing this valuable information.',
  'I learned a lot from this post.',
  'Excellent explanation! Keep up the good work.',
  'This is exactly what I was looking for.',
  'Very helpful tutorial. Thank you!',
  'Can you explain this in more detail?',
  'I have a question about point {n}.',
  'This saved me a lot of time!',
  'Looking forward to more articles like this.',
  'Well written and easy to understand.',
  'Perfect timing for this article!',
  'I shared this with my team.',
  'This is a game-changer for me.',
  'Clear and concise explanation.',
  'I implemented this and it works great!',
  'Thanks for the detailed guide.',
  'This will help with my current project.',
  'Appreciate the effort put into this.',
  'One of the best articles on this topic.'
];

const FEEDBACK_TEMPLATES = [
  'Love the blog design! Very clean and modern.',
  'Would be great to have dark mode support.',
  'The search functionality is excellent.',
  'Please add more articles about {topic}.',
  'Found a small typo in the {article} article.',
  'Great content, keep it up!',
  'The comment system works perfectly.',
  'Would like to see more tutorials.',
  'Loading speed is impressive!',
  'Mobile experience is great.',
  'Consider adding a newsletter feature.',
  'Thanks for all the valuable content.',
  'The categories are well organized.',
  'Love the minimalist design.',
  'Great work on the recent updates!',
  'Please add social media sharing buttons.',
  'The blog is very easy to navigate.',
  'Appreciate the detailed explanations.',
  'Looking forward to more content.',
  'This is my go-to tech blog now!'
];

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function generatePasswordHash(password) {
  const crypto = require('crypto');
  // Simple SHA-256 hash (in production, use bcrypt)
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function formatDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function generateMarkDownContent(title) {
  const sections = [
    `# ${title}\n\n`,
    `## Introduction\n\nThis is a sample blog post about "${title}". In this article, we'll explore various aspects of this topic and provide detailed explanations and examples.\n\n`,
    `## Key Points\n\n- Point 1: Important information\n- Point 2: Detailed explanation\n- Point 3: Practical examples\n\n`,
    `## Code Example\n\n\`\`\`javascript\n// Sample code block\nfunction example() {\n  console.log('${title}');\n  return true;\n}\n\`\`\`\n\n`,
    `## Conclusion\n\nThank you for reading! Feel free to leave your comments below.\n\n`
  ];
  return sections.join('');
}

// Data generation functions
function generateUsers() {
  console.log('\n=== Generating Users ===');

  const users = [];

  // Generate admin users
  for (let i = 0; i < CONFIG.users.admins; i++) {
    const username = USERNAMES.admin[i];
    const info = USER_INFO[i];
    users.push({
      username,
      email: `${username}@cfblog.local`,
      password_hash: generatePasswordHash('password123'),
      display_name: info.name,
      role: 'admin',
      bio: info.bio,
      status: 1
    });
  }

  // Generate contributor users
  for (let i = 0; i < CONFIG.users.contributors; i++) {
    const username = USERNAMES.contributor[i];
    const info = USER_INFO[i + 3];
    users.push({
      username,
      email: `${username}@cfblog.local`,
      password_hash: generatePasswordHash('password123'),
      display_name: info.name,
      role: 'contributor',
      bio: info.bio,
      status: Math.random() > 0.3 ? 1 : 0
    });
  }

  // Generate member users
  for (let i = 0; i < CONFIG.users.members; i++) {
    const username = USERNAMES.member[i];
    const info = USER_INFO[i + 10];
    users.push({
      username,
      email: `${username}@cfblog.local`,
      password_hash: generatePasswordHash('password123'),
      display_name: info.name,
      role: 'member',
      bio: info.bio,
      status: Math.random() > 0.3 ? 1 : 0
    });
  }

  console.log(`Generated ${users.length} users`);
  return users;
}

function generateCategories() {
  console.log('\n=== Generating Categories ===');

  const categories = [];

  // Generate level 1 categories
  for (let i = 0; i < CONFIG.categories.level1; i++) {
    const category = CATEGORY_NAMES[i];
    categories.push({
      name: category.name,
      slug: generateSlug(category.name),
      description: category.description,
      parent_id: null,
      sort_order: i * 10
    });
  }

  // Generate level 2 categories
  for (let i = 0; i < CONFIG.categories.level2; i++) {
    const category = CATEGORY_NAMES[CONFIG.categories.level1 + i];
    categories.push({
      name: category.name,
      slug: generateSlug(category.name),
      description: category.description,
      parent_id: randomInt(1, 3),
      sort_order: i * 10
    });
  }

  // Generate level 3 categories
  for (let i = 0; i < CONFIG.categories.level3; i++) {
    const category = CATEGORY_NAMES[CONFIG.categories.level1 + CONFIG.categories.level2 + i];
    categories.push({
      name: category.name,
      slug: generateSlug(category.name),
      description: category.description,
      parent_id: randomInt(CONFIG.categories.level1 + 1, CONFIG.categories.level1 + 3),
      sort_order: i * 10
    });
  }

  console.log(`Generated ${categories.length} categories`);
  return categories;
}

function generateTags() {
  console.log('\n=== Generating Tags ===');

  const tags = [];

  const allTags = [...TAG_NAMES.tech, ...TAG_NAMES.life, ...TAG_NAMES.general];

  allTags.forEach(name => {
    tags.push({
      name,
      slug: generateSlug(name)
    });
  });

  console.log(`Generated ${tags.length} tags`);
  return tags;
}

function generatePosts(users, categories, tags) {
  console.log('\n=== Generating Posts ===');

  const posts = [];
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Generate published posts
  for (let i = 0; i < CONFIG.posts.published; i++) {
    const title = POST_TITLES[i % POST_TITLES.length];
    const author = randomChoice(users.filter(u => u.role === 'admin' || u.role === 'contributor'));
    const publishedDate = generateRandomDate(oneYearAgo, now);

    posts.push({
      title: `${title} ${Math.floor(i / POST_TITLES.length) + 1}`,
      slug: generateSlug(`${title} ${Math.floor(i / POST_TITLES.length) + 1}`),
      excerpt: `This is a preview of ${title}. Click to read more...`,
      author_id: author.id,
      status: 1,
      featured: i < 20 ? 1 : 0,
      comment_status: Math.random() > 0.3 ? 1 : 0,
      view_count: randomInt(100, 10000),
      published_at: formatDate(publishedDate),
      created_at: formatDate(generateRandomDate(oneYearAgo, publishedDate)),
      updated_at: formatDate(generateRandomDate(publishedDate, now))
    });
  }

  // Generate draft posts
  for (let i = 0; i < CONFIG.posts.draft; i++) {
    const title = POST_TITLES[i % POST_TITLES.length];
    const author = randomChoice(users.filter(u => u.role === 'admin' || u.role === 'contributor'));
    const createdDate = generateRandomDate(oneYearAgo, now);

    posts.push({
      title: `[Draft] ${title} ${Math.floor(i / POST_TITLES.length) + 1}`,
      slug: generateSlug(`draft-${title} ${Math.floor(i / POST_TITLES.length) + 1}`),
      excerpt: `This is a draft post about ${title}.`,
      author_id: author.id,
      status: 0,
      featured: 0,
      comment_status: 1,
      view_count: 0,
      published_at: null,
      created_at: formatDate(createdDate),
      updated_at: formatDate(generateRandomDate(createdDate, now))
    });
  }

  // Generate archived posts
  for (let i = 0; i < CONFIG.posts.archived; i++) {
    const title = POST_TITLES[i % POST_TITLES.length];
    const author = randomChoice(users.filter(u => u.role === 'admin'));
    const publishedDate = generateRandomDate(oneYearAgo, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));

    posts.push({
      title: `[Archived] ${title} ${Math.floor(i / POST_TITLES.length) + 1}`,
      slug: generateSlug(`archived-${title} ${Math.floor(i / POST_TITLES.length) + 1}`),
      excerpt: `This post has been archived.`,
      author_id: author.id,
      status: 2,
      featured: 0,
      comment_status: 1,
      view_count: randomInt(100, 5000),
      published_at: formatDate(publishedDate),
      created_at: formatDate(generateRandomDate(oneYearAgo, publishedDate)),
      updated_at: formatDate(generateRandomDate(publishedDate, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)))
    });
  }

  console.log(`Generated ${posts.length} posts`);
  return posts;
}

function generateComments(posts) {
  console.log('\n=== Generating Comments ===');

  const comments = [];
  const publishedPosts = posts.filter(p => p.status === 1 && p.comment_status === 1);
  let commentCount = 0;

  publishedPosts.forEach(post => {
    const numComments = randomInt(CONFIG.comments.perPost.min, CONFIG.comments.perPost.max);

    for (let i = 0; i < numComments && commentCount < CONFIG.comments.total; i++) {
      const isReply = Math.random() > 0.8;
      const status = Math.random() > 0.15 ? 1 : 0;
      const template = randomChoice(COMMENT_TEMPLATES);
      const postDate = new Date(post.published_at);
      const commentDate = generateRandomDate(postDate, new Date());

      comments.push({
        post_id: post.id,
        author_name: `User${randomInt(1, 100)}`,
        author_email: `user${randomInt(1, 100)}@example.com`,
        content: template.replace('{n}', randomInt(1, 10)),
        parent_id: isReply ? randomInt(1, commentCount || 1) : null,
        status,
        created_at: formatDate(commentDate)
      });

      commentCount++;
    }
  });

  console.log(`Generated ${comments.length} comments`);
  return comments;
}

function generateFeedback() {
  console.log('\n=== Generating Feedback ===');

  const feedback = [];
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < CONFIG.feedback; i++) {
    const hasEmail = Math.random() > 0.4;
    const template = randomChoice(FEEDBACK_TEMPLATES);
    const createdDate = generateRandomDate(oneYearAgo, new Date());

    feedback.push({
      name: `Visitor${i + 1}`,
      email: hasEmail ? `visitor${i + 1}@example.com` : null,
      content: template
        .replace('{topic}', randomChoice(['Cloudflare', 'Programming', 'Web Development']))
        .replace('{article}', randomChoice(POST_TITLES)),
      status: Math.random() > 0.4 ? 1 : 0,
      created_at: formatDate(createdDate)
    });
  }

  console.log(`Generated ${feedback.length} feedback entries`);
  return feedback;
}

function generateAttachments(users) {
  console.log('\n=== Generating Attachments ===');

  const attachments = [];
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const fileTypes = [
    { type: 'image/jpeg', ext: '.jpg' },
    { type: 'image/png', ext: '.png' },
    { type: 'image/gif', ext: '.gif' },
    { type: 'application/pdf', ext: '.pdf' },
    { type: 'application/msword', ext: '.doc' },
    { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: '.docx' }
  ];

  for (let i = 0; i < CONFIG.attachments; i++) {
    const fileType = randomChoice(fileTypes);
    const user = randomChoice(users.filter(u => u.status === 1));
    const createdDate = generateRandomDate(oneYearAgo, new Date());

    attachments.push({
      filename: `${randomBytes(16).toString('hex')}${fileType.ext}`,
      original_name: `attachment_${i + 1}${fileType.ext}`,
      mime_type: fileType.type,
      file_size: randomInt(10240, 5242880), // 10KB to 5MB
      storage_key: `uploads/${randomBytes(16).toString('hex')}${fileType.ext}`,
      upload_user_id: user.id,
      created_at: formatDate(createdDate)
    });
  }

  console.log(`Generated ${attachments.length} attachments`);
  return attachments;
}

function generatePostCategories(posts, categories) {
  console.log('\n=== Generating Post-Category Relationships ===');

  const postCategories = [];
  const publishedPosts = posts.filter(p => p.status === 1);

  publishedPosts.forEach(post => {
    const numCategories = randomInt(1, 3);
    const selectedCategories = [];

    for (let i = 0; i < numCategories; i++) {
      const category = randomChoice(categories);
      if (!selectedCategories.includes(category.id)) {
        selectedCategories.push(category.id);
        postCategories.push({
          post_id: post.id,
          category_id: category.id
        });
      }
    }
  });

  console.log(`Generated ${postCategories.length} post-category relationships`);
  return postCategories;
}

function generatePostTags(posts, tags) {
  console.log('\n=== Generating Post-Tag Relationships ===');

  const postTags = [];
  const publishedPosts = posts.filter(p => p.status === 1);

  publishedPosts.forEach(post => {
    const numTags = randomInt(1, 5);
    const selectedTags = [];

    for (let i = 0; i < numTags; i++) {
      const tag = randomChoice(tags);
      if (!selectedTags.includes(tag.id)) {
        selectedTags.push(tag.id);
        postTags.push({
          post_id: post.id,
          tag_id: tag.id
        });
      }
    }
  });

  console.log(`Generated ${postTags.length} post-tag relationships`);
  return postTags;
}

// Main function
async function main() {
  console.log('CFBlog Test Data Generator');
  console.log('===========================\n');

  const args = process.argv.slice(2);
  const clearData = args.includes('--clear');

  // Generate all data
  const users = generateUsers();
  const categories = generateCategories();
  const tags = generateTags();
  const posts = generatePosts(users, categories, tags);
  const comments = generateComments(posts);
  const feedback = generateFeedback();
  const attachments = generateAttachments(users);
  const postCategories = generatePostCategories(posts, categories);
  const postTags = generatePostTags(posts, tags);

  // Print summary
  console.log('\n=== Generation Summary ===');
  console.log(`Users: ${users.length}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Tags: ${tags.length}`);
  console.log(`Posts: ${posts.length}`);
  console.log(`Comments: ${comments.length}`);
  console.log(`Feedback: ${feedback.length}`);
  console.log(`Attachments: ${attachments.length}`);
  console.log(`Post-Categories: ${postCategories.length}`);
  console.log(`Post-Tags: ${postTags.length}`);
  console.log('\n=== Total Records ===');
  console.log(
    users.length + categories.length + tags.length + posts.length +
    comments.length + feedback.length + attachments.length +
    postCategories.length + postTags.length
  );

  console.log('\nNote: This script generates test data in memory.');
  console.log('To insert data into the database, you need to implement database connection logic.');
  console.log('This will be implemented after the database models are created.');
}

// Run the generator
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  generateUsers,
  generateCategories,
  generateTags,
  generatePosts,
  generateComments,
  generateFeedback,
  generateAttachments,
  generatePostCategories,
  generatePostTags
};
