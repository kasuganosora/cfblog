/**
 * Search Routes - Hono Version
 */

import { Hono } from 'hono';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Tag } from '../models/Tag.js';
import {
  serverErrorResponse,
  errorResponse
} from './base.js';

const searchRoutes = new Hono();

// GET / - 全局搜索
searchRoutes.get('/', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const url = new URL(c.req.url);
    const keyword = url.searchParams.get('keyword');
    const type = url.searchParams.get('type') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!keyword) {
      return c.json(errorResponse('Keyword is required').json(), 400);
    }

    const searchPattern = `%${keyword}%`;
    let results = [];
    let totalCount = 0;

    // Search posts
    if (type === 'all' || type === 'posts') {
      const postModel = new Post(db);
      const postResult = await postModel.searchPosts(keyword, { page, limit, status: 1 });
      results = [
        ...results,
        ...postResult.results.map(post => ({ ...post, type: 'post' }))
      ];
      totalCount += postResult.pagination.total;
    }

    // Search categories
    if (type === 'all' || type === 'categories') {
      const categoryModel = new Category(db);
      const categories = await categoryModel.query(
        `SELECT * FROM categories WHERE name LIKE ? OR description LIKE ? LIMIT 10`,
        [searchPattern, searchPattern]
      );
      results = [
        ...results,
        ...categories.map(cat => ({ ...cat, type: 'category' }))
      ];
      totalCount += categories.length;
    }

    // Search tags
    if (type === 'all' || type === 'tags') {
      const tagModel = new Tag(db);
      const tags = await tagModel.query(
        `SELECT * FROM tags WHERE name LIKE ? LIMIT 10`,
        [searchPattern]
      );
      results = [
        ...results,
        ...tags.map(tag => ({ ...tag, type: 'tag' }))
      ];
      totalCount += tags.length;
    }

    return c.json({
      keyword,
      type,
      results,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

export { searchRoutes };
