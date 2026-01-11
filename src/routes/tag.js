import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response.js';
import { Tag } from '../models/Tag.js';

// 处理标签路由
export async function handleTagRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  const env = request.env;
  const tagModel = new Tag(env);
  
  try {
    // 获取标签列表
    if (path === '/api/tag/list' && method === 'GET') {
      return await handleGetTags(request, tagModel);
    }
    
    // 获取热门标签
    if (path === '/api/tag/popular' && method === 'GET') {
      return await handleGetPopularTags(request, tagModel);
    }
    
    // 批量获取或创建标签（用于文章编辑）
    if (path === '/api/tag/batch' && method === 'POST') {
      return await handleBatchGetOrCreateTags(request, tagModel);
    }
    
    // 获取标签详情
    if (path.startsWith('/api/tag/') && method === 'GET' && !path.includes('/list') && !path.includes('/popular') && !path.includes('/batch') && !path.includes('/create') && !path.includes('/update') && !path.includes('/delete')) {
      const tagIdOrSlug = path.split('/')[3];
      return await handleGetTag(request, tagIdOrSlug, tagModel);
    }
    
    // 创建标签（需要管理员权限）
    if (path === '/api/tag/create' && method === 'POST') {
      return await handleCreateTag(request, tagModel);
    }
    
    // 更新标签（需要管理员权限）
    if (path.startsWith('/api/tag/') && path.includes('/update') && method === 'PUT') {
      const tagId = path.split('/')[3];
      return await handleUpdateTag(request, tagId, tagModel);
    }
    
    // 删除标签（需要管理员权限）
    if (path.startsWith('/api/tag/') && path.includes('/delete') && method === 'DELETE') {
      const tagId = path.split('/')[3];
      return await handleDeleteTag(request, tagId, tagModel);
    }
    
    return errorResponse('未找到对应的API端点', 404);
  } catch (err) {
    console.error('Tag API error:', err);
    return errorResponse('服务器内部错误', 500);
  }
}

// 获取标签列表
async function handleGetTags(request, tagModel) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    
    const options = { page, limit };
    
    const result = await tagModel.getTags(options);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result, '获取标签列表成功');
  } catch (err) {
    console.error('Get tags error:', err);
    return errorResponse('获取标签列表失败', 500);
  }
}

// 获取热门标签
async function handleGetPopularTags(request, tagModel) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    
    const result = await tagModel.getPopularTags(limit);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result.data, '获取热门标签成功');
  } catch (err) {
    console.error('Get popular tags error:', err);
    return errorResponse('获取热门标签失败', 500);
  }
}

// 批量获取或创建标签
async function handleBatchGetOrCreateTags(request, tagModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    const { names } = await request.json();
    
    if (!Array.isArray(names)) {
      return errorResponse('标签名称必须是数组', 400);
    }
    
    if (names.length === 0) {
      return successResponse([], '处理成功');
    }
    
    const result = await tagModel.getOrCreateTags(names);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result.tags, '批量处理标签成功');
  } catch (err) {
    console.error('Batch get or create tags error:', err);
    return errorResponse('批量处理标签失败', 500);
  }
}

// 获取标签详情
async function handleGetTag(request, tagIdOrSlug, tagModel) {
  try {
    let result;
    
    // 判断是 ID 还是 slug
    if (/^\d+$/.test(tagIdOrSlug)) {
      result = await tagModel.getById('tags', tagIdOrSlug);
    } else {
      result = await tagModel.getBySlug(tagIdOrSlug);
    }
    
    if (!result.success || !result.result) {
      return notFoundResponse('标签不存在');
    }
    
    // 获取标签下的文章数量
    const postCountQuery = `
      SELECT COUNT(*) as count
      FROM post_tags pt
      WHERE pt.tag_id = ?
    `;
    const postCountResult = await tagModel.executeOne(postCountQuery, [result.result.id]);
    
    if (postCountResult.success) {
      result.result.post_count = postCountResult.result.count;
    } else {
      result.result.post_count = 0;
    }
    
    return successResponse(result.result, '获取标签详情成功');
  } catch (err) {
    console.error('Get tag error:', err);
    return errorResponse('获取标签详情失败', 500);
  }
}

// 创建标签
async function handleCreateTag(request, tagModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const tagData = await request.json();
    
    if (!tagData.name || !tagData.slug) {
      return errorResponse('标签名和 slug 不能为空', 400);
    }
    
    const result = await tagModel.createTag(tagData);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.tag, '创建标签成功');
  } catch (err) {
    console.error('Create tag error:', err);
    return errorResponse('创建标签失败', 500);
  }
}

// 更新标签
async function handleUpdateTag(request, tagId, tagModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const tagData = await request.json();
    
    // 如果更新名称但没有提供 slug，根据新名称生成 slug
    if (tagData.name && !tagData.slug) {
      tagData.slug = await tagModel.generateUniqueSlug(tagData.name);
    }
    
    const result = await tagModel.updateTag(tagId, tagData);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.tag, '更新标签成功');
  } catch (err) {
    console.error('Update tag error:', err);
    return errorResponse('更新标签失败', 500);
  }
}

// 删除标签
async function handleDeleteTag(request, tagId, tagModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    // 检查标签下是否有文章
    const postCountQuery = `
      SELECT COUNT(*) as count
      FROM post_tags pt
      WHERE pt.tag_id = ?
    `;
    const postCountResult = await tagModel.executeOne(postCountQuery, [tagId]);
    
    if (postCountResult.success && postCountResult.result.count > 0) {
      return errorResponse('该标签下还有文章，无法删除', 400);
    }
    
    const result = await tagModel.deleteTag(tagId);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(null, '删除标签成功');
  } catch (err) {
    console.error('Delete tag error:', err);
    return errorResponse('删除标签失败', 500);
  }
}