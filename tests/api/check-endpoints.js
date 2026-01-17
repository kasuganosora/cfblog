/**
 * Quick API Endpoint Checker
 * 快速检查所有API端点
 */

const API_BASE = 'http://localhost:8787';

const endpoints = [
  // Health Check
  { method: 'GET', path: '/health', name: 'Health Check' },

  // Post API
  { method: 'GET', path: '/api/post/list', name: 'Post List' },
  { method: 'GET', path: '/api/post/1', name: 'Get Post by ID' },
  { method: 'GET', path: '/api/post/slug/test', name: 'Get Post by Slug' },

  // User API
  { method: 'GET', path: '/api/user/list', name: 'User List' },
  { method: 'POST', path: '/api/user/login', body: { username: 'admin', password: 'admin123' }, name: 'User Login' },

  // Category API
  { method: 'GET', path: '/api/category/list', name: 'Category List' },
  { method: 'GET', path: '/api/category/tree', name: 'Category Tree' },
  { method: 'GET', path: '/api/category/1', name: 'Get Category' },

  // Tag API
  { method: 'GET', path: '/api/tag/list', name: 'Tag List' },
  { method: 'GET', path: '/api/tag/popular', name: 'Popular Tags' },
  { method: 'GET', path: '/api/tag/1', name: 'Get Tag' },

  // Comment API
  { method: 'GET', path: '/api/comment/post/1', name: 'Get Comments by Post' },
  { method: 'GET', path: '/api/comment/1', name: 'Get Comment' },

  // Feedback API
  { method: 'GET', path: '/api/feedback/list', name: 'Feedback List' },
  { method: 'GET', path: '/api/feedback/1', name: 'Get Feedback' },

  // Search API
  { method: 'GET', path: '/api/search?keyword=test', name: 'Search' },

  // Settings API
  { method: 'GET', path: '/api/settings', name: 'All Settings' },
  { method: 'GET', path: '/api/settings/blog', name: 'Blog Settings' },
  { method: 'GET', path: '/api/settings/display', name: 'Display Settings' },
  { method: 'GET', path: '/api/settings/comments', name: 'Comment Settings' },
  { method: 'GET', path: '/api/settings/upload', name: 'Upload Settings' },
  { method: 'GET', path: '/api/settings/seo', name: 'SEO Settings' }
];

let results = {
  total: endpoints.length,
  success: 0,
  failed: 0
};

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkEndpoint(endpoint) {
  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }

    const response = await fetch(`${API_BASE}${endpoint.path}`, options);
    const data = await response.json();

    if (response.ok) {
      results.success++;
      log(`✓ ${endpoint.name} (${endpoint.method} ${endpoint.path})`, 'green');
      return { success: true, data };
    } else {
      results.failed++;
      log(`✗ ${endpoint.name} (${endpoint.method} ${endpoint.path})`, 'red');
      log(`  Status: ${response.status}`, 'red');
      log(`  Message: ${data.message || 'Unknown error'}`, 'red');
      return { success: false, data };
    }
  } catch (error) {
    results.failed++;
    log(`✗ ${endpoint.name} (${endpoint.method} ${endpoint.path})`, 'red');
    log(`  Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runChecks() {
  log('\n=== CFBlog API Endpoint Checker ===\n', 'cyan');

  // Check server first
  try {
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (healthResponse.ok) {
      log('✓ Server is running\n', 'green');
    } else {
      log('✗ Server is not responding correctly\n', 'red');
      process.exit(1);
    }
  } catch (error) {
    log('✗ Cannot connect to server. Please start server with: npm run dev\n', 'red');
    process.exit(1);
  }

  // Check all endpoints
  for (const endpoint of endpoints) {
    await checkEndpoint(endpoint);
  }

  // Print summary
  log('\n=== Summary ===', 'cyan');
  log(`Total Endpoints: ${results.total}`, 'blue');
  log(`Success: ${results.success}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.success / results.total) * 100).toFixed(2)}%`, 'blue');
  log('================\n', 'cyan');
}

runChecks();
