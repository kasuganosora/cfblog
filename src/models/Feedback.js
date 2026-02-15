/**
 * Feedback Model
 * Handles feedback data operations
 */

import { BaseModel } from './BaseModel.js';

export class Feedback extends BaseModel {
  constructor(db) {
    super(db);
    this.tableName = 'feedback';
  }

  /**
   * Create feedback
   */
  async createFeedback(feedbackData) {
    const { name, email, content, ip } = feedbackData;

    const feedback = await this.create({
      name,
      email: email || null,
      ip: ip || null,
      content,
      status: 1 // Default to processed
    });

    return feedback;
  }

  /**
   * Get feedback list
   */
  async getFeedbackList(options = {}) {
    const { page = 1, limit = 20, status } = options;

    let where = [];
    let params = [];

    if (status !== undefined) {
      where.push('status = ?');
      params.push(status);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Count total
    const countResult = await this.query(`
      SELECT COUNT(*) as count FROM feedback ${whereClause}
    `, params);

    const total = countResult[0]?.count || 0;

    // Get feedback
    const offset = (page - 1) * limit;
    const feedback = await this.query(`
      SELECT * FROM feedback ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return {
      data: feedback,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update feedback status
   */
  async updateStatus(id, status) {
    await this.execute(
      'UPDATE feedback SET status = ? WHERE id = ?',
      [status, id]
    );

    return this.findById(id);
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(id) {
    // Check if feedback exists
    const feedback = await this.findById(id);

    if (!feedback) {
      throw new Error('Feedback not found');
    }

    await this.delete(id);
    return true;
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats() {
    const totalFeedback = await this.count();
    const processedFeedback = await this.count({ where: 'status = ?', params: [1] });
    const pendingFeedback = await this.count({ where: 'status = ?', params: [0] });

    return {
      total: totalFeedback,
      processed: processedFeedback,
      pending: pendingFeedback
    };
  }
}
