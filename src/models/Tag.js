/**
 * Tag Model
 * Handles tag data operations
 */

import { BaseModel } from './BaseModel.js';
import { generateUniqueSlug } from '../utils/slug.js';

export class Tag extends BaseModel {
  constructor(db) {
    super(db);
    this.tableName = 'tags';
  }

  /**
   * Find by slug
   */
  async findBySlug(slug) {
    return this.queryFirst(
      'SELECT * FROM tags WHERE slug = ?',
      [slug]
    );
  }

  /**
   * Create tag
   */
  async createTag(tagData) {
    const { name } = tagData;

    // Generate unique slug
    const slug = await generateUniqueSlug(name, async (s) => {
      const existing = await this.findBySlug(s);
      return !!existing;
    });

    // Create tag
    const tag = await this.create({
      name,
      slug
    });

    return tag;
  }

  /**
   * Update tag
   */
  async updateTag(id, tagData) {
    const { name } = tagData;

    const updateData = {};
    if (name !== undefined) updateData.name = name;

    if (name !== undefined) {
      // Regenerate slug if name changed
      const slug = await generateUniqueSlug(name, async (s) => {
        const existing = await this.findBySlug(s);
        return !!existing && existing.id !== id;
      });
      updateData.slug = slug;
    }

    updateData.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const tag = await this.update(id, updateData);
    return tag;
  }

  /**
   * Delete tag
   */
  async deleteTag(id) {
    // Check if tag has posts
    const postCount = await this.query(
      `SELECT COUNT(*) as count FROM post_tags WHERE tag_id = ?`,
      [id]
    );

    if (postCount[0]?.count > 0) {
      throw new Error('Cannot delete tag with posts');
    }

    await this.delete(id);
    return true;
  }

  /**
   * Get tag list (with post counts)
   */
  async getTagList(options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const total = await this.count();

    const tags = await this.query(`
      SELECT t.*, COUNT(p.id) as post_count
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      LEFT JOIN posts p ON pt.post_id = p.id AND p.status = 1
      GROUP BY t.id
      ORDER BY t.name
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    return {
      data: tags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get popular tags
   */
  async getPopularTags(options = {}) {
    const { limit = 10 } = options;

    const results = await this.query(`
      SELECT t.*, COUNT(pt.tag_id) as post_count
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      GROUP BY t.id
      ORDER BY post_count DESC, t.name ASC
      LIMIT ?
    `, [limit]);

    return results;
  }

  /**
   * Get tag by ID with post count
   */
  async getTagWithPostCount(id) {
    const tag = await this.findById(id);

    if (!tag) {
      return null;
    }

    const postCountResult = await this.query(
      `SELECT COUNT(*) as count FROM post_tags WHERE tag_id = ?`,
      [id]
    );

    return {
      ...tag,
      post_count: postCountResult[0]?.count || 0
    };
  }
}
