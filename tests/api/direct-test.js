/**
 * Direct Route Testing
 * 直接测试路由函数
 */

import { postRoutes } from '../src/routes/post.js';
import { userRoutes } from '../src/routes/user.js';
import { categoryRoutes } from '../src/routes/category.js';
import { tagRoutes } from '../src/routes/tag.js';
import { commentRoutes } from '../src/routes/comment.js';
import { feedbackRoutes } from '../src/routes/feedback.js';
import { searchRoutes } from '../src/routes/search.js';
import { settingsRoutes } from '../src/routes/settings.js';
import { uploadRoutes } from '../src/routes/upload.js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test if routes are properly exported
const routes = {
  'Post Routes': postRoutes,
  'User Routes': userRoutes,
  'Category Routes': categoryRoutes,
  'Tag Routes': tagRoutes,
  'Comment Routes': commentRoutes,
  'Feedback Routes': feedbackRoutes,
  'Search Routes': searchRoutes,
  'Settings Routes': settingsRoutes,
  'Upload Routes': uploadRoutes
};

log('\n=== Testing Route Exports ===\n', 'cyan');

let passed = 0;
let failed = 0;

for (const [name, route] of Object.entries(routes)) {
  try {
    if (route && typeof route === 'object') {
      log(`✓ ${name} - Exported successfully`, 'green');
      passed++;
    } else {
      log(`✗ ${name} - Invalid export`, 'red');
      failed++;
    }
  } catch (error) {
    log(`✗ ${name} - Error: ${error.message}`, 'red');
    failed++;
  }
}

log('\n=== Summary ===', 'cyan');
log(`Total: ${passed + failed}`, 'cyan');
log(`Passed: ${passed}`, 'green');
log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
log('================\n', 'cyan');

process.exit(failed > 0 ? 1 : 0);
