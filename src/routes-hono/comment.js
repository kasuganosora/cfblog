/**
 * Comment Routes - Hono Version
 */

import { Hono } from 'hono';
import { Comment } from '../models/Comment.js';
import { Settings } from '../models/Settings.js';
import { validateSessionId } from '../utils/auth.js';
import {
  serverErrorResponse,
  errorResponse,
  notFoundResponse,
  safeParseInt,
  requireAdmin
} from './base.js';

const commentRoutes = new Hono();

// GET /api/comment/list - 获取评论列表（管理员）
commentRoutes.get('/list', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams);

    const commentModel = new Comment(db);
    const result = await commentModel.getCommentList({
      page: params.page ? parseInt(params.page) : 1,
      limit: params.limit ? parseInt(params.limit) : 20,
      status: params.status !== undefined ? parseInt(params.status) : undefined
    });

    return c.json(result);
  } catch (error) {
    console.error('Get comment list error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// PUT /api/comment/:id/status - 更新评论状态（管理员）
commentRoutes.put('/:id/status', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = safeParseInt(c.req.param('id'));
    if (id === null) {
      return c.json(errorResponse('Invalid comment ID').json(), 400);
    }
    const body = await c.req.json();

    if (body.status === undefined) {
      return c.json(errorResponse('Status is required').json(), 400);
    }

    const commentModel = new Comment(db);
    const comment = await commentModel.updateStatus(id, body.status);

    if (!comment) {
      return c.json(notFoundResponse('Comment not found').json(), 404);
    }

    return c.json({ success: true, data: comment });
  } catch (error) {
    console.error('Update comment status error:', error);
    return c.json(errorResponse(error.message).json(), 500);
  }
});

// POST /api/comment/create - 创建评论
commentRoutes.post('/create', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const body = await c.req.json();

    // Support both camelCase and snake_case field names
    const postId = body.postId || body.post_id;
    const authorName = body.authorName || body.author_name;
    const authorEmail = body.authorEmail || body.author_email;
    const parentId = body.parentId || body.parent_id || null;

    if (!postId || !authorName || !body.content) {
      return c.json(errorResponse('Post ID, author name, and content are required').json(), 400);
    }

    // Input length validation
    if (authorName.length > 50) {
      return c.json(errorResponse('Author name must be 50 characters or less').json(), 400);
    }
    if (body.content.length > 5000) {
      return c.json(errorResponse('Comment content must be 5000 characters or less').json(), 400);
    }
    if (authorEmail && authorEmail.length > 100) {
      return c.json(errorResponse('Email must be 100 characters or less').json(), 400);
    }

    // Check if post allows comments
    const postResult = await db.prepare('SELECT comment_status FROM posts WHERE id = ?').bind(postId).first();
    if (!postResult) {
      return c.json(errorResponse('Post not found').json(), 404);
    }

    if (postResult.comment_status === 0) {
      return c.json(errorResponse('Comments are disabled for this post').json(), 403);
    }

    // IP cooldown for non-logged-in users
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || '0.0.0.0';
    let isLoggedIn = false;
    try {
      const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
      if (sessionId && c.env?.SESSION_SECRET) {
        isLoggedIn = !!(await validateSessionId(sessionId, c.env.SESSION_SECRET));
      }
    } catch(e) {}

    if (!isLoggedIn) {
      const settingsModel = new Settings(db);
      const commentSettings = await settingsModel.getCommentSettings();
      const cooldown = commentSettings.cooldown || 120;
      if (cooldown > 0) {
        try {
          const since = new Date(Date.now() - cooldown * 1000).toISOString().slice(0, 19).replace('T', ' ');
          const recent = await db.prepare(
            'SELECT id FROM comments WHERE author_ip = ? AND created_at > ? LIMIT 1'
          ).bind(ip, since).first();
          if (recent) {
            return c.json(errorResponse(`操作过于频繁，请 ${Math.ceil(cooldown / 60)} 分钟后再试`).json(), 429);
          }
        } catch (e) {
          // author_ip column may not exist yet (migration pending), skip rate limit check
          console.warn('IP rate limit check skipped:', e.message);
        }
      }
    }

    const commentModel = new Comment(db);
    let comment;
    try {
      comment = await commentModel.createComment({
        post_id: postId,
        author_name: authorName,
        author_email: authorEmail,
        author_ip: ip,
        content: body.content,
        parent_id: parentId
      });
    } catch (e) {
      if (e.message?.includes('no such column: author_ip')) {
        // Fallback: create comment without IP (migration not yet applied)
        comment = await commentModel.createComment({
          post_id: postId,
          author_name: authorName,
          author_email: authorEmail,
          content: body.content,
          parent_id: parentId
        });
      } else {
        throw e;
      }
    }

    return c.json(comment, 201);
  } catch (error) {
    console.error('Create comment error:', error);
    return c.json(errorResponse(error.message).json(), 400);
  }
});

// GET /post/:postId - 获取文章的评论
commentRoutes.get('/post/:postId', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const postId = safeParseInt(c.req.param('postId'));
    if (postId === null) {
      return c.json(errorResponse('Invalid post ID').json(), 400);
    }
    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams);

    const commentModel = new Comment(db);
    const result = await commentModel.getCommentsByPost(postId, {
      page: params.page ? parseInt(params.page) : 1,
      limit: params.limit ? parseInt(params.limit) : 20
    });

    return c.json(result);
  } catch (error) {
    console.error('Get comments error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// GET /api/comment/:id - 根据ID获取评论
commentRoutes.get('/:id', async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = safeParseInt(c.req.param('id'));
    if (id === null) {
      return c.json(errorResponse('Invalid comment ID').json(), 400);
    }
    const commentModel = new Comment(db);
    const comment = await commentModel.getCommentById(id);

    if (!comment) {
      return c.json(notFoundResponse('Comment not found').json(), 404);
    }

    return c.json(comment);
  } catch (error) {
    console.error('Get comment error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// DELETE /api/comment/:id/delete - 删除评论（管理员）
commentRoutes.delete('/:id/delete', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) {
      return c.json(serverErrorResponse('Database not available').json(), 500);
    }

    const id = safeParseInt(c.req.param('id'));
    if (id === null) {
      return c.json(errorResponse('Invalid comment ID').json(), 400);
    }
    const commentModel = new Comment(db);
    await commentModel.deleteComment(id);

    return c.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return c.json(errorResponse(error.message).json(), 500);
  }
});

export { commentRoutes };
