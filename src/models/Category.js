import { BaseModel } from './BaseModel.js';

export class Category extends BaseModel {
  constructor(env) {
    super(env);
  }
  
  // 根据分类 slug 获取分类
  async getBySlug(slug) {
    return await this.findOne('categories', 'slug = ?', [slug]);
  }
  
  // 创建分类
  async createCategory(categoryData) {
    const { name, slug, description, parentId } = categoryData;
    
    // 检查分类名和 slug 是否已存在
    const existingCategoryByName = await this.findOne('categories', 'name = ?', [name]);
    if (existingCategoryByName.success && existingCategoryByName.result) {
      return { success: false, message: '分类名已存在' };
    }
    
    const existingCategoryBySlug = await this.getBySlug(slug);
    if (existingCategoryBySlug.success && existingCategoryBySlug.result) {
      return { success: false, message: '分类 slug 已存在' };
    }
    
    // 创建分类
    const newCategoryData = {
      name,
      slug,
      description,
      parent_id: parentId
    };
    
    const result = await this.insert('categories', newCategoryData);
    
    if (!result.success) {
      return { success: false, message: '创建分类失败', error: result.error };
    }
    
    // 获取新创建的分类
    const newCategory = await this.getById('categories', result.meta.lastRowId);
    
    return { 
      success: true, 
      message: '分类创建成功', 
      category: newCategory.result 
    };
  }
  
  // 更新分类
  async updateCategory(categoryId, categoryData) {
    // 检查分类是否存在
    const existingCategory = await this.getById('categories', categoryId);
    if (!existingCategory.success || !existingCategory.result) {
      return { success: false, message: '分类不存在' };
    }
    
    // 如果更新分类名，检查是否已存在
    if (categoryData.name && categoryData.name !== existingCategory.result.name) {
      const categoryWithSameName = await this.findOne('categories', 'name = ?', [categoryData.name]);
      if (categoryWithSameName.success && categoryWithSameName.result) {
        return { success: false, message: '分类名已存在' };
      }
    }
    
    // 如果更新 slug，检查是否已存在
    if (categoryData.slug && categoryData.slug !== existingCategory.result.slug) {
      const categoryWithSameSlug = await this.getBySlug(categoryData.slug);
      if (categoryWithSameSlug.success && categoryWithSameSlug.result) {
        return { success: false, message: '分类 slug 已存在' };
      }
    }
    
    // 准备更新数据
    const updateData = {};
    if (categoryData.name) updateData.name = categoryData.name;
    if (categoryData.slug) updateData.slug = categoryData.slug;
    if (categoryData.description !== undefined) updateData.description = categoryData.description;
    if (categoryData.parentId !== undefined) updateData.parent_id = categoryData.parentId;
    updateData.updated_at = new Date().toISOString();
    
    const result = await this.update('categories', categoryId, updateData);
    
    if (!result.success) {
      return { success: false, message: '更新分类失败', error: result.error };
    }
    
    // 获取更新后的分类信息
    const updatedCategory = await this.getById('categories', categoryId);
    
    return { 
      success: true, 
      message: '分类更新成功', 
      category: updatedCategory.result 
    };
  }
  
  // 删除分类
  async deleteCategory(categoryId) {
    // 检查分类是否存在
    const existingCategory = await this.getById('categories', categoryId);
    if (!existingCategory.success || !existingCategory.result) {
      return { success: false, message: '分类不存在' };
    }
    
    // 检查是否有子分类
    const childCategories = await this.findMany('categories', 'parent_id = ?', [categoryId]);
    if (childCategories.success && childCategories.data.length > 0) {
      return { success: false, message: '请先删除子分类' };
    }
    
    // 删除文章分类关联
    await this.deleteCategoryFromPosts(categoryId);
    
    // 删除分类
    const result = await this.delete('categories', categoryId);
    
    if (!result.success) {
      return { success: false, message: '删除分类失败', error: result.error };
    }
    
    return { success: true, message: '分类删除成功' };
  }
  
  // 获取分类列表
  async getCategories(options = {}) {
    const { page = 1, limit = 100 } = options;
    
    return await this.getAll('categories', {
      select: 'id, name, slug, description, parent_id, created_at, updated_at',
      orderBy: 'name ASC',
      page,
      limit
    });
  }
  
  // 获取分类树形结构
  async getCategoryTree() {
    const result = await this.getAll('categories', {
      select: 'id, name, slug, description, parent_id, created_at, updated_at',
      orderBy: 'name ASC',
      page: 1,
      limit: 1000 // 获取所有分类
    });
    
    if (!result.success) {
      return result;
    }
    
    const categories = result.data;
    const categoryMap = {};
    const tree = [];
    
    // 创建分类映射
    categories.forEach(category => {
      categoryMap[category.id] = { ...category, children: [] };
    });
    
    // 构建树形结构
    categories.forEach(category => {
      if (category.parent_id === null) {
        tree.push(categoryMap[category.id]);
      } else {
        const parent = categoryMap[category.parent_id];
        if (parent) {
          parent.children.push(categoryMap[category.id]);
        }
      }
    });
    
    return {
      success: true,
      data: tree
    };
  }
  
  // 获取文章数量最多的分类
  async getPopularCategories(limit = 10) {
    const query = `
      SELECT c.id, c.name, c.slug, c.description, COUNT(pc.post_id) as post_count
      FROM categories c
      LEFT JOIN post_categories pc ON c.id = pc.category_id
      GROUP BY c.id
      ORDER BY post_count DESC, c.name ASC
      LIMIT ?
    `;
    
    const result = await this.executeQuery(this.env, query, [limit]);
    
    if (!result.success) {
      return result;
    }
    
    return {
      success: true,
      data: result.results
    };
  }
  
  // 删除文章分类关联
  async deleteCategoryFromPosts(categoryId) {
    const query = 'DELETE FROM post_categories WHERE category_id = ?';
    return await this.executeRun(query, [categoryId]);
  }
  
  // 生成唯一 slug
  async generateUniqueSlug(name) {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // 如果 slug 为空（例如，分类名只有特殊字符），使用时间戳
    if (!baseSlug) {
      baseSlug = Date.now().toString();
    }
    
    let slug = baseSlug;
    let counter = 1;
    
    // 检查 slug 是否已存在
    let existingCategory = await this.getBySlug(slug);
    
    // 如果 slug 已存在，尝试添加数字后缀
    while (existingCategory.success && existingCategory.result) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      existingCategory = await this.getBySlug(slug);
    }
    
    return slug;
  }
}