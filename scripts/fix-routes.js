/**
 * 批量修复Hono路由路径
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../src/routes-hono');
const routeFiles = [
  'user.js',
  'category.js',
  'tag.js',
  'comment.js',
  'feedback.js',
  'search.js',
  'settings.js',
  'upload.js',
  'admin.js'
];

const routePrefixes = {
  'user.js': 'user',
  'category.js': 'category',
  'tag.js': 'tag',
  'comment.js': 'comment',
  'feedback.js': 'feedback',
  'search.js': 'search',
  'settings.js': 'settings',
  'upload.js': 'upload',
  'admin.js': 'admin'
};

function fixRouteFile(filename) {
  const filepath = path.join(routesDir, filename);
  const prefix = routePrefixes[filename];

  if (!fs.existsSync(filepath)) {
    console.log(`❌ File not found: ${filepath}`);
    return;
  }

  let content = fs.readFileSync(filepath, 'utf8');
  const originalContent = content;

  // Replace all route paths
  const replacements = [
    // Basic routes
    [`/${prefix}/list`, '/list'],
    [`/${prefix}/:id`, '/:id'],
    [`/${prefix}/create`, '/create'],
    [`/${prefix}/:id/update`, '/:id/update'],
    [`/${prefix}/:id/delete`, '/:id/delete'],
    [`/${prefix}/:id/edit`, '/:id/edit'],
    [`/${prefix}/search`, '/search'],
    [`/${prefix}/count`, '/count'],

    // Special routes
    [`/${prefix}/slug/:slug`, '/slug/:slug'],
    [`/${prefix}/published`, '/published'],
    [`/${prefix}/login`, '/login'],
    [`/${prefix}/register`, '/register'],
    [`/${prefix}/logout`, '/logout'],
    [`/${prefix}/me`, '/me'],
    [`/${prefix}/profile`, '/profile'],
    [`/${prefix}/post/:id`, '/post/:id'],
    [`/${prefix}/config`, '/config'],
    [`/${prefix}/:key`, '/:key'],
    [`/:key`, '/:key'], // For settings
  ];

  // Apply replacements
  replacements.forEach(([old, newStr]) => {
    const regex = new RegExp(`'${old}'`, 'g');
    content = content.replace(regex, `'${newStr}'`);
  });

  // Save if changed
  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`✅ Fixed: ${filename}`);
    console.log(`   Prefix: ${prefix}`);
  } else {
    console.log(`⚠️  No changes: ${filename}`);
  }
}

console.log('Fixing Hono route paths...\n');

routeFiles.forEach(fixRouteFile);

console.log('\n✅ Route fixing complete!');
