/**
 * Module-Level API Test
 * 直接测试API模块函数
 */

import { Router } from 'itty-router';
import { Post } from '../src/models/Post.js';
import { Category } from '../src/models/Category.js';
import { Tag } from '../src/models/Tag.js';
import { User } from '../src/models/User.js';
import { Comment } from '../src/models/Comment.js';
import { Feedback } from '../src/models/Feedback.js';
import { Settings } from '../src/models/Settings.js';

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

// Mock DB and env
const mockDB = {
  prepare: (sql) => ({
    bind: (...params) => ({
      all: async () => {
        if (sql.includes('posts')) return { results: [{ id: 1, title: 'Test Post' }] };
        if (sql.includes('categories')) return { results: [{ id: 1, name: 'Test Category' }] };
        if (sql.includes('tags')) return { results: [{ id: 1, name: 'Test Tag' }] };
        if (sql.includes('users')) return { results: [{ id: 1, username: 'admin' }] };
        if (sql.includes('comments')) return { results: [{ id: 1, content: 'Test Comment' }] };
        if (sql.includes('feedback')) return { results: [{ id: 1, content: 'Test Feedback' }] };
        return { results: [] };
      },
      first: async () => {
        if (sql.includes('COUNT')) return { results: [{ count: 1 }] };
        return null;
      },
      run: async () => ({ meta: { changes: 1 } })
    })
  })
};

const mockEnv = {
  DB: mockDB,
  SESSION_SECRET: 'test-secret'
};

// Create mock requests
function createMockRequest(method, path, body = null, params = {}) {
  const url = `http://localhost:8787${path}`;
  return {
    method,
    url,
    env: mockEnv,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    params,
    json: async () => body
  };
}

async function testModel(modelName, modelClass) {
  log(`\n=== Testing ${modelName} ===`, 'cyan');
  try {
    const model = new modelClass(mockDB);
    let passed = 0;
    let total = 0;

    // Test getPostList or similar
    if (model.getPostList) {
      total++;
      try {
        const result = await model.getPostList({ page: 1, limit: 10 });
        log(`✓ getPostList() works`, 'green');
        passed++;
      } catch (e) {
        log(`✗ getPostList() failed: ${e.message}`, 'red');
      }
    }

    if (model.getCategoryList) {
      total++;
      try {
        const result = await model.getCategoryList({ page: 1, limit: 10 });
        log(`✓ getCategoryList() works`, 'green');
        passed++;
      } catch (e) {
        log(`✗ getCategoryList() failed: ${e.message}`, 'red');
      }
    }

    if (model.getTagList) {
      total++;
      try {
        const result = await model.getTagList({ page: 1, limit: 10 });
        log(`✓ getTagList() works`, 'green');
        passed++;
      } catch (e) {
        log(`✗ getTagList() failed: ${e.message}`, 'red');
      }
    }

    if (model.getUserList) {
      total++;
      try {
        const result = await model.getUserList({ page: 1, limit: 10 });
        log(`✓ getUserList() works`, 'green');
        passed++;
      } catch (e) {
        log(`✗ getUserList() failed: ${e.message}`, 'red');
      }
    }

    if (model.getCommentsByPost) {
      total++;
      try {
        const result = await model.getCommentsByPost(1, { page: 1, limit: 10 });
        log(`✓ getCommentsByPost() works`, 'green');
        passed++;
      } catch (e) {
        log(`✗ getCommentsByPost() failed: ${e.message}`, 'red');
      }
    }

    if (model.getFeedbackList) {
      total++;
      try {
        const result = await model.getFeedbackList({ page: 1, limit: 10 });
        log(`✓ getFeedbackList() works`, 'green');
        passed++;
      } catch (e) {
        log(`✗ getFeedbackList() failed: ${e.message}`, 'red');
      }
    }

    if (model.getAllSettings) {
      total++;
      try {
        const result = await model.getAllSettings();
        log(`✓ getAllSettings() works`, 'green');
        passed++;
      } catch (e) {
        log(`✗ getAllSettings() failed: ${e.message}`, 'red');
      }
    }

    log(`\n${modelName}: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
    return { passed, total };
  } catch (error) {
    log(`✗ ${modelName} initialization failed: ${error.message}`, 'red');
    return { passed: 0, total: 1 };
  }
}

async function runTests() {
  log('\n' + '='.repeat(50), 'cyan');
  log('CFBlog Model Module Tests', 'cyan');
  log('='.repeat(50), 'cyan');

  const results = await Promise.all([
    testModel('Post Model', Post),
    testModel('Category Model', Category),
    testModel('Tag Model', Tag),
    testModel('User Model', User),
    testModel('Comment Model', Comment),
    testModel('Feedback Model', Feedback),
    testModel('Settings Model', Settings)
  ]);

  const totalTests = results.reduce((sum, r) => sum + r.total, 0);
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);

  log('\n' + '='.repeat(50), 'cyan');
  log('Overall Summary', 'cyan');
  log('='.repeat(50), 'cyan');
  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${totalPassed}`, 'green');
  log(`Failed: ${totalTests - totalPassed}`, totalTests - totalPassed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(2)}%`, 'cyan');
  log('='.repeat(50) + '\n', 'cyan');

  process.exit(totalTests - totalPassed > 0 ? 1 : 0);
}

runTests();
