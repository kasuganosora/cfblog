/**
 * Category Model
 * Handles category data operations
 */

import { BaseModel } from './BaseModel.js';
import { generateUniqueSlug } from '../utils/slug.js';

export class Category extends BaseModel {
  constructor(db) {
    super(db);
    this.tableName = 'categories';
  }

  /**
   * Find by slug
   */
  async findBySlug(slug) {
    return this.queryFirst(
      'SELECT * FROM categories WHERE slug = ?',
      [slug]
    );
  }

  /**
   * Create category
   */
  async createCategory(categoryData) {
    const { name, slug: customSlug, description, parentId, sortOrder } = categoryData;

    // Use custom slug or generate from name
    const slug = await generateUniqueSlug(customSlug || name, async (s) => {
      const existing = await this.findBySlug(s);
      return !!existing;
    });

    // Create category
    const category = await this.create({
      name,
      slug,
      description,
      parent_id: parentId || null,
      sort_order: sortOrder || 0
    });

    return category;
  }

  /**
   * Update category
   */
  async updateCategory(id, categoryData) {
    const { name, slug: customSlug, description, parentId, sortOrder } = categoryData;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (parentId !== undefined) updateData.parent_id = parentId;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;

    if (customSlug !== undefined) {
      // Use custom slug if provided, otherwise regenerate from name
      const slugSource = customSlug || name;
      if (slugSource) {
        const slug = await generateUniqueSlug(slugSource, async (s) => {
          const existing = await this.findBySlug(s);
          return !!existing && existing.id !== id;
        });
        updateData.slug = slug;
      }
    } else if (name !== undefined) {
      // Regenerate slug if name changed but no slug provided
      const slug = await generateUniqueSlug(name, async (s) => {
        const existing = await this.findBySlug(s);
        return !!existing && existing.id !== id;
      });
      updateData.slug = slug;
    }

    updateData.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const category = await this.update(id, updateData);
    return category;
  }

  /**
   * Delete category
   */
  async deleteCategory(id) {
    // Check if category has posts
    const postCount = await this.query(
      `SELECT COUNT(*) as count FROM post_categories WHERE category_id = ?`,
      [id]
    );

    if (postCount[0]?.count > 0) {
      throw new Error('Cannot delete category with posts');
    }

    // Check if category has children
    const childCount = await this.query(
      `SELECT COUNT(*) as count FROM categories WHERE parent_id = ?`,
      [id]
    );

    if (childCount[0]?.count > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    await this.delete(id);
    return true;
  }

  /**
   * Get category tree (with post counts)
   */
  async getCategoryTree() {
    const allCategories = await this.query(`
      SELECT c.*, COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN post_categories pc ON c.id = pc.category_id
      LEFT JOIN posts p ON pc.post_id = p.id AND p.status = 1
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
    `);

    const buildTree = (parentId = null) => {
      return allCategories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => ({
          ...cat,
          children: buildTree(cat.id)
        }));
    };

    return buildTree();
  }

  /**
   * Get category list (with post counts)
   */
  async getCategoryList(options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const total = await this.count();

    const categories = await this.query(`
      SELECT c.*, COUNT(p.id) as post_count
      FROM categories c
      LEFT JOIN post_categories pc ON c.id = pc.category_id
      LEFT JOIN posts p ON pc.post_id = p.id AND p.status = 1
      GROUP BY c.id
      ORDER BY c.sort_order, c.name
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    return {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get category by ID with post count
   */
  async getCategoryWithPostCount(id) {
    const category = await this.findById(id);

    if (!category) {
      return null;
    }

    const postCountResult = await this.query(
      `SELECT COUNT(*) as count FROM post_categories WHERE category_id = ?`,
      [id]
    );

    return {
      ...category,
      post_count: postCountResult[0]?.count || 0
    };
  }
}
