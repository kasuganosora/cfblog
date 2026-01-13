// 图片处理工具函数

/**
 * 从 HTML 内容中提取第一张图片的 URL
 * @param {string} htmlContent - HTML 内容
 * @returns {string|null} - 图片 URL 或 null
 */
export function extractFeaturedImage(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return null;
  }
  
  // 匹配 img 标签的正则表达式
  const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/i;
  const match = htmlContent.match(imgRegex);
  
  if (match && match[1]) {
    const imageUrl = match[1];
    
    // 验证图片 URL 格式
    if (isValidImageUrl(imageUrl)) {
      return imageUrl;
    }
  }
  
  return null;
}

/**
 * 验证是否为有效的图片 URL
 * @param {string} url - 图片 URL
 * @returns {boolean} - 是否有效
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // 检查是否为有效的 URL 格式
  try {
    new URL(url);
  } catch {
    // 如果不是完整 URL，检查是否为相对路径
    if (!url.startsWith('/') && !url.startsWith('./') && !url.startsWith('../')) {
      return false;
    }
  }
  
  // 检查文件扩展名
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const urlLower = url.toLowerCase();
  
  return imageExtensions.some(ext => urlLower.includes(ext));
}

/**
 * 为文章列表添加题图信息
 * @param {Array} posts - 文章列表
 * @returns {Array} - 添加了题图信息的文章列表
 */
export function addFeaturedImagesToPosts(posts) {
  if (!Array.isArray(posts)) {
    return posts;
  }
  
  return posts.map(post => {
    if (post.content) {
      const featuredImage = extractFeaturedImage(post.content);
      return {
        ...post,
        featuredImage
      };
    }
    return post;
  });
}

/**
 * 为单篇文章添加题图信息
 * @param {Object} post - 文章对象
 * @returns {Object} - 添加了题图信息的文章对象
 */
export function addFeaturedImageToPost(post) {
  if (!post || typeof post !== 'object') {
    return post;
  }
  
  if (post.content) {
    const featuredImage = extractFeaturedImage(post.content);
    return {
      ...post,
      featuredImage
    };
  }
  
  return post;
}

/**
 * 生成图片的 alt 文本
 * @param {string} title - 文章标题
 * @param {string} imageUrl - 图片 URL
 * @returns {string} - alt 文本
 */
export function generateImageAlt(title, imageUrl) {
  if (title) {
    return title;
  }
  
  if (imageUrl) {
    // 从 URL 中提取文件名作为 alt
    const filename = imageUrl.split('/').pop().split('.')[0];
    return filename.replace(/[-_]/g, ' ');
  }
  
  return '文章配图';
}

/**
 * 优化图片 URL（添加参数等）
 * @param {string} imageUrl - 原始图片 URL
 * @param {Object} options - 优化选项
 * @returns {string} - 优化后的图片 URL
 */
export function optimizeImageUrl(imageUrl, options = {}) {
  if (!imageUrl) {
    return imageUrl;
  }
  
  const { width, height, quality = 80, format } = options;
  
  try {
    const url = new URL(imageUrl);
    
    // 如果是 Cloudflare Images 或其他支持参数的服务
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    if (quality !== 80) url.searchParams.set('q', quality.toString());
    if (format) url.searchParams.set('f', format);
    
    return url.toString();
  } catch {
    // 如果不是完整 URL，直接返回
    return imageUrl;
  }
}