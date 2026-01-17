/**
 * Frontend Routes - Hono Version
 */

import { Hono } from 'hono';
import { homePage, postPage, loginPage, searchPage, feedbackPage } from '../routes/frontend-simple-v2.js';

const frontendRoutes = new Hono();

// GET / - 首页
frontendRoutes.get('/', async (c) => {
  const result = await homePage(c);
  return result;
});

// GET /post/:slug - 文章详情
frontendRoutes.get('/post/:slug', async (c) => {
  c.req.params = { slug: c.req.param('slug') };
  const result = await postPage(c);
  return result;
});

// GET /login - 登录页
frontendRoutes.get('/login', async (c) => {
  const result = await loginPage(c);
  return result;
});

// GET /search - 搜索页
frontendRoutes.get('/search', async (c) => {
  const result = await searchPage(c);
  return result;
});

// GET /feedback - 反馈页
frontendRoutes.get('/feedback', async (c) => {
  const result = await feedbackPage(c);
  return result;
});

export { frontendRoutes };
