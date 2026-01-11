import { BaseModel } from './BaseModel.js';

export class Tag extends BaseModel {
  constructor(env) {
    super(env);
  }
  
  // 根据标签 slug 获取标签
  async getBySlug(slug) {
    return await this.findOne('tags', 'slug = ?', [slug]);
  }
  
  // 创建标签
  async createTag(tagData) {
    const { name, slug, description } = tagData;
    
    // 检查标签名和 slug 是否已存在
    const existingTagByName = await this.findOne('tags', 'name = ?', [name]);
    if (existingTagByName.success && existingTagByName.result) {
      return { success: false, message: '标签名已存在' };
    }
    
    const existingTagBySlug = await this.getBySlug(slug);
    if (existingTagBySlug.success && existingTagBySlug.result) {
      return { success: false, message: '标签 slug 已存在' };
    }
    
    // 创建标签
    const newTagData = {
      name,
      slug,
      description
    };
    
    const result = await this.insert('tags', newTagData);
    
    if (!result.success) {
      return { success: false, message: '创建标签失败', error: result.error };
    }
    
    // 获取新创建的标签
    const newTag = await this.getById('tags', result.meta.lastRowId);
    
    return { 
      success: true, 
      message: '标签创建成功', 
      tag: newTag.result 
    };
  }
  
  // 更新标签
  async updateTag(tagId, tagData) {
    // 检查标签是否存在
    const existingTag = await this.getById('tags', tagId);
    if (!existingTag.success || !existingTag.result) {
      return { success: false, message: '标签不存在' };
    }
    
    // 如果更新标签名，检查是否已存在
    if (tagData.name && tagData.name !== existingTag.result.name) {
      const tagWithSameName = await this.findOne('tags', 'name = ?', [tagData.name]);
      if (tagWithSameName.success && tagWithSameName.result) {
        return { success: false, message: '标签名已存在' };
      }
    }
    
    // 如果更新 slug，检查是否已存在
    if (tagData.slug && tagData.slug !== existingTag.result.slug) {
      const tagWithSameSlug = await this.getBySlug(tagData.slug);
      if (tagWithSameSlug.success && tagWithSameSlug.result) {
        return { success: false, message: '标签 slug 已存在' };
      }
    }
    
    // 准备更新数据
    const updateData = {};
    if (tagData.name) updateData.name = tagData.name;
    if (tagData.slug) updateData.slug = tagData.slug;
    if (tagData.description !== undefined) updateData.description = tagData.description;
    updateData.updated_at = new Date().toISOString();
    
    const result = await this.update('tags', tagId, updateData);
    
    if (!result.success) {
      return { success: false, message: '更新标签失败', error: result.error };
    }
    
    // 获取更新后的标签信息
    const updatedTag = await this.getById('tags', tagId);
    
    return { 
      success: true, 
      message: '标签更新成功', 
      tag: updatedTag.result 
    };
  }
  
  // 删除标签
  async deleteTag(tagId) {
    // 检查标签是否存在
    const existingTag = await this.getById('tags', tagId);
    if (!existingTag.success || !existingTag.result) {
      return { success: false, message: '标签不存在' };
    }
    
    // 删除文章标签关联
    await this.deleteTagFromPosts(tagId);
    
    // 删除标签
    const result = await this.delete('tags', tagId);
    
    if (!result.success) {
      return { success: false, message: '删除标签失败', error: result.error };
    }
    
    return { success: true, message: '标签删除成功' };
  }
  
  // 获取标签列表
  async getTags(options = {}) {
    const { page = 1, limit = 100 } = options;
    
    return await this.getAll('tags', {
      select: 'id, name, slug, description, created_at, updated_at',
      orderBy: 'name ASC',
      page,
      limit
    });
  }
  
  // 获取文章数量最多的标签
  async getPopularTags(limit = 20) {
    const query = `
      SELECT t.id, t.name, t.slug, t.description, COUNT(pt.post_id) as post_count
      FROM tags t
      LEFT JOIN post_tags pt ON t.id = pt.tag_id
      GROUP BY t.id
      ORDER BY post_count DESC, t.name ASC
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
  
  // 根据名称获取或创建标签
  async getOrCreateTag(name) {
    // 先尝试获取
    let result = await this.findOne('tags', 'name = ?', [name]);
    
    if (result.success && result.result) {
      return { success: true, tag: result.result };
    }
    
    // 如果不存在，创建新标签
    const slug = await this.generateUniqueSlug(name);
    const newTagData = {
      name,
      slug,
      description: ''
    };
    
    const createResult = await this.insert('tags', newTagData);
    
    if (!createResult.success) {
      return { success: false, message: '创建标签失败', error: createResult.error };
    }
    
    // 获取新创建的标签
    const newTag = await this.getById('tags', createResult.meta.lastRowId);
    
    return { 
      success: true, 
      tag: newTag.result 
    };
  }
  
  // 批量根据名称获取或创建标签
  async getOrCreateTags(names) {
    const results = [];
    
    for (const name of names) {
      const result = await this.getOrCreateTag(name);
      if (result.success) {
        results.push(result.tag);
      }
    }
    
    return {
      success: true,
      tags: results
    };
  }
  
  // 删除文章标签关联
  async deleteTagFromPosts(tagId) {
    const query = 'DELETE FROM post_tags WHERE tag_id = ?';
    return await this.executeRun(query, [tagId]);
  }
  
  // 生成唯一 slug
  async generateUniqueSlug(name) {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // 如果 slug 为空（例如，标签名只有特殊字符），使用时间戳
    if (!baseSlug) {
      baseSlug = Date.now().toString();
    }
    
    let slug = baseSlug;
    let counter = 1;
    
    // 检查 slug 是否已存在
    let existingTag = await this.getBySlug(slug);
    
    // 如果 slug 已存在，尝试添加数字后缀
    while (existingTag.success && existingTag.result) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      existingTag = await this.getBySlug(slug);
    }
    
    return slug;
  }
}