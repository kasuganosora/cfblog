/**
 * Settings Model
 * Handles system settings
 */

import { BaseModel } from './BaseModel.js';

export class Settings extends BaseModel {
  constructor(db) {
    super(db);
    this.tableName = 'settings';
  }

  /**
   * Get setting by key
   */
  async getSetting(key) {
    const result = await this.queryFirst(
      'SELECT * FROM settings WHERE key = ?',
      [key]
    );
    return result ? result.value : null;
  }

  /**
   * Get multiple settings by keys
   */
  async getSettings(keys) {
    const placeholders = keys.map(() => '?').join(',');
    const results = await this.query(
      `SELECT * FROM settings WHERE key IN (${placeholders})`,
      keys
    );

    const settings = {};
    results.forEach(result => {
      settings[result.key] = result.value;
    });

    return settings;
  }

  /**
   * Get all settings
   */
  async getAllSettings() {
    const results = await this.all();
    const settings = {};
    results.forEach(result => {
      settings[result.key] = result.value;
    });
    return settings;
  }

  /**
   * Set setting value
   */
  async setSetting(key, value, description = null) {
    const existing = await this.getSetting(key);

    if (existing) {
      await this.execute(
        'UPDATE settings SET value = ?, description = ?, updated_at = ? WHERE key = ?',
        [value, description || existing.description, new Date().toISOString().slice(0, 19).replace('T', ' '), key]
      );
    } else {
      await this.execute(
        'INSERT INTO settings (key, value, description, updated_at) VALUES (?, ?, ?, ?)',
        [key, value, description, new Date().toISOString().slice(0, 19).replace('T', ' ')]
      );
    }

    return this.getSetting(key);
  }

  /**
   * Set multiple settings
   */
  async setSettings(settings) {
    for (const [key, value] of Object.entries(settings)) {
      await this.setSetting(key, value);
    }
    return true;
  }

  /**
   * Delete setting
   */
  async deleteSetting(key) {
    await this.execute('DELETE FROM settings WHERE key = ?', [key]);
    return true;
  }

  /**
   * Get blog basic info
   */
  async getBlogInfo() {
    const keys = ['blog_title', 'blog_description', 'blog_subtitle'];
    const settings = await this.getSettings(keys);

    return {
      title: settings.blog_title || 'CFBlog',
      description: settings.blog_description || 'A modern blog platform',
      subtitle: settings.blog_subtitle || 'Welcome to CFBlog'
    };
  }

  /**
   * Get display settings
   */
  async getDisplaySettings() {
    const keys = ['posts_per_page', 'pagination_style'];
    const settings = await this.getSettings(keys);

    return {
      postsPerPage: parseInt(settings.posts_per_page || 10),
      paginationStyle: settings.pagination_style || 'numeric'
    };
  }

  /**
   * Get comment settings
   */
  async getCommentSettings() {
    const keys = ['comment_moderation', 'comment_permission'];
    const settings = await this.getSettings(keys);

    return {
      moderation: parseInt(settings.comment_moderation || 0),
      permission: settings.comment_permission || 'all'
    };
  }

  /**
   * Get upload settings
   */
  async getUploadSettings() {
    const keys = ['upload_allowed_types', 'upload_max_size'];
    const settings = await this.getSettings(keys);

    return {
      allowedTypes: settings.upload_allowed_types || 'jpg,jpeg,png,gif,pdf,doc,docx',
      maxSize: parseInt(settings.upload_max_size || 5242880) // 5MB default
    };
  }

  /**
   * Get SEO settings
   */
  async getSEOSettings() {
    const keys = ['meta_description', 'meta_keywords'];
    const settings = await this.getSettings(keys);

    return {
      description: settings.meta_description || 'CFBlog - A modern blog platform',
      keywords: settings.meta_keywords || 'blog,cloudflare,workers'
    };
  }

  /**
   * Update blog info
   */
  async updateBlogInfo({ title, description, subtitle }) {
    const settings = {};
    if (title !== undefined) settings.blog_title = title;
    if (description !== undefined) settings.blog_description = description;
    if (subtitle !== undefined) settings.blog_subtitle = subtitle;

    await this.setSettings(settings);
    return this.getBlogInfo();
  }

  /**
   * Update display settings
   */
  async updateDisplaySettings({ postsPerPage, paginationStyle }) {
    const settings = {};
    if (postsPerPage !== undefined) settings.posts_per_page = postsPerPage.toString();
    if (paginationStyle !== undefined) settings.pagination_style = paginationStyle;

    await this.setSettings(settings);
    return this.getDisplaySettings();
  }

  /**
   * Update comment settings
   */
  async updateCommentSettings({ moderation, permission }) {
    const settings = {};
    if (moderation !== undefined) settings.comment_moderation = moderation.toString();
    if (permission !== undefined) settings.comment_permission = permission;

    await this.setSettings(settings);
    return this.getCommentSettings();
  }

  /**
   * Update upload settings
   */
  async updateUploadSettings({ allowedTypes, maxSize }) {
    const settings = {};
    if (allowedTypes !== undefined) settings.upload_allowed_types = allowedTypes;
    if (maxSize !== undefined) settings.upload_max_size = maxSize.toString();

    await this.setSettings(settings);
    return this.getUploadSettings();
  }

  /**
   * Update SEO settings
   */
  async updateSEOSettings({ description, keywords }) {
    const settings = {};
    if (description !== undefined) settings.meta_description = description;
    if (keywords !== undefined) settings.meta_keywords = keywords;

    await this.setSettings(settings);
    return this.getSEOSettings();
  }
}
