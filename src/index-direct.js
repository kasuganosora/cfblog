/**
 * CFBlog Main Entry Point - Direct Routes
 * 所有路由直接定义，避免子路由问题
 */

import { Router } from 'itty-router';
import { Post } from './models/Post.js';
import { User } from './models/User.js';
import { Category } from './models/Category.js';
import { Tag } from './models/Tag.js';
import { Comment } from './models/Comment.js';
import { Feedback } from './models/Feedback.js';
import { Settings } from './models/Settings.js';

const router = Router();

// ============================================
// Health Check
// ============================================
router.get('/health', () => {
  return new Response(JSON.stringify({
    success: true,
    message: 'CFBlog is running',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// ============================================
// CORS Middleware
// ============================================
router.all('*', (request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  request.corsHeaders = corsHeaders;
  return null; // 继续处理请求
});

// ============================================
// POST Routes
// ============================================

// GET /api/post/list
router.get('/api/post/list', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const postModel = new Post(db);
    const params = Object.fromEntries(new URL(request.url).searchParams);

    const result = await postModel.getPostList({
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined,
      status: params.status !== undefined ? parseInt(params.status) : undefined,
      featured: params.featured !== undefined ? params.featured === 'true' : undefined
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Post list error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// GET /api/post/published
router.get('/api/post/published', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const postModel = new Post(db);
    const result = await postModel.getPostList({ status: 1 });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get published posts error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// GET /api/post/:id
router.get('/api/post/:id', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const postModel = new Post(db);
    const id = parseInt(request.params.id);
    const post = await postModel.getPostById(id);

    if (!post) {
      return new Response(JSON.stringify({ success: false, message: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await postModel.incrementViewCount(id);

    return new Response(JSON.stringify(post), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get post error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// USER Routes
// ============================================

// GET /api/user/list
router.get('/api/user/list', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userModel = new User(db);
    const params = Object.fromEntries(new URL(request.url).searchParams);

    const result = await userModel.getUserList({
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('User list error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// GET /api/user/:id
router.get('/api/user/:id', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userModel = new User(db);
    const id = parseInt(request.params.id);
    const user = await userModel.getUserById(id);

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// POST /api/user/login
router.post('/api/user/login', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: 'Username and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userModel = new User(db);
    const user = await userModel.verifyCredentials(username, password);

    const sessionId = 'session-' + Date.now() + '-' + Math.random();

    return new Response(JSON.stringify({
      success: true,
      data: { user, sessionId },
      message: 'Login successful'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// CATEGORY Routes
// ============================================

// GET /api/category/list
router.get('/api/category/list', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const categoryModel = new Category(db);
    const params = Object.fromEntries(new URL(request.url).searchParams);

    const result = await categoryModel.getCategoryList({
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Category list error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// GET /api/category/published
router.get('/api/category/published', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const categoryModel = new Category(db);
    const result = await categoryModel.getCategoryList({ status: 1 });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get published categories error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// TAG Routes
// ============================================

// GET /api/tag/list
router.get('/api/tag/list', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tagModel = new Tag(db);
    const params = Object.fromEntries(new URL(request.url).searchParams);

    const result = await tagModel.getTagList({
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Tag list error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// GET /api/tag/published
router.get('/api/tag/published', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tagModel = new Tag(db);
    const result = await tagModel.getTagList({ status: 1 });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get published tags error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// COMMENT Routes
// ============================================

// GET /api/comment/list
router.get('/api/comment/list', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const commentModel = new Comment(db);
    const params = Object.fromEntries(new URL(request.url).searchParams);

    const result = await commentModel.getCommentList({
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Comment list error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// FEEDBACK Routes
// ============================================

// GET /api/feedback/list
router.get('/api/feedback/list', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const feedbackModel = new Feedback(db);
    const params = Object.fromEntries(new URL(request.url).searchParams);

    const result = await feedbackModel.getFeedbackList({
      page: params.page ? parseInt(params.page) : undefined,
      limit: params.limit ? parseInt(params.limit) : undefined
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Feedback list error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// SETTINGS Routes
// ============================================

// GET /api/settings
router.get('/api/settings', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const settingsModel = new Settings(db);
    const settings = await settingsModel.getAllSettings();

    return new Response(JSON.stringify(settings), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// SEARCH Routes
// ============================================

// GET /api/search
router.get('/api/search', async (request) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ success: false, message: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');

    if (!keyword) {
      return new Response(JSON.stringify({ success: false, message: 'Keyword is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const postModel = new Post(db);
    const result = await postModel.searchPosts(keyword, { page: 1, limit: 10 });

    return new Response(JSON.stringify({
      keyword,
      results: result.results,
      pagination: result.pagination
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ============================================
// 404 Handler
// ============================================
router.all('*', () => {
  return new Response(JSON.stringify({
    success: false,
    message: 'Not Found'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
});

export default {
  fetch: router.fetch
};
