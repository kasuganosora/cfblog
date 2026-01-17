/**
 * CFBlog Main Entry Point - Hono Version
 * 使用Hono框架重写
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Import route modules
import { postRoutes } from './routes-hono/post.js';
import { userRoutes } from './routes-hono/user.js';
import { categoryRoutes } from './routes-hono/category.js';
import { tagRoutes } from './routes-hono/tag.js';
import { commentRoutes } from './routes-hono/comment.js';
import { feedbackRoutes } from './routes-hono/feedback.js';
import { searchRoutes } from './routes-hono/search.js';
import { settingsRoutes } from './routes-hono/settings.js';
import { uploadRoutes } from './routes-hono/upload.js';
import { adminRoutes } from './routes-hono/admin.js';
import { frontendRoutes } from './routes-hono/frontend.js';

// Create main app
const app = new Hono();

// Global middleware
app.use('*', cors());
app.use('*', logger());

// Health check
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'CFBlog is running',
    timestamp: new Date().toISOString(),
    version: 'Hono'
  });
});

// API routes - 使用route方法进行子路由挂载
app.route('/api/post', postRoutes);
app.route('/api/user', userRoutes);
app.route('/api/category', categoryRoutes);
app.route('/api/tag', tagRoutes);
app.route('/api/comment', commentRoutes);
app.route('/api/feedback', feedbackRoutes);
app.route('/api/search', searchRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/upload', uploadRoutes);

// Admin routes
app.route('/admin', adminRoutes);

// Frontend routes
app.route('/', frontendRoutes);

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    success: false,
    message: err.message || 'Internal Server Error'
  }, err.status || 500);
});

// 404 handler
app.notFound((c) => {
  const accept = c.req.header('Accept') || '';
  if (accept.includes('application/json')) {
    return c.json({
      success: false,
      message: 'Not Found'
    }, 404);
  }
  return c.html('<h1>404 - Not Found</h1>', 404);
});

export default app;
