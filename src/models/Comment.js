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
      content,
      parentId: parentIdCamel,
      parent_id: parentIdSnake
    } = commentData;

    const postId = postIdCamel || postIdSnake;
    const authorName = authorNameCamel || authorNameSnake;
    const authorEmail = authorEmailCamel || authorEmailSnake;
    const parentId = parentIdCamel || parentIdSnake;

    const comment = await this.create({
      post_id: postId,
      author_name: authorName,
      author_email: authorEmail || null,
      content,
      parent_id: parentId || null,
      status: 1 // Default to approved
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

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async comment => {
        const replies = await this.query(`
          SELECT * FROM comments WHERE parent_id = ? ORDER BY created_at ASC
        `, [comment.id]);

        return {
          ...comment,
          replies
        };
      })
    );

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
    const approvedComments = await this.count({ where: 'status = ?' });
    const pendingComments = await this.count({ where: 'status = ?' });

    return {
      total: totalComments,
      approved: approvedComments,
      pending: pendingComments
    };
  }
}
