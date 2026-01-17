/**
 * CFBlog Main Entry Point
 * Simplified version for E2E testing
 */

import { Router } from 'itty-router';

// Import routes
import { userRoutes } from './routes/user.js';
import { postRoutes } from './routes/post.js';
import { categoryRoutes } from './routes/category.js';
import { tagRoutes } from './routes/tag.js';
import { commentRoutes } from './routes/comment.js';
import { feedbackRoutes } from './routes/feedback.js';
import { searchRoutes } from './routes/search.js';
import { uploadRoutes } from './routes/upload.js';
import { frontendSimpleRoutes } from './routes/frontend-simple.js';
import { adminRoutes } from './routes/admin/dashboard.js';
import { cacheAdminRoutes } from './routes/cache-admin.js';
import { settingsRoutes } from './routes/settings.js';

// Import middleware
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/error.js';

// Create router
const router = Router();

// Apply CORS middleware
router.all('*', corsMiddleware);

// Health check
router.get('/health', () => {
  return new Response(JSON.stringify({
    success: true,
    message: 'CFBlog is running',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// API Routes
router.all('/api/user/*', userRoutes);
router.all('/api/post/*', postRoutes);
router.all('/api/category/*', categoryRoutes);
router.all('/api/tag/*', tagRoutes);
router.all('/api/comment/*', commentRoutes);
router.all('/api/feedback/*', feedbackRoutes);
router.all('/api/search', searchRoutes);
router.all('/api/upload', uploadRoutes);
router.all('/api/settings/*', settingsRoutes);
router.all('/admin/api/cache/*', cacheAdminRoutes);

// Frontend routes (using simplified version)
router.all('/', frontendSimpleRoutes);
router.all('/post/*', frontendSimpleRoutes);
router.all('/login', frontendSimpleRoutes);
router.all('/search', frontendSimpleRoutes);
router.all('/feedback', frontendSimpleRoutes);
router.all('/category/*', frontendSimpleRoutes);
router.all('/categories', frontendSimpleRoutes);
router.all('/tag/*', frontendSimpleRoutes);
router.all('/tags', frontendSimpleRoutes);

// Admin routes
router.all('/admin/*', adminRoutes);

// 404 handler for JSON
router.all('*', () => {
  return new Response(JSON.stringify({
    success: false,
    message: 'Not Found'
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
});

// Error handler
router.all('*', errorHandler);

// Export fetch handler for Cloudflare Workers
export default {
  fetch: router.fetch
};
