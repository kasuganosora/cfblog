import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response.js';
import { Feedback } from '../models/Feedback.js';

// 处理反馈路由
export async function handleFeedbackRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  const env = request.env;
  const feedbackModel = new Feedback(env);
  
  try {
    // 提交反馈
    if (path === '/api/feedback/submit' && method === 'POST') {
      return await handleSubmitFeedback(request, feedbackModel);
    }
    
    // 获取反馈列表（需要管理员权限）
    if (path === '/api/feedback/list' && method === 'GET') {
      return await handleGetFeedbackList(request, feedbackModel);
    }
    
    // 获取反馈详情（需要管理员权限）
    if (path.startsWith('/api/feedback/') && method === 'GET' && !path.includes('/list') && !path.includes('/submit') && !path.includes('/stats') && !path.includes('/batch') && !path.includes('/update') && !path.includes('/delete')) {
      const feedbackId = path.split('/')[3];
      return await handleGetFeedback(request, feedbackId, feedbackModel);
    }
    
    // 更新反馈状态（需要管理员权限）
    if (path.startsWith('/api/feedback/') && path.includes('/update') && method === 'PUT') {
      const feedbackId = path.split('/')[3];
      return await handleUpdateFeedbackStatus(request, feedbackId, feedbackModel);
    }
    
    // 标记为已读（需要管理员权限）
    if (path.startsWith('/api/feedback/') && path.includes('/read') && method === 'PUT') {
      const feedbackId = path.split('/')[3];
      return await handleMarkAsRead(request, feedbackId, feedbackModel);
    }
    
    // 标记为已回复（需要管理员权限）
    if (path.startsWith('/api/feedback/') && path.includes('/reply') && method === 'PUT') {
      const feedbackId = path.split('/')[3];
      return await handleMarkAsReplied(request, feedbackId, feedbackModel);
    }
    
    // 删除反馈（需要管理员权限）
    if (path.startsWith('/api/feedback/') && path.includes('/delete') && method === 'DELETE') {
      const feedbackId = path.split('/')[3];
      return await handleDeleteFeedback(request, feedbackId, feedbackModel);
    }
    
    // 批量更新反馈状态（需要管理员权限）
    if (path === '/api/feedback/batch/update' && method === 'PUT') {
      return await handleBatchUpdateStatus(request, feedbackModel);
    }
    
    // 批量删除反馈（需要管理员权限）
    if (path === '/api/feedback/batch/delete' && method === 'DELETE') {
      return await handleBatchDelete(request, feedbackModel);
    }
    
    // 获取反馈统计（需要管理员权限）
    if (path === '/api/feedback/stats' && method === 'GET') {
      return await handleGetFeedbackStats(request, feedbackModel);
    }
    
    return errorResponse('未找到对应的API端点', 404);
  } catch (err) {
    console.error('Feedback API error:', err);
    return errorResponse('服务器内部错误', 500);
  }
}

// 提交反馈
async function handleSubmitFeedback(request, feedbackModel) {
  try {
    const feedbackData = await request.json();
    
    // 获取客户端信息
    feedbackData.ipAddress = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';
    feedbackData.userAgent = request.headers.get('User-Agent') || '';
    
    const result = await feedbackModel.createFeedback(feedbackData);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.feedback, result.message);
  } catch (err) {
    console.error('Submit feedback error:', err);
    return errorResponse('提交反馈失败', 500);
  }
}

// 获取反馈列表
async function handleGetFeedbackList(request, feedbackModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status')) : undefined;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    const options = { page, limit, status, startDate, endDate };
    
    const result = await feedbackModel.getFeedbackList(options);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result, '获取反馈列表成功');
  } catch (err) {
    console.error('Get feedback list error:', err);
    return errorResponse('获取反馈列表失败', 500);
  }
}

// 获取反馈详情
async function handleGetFeedback(request, feedbackId, feedbackModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const result = await feedbackModel.getFeedbackById(feedbackId);
    
    if (!result.success || !result.result) {
      return notFoundResponse('反馈不存在');
    }
    
    return successResponse(result.result, '获取反馈详情成功');
  } catch (err) {
    console.error('Get feedback error:', err);
    return errorResponse('获取反馈详情失败', 500);
  }
}

// 更新反馈状态
async function handleUpdateFeedbackStatus(request, feedbackId, feedbackModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const { status } = await request.json();
    
    if (status === undefined) {
      return errorResponse('状态不能为空', 400);
    }
    
    const result = await feedbackModel.updateFeedbackStatus(feedbackId, status);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(null, result.message);
  } catch (err) {
    console.error('Update feedback status error:', err);
    return errorResponse('更新反馈状态失败', 500);
  }
}

// 标记为已读
async function handleMarkAsRead(request, feedbackId, feedbackModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const result = await feedbackModel.markAsRead(feedbackId);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(null, result.message);
  } catch (err) {
    console.error('Mark feedback as read error:', err);
    return errorResponse('标记反馈为已读失败', 500);
  }
}

// 标记为已回复
async function handleMarkAsReplied(request, feedbackId, feedbackModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const result = await feedbackModel.markAsReplied(feedbackId);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(null, result.message);
  } catch (err) {
    console.error('Mark feedback as replied error:', err);
    return errorResponse('标记反馈为已回复失败', 500);
  }
}

// 删除反馈
async function handleDeleteFeedback(request, feedbackId, feedbackModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const result = await feedbackModel.deleteFeedback(feedbackId);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(null, result.message);
  } catch (err) {
    console.error('Delete feedback error:', err);
    return errorResponse('删除反馈失败', 500);
  }
}

// 批量更新反馈状态
async function handleBatchUpdateStatus(request, feedbackModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const { ids, status } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('请提供有效的ID列表', 400);
    }
    
    if (status === undefined) {
      return errorResponse('状态不能为空', 400);
    }
    
    const result = await feedbackModel.batchUpdateStatus(ids, status);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(null, result.message);
  } catch (err) {
    console.error('Batch update feedback status error:', err);
    return errorResponse('批量更新反馈状态失败', 500);
  }
}

// 批量删除反馈
async function handleBatchDelete(request, feedbackModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('请提供有效的ID列表', 400);
    }
    
    const result = await feedbackModel.batchDelete(ids);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(null, result.message);
  } catch (err) {
    console.error('Batch delete feedback error:', err);
    return errorResponse('批量删除反馈失败', 500);
  }
}

// 获取反馈统计
async function handleGetFeedbackStats(request, feedbackModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const result = await feedbackModel.getFeedbackStats();
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result.stats, '获取反馈统计成功');
  } catch (err) {
    console.error('Get feedback stats error:', err);
    return errorResponse('获取反馈统计失败', 500);
  }
}