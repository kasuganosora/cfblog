// 从 KV 获取缓存
export async function getCache(env, key) {
  try {
    const value = await env.CACHE.get(key);
    
    if (value === null) {
      return {
        success: false,
        exists: false
      };
    }
    
    // 尝试解析为 JSON，如果失败则返回原始字符串
    let data;
    try {
      data = JSON.parse(value);
    } catch (e) {
      data = value;
    }
    
    return {
      success: true,
      exists: true,
      data
    };
  } catch (error) {
    console.error('KV get error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 设置 KV 缓存
export async function setCache(env, key, value, expirationTtl = null) {
  try {
    let stringValue;
    
    // 如果是对象，转换为 JSON 字符串
    if (typeof value === 'object') {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = value.toString();
    }
    
    const options = {};
    if (expirationTtl) {
      options.expirationTtl = expirationTtl;
    }
    
    await env.CACHE.put(key, stringValue, options);
    
    return {
      success: true,
      message: '缓存设置成功'
    };
  } catch (error) {
    console.error('KV put error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 删除 KV 缓存
export async function deleteCache(env, key) {
  try {
    await env.CACHE.delete(key);
    
    return {
      success: true,
      message: '缓存删除成功'
    };
  } catch (error) {
    console.error('KV delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 批量获取缓存
export async function getMultipleCache(env, keys) {
  try {
    const results = await env.CACHE.get(keys);
    
    const processedResults = {};
    
    keys.forEach((key, index) => {
      const value = results[index];
      
      if (value === null) {
        processedResults[key] = {
          exists: false
        };
      } else {
        // 尝试解析为 JSON
        try {
          processedResults[key] = {
            exists: true,
            data: JSON.parse(value)
          };
        } catch (e) {
          processedResults[key] = {
            exists: true,
            data: value
          };
        }
      }
    });
    
    return {
      success: true,
      results: processedResults
    };
  } catch (error) {
    console.error('KV get multiple error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 生成缓存键
export function generateCacheKey(prefix, identifier) {
  return `${prefix}:${identifier}`;
}

// 缓存装饰器函数
export function withCache(cacheKeyPrefix, expirationTtl = 3600) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const env = args[0]; // 假设第一个参数是 env
      const cacheKey = generateCacheKey(cacheKeyPrefix, JSON.stringify(args.slice(1)));
      
      // 尝试从缓存获取
      const cached = await getCache(env, cacheKey);
      if (cached.success && cached.exists) {
        return cached.data;
      }
      
      // 执行原始方法
      const result = await originalMethod.apply(this, args);
      
      // 将结果存入缓存
      if (result && result.success !== false) {
        await setCache(env, cacheKey, result, expirationTtl);
      }
      
      return result;
    };
    
    return descriptor;
  };
}