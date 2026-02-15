/**
 * Attachment Model
 */

import { BaseModel } from './BaseModel.js';

export class Attachment extends BaseModel {
  constructor(db) {
    super(db);
    this.tableName = 'attachments';
  }

  async createAttachment(data) {
    const { filename, original_name, mime_type, file_size, storage_key, upload_user_id } = data;
    return this.create({
      filename,
      original_name,
      mime_type,
      file_size,
      storage_key,
      upload_user_id: upload_user_id || null
    });
  }

  async findByStorageKey(storageKey) {
    return this.queryFirst('SELECT * FROM attachments WHERE storage_key = ?', [storageKey]);
  }

  async getAttachmentList(options = {}) {
    const { page = 1, limit = 20, mime_type } = options;

    let where = [];
    let params = [];

    if (mime_type) {
      where.push('a.mime_type LIKE ?');
      params.push(`${mime_type}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await this.queryFirst(
      `SELECT COUNT(*) as count FROM attachments a ${whereClause}`,
      params
    );
    const total = countResult?.count || 0;

    const offset = (page - 1) * limit;
    const data = await this.query(`
      SELECT a.*, u.username as uploader_name
      FROM attachments a
      LEFT JOIN users u ON a.upload_user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async deleteAttachment(id) {
    const attachment = await this.findById(id);
    if (!attachment) throw new Error('Attachment not found');
    await this.delete(id);
    return attachment;
  }
}
