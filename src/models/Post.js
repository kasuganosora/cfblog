/**
 * Post Model
 * Handles post data operations
 */

import { BaseModel } from './BaseModel.js';
import { generateSlug, generateUniqueSlug } from '../utils/slug.js';

export class Post extends BaseModel {
  constructor(db) {
    super(db);
    this.tableName = 'posts';
  }

  /**
   * Find by slug
   */
  async findBySlug(slug) {
    return this.queryFirst(
      'SELECT * FROM posts WHERE slug = ?',
      [slug]
    );
  }

  /**
   * Create post
   */
  async createPost(postData) {
    const { title, excerpt, authorId, status, featured, commentStatus, content, categoryIds, tagIds, publishedAt } = postData;

    // Generate unique slug
    const slug = await generateUniqueSlug(title, async (s) => {
      const existing = await this.findBySlug(s);
      return !!existing;
    });

    // Create post
    const post = await this.create({
      title,
      slug,
      excerpt,
      author_id: authorId,
      status: status || 0,
      featured: featured ? 1 : 0,
      comment_status: commentStatus ? 1 : 0,
      content_key: content ? `posts/${slug}.md` : null,
      published_at: publishedAt || (status === 1 ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null)
    });

    // Associate categories
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await this.execute(
          'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
          [post.id, categoryId]
        );
      }
    }

    // Associate tags
    if (tagIds && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await this.execute(
          'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
          [post.id, tagId]
        );
      }
    }

    return this.getPostById(post.id);
  }

  /**
   * Update post
   */
  async updatePost(id, postData) {
    const { title, excerpt, status, featured, commentStatus, content, categoryIds, tagIds, publishedAt } = postData;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (status !== undefined) updateData.status = status;
    if (featured !== undefined) updateData.featured = featured ? 1 : 0;
    if (commentStatus !== undefined) updateData.comment_status = commentStatus ? 1 : 0;
    if (content !== undefined) updateData.content_key = content ? `posts/${title}.md` : null;
    if (publishedAt !== undefined) updateData.published_at = publishedAt;

    if (title !== undefined) {
      // Regenerate slug if title changed
      const slug = await generateUniqueSlug(title, async (s) => {
        const existing = await this.findBySlug(s);
        return !!existing && existing.id !== id;
      });
      updateData.slug = slug;
    }

    updateData.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await this.update(id, updateData);

    // Update categories
    if (categoryIds !== undefined) {
      await this.execute('DELETE FROM post_categories WHERE post_id = ?', [id]);
      for (const categoryId of categoryIds) {
        await this.execute(
          'INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)',
          [id, categoryId]
        );
      }
    }

    // Update tags
    if (tagIds !== undefined) {
      await this.execute('DELETE FROM post_tags WHERE post_id = ?', [id]);
      for (const tagId of tagIds) {
        await this.execute(
          'INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)',
          [id, tagId]
        );
      }
    }

    return this.getPostById(id);
  }

  /**
   * Delete post
   */
  async deletePost(id) {
    await this.delete(id);
    return true;
  }

  /**
   * Get post by ID with full details
   */
  async getPostById(id) {
    const post = await this.findById(id);

    if (!post) {
      return null;
    }

    // Get categories
    const categories = await this.query(`
      SELECT c.* FROM categories c
      JOIN post_categories pc ON c.id = pc.category_id
      WHERE pc.post_id = ?
    `, [id]);

    // Get tags
    const tags = await this.query(`
      SELECT t.* FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ?
    `, [id]);

    return {
      ...post,
      categories,
      tags
    };
  }

  /**
   * Get post by slug with full details
   */
  async getPostBySlug(slug) {
    const post = await this.findBySlug(slug);

    if (!post) {
      return null;
    }

    return this.getPostById(post.id);
  }

  /**
   * Get post list
   */
  async getPostList(options = {}) {
    const { page = 1, limit = 10, status, featured } = options;

    let where = [];
    let params = [];

    if (status !== undefined) {
      where.push('p.status = ?');
      params.push(status);
    }

    if (featured !== undefined) {
      where.push('p.featured = ?');
      params.push(featured ? 1 : 0);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Count total
    const countResult = await this.query(`
      SELECT COUNT(*) as count FROM posts p ${whereClause}
    `, params);

    const total = countResult[0]?.count || 0;

    // Get posts
    const offset = (page - 1) * limit;
    const posts = await this.query(`
      SELECT p.*, u.username, u.display_name as author_name, u.avatar as author_avatar
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ${whereClause}
      ORDER BY p.published_at DESC, p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id) {
    await this.execute(
      'UPDATE posts SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );

    const post = await this.findById(id);
    return post ? post.view_count + 1 : 0;
  }

  /**
   * Search posts
   */
  async searchPosts(keyword, options = {}) {
    const { page = 1, limit = 10, status = 1 } = options;

    const offset = (page - 1) * limit;
    const searchPattern = `%${keyword}%`;

    // Count total
    const countResult = await this.query(`
      SELECT COUNT(*) as count
      FROM posts
      WHERE status = ? AND (title LIKE ? OR excerpt LIKE ?)
    `, [status, searchPattern, searchPattern]);

    const total = countResult[0]?.count || 0;

    // Get posts
    const posts = await this.query(`
      SELECT p.*, u.username, u.display_name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.status = ? AND (p.title LIKE ? OR p.excerpt LIKE ?)
      ORDER BY p.published_at DESC
      LIMIT ? OFFSET ?
    `, [status, searchPattern, searchPattern, limit, offset]);

    return {
      keyword,
      results: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
