/**
 * Search Routes
 * Handles search functionality
 */

import { Router } from 'itty-router';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Tag } from '../models/Tag.js';
import {
  successResponse,
  errorResponse,
  serverErrorResponse
} from '../utils/response.js';

const searchRouter = Router();

// Middleware to get DB instance
const withDB = async (request, fn) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return serverErrorResponse('Database not available');
    }
    return fn(db);
  } catch (error) {
    console.error('Search route error:', error);
    return serverErrorResponse(error.message);
  }
};

// GET /api/search - Global search
searchRouter.get('/', async (request) => {
  return withDB(request, async (db) => {
    try {
      const { keyword, type = 'all', page = 1, limit = 10 } = Object.fromEntries(new URL(request.url).searchParams);

      if (!keyword) {
        return errorResponse('Keyword is required');
      }

      const searchPattern = `%${keyword}%`;
      const offset = (page - 1) * limit;

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

      return successResponse({
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
      return serverErrorResponse(error.message);
    }
  });
});

export { searchRouter as searchRoutes };
