// 上传文件到 R2
export async function uploadFile(env, key, data, contentType = 'application/octet-stream') {
  try {
    const object = await env.BLOG_STORAGE.put(key, data, {
      httpMetadata: {
        contentType,
      },
    });
    
    return {
      success: true,
      key: object.key,
      etag: object.etag,
      size: object.size
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 从 R2 获取文件
export async function getFile(env, key) {
  try {
    const object = await env.BLOG_STORAGE.get(key);
    
    if (!object) {
      return {
        success: false,
        error: '文件不存在'
      };
    }
    
    return {
      success: true,
      data: object.body,
      contentType: object.httpMetadata.contentType,
      size: object.size,
      etag: object.etag
    };
  } catch (error) {
    console.error('R2 get error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 删除 R2 中的文件
export async function deleteFile(env, key) {
  try {
    await env.BLOG_STORAGE.delete(key);
    
    return {
      success: true,
      message: '文件删除成功'
    };
  } catch (error) {
    console.error('R2 delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 列出 R2 中的文件
export async function listFiles(env, prefix = '', limit = 1000) {
  try {
    const result = await env.BLOG_STORAGE.list({
      prefix,
      limit
    });
    
    return {
      success: true,
      objects: result.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        etag: obj.etag,
        lastModified: obj.uploaded
      })),
      truncated: result.truncated,
      cursor: result.cursor
    };
  } catch (error) {
    console.error('R2 list error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 生成唯一文件键
export function generateFileKey(originalName, folder = '') {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.includes('.') 
    ? '.' + originalName.split('.').pop() 
    : '';
  
  const fileName = `${timestamp}-${randomStr}${extension}`;
  
  return folder 
    ? `${folder}/${fileName}` 
    : fileName;
}