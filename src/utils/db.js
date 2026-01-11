// 执行查询并处理结果
export async function executeQuery(env, query, params = []) {
  try {
    const stmt = env.DB.prepare(query);
    
    let result;
    if (params.length > 0) {
      result = await stmt.bind(...params).all();
    } else {
      result = await stmt.all();
    }
    
    return {
      success: true,
      results: result.results || []
    };
  } catch (error) {
    console.error('Database query error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 执行单行查询
export async function executeOne(env, query, params = []) {
  try {
    const stmt = env.DB.prepare(query);
    
    let result;
    if (params.length > 0) {
      result = await stmt.bind(...params).first();
    } else {
      result = await stmt.first();
    }
    
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error('Database query error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 执行插入/更新/删除操作
export async function executeRun(env, query, params = []) {
  try {
    const stmt = env.DB.prepare(query);
    
    let result;
    if (params.length > 0) {
      result = await stmt.bind(...params).run();
    } else {
      result = await stmt.run();
    }
    
    return {
      success: true,
      meta: {
        changes: result.changes || 0,
        lastRowId: result.meta?.last_row_id || null
      }
    };
  } catch (error) {
    console.error('Database run error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 分页查询辅助函数
export function paginate(query, page = 1, limit = 10) {
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

// 计算总页数
export function getTotalPages(total, limit) {
  return Math.ceil(total / limit);
}