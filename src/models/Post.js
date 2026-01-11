import { BaseModel } from './BaseModel.js';
import { executeQuery, executeOne, executeRun, paginate, getTotalPages } from '../utils/db.js';

export class Post extends BaseModel {
  constructor(env) {
    super(env);
  }
  
  // 根据文章 slug 获取文章
  async getBySlug(slug) {
    const query = `
      SELECT p.*, u.username, u.display_name as author_name 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.slug = ?
    `;
    return await executeOne(this.env, query, [slug]);
  }
  
  // 创建文章
  async createPost(postData) {
    const { title, slug, excerpt, content, authorId, status = 0, featured = 0, commentStatus = 1 } = postData;
    
    // 检查文章标题和 slug 是否已存在
    const existingPostByTitle = await this.findOne('posts', 'title = ?', [title]);
    if (existingPostByTitle.success && existingPostByTitle.result) {
      return { success: false, message: '文章标题已存在' };
    }
    
    const existingPostBySlug = await this.getBySlug(slug);
    if (existingPostBySlug.success && existingPostBySlug.result) {
      return { success: false, message: '文章 slug 已存在' };
    }
    
    // 准备文章数据
    const newPostData = {
      title,
      slug,
      excerpt,
      author_id: authorId,
      status,
      featured,
      comment_status: commentStatus,
      published_at: status === 1 ? new Date().toISOString() : null
    };
    
    // 创建文章
    const result = await this.insert('posts', newPostData);
    
    if (!result.success) {
      return { success: false, message: '创建文章失败', error: result.error };
    }
    
    const postId = result.meta.lastRowId;
    
    // 如果有内容，保存到 R2
    if (content) {
      const contentKey = `posts/${postId}/content.md`;
      const r2Result = await this.saveContentToR2(contentKey, content);
      
      if (!r2Result.success) {
        return { success: false, message: '保存文章内容到R2失败', error: r2Result.error };
      }
      
      // 更新文章的 content_key
      await this.update('posts', postId, { content_key: contentKey });
    }
    
    // 获取新创建的文章
    const newPost = await this.getPostById(postId);
    
    return { 
      success: true, 
      message: '文章创建成功', 
      post: newPost.result 
    };
  }
  
  // 更新文章
  async updatePost(postId, postData) {
    // 检查文章是否存在
    const existingPost = await this.getById('posts', postId);
    if (!existingPost.success || !existingPost.result) {
      return { success: false, message: '文章不存在' };
    }
    
    // 如果更新标题，检查是否已存在
    if (postData.title && postData.title !== existingPost.result.title) {
      const postWithSameTitle = await this.findOne('posts', 'title = ?', [postData.title]);
      if (postWithSameTitle.success && postWithSameTitle.result) {
        return { success: false, message: '文章标题已存在' };
      }
    }
    
    // 如果更新 slug，检查是否已存在
    if (postData.slug && postData.slug !== existingPost.result.slug) {
      const postWithSameSlug = await this.getBySlug(postData.slug);
      if (postWithSameSlug.success && postWithSameSlug.result) {
        return { success: false, message: '文章 slug 已存在' };
      }
    }
    
    // 准备更新数据
    const updateData = {};
    if (postData.title) updateData.title = postData.title;
    if (postData.slug) updateData.slug = postData.slug;
    if (postData.excerpt !== undefined) updateData.excerpt = postData.excerpt;
    if (postData.status !== undefined) {
      updateData.status = postData.status;
      // 如果状态从草稿变为发布，设置发布时间
      if (existingPost.result.status === 0 && postData.status === 1) {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (postData.featured !== undefined) updateData.featured = postData.featured;
    if (postData.commentStatus !== undefined) updateData.comment_status = postData.commentStatus;
    updateData.updated_at = new Date().toISOString();
    
    const result = await this.update('posts', postId, updateData);
    
    if (!result.success) {
      return { success: false, message: '更新文章失败', error: result.error };
    }
    
    // 如果有内容更新，保存到 R2
    if (postData.content !== undefined) {
      const contentKey = existingPost.result.content_key || `posts/${postId}/content.md`;
      const r2Result = await this.saveContentToR2(contentKey, postData.content);
      
      if (!r2Result.success) {
        return { success: false, message: '保存文章内容到R2失败', error: r2Result.error };
      }
      
      // 如果文章原本没有 content_key，更新它
      if (!existingPost.result.content_key) {
        await this.update('posts', postId, { content_key: contentKey });
      }
    }
    
    // 获取更新后的文章
    const updatedPost = await this.getPostById(postId);
    
    return { 
      success: true, 
      message: '文章更新成功', 
      post: updatedPost.result 
    };
  }
  
  // 删除文章
  async deletePost(postId) {
    // 获取文章信息
    const postResult = await this.getById('posts', postId);
    if (!postResult.success || !postResult.result) {
      return { success: false, message: '文章不存在' };
    }
    
    const post = postResult.result;
    
    // 删除文章内容（从 R2）
    if (post.content_key) {
      await this.deleteContentFromR2(post.content_key);
    }
    
    // 删除文章分类关联
    await this.deletePostCategories(postId);
    
    // 删除文章标签关联
    await this.deletePostTags(postId);
    
    // 删除文章
    const result = await this.delete('posts', postId);
    
    if (!result.success) {
      return { success: false, message: '删除文章失败', error: result.error };
    }
    
    return { success: true, message: '文章删除成功' };
  }
  
  // 获取文章详情（包含内容）
  async getPostById(postId, includeContent = true) {
    const query = `
      SELECT p.*, u.username, u.display_name as author_name 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.id = ?
    `;
    
    const result = await executeOne(this.env, query, [postId]);
    
    if (!result.success || !result.result) {
      return result;
    }
    
    const post = result.result;
    
    // 如果需要内容且文章有 content_key，从 R2 获取内容
    if (includeContent && post.content_key) {
      const contentResult = await this.getContentFromR2(post.content_key);
      if (contentResult.success) {
        post.content = contentResult.data;
      }
    }
    
    // 获取文章分类
    const categoriesResult = await this.getPostCategories(postId);
    if (categoriesResult.success) {
      post.categories = categoriesResult.data;
    } else {
      post.categories = [];
    }
    
    // 获取文章标签
    const tagsResult = await this.getPostTags(postId);
    if (tagsResult.success) {
      post.tags = tagsResult.data;
    } else {
      post.tags = [];
    }
    
    return { success: true, result: post };
  }
  
  // 获取文章列表
  async getPosts(options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      featured, 
      authorId, 
      categoryId,
      tagId,
      includeContent = false
    } = options;
    
    let where = '1=1';
    const params = [];
    
    if (status !== undefined) {
      where += ' AND p.status = ?';
      params.push(status);
    }
    
    if (featured !== undefined) {
      where += ' AND p.featured = ?';
      params.push(featured);
    }
    
    if (authorId) {
      where += ' AND p.author_id = ?';
      params.push(authorId);
    }
    
    if (categoryId) {
      where += ' AND EXISTS (SELECT 1 FROM post_categories pc WHERE pc.post_id = p.id AND pc.category_id = ?)';
      params.push(categoryId);
    }
    
    if (tagId) {
      where += ' AND EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag_id = ?)';
      params.push(tagId);
    }
    
    // 构建查询
    const selectClause = `
      p.id, p.title, p.slug, p.excerpt, p.author_id, p.status, p.featured, 
      p.comment_status, p.view_count, p.published_at, p.created_at, p.updated_at,
      u.username, u.display_name as author_name
    `;
    
    const query = `
      SELECT ${selectClause}
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE ${where}
      ORDER BY p.created_at DESC
    `;
    
    // 分页处理
    const paginatedQuery = paginate(query, page, limit);
    const result = await executeQuery(this.env, paginatedQuery, params);
    
    if (!result.success) {
      return result;
    }
    
    // 获取总数
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM posts p 
      WHERE ${where}
    `;
    const countResult = await executeOne(this.env, countQuery, params);
    
    if (!countResult.success) {
      return countResult;
    }
    
    const total = countResult.result.total;
    
    // 为每篇文章获取分类和标签
    const posts = await Promise.all(result.results.map(async post => {
      // 获取文章分类
      const categoriesResult = await this.getPostCategories(post.id);
      if (categoriesResult.success) {
        post.categories = categoriesResult.data;
      } else {
        post.categories = [];
      }
      
      // 获取文章标签
      const tagsResult = await this.getPostTags(post.id);
      if (tagsResult.success) {
        post.tags = tagsResult.data;
      } else {
        post.tags = [];
      }
      
      return post;
    }));
    
    return {
      success: true,
      data: posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: getTotalPages(total, limit)
      }
    };
  }
  
  // 获取文章分类
  async getPostCategories(postId) {
    const query = `
      SELECT c.id, c.name, c.slug, c.description
      FROM categories c
      JOIN post_categories pc ON c.id = pc.category_id
      WHERE pc.post_id = ?
    `;
    
    const result = await executeQuery(this.env, query, [postId]);
    return result;
  }
  
  // 获取文章标签
  async getPostTags(postId) {
    const query = `
      SELECT t.id, t.name, t.slug, t.description
      FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      WHERE pt.post_id = ?
    `;
    
    const result = await executeQuery(this.env, query, [postId]);
    return result;
  }
  
  // 设置文章分类
  async setPostCategories(postId, categoryIds) {
    // 先删除现有分类关联
    await this.deletePostCategories(postId);
    
    // 添加新的分类关联
    for (const categoryId of categoryIds) {
      await this.insert('post_categories', {
        post_id: postId,
        category_id: categoryId
      });
    }
    
    return { success: true, message: '文章分类设置成功' };
  }
  
  // 设置文章标签
  async setPostTags(postId, tagIds) {
    // 先删除现有标签关联
    await this.deletePostTags(postId);
    
    // 添加新的标签关联
    for (const tagId of tagIds) {
      await this.insert('post_tags', {
        post_id: postId,
        tag_id: tagId
      });
    }
    
    return { success: true, message: '文章标签设置成功' };
  }
  
  // 删除文章分类关联
  async deletePostCategories(postId) {
    const query = 'DELETE FROM post_categories WHERE post_id = ?';
    return await executeRun(this.env, query, [postId]);
  }
  
  // 删除文章标签关联
  async deletePostTags(postId) {
    const query = 'DELETE FROM post_tags WHERE post_id = ?';
    return await executeRun(this.env, query, [postId]);
  }
  
  // 保存内容到 R2
  async saveContentToR2(key, content) {
    try {
      const object = await this.env.BLOG_STORAGE.put(key, content, {
        httpMetadata: {
          contentType: 'text/markdown',
        },
      });
      
      return {
        success: true,
        key: object.key,
        etag: object.etag
      };
    } catch (error) {
      console.error('R2 save content error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 从 R2 获取内容
  async getContentFromR2(key) {
    try {
      const object = await this.env.BLOG_STORAGE.get(key);
      
      if (!object) {
        return {
          success: false,
          error: '文件不存在'
        };
      }
      
      return {
        success: true,
        data: await object.text()
      };
    } catch (error) {
      console.error('R2 get content error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 从 R2 删除内容
  async deleteContentFromR2(key) {
    try {
      await this.env.BLOG_STORAGE.delete(key);
      
      return {
        success: true,
        message: '内容删除成功'
      };
    } catch (error) {
      console.error('R2 delete content error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 搜索文章
  async searchPosts(keyword, options = {}) {
    const { page = 1, limit = 10, status = 1 } = options; // 默认只搜索已发布的文章
    
    const query = `
      SELECT p.id, p.title, p.slug, p.excerpt, p.author_id, p.status, p.featured, 
      p.comment_status, p.view_count, p.published_at, p.created_at, p.updated_at,
      u.username, u.display_name as author_name
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.status = ? AND (p.title LIKE ? OR p.excerpt LIKE ?)
      ORDER BY p.created_at DESC
    `;
    
    const params = [status, `%${keyword}%`, `%${keyword}%`];
    
    // 分页处理
    const paginatedQuery = paginate(query, page, limit);
    const result = await executeQuery(this.env, paginatedQuery, params);
    
    if (!result.success) {
      return result;
    }
    
    // 获取总数
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM posts 
      WHERE status = ? AND (title LIKE ? OR excerpt LIKE ?)
    `;
    const countResult = await executeOne(this.env, countQuery, params);
    
    if (!countResult.success) {
      return countResult;
    }
    
    const total = countResult.result.total;
    
    // 为每篇文章获取分类和标签
    const posts = await Promise.all(result.results.map(async post => {
      // 获取文章分类
      const categoriesResult = await this.getPostCategories(post.id);
      if (categoriesResult.success) {
        post.categories = categoriesResult.data;
      } else {
        post.categories = [];
      }
      
      // 获取文章标签
      const tagsResult = await this.getPostTags(post.id);
      if (tagsResult.success) {
        post.tags = tagsResult.data;
      } else {
        post.tags = [];
      }
      
      return post;
    }));
    
    return {
      success: true,
      data: posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: getTotalPages(total, limit)
      }
    };
  }
  
  // 增加文章浏览量
  async incrementViewCount(postId) {
    const query = 'UPDATE posts SET view_count = view_count + 1 WHERE id = ?';
    return await executeRun(this.env, query, [postId]);
  }
  
  // 生成唯一 slug
  async generateUniqueSlug(title) {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // 如果 slug 为空（例如，标题只有特殊字符），使用时间戳
    if (!baseSlug) {
      baseSlug = Date.now().toString();
    }
    
    let slug = baseSlug;
    let counter = 1;
    
    // 检查 slug 是否已存在
    let existingPost = await this.getBySlug(slug);
    
    // 如果 slug 已存在，尝试添加数字后缀
    while (existingPost.success && existingPost.result) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      existingPost = await this.getBySlug(slug);
    }
    
    return slug;
  }
}