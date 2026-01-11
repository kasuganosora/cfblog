import { BaseModel } from './BaseModel.js';

export class Comment extends BaseModel {
  constructor(env) {
    super(env);
  }
  
  // 创建评论
  async createComment(commentData) {
    const { 
      postId, 
      userId, 
      parentId, 
      authorName, 
      authorEmail, 
      authorUrl, 
      content, 
      ipAddress, 
      userAgent,
      status = 0 // 默认待审核
    } = commentData;
    
    // 验证必填字段
    if (!postId || !content) {
      return { success: false, message: '文章ID和内容不能为空' };
    }
    
    // 检查文章是否存在
    const postResult = await this.getById('posts', postId);
    if (!postResult.success || !postResult.result) {
      return { success: false, message: '文章不存在' };
    }
    
    // 检查文章是否允许评论
    if (postResult.result.comment_status === 0) {
      return { success: false, message: '该文章不允许评论' };
    }
    
    // 如果是回复评论，检查父评论是否存在
    if (parentId) {
      const parentCommentResult = await this.getById('comments', parentId);
      if (!parentCommentResult.success || !parentCommentResult.result) {
        return { success: false, message: '父评论不存在' };
      }
      
      // 检查父评论是否属于同一篇文章
      if (parentCommentResult.result.post_id !== postId) {
        return { success: false, message: '父评论不属于该文章' };
      }
    }
    
    // 游客评论需要填写姓名和邮箱
    if (!userId && (!authorName || !authorEmail)) {
      return { success: false, message: '游客评论需要填写姓名和邮箱' };
    }
    
    // 验证邮箱格式
    if (authorEmail && !this.isValidEmail(authorEmail)) {
      return { success: false, message: '邮箱格式不正确' };
    }
    
    // 创建评论
    const newCommentData = {
      post_id: postId,
      user_id: userId,
      parent_id: parentId,
      author_name: authorName || '',
      author_email: authorEmail || '',
      author_url: authorUrl || '',
      content,
      status,
      ip_address: ipAddress || '',
      user_agent: userAgent || ''
    };
    
    const result = await this.insert('comments', newCommentData);
    
    if (!result.success) {
      return { success: false, message: '创建评论失败', error: result.error };
    }
    
    // 获取新创建的评论
    const newComment = await this.getCommentById(result.meta.lastRowId);
    
    return { 
      success: true, 
      message: status === 1 ? '评论发布成功' : '评论提交成功，等待审核', 
      comment: newComment.result 
    };
  }
  
  // 获取评论详情
  async getCommentById(id) {
    const query = `
      SELECT c.*, 
        CASE 
          WHEN c.user_id IS NOT NULL THEN u.username
          ELSE c.author_name
        END as author_name,
        CASE 
          WHEN c.user_id IS NOT NULL THEN u.display_name
          ELSE c.author_name
        END as author_display_name,
        CASE 
          WHEN c.user_id IS NOT NULL THEN u.avatar
          ELSE ''
        END as author_avatar,
        CASE 
          WHEN c.user_id IS NOT NULL THEN ''
          ELSE c.author_email
        END as author_email,
        CASE 
          WHEN c.user_id IS NOT NULL THEN ''
          ELSE c.author_url
        END as author_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    
    const result = await this.executeOne(query, [id]);
    return result;
  }
  
  // 获取评论列表
  async getComments(options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      postId, 
      userId, 
      status,
      parentId = null // 获取顶级评论
    } = options;
    
    let where = '1=1';
    const params = [];
    
    if (postId) {
      where += ' AND c.post_id = ?';
      params.push(postId);
    }
    
    if (userId) {
      where += ' AND c.user_id = ?';
      params.push(userId);
    }
    
    if (status !== undefined) {
      where += ' AND c.status = ?';
      params.push(status);
    }
    
    if (parentId !== null && parentId !== undefined) {
      where += ' AND c.parent_id = ?';
      params.push(parentId);
    }
    
    const query = `
      SELECT c.*, 
        CASE 
          WHEN c.user_id IS NOT NULL THEN u.username
          ELSE c.author_name
        END as author_name,
        CASE 
          WHEN c.user_id IS NOT NULL THEN u.display_name
          ELSE c.author_name
        END as author_display_name,
        CASE 
          WHEN c.user_id IS NOT NULL THEN u.avatar
          ELSE ''
        END as author_avatar,
        CASE 
          WHEN c.user_id IS NOT NULL THEN ''
          ELSE c.author_email
        END as author_email,
        CASE 
          WHEN c.user_id IS NOT NULL THEN ''
          ELSE c.author_url
        END as author_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE ${where}
      ORDER BY c.created_at ASC
    `;
    
    // 分页处理
    const paginatedQuery = paginate(query, page, limit);
    const result = await this.executeQuery(paginatedQuery, params);
    
    if (!result.success) {
      return result;
    }
    
    // 获取总数
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM comments c 
      WHERE ${where}
    `;
    const countResult = await this.executeOne(countQuery, params);
    
    if (!countResult.success) {
      return countResult;
    }
    
    const total = countResult.result.total;
    
    // 为每个评论获取回复数量
    const comments = await Promise.all(result.results.map(async comment => {
      const repliesCountQuery = 'SELECT COUNT(*) as count FROM comments WHERE parent_id = ?';
      const repliesCountResult = await this.executeOne(repliesCountQuery, [comment.id]);
      
      if (repliesCountResult.success) {
        comment.replies_count = repliesCountResult.result.count;
      } else {
        comment.replies_count = 0;
      }
      
      return comment;
    }));
    
    return {
      success: true,
      data: comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: getTotalPages(total, limit)
      }
    };
  }
  
  // 获取评论回复
  async getCommentReplies(parentId, options = {}) {
    const { page = 1, limit = 10 } = options;
    
    return await this.getComments({
      page,
      limit,
      parentId
    });
  }
  
  // 更新评论
  async updateComment(commentId, commentData) {
    // 检查评论是否存在
    const existingComment = await this.getById('comments', commentId);
    if (!existingComment.success || !existingComment.result) {
      return { success: false, message: '评论不存在' };
    }
    
    // 准备更新数据
    const updateData = {};
    if (commentData.content !== undefined) updateData.content = commentData.content;
    if (commentData.status !== undefined) updateData.status = commentData.status;
    updateData.updated_at = new Date().toISOString();
    
    const result = await this.update('comments', commentId, updateData);
    
    if (!result.success) {
      return { success: false, message: '更新评论失败', error: result.error };
    }
    
    // 获取更新后的评论
    const updatedComment = await this.getCommentById(commentId);
    
    return { 
      success: true, 
      message: '评论更新成功', 
      comment: updatedComment.result 
    };
  }
  
  // 删除评论
  async deleteComment(commentId) {
    // 检查评论是否存在
    const existingComment = await this.getById('comments', commentId);
    if (!existingComment.success || !existingComment.result) {
      return { success: false, message: '评论不存在' };
    }
    
    // 删除评论的所有回复
    await this.deleteCommentReplies(commentId);
    
    // 删除评论
    const result = await this.delete('comments', commentId);
    
    if (!result.success) {
      return { success: false, message: '删除评论失败', error: result.error };
    }
    
    return { success: true, message: '评论删除成功' };
  }
  
  // 删除评论回复
  async deleteCommentReplies(parentId) {
    // 递归删除所有回复
    const query = `
      WITH RECURSIVE comment_tree AS (
        SELECT id FROM comments WHERE parent_id = ?
        UNION
        SELECT c.id FROM comments c
        JOIN comment_tree ct ON c.parent_id = ct.id
      )
      DELETE FROM comments WHERE id IN (SELECT id FROM comment_tree)
    `;
    
    return await this.executeRun(query, [parentId]);
  }
  
  // 批准评论
  async approveComment(commentId) {
    return await this.updateComment(commentId, { status: 1 });
  }
  
  // 拒绝评论
  async rejectComment(commentId) {
    return await this.updateComment(commentId, { status: 2 });
  }
  
  // 获取评论统计
  async getCommentStats() {
    try {
      // 总评论数
      const totalCommentsResult = await this.executeOne('SELECT COUNT(*) as total FROM comments');
      const totalComments = totalCommentsResult.success ? totalCommentsResult.result.total : 0;
      
      // 按状态统计
      const statusStatsResult = await this.executeQuery(`
        SELECT status, COUNT(*) as count
        FROM comments
        GROUP BY status
      `);
      
      const statusStats = statusStatsResult.success ? statusStatsResult.results : [];
      
      // 今日评论数
      const todayCommentsResult = await this.executeOne(`
        SELECT COUNT(*) as count
        FROM comments
        WHERE DATE(created_at) = DATE('now')
      `);
      const todayComments = todayCommentsResult.success ? todayCommentsResult.result.count : 0;
      
      // 待审核评论数
      const pendingCommentsResult = await this.executeOne(`
        SELECT COUNT(*) as count
        FROM comments
        WHERE status = 0
      `);
      const pendingComments = pendingCommentsResult.success ? pendingCommentsResult.result.count : 0;
      
      return {
        success: true,
        stats: {
          totalComments,
          todayComments,
          pendingComments,
          statusStats: statusStats.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
          }, {})
        }
      };
    } catch (error) {
      console.error('Get comment stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // 验证邮箱格式
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// 计算总页数（从 utils/db.js 复制，避免循环依赖）
function getTotalPages(total, limit) {
  return Math.ceil(total / limit);
}

// 分页处理（从 utils/db.js 复制，避免循环依赖）
function paginate(query, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  // 检查查询中是否已经包含 LIMIT
  if (query.toLowerCase().includes(' limit ')) {
    // 如果已经有 LIMIT，替换它
    return query.replace(/ limit \d+(\s+offset\s+\d+)?$/i, ` LIMIT ${limit} OFFSET ${offset}`);
  } else {
    // 如果没有 LIMIT，添加它
    return `${query} LIMIT ${limit} OFFSET ${offset}`;
  }
}