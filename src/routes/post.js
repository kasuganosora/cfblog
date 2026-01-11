import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '../utils/response.js';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Tag } from '../models/Tag.js';

// 处理文章路由
export async function handlePostRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  const env = request.env;
  const postModel = new Post(env);
  const categoryModel = new Category(env);
  const tagModel = new Tag(env);
  
  try {
    // 获取文章列表
    if (path === '/api/post/list' && method === 'GET') {
      return await handleGetPosts(request, postModel);
    }
    
    // 获取文章详情
    if (path.startsWith('/api/post/') && method === 'GET' && !path.includes('/list') && !path.includes('/create') && !path.includes('/update') && !path.includes('/delete') && !path.includes('/search')) {
      const postIdOrSlug = path.split('/')[3];
      return await handleGetPost(request, postIdOrSlug, postModel);
    }
    
    // 创建文章（需要认证）
    if (path === '/api/post/create' && method === 'POST') {
      return await handleCreatePost(request, postModel, categoryModel, tagModel);
    }
    
    // 更新文章（需要认证）
    if (path.startsWith('/api/post/') && path.includes('/update') && method === 'PUT') {
      const postId = path.split('/')[3];
      return await handleUpdatePost(request, postId, postModel, categoryModel, tagModel);
    }
    
    // 删除文章（需要认证）
    if (path.startsWith('/api/post/') && path.includes('/delete') && method === 'DELETE') {
      const postId = path.split('/')[3];
      return await handleDeletePost(request, postId, postModel);
    }
    
    // 搜索文章
    if (path.startsWith('/api/post/search') && method === 'GET') {
      return await handleSearchPosts(request, postModel);
    }
    
    // 设置文章分类（需要认证）
    if (path.startsWith('/api/post/') && path.includes('/categories') && method === 'PUT') {
      const postId = path.split('/')[3];
      return await handleSetPostCategories(request, postId, postModel);
    }
    
    // 设置文章标签（需要认证）
    if (path.startsWith('/api/post/') && path.includes('/tags') && method === 'PUT') {
      const postId = path.split('/')[3];
      return await handleSetPostTags(request, postId, postModel);
    }
    
    return errorResponse('未找到对应的API端点', 404);
  } catch (err) {
    console.error('Post API error:', err);
    return errorResponse('服务器内部错误', 500);
  }
}

// 获取文章列表
async function handleGetPosts(request, postModel) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status')) : 1; // 默认只获取已发布的文章
    const featured = url.searchParams.get('featured') ? parseInt(url.searchParams.get('featured')) : undefined;
    const authorId = url.searchParams.get('authorId') ? parseInt(url.searchParams.get('authorId')) : undefined;
    const categoryId = url.searchParams.get('categoryId') ? parseInt(url.searchParams.get('categoryId')) : undefined;
    const tagId = url.searchParams.get('tagId') ? parseInt(url.searchParams.get('tagId')) : undefined;
    
    const options = { page, limit, status, featured, authorId, categoryId, tagId };
    
    const result = await postModel.getPosts(options);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result, '获取文章列表成功');
  } catch (err) {
    console.error('Get posts error:', err);
    return errorResponse('获取文章列表失败', 500);
  }
}

// 获取文章详情
async function handleGetPost(request, postIdOrSlug, postModel) {
  try {
    // 判断是 ID 还是 slug
    const isId = /^\d+$/.test(postIdOrSlug);
    
    let result;
    if (isId) {
      result = await postModel.getPostById(parseInt(postIdOrSlug));
    } else {
      result = await postModel.getBySlug(postIdOrSlug);
      if (result.success && result.result) {
        // 如果是通过 slug 获取的，需要获取完整的文章信息
        result = await postModel.getPostById(result.result.id);
      }
    }
    
    if (!result.success || !result.result) {
      return notFoundResponse('文章不存在');
    }
    
    // 增加浏览量
    await postModel.incrementViewCount(result.result.id);
    
    return successResponse(result.result, '获取文章详情成功');
  } catch (err) {
    console.error('Get post error:', err);
    return errorResponse('获取文章详情失败', 500);
  }
}

// 创建文章
async function handleCreatePost(request, postModel, categoryModel, tagModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    const postData = await request.json();
    
    if (!postData.title || !postData.content) {
      return errorResponse('标题和内容不能为空', 400);
    }
    
    // 如果没有提供 slug，根据标题生成
    if (!postData.slug) {
      postData.slug = await postModel.generateUniqueSlug(postData.title);
    }
    
    const authorId = request.user.id;
    
    const result = await postModel.createPost({
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt || '',
      content: postData.content,
      authorId,
      status: postData.status || 0,
      featured: postData.featured || 0,
      commentStatus: postData.commentStatus !== undefined ? postData.commentStatus : 1
    });
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    const postId = result.post.id;
    
    // 设置文章分类
    if (postData.categoryIds && postData.categoryIds.length > 0) {
      await postModel.setPostCategories(postId, postData.categoryIds);
    }
    
    // 设置文章标签
    if (postData.tagIds && postData.tagIds.length > 0) {
      await postModel.setPostTags(postId, postData.tagIds);
    }
    
    // 重新获取完整的文章信息
    const fullPost = await postModel.getPostById(postId);
    
    return successResponse(fullPost.result, '创建文章成功');
  } catch (err) {
    console.error('Create post error:', err);
    return errorResponse('创建文章失败', 500);
  }
}

// 更新文章
async function handleUpdatePost(request, postId, postModel, categoryModel, tagModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    const postData = await request.json();
    
    // 获取原始文章信息
    const originalPost = await postModel.getById('posts', postId);
    if (!originalPost.success || !originalPost.result) {
      return notFoundResponse('文章不存在');
    }
    
    // 检查权限：只有文章作者或管理员可以修改
    if (originalPost.result.author_id !== request.user.id && request.user.role !== 'admin') {
      return errorResponse('无权限修改此文章', 403);
    }
    
    // 如果没有提供 slug 但提供了新标题，根据新标题生成 slug
    if (postData.title && !postData.slug) {
      postData.slug = await postModel.generateUniqueSlug(postData.title);
    }
    
    const result = await postModel.updatePost(parseInt(postId), postData);
    
    if (!result.success) {
      return errorResponse(result.message, 400);
    }
    
    // 设置文章分类
    if (postData.categoryIds !== undefined) {
      await postModel.setPostCategories(parseInt(postId), postData.categoryIds);
    }
    
    // 设置文章标签
    if (postData.tagIds !== undefined) {
      await postModel.setPostTags(parseInt(postId), postData.tagIds);
    }
    
    // 重新获取完整的文章信息
    const fullPost = await postModel.getPostById(parseInt(postId));
    
    return successResponse(fullPost.result, '更新文章成功');
  } catch (err) {
    console.error('Update post error:', err);
    return errorResponse('更新文章失败', 500);
  }
}

// 删除文章
async function handleDeletePost(request, postId, postModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    // 获取原始文章信息
    const originalPost = await postModel.getById('posts', postId);
    if (!originalPost.success || !originalPost.result) {
      return notFoundResponse('文章不存在');
    }
    
    // 检查权限：只有文章作者或管理员可以删除
    if (originalPost.result.author_id !== request.user.id && request.user.role !== 'admin') {
      return errorResponse('无权限删除此文章', 403);
    }
    
    const result = await postModel.deletePost(parseInt(postId));
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(null, '删除文章成功');
  } catch (err) {
    console.error('Delete post error:', err);
    return errorResponse('删除文章失败', 500);
  }
}

// 搜索文章
async function handleSearchPosts(request, postModel) {
  try {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const status = url.searchParams.get('status') ? parseInt(url.searchParams.get('status')) : 1; // 默认只搜索已发布的文章
    
    if (!keyword) {
      return errorResponse('搜索关键词不能为空', 400);
    }
    
    const options = { page, limit, status };
    
    const result = await postModel.searchPosts(keyword, options);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result, '搜索文章成功');
  } catch (err) {
    console.error('Search posts error:', err);
    return errorResponse('搜索文章失败', 500);
  }
}

// 设置文章分类
async function handleSetPostCategories(request, postId, postModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    const { categoryIds } = await request.json();
    
    if (!Array.isArray(categoryIds)) {
      return errorResponse('分类ID必须是数组', 400);
    }
    
    // 获取原始文章信息
    const originalPost = await postModel.getById('posts', postId);
    if (!originalPost.success || !originalPost.result) {
      return notFoundResponse('文章不存在');
    }
    
    // 检查权限：只有文章作者或管理员可以修改
    if (originalPost.result.author_id !== request.user.id && request.user.role !== 'admin') {
      return errorResponse('无权限修改此文章', 403);
    }
    
    const result = await postModel.setPostCategories(parseInt(postId), categoryIds);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(null, '设置文章分类成功');
  } catch (err) {
    console.error('Set post categories error:', err);
    return errorResponse('设置文章分类失败', 500);
  }
}

// 设置文章标签
async function handleSetPostTags(request, postId, postModel) {
  if (!request.user) {
    return unauthorizedResponse();
  }
  
  try {
    const { tagIds } = await request.json();
    
    if (!Array.isArray(tagIds)) {
      return errorResponse('标签ID必须是数组', 400);
    }
    
    // 获取原始文章信息
    const originalPost = await postModel.getById('posts', postId);
    if (!originalPost.success || !originalPost.result) {
      return notFoundResponse('文章不存在');
    }
    
    // 检查权限：只有文章作者或管理员可以修改
    if (originalPost.result.author_id !== request.user.id && request.user.role !== 'admin') {
      return errorResponse('无权限修改此文章', 403);
    }
    
    const result = await postModel.setPostTags(parseInt(postId), tagIds);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(null, '设置文章标签成功');
  } catch (err) {
    console.error('Set post tags error:', err);
    return errorResponse('设置文章标签失败', 500);
  }
}