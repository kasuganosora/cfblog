/**
 * Hono Post Routes Test
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { postRoutes } from './routes-hono-post-simple.js';

const app = new Hono();

// Global middleware
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'CFBlog is running',
    timestamp: new Date().toISOString(),
    version: 'Hono Post Test'
  });
});

// Post routes
app.route('/api/post', postRoutes);

export default app;
