import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response.js';
import { Attachment } from '../models/Attachment.js';

// 处理上传路由
export async function handleUploadRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  const env = request.env;
  const attachmentModel = new Attachment(env);
  
  try {
    // 上传文件
    if (path === '/api/upload' && method === 'POST') {
      return await handleUploadFile(request, attachmentModel);
    }
    
    // 获取附件列表
    if (path === '/api/upload/list' && method === 'GET') {
      return await handleGetAttachments(request, attachmentModel);
    }
    
    // 获取附件详情
    if (path.startsWith('/api/upload/') && method === 'GET') {
      const attachmentId = path.split('/')[3];
      return await handleGetAttachment(request, attachmentId, attachmentModel);
    }
    
    // 更新附件信息
    if (path.startsWith('/api/upload/') && method === 'PUT') {
      const attachmentId = path.split('/')[3];
      return await handleUpdateAttachment(request, attachmentId, attachmentModel);
    }
    
    // 删除附件
    if (path.startsWith('/api/upload/') && method === 'DELETE') {
      const attachmentId = path.split('/')[3];
      return await handleDeleteAttachment(request, attachmentId, attachmentModel);
    }
    
    // 下载文件
    if (path.startsWith('/api/upload/') && path.includes('/download') && method === 'GET') {
      const attachmentId = path.split('/')[3];
      return await handleDownloadAttachment(request, attachmentId, attachmentModel);
    }
    
    // 获取附件统计
    if (path === '/api/upload/stats' && method === 'GET') {
      return await handleGetAttachmentStats(request, attachmentModel);
    }
    
    return errorResponse('未找到对应的API端点', 404);
  } catch (err) {
    console.error('Upload API error:', err);
    return errorResponse('服务器内部错误', 500);
  }
}

// 上传文件
async function handleUploadFile(request, attachmentModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const postId = formData.get('postId') ? parseInt(formData.get('postId')) : null;
    const description = formData.get('description') || '';
    
    if (!file) {
      return errorResponse('请选择要上传的文件', 400);
    }
    
    // 获取文件信息
    const originalName = file.name;
    const mimeType = file.type;
    const fileSize = file.size;
    
    // 检查文件大小 (限制为 50MB)
    if (fileSize > 50 * 1024 * 1024) {
      return errorResponse('文件大小不能超过 50MB', 400);
    }
    
    // 上传附件
    const result = await attachmentModel.uploadAttachment({
      originalName,
      file: file.stream(),
      mimeType,
      fileSize,
      uploaderId: request.user.id,
      postId,
      description
    });
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.attachment, '文件上传成功');
  } catch (err) {
    console.error('Upload file error:', err);
    return errorResponse('文件上传失败', 500);
  }
}

// 获取附件列表
async function handleGetAttachments(request, attachmentModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const postId = url.searchParams.get('postId') ? parseInt(url.searchParams.get('postId')) : undefined;
    
    // 非管理员只能查看自己上传的文件
    const uploaderId = request.user.role === 'admin' ? undefined : request.user.id;
    
    const options = { page, limit, uploaderId, postId };
    
    const result = await attachmentModel.getAttachments(options);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result, '获取附件列表成功');
  } catch (err) {
    console.error('Get attachments error:', err);
    return errorResponse('获取附件列表失败', 500);
  }
}

// 获取附件详情
async function handleGetAttachment(request, attachmentId, attachmentModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    const result = await attachmentModel.getAttachmentById(attachmentId);
    
    if (!result.success || !result.result) {
      return errorResponse('附件不存在', 404);
    }
    
    const attachment = result.result;
    
    // 非管理员只能查看自己上传的文件
    if (request.user.role !== 'admin' && attachment.uploader_id !== request.user.id) {
      return errorResponse('无权限查看此附件', 403);
    }
    
    return successResponse(attachment, '获取附件详情成功');
  } catch (err) {
    console.error('Get attachment error:', err);
    return errorResponse('获取附件详情失败', 500);
  }
}

// 更新附件信息
async function handleUpdateAttachment(request, attachmentId, attachmentModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    const { description, postId } = await request.json();
    
    // 获取附件信息
    const attachmentResult = await attachmentModel.getAttachmentById(attachmentId);
    if (!attachmentResult.success || !attachmentResult.result) {
      return errorResponse('附件不存在', 404);
    }
    
    const attachment = attachmentResult.result;
    
    // 非管理员只能修改自己上传的文件
    if (request.user.role !== 'admin' && attachment.uploader_id !== request.user.id) {
      return errorResponse('无权限修改此附件', 403);
    }
    
    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (postId !== undefined) updateData.postId = postId;
    
    const result = await attachmentModel.updateAttachment(attachmentId, updateData);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.attachment, '更新附件信息成功');
  } catch (err) {
    console.error('Update attachment error:', err);
    return errorResponse('更新附件信息失败', 500);
  }
}

// 删除附件
async function handleDeleteAttachment(request, attachmentId, attachmentModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    // 获取附件信息
    const attachmentResult = await attachmentModel.getAttachmentById(attachmentId);
    if (!attachmentResult.success || !attachmentResult.result) {
      return errorResponse('附件不存在', 404);
    }
    
    const attachment = attachmentResult.result;
    
    // 非管理员只能删除自己上传的文件
    if (request.user.role !== 'admin' && attachment.uploader_id !== request.user.id) {
      return errorResponse('无权限删除此附件', 403);
    }
    
    const result = await attachmentModel.deleteAttachment(attachmentId);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(null, '删除附件成功');
  } catch (err) {
    console.error('Delete attachment error:', err);
    return errorResponse('删除附件失败', 500);
  }
}

// 下载附件
async function handleDownloadAttachment(request, attachmentId, attachmentModel) {
  try {
    // 获取附件信息
    const attachmentResult = await attachmentModel.getAttachmentById(attachmentId);
    if (!attachmentResult.success || !attachmentResult.result) {
      return errorResponse('附件不存在', 404);
    }
    
    const attachment = attachmentResult.result;
    
    // 获取文件
    const fileResult = await attachmentModel.getAttachmentFile(attachment.file_path);
    
    if (!fileResult.success) {
      return errorResponse('文件不存在', 404);
    }
    
    // 增加下载次数
    await attachmentModel.incrementDownloadCount(attachmentId);
    
    // 返回文件
    return new Response(fileResult.data, {
      headers: {
        'Content-Type': fileResult.contentType,
        'Content-Disposition': `attachment; filename="${attachment.original_name}"`,
        'Content-Length': fileResult.size,
        'ETag': fileResult.etag,
      }
    });
  } catch (err) {
    console.error('Download attachment error:', err);
    return errorResponse('下载附件失败', 500);
  }
}

// 获取附件统计
async function handleGetAttachmentStats(request, attachmentModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const result = await attachmentModel.getAttachmentStats();
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result.stats, '获取附件统计成功');
  } catch (err) {
    console.error('Get attachment stats error:', err);
    return errorResponse('获取附件统计失败', 500);
  }
}