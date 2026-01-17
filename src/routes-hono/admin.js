/**
 * Admin Routes - Hono Version
 */

import { Hono } from 'hono';

const adminRoutes = new Hono();

// GET /admin - 管理后台首页
adminRoutes.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CFBlog Admin</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <h1>CFBlog Admin Panel</h1>
      <p>Admin dashboard - Coming Soon</p>
    </body>
    </html>
  `);
});

export { adminRoutes };
