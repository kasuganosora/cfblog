/**
 * Admin Dashboard Routes
 * Handles all admin page rendering
 */

import { Router } from 'itty-router';

const adminRouter = Router();

// GET /admin - Admin dashboard
adminRouter.get('/', async () => {
  // TODO: Implement admin dashboard rendering
  return new Response('CFBlog - Admin Dashboard', {
    headers: { 'Content-Type': 'text/html' }
  });
});

// GET /admin/posts - Posts management
adminRouter.get('/posts', async () => {
  // TODO: Implement admin posts page rendering
  return new Response('CFBlog - Admin Posts', {
    headers: { 'Content-Type': 'text/html' }
  });
});

// GET /admin/categories - Categories management
adminRouter.get('/categories', async () => {
  // TODO: Implement admin categories page rendering
  return new Response('CFBlog - Admin Categories', {
    headers: { 'Content-Type': 'text/html' }
  });
});

// GET /admin/tags - Tags management
adminRouter.get('/tags', async () => {
  // TODO: Implement admin tags page rendering
  return new Response('CFBlog - Admin Tags', {
    headers: { 'Content-Type': 'text/html' }
  });
});

// GET /admin/comments - Comments management
adminRouter.get('/comments', async () => {
  // TODO: Implement admin comments page rendering
  return new Response('CFBlog - Admin Comments', {
    headers: { 'Content-Type': 'text/html' }
  });
});

// GET /admin/feedback - Feedback management
adminRouter.get('/feedback', async () => {
  // TODO: Implement admin feedback page rendering
  return new Response('CFBlog - Admin Feedback', {
    headers: { 'Content-Type': 'text/html' }
  });
});

// GET /admin/attachments - Attachments management
adminRouter.get('/attachments', async () => {
  // TODO: Implement admin attachments page rendering
  return new Response('CFBlog - Admin Attachments', {
    headers: { 'Content-Type': 'text/html' }
  });
});

// GET /admin/users - Users management
adminRouter.get('/users', async () => {
  // TODO: Implement admin users page rendering
  return new Response('CFBlog - Admin Users', {
    headers: { 'Content-Type': 'text/html' }
  });
});

// GET /admin/settings - System settings
adminRouter.get('/settings', async () => {
  // TODO: Implement admin settings page rendering
  return new Response('CFBlog - Admin Settings', {
    headers: { 'Content-Type': 'text/html' }
  });
});

export { adminRouter as adminRoutes };
