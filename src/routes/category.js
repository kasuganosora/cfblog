import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response.js';
import { Category } from '../models/Category.js';

// 处理分类路由
export async function handleCategoryRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  const env = request.env;
  const categoryModel = new Category(env);
  
  try {
    // 获取分类列表
    if (path === '/api/category/list' && method === 'GET') {
      return await handleGetCategories(request, categoryModel);
    }
    
    // 获取分类树
    if (path === '/api/category/tree' && method === 'GET') {
      return await handleGetCategoryTree(request, categoryModel);
    }
    
    // 获取热门分类
    if (path === '/api/category/popular' && method === 'GET') {
      return await handleGetPopularCategories(request, categoryModel);
    }
    
    // 获取分类详情
    if (path.startsWith('/api/category/') && method === 'GET' && !path.includes('/list') && !path.includes('/tree') && !path.includes('/popular') && !path.includes('/create') && !path.includes('/update') && !path.includes('/delete')) {
      const categoryIdOrSlug = path.split('/')[3];
      return await handleGetCategory(request, categoryIdOrSlug, categoryModel);
    }
    
    // 创建分类（需要管理员权限）
    if (path === '/api/category/create' && method === 'POST') {
      return await handleCreateCategory(request, categoryModel);
    }
    
    // 更新分类（需要管理员权限）
    if (path.startsWith('/api/category/') && path.includes('/update') && method === 'PUT') {
      const categoryId = path.split('/')[3];
      return await handleUpdateCategory(request, categoryId, categoryModel);
    }
    
    // 删除分类（需要管理员权限）
    if (path.startsWith('/api/category/') && path.includes('/delete') && method === 'DELETE') {
      const categoryId = path.split('/')[3];
      return await handleDeleteCategory(request, categoryId, categoryModel);
    }
    
    return errorResponse('未找到对应的API端点', 404);
  } catch (err) {
    console.error('Category API error:', err);
    return errorResponse('服务器内部错误', 500);
  }
}

// 获取分类列表
async function handleGetCategories(request, categoryModel) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    
    const options = { page, limit };
    
    const result = await categoryModel.getCategories(options);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result, '获取分类列表成功');
  } catch (err) {
    console.error('Get categories error:', err);
    return errorResponse('获取分类列表失败', 500);
  }
}

// 获取分类树
async function handleGetCategoryTree(request, categoryModel) {
  try {
    const result = await categoryModel.getCategoryTree();
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result.data, '获取分类树成功');
  } catch (err) {
    console.error('Get category tree error:', err);
    return errorResponse('获取分类树失败', 500);
  }
}

// 获取热门分类
async function handleGetPopularCategories(request, categoryModel) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    
    const result = await categoryModel.getPopularCategories(limit);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result.data, '获取热门分类成功');
  } catch (err) {
    console.error('Get popular categories error:', err);
    return errorResponse('获取热门分类失败', 500);
  }
}

// 获取分类详情
async function handleGetCategory(request, categoryIdOrSlug, categoryModel) {
  try {
    let result;
    
    // 判断是 ID 还是 slug
    if (/^\d+$/.test(categoryIdOrSlug)) {
      result = await categoryModel.getById('categories', categoryIdOrSlug);
    } else {
      result = await categoryModel.getBySlug(categoryIdOrSlug);
    }
    
    if (!result.success || !result.result) {
      return notFoundResponse('分类不存在');
    }
    
    // 获取分类下的文章数量
    const postCountQuery = `
      SELECT COUNT(*) as count
      FROM post_categories pc
      WHERE pc.category_id = ?
    `;
    const postCountResult = await categoryModel.executeOne(postCountQuery, [result.result.id]);
    
    if (postCountResult.success) {
      result.result.post_count = postCountResult.result.count;
    } else {
      result.result.post_count = 0;
    }
    
    return successResponse(result.result, '获取分类详情成功');
  } catch (err) {
    console.error('Get category error:', err);
    return errorResponse('获取分类详情失败', 500);
  }
}

// 创建分类
async function handleCreateCategory(request, categoryModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const categoryData = await request.json();
    
    if (!categoryData.name || !categoryData.slug) {
      return errorResponse('分类名和 slug 不能为空', 400);
    }
    
    const result = await categoryModel.createCategory(categoryData);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.category, '创建分类成功');
  } catch (err) {
    console.error('Create category error:', err);
    return errorResponse('创建分类失败', 500);
  }
}

// 更新分类
async function handleUpdateCategory(request, categoryId, categoryModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    const categoryData = await request.json();
    
    // 如果更新名称但没有提供 slug，根据新名称生成 slug
    if (categoryData.name && !categoryData.slug) {
      categoryData.slug = await categoryModel.generateUniqueSlug(categoryData.name);
    }
    
    const result = await categoryModel.updateCategory(categoryId, categoryData);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(result.category, '更新分类成功');
  } catch (err) {
    console.error('Update category error:', err);
    return errorResponse('更新分类失败', 500);
  }
}

// 删除分类
async function handleDeleteCategory(request, categoryId, categoryModel) {
  if (!request.user || request.user.role !== 'admin') {
    return unauthorizedResponse('需要管理员权限');
  }
  
  try {
    // 检查分类下是否有文章
    const postCountQuery = `
      SELECT COUNT(*) as count
      FROM post_categories pc
      WHERE pc.category_id = ?
    `;
    const postCountResult = await categoryModel.executeOne(postCountQuery, [categoryId]);
    
    if (postCountResult.success && postCountResult.result.count > 0) {
      return errorResponse('该分类下还有文章，无法删除', 400);
    }
    
    const result = await categoryModel.deleteCategory(categoryId);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    return successResponse(null, '删除分类成功');
  } catch (err) {
    console.error('Delete category error:', err);
    return errorResponse('删除分类失败', 500);
  }
}