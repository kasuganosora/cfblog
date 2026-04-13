/**
 * Comment Model
 * Handles comment data operations
 */

import { BaseModel } from './BaseModel.js';

export class Comment extends BaseModel {
  constructor(db) {
    super(db);
    this.tableName = 'comments';
  }

  /**
   * Create comment
   */
  async createComment(commentData) {
    // Support both camelCase and snake_case field names
    const {
      postId: postIdCamel,
      post_id: postIdSnake,
      authorName: authorNameCamel,
      author_name: authorNameSnake,
      authorEmail: authorEmailCamel,
      author_email: authorEmailSnake,
      author_ip,
      content,
      parentId: parentIdCamel,
      parent_id: parentIdSnake,
      status
    } = commentData;

    const postId = postIdCamel ?? postIdSnake;
    const authorName = authorNameCamel ?? authorNameSnake;
    const authorEmail = authorEmailCamel ?? authorEmailSnake;
    const parentId = parentIdCamel ?? parentIdSnake;

    const comment = await this.create({
      post_id: postId,
      author_name: authorName,
      author_email: authorEmail || null,
      author_ip: author_ip || null,
      content,
      parent_id: parentId || null,
      status: status !== undefined ? status : 1 // Default to approved unless caller specifies
    });

    return this.getCommentById(comment.id);
  }

  /**
   * Get comment by ID with replies
   */
  async getCommentById(id) {
    const comment = await this.findById(id);

    if (!comment) {
      return null;
    }

    // Get replies
    const replies = await this.query(`
      SELECT * FROM comments WHERE parent_id = ? ORDER BY created_at ASC
    `, [id]);

    return {
      ...comment,
      replies
    };
  }

  /**
   * Get comments for a post
   */
  async getCommentsByPost(postId, options = {}) {
    const { page = 1, limit = 20 } = options;

    // Count total
    const countResult = await this.query(`
      SELECT COUNT(*) as count FROM comments WHERE post_id = ? AND parent_id IS NULL
    `, [postId]);

    const total = countResult[0]?.count || 0;

    // Get top-level comments
    const offset = (page - 1) * limit;
    const comments = await this.query(`
      SELECT c.* FROM comments c
      WHERE c.post_id = ? AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [postId, limit, offset]);

    // Batch-fetch all replies for the fetched comments (avoids N+1 queries)
    const commentIds = comments.map(c => c.id);
    let repliesMap = {};
    if (commentIds.length > 0) {
      const allReplies = await this.query(`
        SELECT * FROM comments WHERE parent_id IN (${commentIds.map(() => '?').join(',')}) ORDER BY created_at ASC
      `, commentIds);
      for (const reply of allReplies) {
        if (!repliesMap[reply.parent_id]) {
          repliesMap[reply.parent_id] = [];
        }
        repliesMap[reply.parent_id].push(reply);
      }
    }

    const commentsWithReplies = comments.map(comment => ({
      ...comment,
      replies: repliesMap[comment.id] || []
    }));

    return {
      data: commentsWithReplies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get comment list (admin global view)
   */
  async getCommentList(options = {}) {
    const { page = 1, limit = 20, status } = options;

    let where = [];
    let params = [];

    if (status !== undefined) {
      where.push('c.status = ?');
      params.push(status);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await this.query(`
      SELECT COUNT(*) as count FROM comments c ${whereClause}
    `, params);

    const total = countResult[0]?.count || 0;

    const offset = (page - 1) * limit;
    const comments = await this.query(`
      SELECT c.*, p.title as post_title
      FROM comments c
      LEFT JOIN posts p ON c.post_id = p.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return {
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update comment status
   */
  async updateStatus(id, status) {
    await this.execute(
      'UPDATE comments SET status = ? WHERE id = ?',
      [status, id]
    );

    return this.getCommentById(id);
  }

  /**
   * Delete comment
   */
  async deleteComment(id) {
    // Check if comment exists
    const comment = await this.findById(id);

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Delete comment and its replies
    await this.execute('DELETE FROM comments WHERE id = ? OR parent_id = ?', [id, id]);

    return true;
  }

  /**
   * Get comment statistics
   */
  async getCommentStats() {
    const totalComments = await this.count();
    const approvedComments = await this.count({ where: 'status = ?', params: [1] });
    const pendingComments = await this.count({ where: 'status = ?', params: [0] });

    return {
      total: totalComments,
      approved: approvedComments,
      pending: pendingComments
    };
  }
}
