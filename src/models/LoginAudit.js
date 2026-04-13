/**
 * LoginAudit Model
 * IP-based login rate limiting and audit logging
 */

import { BaseModel } from './BaseModel.js';

const MAX_RECORDS = 1000;
const CLEANUP_COUNT = 500;
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_HOURS = 1;

export class LoginAudit extends BaseModel {
  constructor(db) {
    super(db);
    this.tableName = 'login_audit';
  }

  /**
   * Record a login attempt
   */
  async recordAttempt({ ip, username, success, user_agent }) {
    await this.create({
      ip,
      username,
      success: success ? 1 : 0,
      user_agent: user_agent || null
    });
    // Cleanup old records if over limit
    await this.cleanup();
  }

  /** SQLite datetime format helper: YYYY-MM-DD HH:MM:SS */
  _sqliteNow(offsetMs = 0) {
    return new Date(Date.now() + offsetMs).toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * Check if an IP is blocked (5+ failed attempts within 1 hour)
   * Returns { blocked, remainingMinutes }
   */
  async isIPBlocked(ip) {
    const since = this._sqliteNow(-BLOCK_DURATION_HOURS * 60 * 60 * 1000);
    const result = await this.queryFirst(
      `SELECT COUNT(*) as fail_count FROM login_audit
       WHERE ip = ? AND success = 0 AND created_at > ?`,
      [ip, since]
    );
    const failCount = result?.fail_count || 0;
    if (failCount >= MAX_ATTEMPTS) {
      // Find the earliest failure in the window to calculate remaining time
      const earliest = await this.queryFirst(
        `SELECT created_at FROM login_audit
         WHERE ip = ? AND success = 0 AND created_at > ?
         ORDER BY created_at ASC LIMIT 1`,
        [ip, since]
      );
      if (!earliest) return { blocked: true, remainingMinutes: BLOCK_DURATION_HOURS * 60 };
      const unblockTime = new Date(new Date(earliest.created_at + 'Z').getTime() + BLOCK_DURATION_HOURS * 60 * 60 * 1000);
      const remainingMinutes = Math.max(0, Math.ceil((unblockTime.getTime() - Date.now()) / 60000));
      return { blocked: true, remainingMinutes: remainingMinutes };
    }
    return { blocked: false, remainingMinutes: 0 };
  }

  /**
   * Clear failed attempts for an IP (call on successful login)
   */
  async clearFailedAttempts(ip) {
    const since = new Date(Date.now() - BLOCK_DURATION_HOURS * 60 * 60 * 1000).toISOString();
    await this.execute(
      `DELETE FROM login_audit WHERE ip = ? AND success = 0 AND created_at > ?`,
      [ip, since]
    );
  }

  /**
   * Get audit list with pagination
   */
  async getAuditList(options = {}) {
    const { page = 1, limit = 20 } = options;

    const countResult = await this.queryFirst(
      'SELECT COUNT(*) as count FROM login_audit'
    );
    const total = countResult?.count || 0;

    const offset = (page - 1) * limit;
    const data = await this.query(
      `SELECT * FROM login_audit ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Delete oldest records when count exceeds MAX_RECORDS
   */
  async cleanup() {
    const countResult = await this.queryFirst(
      'SELECT COUNT(*) as count FROM login_audit'
    );
    if ((countResult?.count || 0) > MAX_RECORDS) {
      await this.execute(
        `DELETE FROM login_audit WHERE id IN (
          SELECT id FROM login_audit ORDER BY created_at ASC LIMIT ?
        )`,
        [CLEANUP_COUNT]
      );
    }
  }
}
