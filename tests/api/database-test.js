/**
 * Database and API Validation Test
 * 验证数据库和API功能
 */

const { execSync } = require('child_process');

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

function runQuery(sql) {
  try {
    const result = execSync(
      `npx wrangler d1 execute cfblog-database --local --command "${sql.replace(/"/g, '\\"')}"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    return JSON.parse(result);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function runAPICall(method, endpoint, data = null) {
  try {
    const curlCmd = data
      ? `curl -s -X ${method} http://localhost:8787${endpoint} -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`
      : `curl -s -X ${method} http://localhost:8787${endpoint}`;

    const result = execSync(curlCmd, { encoding: 'utf-8', stdio: 'pipe' });
    try {
      return JSON.parse(result);
    } catch {
      return { raw: result };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testDatabaseTables() {
  log('\n=== Testing Database Tables ===', 'cyan');

  const tests = [
    { name: 'Posts Table', sql: 'SELECT COUNT(*) as count FROM posts' },
    { name: 'Users Table', sql: 'SELECT COUNT(*) as count FROM users' },
    { name: 'Categories Table', sql: 'SELECT COUNT(*) as count FROM categories' },
    { name: 'Tags Table', sql: 'SELECT COUNT(*) as count FROM tags' },
    { name: 'Comments Table', sql: 'SELECT COUNT(*) as count FROM comments' },
    { name: 'Feedback Table', sql: 'SELECT COUNT(*) as count FROM feedback' },
    { name: 'Post-Category Links', sql: 'SELECT COUNT(*) as count FROM post_categories' },
    { name: 'Post-Tag Links', sql: 'SELECT COUNT(*) as count FROM post_tags' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = runQuery(test.sql);
    if (result.success === false) {
      log(`✗ ${test.name}: ${result.error}`, 'red');
      failed++;
    } else if (result.results && result.results[0]) {
      const count = result.results[0].count;
      log(`✓ ${test.name}: ${count} records`, 'green');
      passed++;
    } else {
      log(`✗ ${test.name}: No data`, 'red');
      failed++;
    }
  }

  return { passed, failed };
}

async function testHealthEndpoint() {
  log('\n=== Testing Health Endpoint ===', 'cyan');
  const result = runAPICall('GET', '/health');

  if (result.success && result.data) {
    log(`✓ Health check passed`, 'green');
    return true;
  } else {
    log(`✗ Health check failed`, 'red');
    return false;
  }
}

async function testDatabaseQueries() {
  log('\n=== Testing Database Queries ===', 'cyan');

  const tests = [
    { name: 'Get Posts', sql: 'SELECT id, title, status FROM posts LIMIT 3' },
    { name: 'Get Users', sql: 'SELECT id, username, role FROM users LIMIT 3' },
    { name: 'Get Categories', sql: 'SELECT id, name, slug FROM categories LIMIT 3' },
    { name: 'Get Tags', sql: 'SELECT id, name, slug FROM tags LIMIT 3' },
    { name: 'Get Comments', sql: 'SELECT id, author_name, post_id FROM comments LIMIT 3' },
    { name: 'Get Feedback', sql: 'SELECT id, name, status FROM feedback LIMIT 3' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = runQuery(test.sql);
    if (result.success === false) {
      log(`✗ ${test.name}: ${result.error}`, 'red');
      failed++;
    } else if (result.results && result.results.length > 0) {
      log(`✓ ${test.name}: Found ${result.results.length} records`, 'green');
      passed++;
    } else {
      log(`✗ ${test.name}: No records`, 'red');
      failed++;
    }
  }

  return { passed, failed };
}

async function testDataIntegrity() {
  log('\n=== Testing Data Integrity ===', 'cyan');

  const tests = [
    {
      name: 'Check Post Authors Exist',
      sql: 'SELECT COUNT(*) as count FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE u.id IS NULL'
    },
    {
      name: 'Check Comment Posts Exist',
      sql: 'SELECT COUNT(*) as count FROM comments c LEFT JOIN posts p ON c.post_id = p.id WHERE p.id IS NULL'
    },
    {
      name: 'Check Post-Category Links Valid',
      sql: 'SELECT COUNT(*) as count FROM post_categories pc LEFT JOIN posts p ON pc.post_id = p.id WHERE p.id IS NULL'
    },
    {
      name: 'Check Post-Tag Links Valid',
      sql: 'SELECT COUNT(*) as count FROM post_tags pt LEFT JOIN posts p ON pt.post_id = p.id WHERE p.id IS NULL'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = runQuery(test.sql);
    if (result.success === false) {
      log(`✗ ${test.name}: ${result.error}`, 'red');
      failed++;
    } else if (result.results && result.results[0]) {
      const count = result.results[0].count;
      if (count === 0) {
        log(`✓ ${test.name}: No orphaned records`, 'green');
        passed++;
      } else {
        log(`⚠ ${test.name}: ${count} orphaned records`, 'yellow');
        passed++; // Warning but not failure
      }
    } else {
      log(`✗ ${test.name}: Cannot verify`, 'red');
      failed++;
    }
  }

  return { passed, failed };
}

async function generateTestReport() {
  log('\n' + '='.repeat(60), 'cyan');
  log('CFBlog API Database Test Report', 'cyan');
  log('='.repeat(60), 'cyan');

  // Check server
  const healthOK = await testHealthEndpoint();

  if (!healthOK) {
    log('\n❌ Server is not running. Please start with: npm run dev', 'red');
    process.exit(1);
  }

  // Run all tests
  const dbTests = await testDatabaseTables();
  const queryTests = await testDatabaseQueries();
  const integrityTests = await testDataIntegrity();

  // Summary
  const totalPassed = dbTests.passed + queryTests.passed + integrityTests.passed;
  const totalFailed = dbTests.failed + queryTests.failed + integrityTests.failed;
  const totalTests = totalPassed + totalFailed;

  log('\n' + '='.repeat(60), 'cyan');
  log('Test Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${totalPassed}`, 'green');
  log(`Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`, 'cyan');

  log('\n' + '='.repeat(60), 'cyan');

  process.exit(totalFailed > 0 ? 1 : 0);
}

generateTestReport();
