/**
 * Post Routes
 * Handles post CRUD operations
 */

import { Router } from 'itty-router';
import { Post } from '../models/Post.js';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse
} from '../utils/response.js';

const postRouter = Router();

// Middleware to get DB instance
const withDB = async (request, fn) => {
  try {
    const db = request.env?.DB;
    if (!db) {
      return serverErrorResponse('Database not available');
    }
    return fn(new Post(db));
  } catch (error) {
    console.error('Post route error:', error);
    return serverErrorResponse(error.message);
  }
};

// GET /api/post/list - Get post list
postRouter.get('/list', async (request) => {
  return withDB(request, async (postModel) => {
    try {
      const { page, limit, status, featured } = Object.fromEntries(new URL(request.url).searchParams);

      const result = await postModel.getPostList({
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        status: status !== undefined ? parseInt(status) : undefined,
        featured: featured !== undefined ? featured === 'true' : undefined
      });

      return successResponse(result);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/post/:id - Get post detail by ID
postRouter.get('/:id', async (request) => {
  return withDB(request, async (postModel) => {
    try {
      const id = parseInt(request.params.id);
      const post = await postModel.getPostById(id);

      if (!post) {
        return notFoundResponse('Post not found');
      }

      // Increment view count
      await postModel.incrementViewCount(id);

      return successResponse(post);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// GET /api/post/slug/:slug - Get post detail by slug
postRouter.get('/slug/:slug', async (request) => {
  return withDB(request, async (postModel) => {
    try {
      const slug = request.params.slug;
      const post = await postModel.getPostBySlug(slug);

      if (!post) {
        return notFoundResponse('Post not found');
      }

      // Increment view count
      await postModel.incrementViewCount(post.id);

      return successResponse(post);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

// POST /api/post/create - Create post
postRouter.post('/create', async (request) => {
  return withDB(request, async (postModel) => {
    try {
      const body = await request.json();

      if (!body.title || !body.authorId) {
        return errorResponse('Title and author ID are required');
      }

      // TODO: Add authentication and permission check
      // For now, skip auth check

      const post = await postModel.createPost(body);
      return successResponse(post, 'Post created successfully', 201);
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

// PUT /api/post/:id/update - Update post
postRouter.put('/:id/update', async (request) => {
  return withDB(request, async (postModel) => {
    try {
      const id = parseInt(request.params.id);
      const body = await request.json();

      // TODO: Add authentication and permission check
      // For now, skip auth check

      const post = await postModel.updatePost(id, body);
      return successResponse(post, 'Post updated successfully');
    } catch (error) {
      return errorResponse(error.message, 400);
    }
  });
});

// DELETE /api/post/:id/delete - Delete post
postRouter.delete('/:id/delete', async (request) => {
  return withDB(request, async (postModel) => {
    try {
      const id = parseInt(request.params.id);

      // TODO: Add authentication and permission check
      // For now, skip auth check

      await postModel.deletePost(id);
      return successResponse(null, 'Post deleted successfully');
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  });
});

// GET /api/post/search - Search posts (moved to /api/search)
postRouter.get('/search', async (request) => {
  return withDB(request, async (postModel) => {
    try {
      const { keyword, page, limit } = Object.fromEntries(new URL(request.url).searchParams);

      if (!keyword) {
        return errorResponse('Keyword is required');
      }

      const result = await postModel.searchPosts(keyword, {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10
      });

      return successResponse(result);
    } catch (error) {
      return serverErrorResponse(error.message);
    }
  });
});

export { postRouter as postRoutes };
