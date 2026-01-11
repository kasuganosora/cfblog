import { successResponse, errorResponse } from '../utils/response.js';
import { Post } from '../models/Post.js';
import { Category } from '../models/Category.js';
import { Tag } from '../models/Tag.js';
import { User } from '../models/User.js';

// 处理搜索路由
export async function handleSearchRoutes(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  const env = request.env;
  const postModel = new Post(env);
  const categoryModel = new Category(env);
  const tagModel = new Tag(env);
  const userModel = new User(env);
  
  try {
    // 搜索文章
    if (path === '/api/search/posts' && method === 'GET') {
      return await handleSearchPosts(request, postModel);
    }
    
    // 全局搜索
    if (path === '/api/search/all' && method === 'GET') {
      return await handleGlobalSearch(request, postModel, categoryModel, tagModel, userModel);
    }
    
    // 搜索建议
    if (path === '/api/search/suggestions' && method === 'GET') {
      return await handleSearchSuggestions(request, postModel);
    }
    
    return errorResponse('未找到对应的API端点', 404);
  } catch (err) {
    console.error('Search API error:', err);
    return errorResponse('服务器内部错误', 500);
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
    const categoryId = url.searchParams.get('categoryId') ? parseInt(url.searchParams.get('categoryId')) : undefined;
    const tagId = url.searchParams.get('tagId') ? parseInt(url.searchParams.get('tagId')) : undefined;
    
    if (!keyword) {
      return errorResponse('搜索关键词不能为空', 400);
    }
    
    const options = { page, limit, status, categoryId, tagId };
    
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

// 全局搜索
async function handleGlobalSearch(request, postModel, categoryModel, tagModel, userModel) {
  try {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';
    const limit = parseInt(url.searchParams.get('limit')) || 5; // 每种类型最多返回5条结果
    
    if (!keyword) {
      return errorResponse('搜索关键词不能为空', 400);
    }
    
    const searchResults = {};
    
    // 搜索文章
    const postSearchResult = await postModel.searchPosts(keyword, { page: 1, limit, status: 1 });
    if (postSearchResult.success) {
      searchResults.posts = postSearchResult.data;
    } else {
      searchResults.posts = [];
    }
    
    // 搜索分类
    const categorySearchResult = await searchCategories(keyword, limit, categoryModel);
    if (categorySearchResult.success) {
      searchResults.categories = categorySearchResult.data;
    } else {
      searchResults.categories = [];
    }
    
    // 搜索标签
    const tagSearchResult = await searchTags(keyword, limit, tagModel);
    if (tagSearchResult.success) {
      searchResults.tags = tagSearchResult.data;
    } else {
      searchResults.tags = [];
    }
    
    // 搜索用户（仅管理员）
    if (request.user && request.user.role === 'admin') {
      const userSearchResult = await searchUsers(keyword, limit, userModel);
      if (userSearchResult.success) {
        searchResults.users = userSearchResult.data;
      } else {
        searchResults.users = [];
      }
    }
    
    return successResponse(searchResults, '全局搜索成功');
  } catch (err) {
    console.error('Global search error:', err);
    return errorResponse('全局搜索失败', 500);
  }
}

// 搜索建议
async function handleSearchSuggestions(request, postModel) {
  try {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    
    if (!keyword || keyword.length < 2) {
      return successResponse([], '搜索关键词太短');
    }
    
    // 从文章标题和摘要中获取建议
    const query = `
      SELECT DISTINCT 
        CASE 
          WHEN LENGTH(title) > 50 THEN SUBSTR(title, 1, 50) || '...'
          ELSE title
        END as suggestion,
        'post' as type,
        id as reference_id
      FROM posts
      WHERE status = 1 AND (title LIKE ? OR excerpt LIKE ?)
      ORDER BY view_count DESC, created_at DESC
      LIMIT ?
    `;
    
    const params = [`%${keyword}%`, `%${keyword}%`, limit];
    
    const result = await postModel.executeQuery(query, params);
    
    if (!result.success) {
      return errorResponse(result.message, 500);
    }
    
    return successResponse(result.results, '获取搜索建议成功');
  } catch (err) {
    console.error('Search suggestions error:', err);
    return errorResponse('获取搜索建议失败', 500);
  }
}

// 搜索分类
async function searchCategories(keyword, limit, categoryModel) {
  try {
    const query = `
      SELECT id, name, slug, description
      FROM categories
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY name ASC
      LIMIT ?
    `;
    
    const result = await categoryModel.executeQuery(query, [`%${keyword}%`, `%${keyword}%`, limit]);
    
    if (result.success) {
      // 为每个分类获取文章数量
      const categories = await Promise.all(result.results.map(async category => {
        const postCountQuery = `
          SELECT COUNT(*) as count
          FROM post_categories pc
          WHERE pc.category_id = ?
        `;
        const postCountResult = await categoryModel.executeOne(postCountQuery, [category.id]);
        
        if (postCountResult.success) {
          category.post_count = postCountResult.result.count;
        } else {
          category.post_count = 0;
        }
        
        return category;
      }));
      
      return { success: true, data: categories };
    }
    
    return result;
  } catch (err) {
    console.error('Search categories error:', err);
    return { success: false, error: err.message };
  }
}

// 搜索标签
async function searchTags(keyword, limit, tagModel) {
  try {
    const query = `
      SELECT id, name, slug, description
      FROM tags
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY name ASC
      LIMIT ?
    `;
    
    const result = await tagModel.executeQuery(query, [`%${keyword}%`, `%${keyword}%`, limit]);
    
    if (result.success) {
      // 为每个标签获取文章数量
      const tags = await Promise.all(result.results.map(async tag => {
        const postCountQuery = `
          SELECT COUNT(*) as count
          FROM post_tags pt
          WHERE pt.tag_id = ?
        `;
        const postCountResult = await tagModel.executeOne(postCountQuery, [tag.id]);
        
        if (postCountResult.success) {
          tag.post_count = postCountResult.result.count;
        } else {
          tag.post_count = 0;
        }
        
        return tag;
      }));
      
      return { success: true, data: tags };
    }
    
    return result;
  } catch (err) {
    console.error('Search tags error:', err);
    return { success: false, error: err.message };
  }
}

// 搜索用户
async function searchUsers(keyword, limit, userModel) {
  try {
    const query = `
      SELECT id, username, display_name, avatar, role, bio
      FROM users
      WHERE status = 1 AND (username LIKE ? OR display_name LIKE ?)
      ORDER BY username ASC
      LIMIT ?
    `;
    
    return await userModel.executeQuery(query, [`%${keyword}%`, `%${keyword}%`, limit]);
  } catch (err) {
    console.error('Search users error:', err);
    return { success: false, error: err.message };
  }
}