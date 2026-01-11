import { BaseModel } from './BaseModel.js';

export class Feedback extends BaseModel {
  constructor(env) {
    super(env);
  }
  
  // 创建反馈
  async createFeedback(feedbackData) {
    const { name, email, subject, content, ipAddress, userAgent } = feedbackData;
    
    // 验证必填字段
    if (!name || !email || !subject || !content) {
      return { success: false, message: '姓名、邮箱、主题和内容不能为空' };
    }
    
    // 验证邮箱格式
    if (!this.isValidEmail(email)) {
      return { success: false, message: '邮箱格式不正确' };
    }
    
    // 创建反馈
    const newFeedbackData = {
      name,
      email,
      subject,
      content,
      ip_address: ipAddress || '',
      user_agent: userAgent || '',
      status: 0 // 默认未读
    };
    
    const result = await this.insert('feedback', newFeedbackData);
    
    if (!result.success) {
      return { success: false, message: '提交反馈失败', error: result.error };
    }
    
    // 获取新创建的反馈
    const newFeedback = await this.getById('feedback', result.meta.lastRowId);
    
    return { 
      success: true, 
      message: '反馈提交成功，感谢您的意见！', 
      feedback: newFeedback.result 
    };
  }
  
  // 获取反馈详情
  async getFeedbackById(id) {
    return await this.getById('feedback', id);
  }
  
  // 获取反馈列表
  async getFeedbackList(options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      status,
      startDate,
      endDate
    } = options;
    
    let where = '1=1';
    const params = [];
    
    if (status !== undefined) {
      where += ' AND status = ?';
      params.push(status);
    }
    
    if (startDate) {
      where += ' AND DATE(created_at) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      where += ' AND DATE(created_at) <= ?';
      params.push(endDate);
    }
    
    return await this.findMany('feedback', where, params, {
      orderBy: 'created_at DESC',
      page,
      limit
    });
  }
  
  // 更新反馈状态
  async updateFeedbackStatus(id, status) {
    // 检查反馈是否存在
    const existingFeedback = await this.getById('feedback', id);
    if (!existingFeedback.success || !existingFeedback.result) {
      return { success: false, message: '反馈不存在' };
    }
    
    const result = await this.update('feedback', id, { 
      status, 
      updated_at: new Date().toISOString() 
    });
    
    if (!result.success) {
      return { success: false, message: '更新反馈状态失败', error: result.error };
    }
    
    return { success: true, message: '反馈状态更新成功' };
  }
  
  // 标记为已读
  async markAsRead(id) {
    return await this.updateFeedbackStatus(id, 1);
  }
  
  // 标记为已回复
  async markAsReplied(id) {
    return await this.updateFeedbackStatus(id, 2);
  }
  
  // 删除反馈
  async deleteFeedback(id) {
    // 检查反馈是否存在
    const existingFeedback = await this.getById('feedback', id);
    if (!existingFeedback.success || !existingFeedback.result) {
      return { success: false, message: '反馈不存在' };
    }
    
    const result = await this.delete('feedback', id);
    
    if (!result.success) {
      return { success: false, message: '删除反馈失败', error: result.error };
    }
    
    return { success: true, message: '反馈删除成功' };
  }
  
  // 批量更新反馈状态
  async batchUpdateStatus(ids, status) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, message: '请提供有效的ID列表' };
    }
    
    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE feedback SET status = ?, updated_at = ? WHERE id IN (${placeholders})`;
    
    try {
      const result = await this.executeRun(query, [status, new Date().toISOString(), ...ids]);
      
      if (!result.success) {
        return { success: false, message: '批量更新失败', error: result.error };
      }
      
      return { success: true, message: `已更新${result.meta.changes}条反馈状态` };
    } catch (error) {
      console.error('Batch update feedback status error:', error);
      return { success: false, message: '批量更新失败', error: error.message };
    }
  }
  
  // 批量删除反馈
  async batchDelete(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, message: '请提供有效的ID列表' };
    }
    
    const placeholders = ids.map(() => '?').join(',');
    const query = `DELETE FROM feedback WHERE id IN (${placeholders})`;
    
    try {
      const result = await this.executeRun(query, ids);
      
      if (!result.success) {
        return { success: false, message: '批量删除失败', error: result.error };
      }
      
      return { success: true, message: `已删除${result.meta.changes}条反馈` };
    } catch (error) {
      console.error('Batch delete feedback error:', error);
      return { success: false, message: '批量删除失败', error: error.message };
    }
  }
  
  // 获取反馈统计
  async getFeedbackStats() {
    try {
      // 总反馈数
      const totalFeedbackResult = await this.executeOne('SELECT COUNT(*) as total FROM feedback');
      const totalFeedback = totalFeedbackResult.success ? totalFeedbackResult.result.total : 0;
      
      // 按状态统计
      const statusStatsResult = await this.executeQuery(`
        SELECT status, COUNT(*) as count
        FROM feedback
        GROUP BY status
      `);
      
      const statusStats = statusStatsResult.success ? statusStatsResult.results : [];
      
      // 今日反馈数
      const todayFeedbackResult = await this.executeOne(`
        SELECT COUNT(*) as count
        FROM feedback
        WHERE DATE(created_at) = DATE('now')
      `);
      const todayFeedback = todayFeedbackResult.success ? todayFeedbackResult.result.count : 0;
      
      // 本周反馈数
      const weekFeedbackResult = await this.executeOne(`
        SELECT COUNT(*) as count
        FROM feedback
        WHERE DATE(created_at) >= DATE('now', '-7 days')
      `);
      const weekFeedback = weekFeedbackResult.success ? weekFeedbackResult.result.count : 0;
      
      // 未读反馈数
      const unreadFeedbackResult = await this.executeOne(`
        SELECT COUNT(*) as count
        FROM feedback
        WHERE status = 0
      `);
      const unreadFeedback = unreadFeedbackResult.success ? unreadFeedbackResult.result.count : 0;
      
      return {
        success: true,
        stats: {
          totalFeedback,
          todayFeedback,
          weekFeedback,
          unreadFeedback,
          statusStats: statusStats.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
          }, {})
        }
      };
    } catch (error) {
      console.error('Get feedback stats error:', error);
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