import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response.js';
import { Comment } from '../models/Comment.js';
import { authenticateRequest } from '../utils/auth-helper.js';

// 处理评论路由
export async function handleCommentRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  const env = request.env;
  const commentModel = new Comment(env);
  
  try {
    // 获取评论列表
    if (path === '/api/comment/list' && method === 'GET') {
      return await handleGetComments(request, commentModel);
    }
    
    // 获取评论详情
    if (path.startsWith('/api/comment/') && method === 'GET' && !path.includes('/list') && !path.includes('/create') && !path.includes('/update') && !path.includes('/delete') && !path.includes('/approve') && !path.includes('/reject')) {
      const commentId = path.split('/')[3];
      return await handleGetComment(request, commentId, commentModel);
    }
    
    // 创建评论
    if (path === '/api/comment/create' && method === 'POST') {
      return await handleCreateComment(request, commentModel);
    }
    
    // 更新评论（需要认证）
    if (path.startsWith('/api/comment/') && path.includes('/update') && method === 'PUT') {
      const commentId = path.split('/')[3];
      return await handleUpdateComment(request, commentId, commentModel);
    }
    
    // 删除评论（需要认证）
    if (path.startsWith('/api/comment/') && path.includes('/delete') && method === 'DELETE') {
      const commentId = path.split('/')[3];
      return await handleDeleteComment(request, commentId, commentModel);
    }
    
    // 批准评论（需要管理员权限）
    if (path.startsWith('/api/comment/') && path.includes('/approve') && method === 'PUT') {
      const commentId = path.split('/')[3];
      return await handleApproveComment(request, commentId, commentModel);
    }
    
    // 拒绝评论（需要管理员权限）
    if (path.startsWith('/api/comment/') && path.includes('/reject') && method === 'PUT') {
      const commentId = path.split('/')[3];
      return await handleRejectComment(request, commentId, commentModel);
    }
    
    // 获取评论回复
    if (path.startsWith('/api/comment/') && path.includes('/replies') && method === 'GET') {
      const commentId = path.split('/')[3];
      return await handleGetCommentReplies(request, commentId, commentModel);
    }
    
    // 获取评论统计（需要管理员权限）
    if (path === '/api/comment/stats' && method === 'GET') {
      return await handleGetCommentStats(request, commentModel);
    }
    
    return errorResponse('未找到对应的API端点', 404);
  } catch (err) {
    console.error('Comment API error:', err);
    return errorResponse('服务器内部错误', 500);
  }
}

// 获取评论列表
async function handleGetComments(request, commentModel) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const postId = url.searchParams.get('postId') ? parseInt(url.searchParams.get('postId')) : undefined;
    const userId = url.searchParams.get('userId') ? parseInt(url.searchParams.get('userId')) : undefined;
    const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status')) : 1; // 默认只获取已批准的评论
    let parentId = url.searchParams.get('parentId') ? (url.searchParams.get('parentId') === 'null' ? null : parseInt(url.searchParams.get('parentId'))) : null;
    
    // 如果是获取文章评论，默认只获取顶级评论
    if (postId && parentId === undefined) {
      parentId = null;
    }
    
    const options = { page, limit, postId, userId, status, parentId };
    
    const result = await commentModel.getComments(options);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result, '获取评论列表成功');
  } catch (err) {
    console.error('Get comments error:', err);
    return errorResponse('获取评论列表失败', 500);
  }
}

// 获取评论详情
async function handleGetComment(request, commentId, commentModel) {
  try {
    const result = await commentModel.getCommentById(commentId);
    
    if (!result.success || !result.result) {
      return notFoundResponse('评论不存在');
    }
    
    return successResponse(result.result, '获取评论详情成功');
  } catch (err) {
    console.error('Get comment error:', err);
    return errorResponse('获取评论详情失败', 500);
  }
}

// 创建评论
async function handleCreateComment(request, commentModel) {
  try {
    const user = await authenticateRequest(request, commentModel.env);
    if (user) {
      request.user = user;
    }

    const commentData = await request.json();

    // 如果用户已登录，使用用户信息
    if (request.user) {
      commentData.userId = request.user.id;
    }
    
    // 获取客户端信息
    commentData.ipAddress = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || '';
    commentData.userAgent = request.headers.get('User-Agent') || '';
    
    const result = await commentModel.createComment(commentData);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.comment, result.message);
  } catch (err) {
    console.error('Create comment error:', err);
    return errorResponse('创建评论失败', 500);
  }
}

// 更新评论
async function handleUpdateComment(request, commentId, commentModel) {
  const user = await authenticateRequest(request, commentModel.env);
  if (!user) {
    return unauthorizedResponse();
  }
  request.user = user;
  
  try {
    // 获取原始评论信息
    const originalComment = await commentModel.getById('comments', commentId);
    if (!originalComment.success || !originalComment.result) {
      return notFoundResponse('评论不存在');
    }
    
    // 检查权限：只有评论作者或管理员可以修改
    const isAuthor = originalComment.result.user_id === request.user.id;
    const isAdmin = request.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      return errorResponse('无权限修改此评论', 403);
    }
    
    const commentData = await request.json();
    
    // 非管理员只能修改内容，不能修改状态
    if (!isAdmin) {
      delete commentData.status;
    }
    
    const result = await commentModel.updateComment(commentId, commentData);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.comment, '更新评论成功');
  } catch (err) {
    console.error('Update comment error:', err);
    return errorResponse('更新评论失败', 500);
  }
}

// 删除评论
async function handleDeleteComment(request, commentId, commentModel) {
  const user = await authenticateRequest(request, commentModel.env);
  if (!user) {
    return unauthorizedResponse();
  }
  request.user = user;
  
  try {
    // 获取原始评论信息
    const originalComment = await commentModel.getById('comments', commentId);
    if (!originalComment.success || !originalComment.result) {
      return notFoundResponse('评论不存在');
    }
    
    // 检查权限：只有评论作者或管理员可以删除
    const isAuthor = originalComment.result.user_id === request.user.id;
    const isAdmin = request.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      return errorResponse('无权限删除此评论', 403);
    }
    
    const result = await commentModel.deleteComment(commentId);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(null, '删除评论成功');
  } catch (err) {
    console.error('Delete comment error:', err);
    return errorResponse('删除评论失败', 500);
  }
}

// 批准评论
async function handleApproveComment(request, commentId, commentModel) {
  const user = await authenticateRequest(request, commentModel.env);
  if (!user || user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  request.user = user;
  
  try {
    const result = await commentModel.approveComment(commentId);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.comment, '评论批准成功');
  } catch (err) {
    console.error('Approve comment error:', err);
    return errorResponse('批准评论失败', 500);
  }
}

// 拒绝评论
async function handleRejectComment(request, commentId, commentModel) {
  const user = await authenticateRequest(request, commentModel.env);
  if (!user || user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  request.user = user;
  
  try {
    const result = await commentModel.rejectComment(commentId);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.comment, '评论拒绝成功');
  } catch (err) {
    console.error('Reject comment error:', err);
    return errorResponse('拒绝评论失败', 500);
  }
}

// 获取评论回复
async function handleGetCommentReplies(request, commentId, commentModel) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    
    const options = { page, limit };
    
    const result = await commentModel.getCommentReplies(commentId, options);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result, '获取评论回复成功');
  } catch (err) {
    console.error('Get comment replies error:', err);
    return errorResponse('获取评论回复失败', 500);
  }
}

// 获取评论统计
async function handleGetCommentStats(request, commentModel) {
  const user = await authenticateRequest(request, commentModel.env);
  if (!user || user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  request.user = user;
  
  try {
    const result = await commentModel.getCommentStats();
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result.stats, '获取评论统计成功');
  } catch (err) {
    console.error('Get comment stats error:', err);
    return errorResponse('获取评论统计失败', 500);
  }
}