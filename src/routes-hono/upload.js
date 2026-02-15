/**
 * Upload Routes - Hono Version
 */

import { Hono } from 'hono';
import { requireAuth } from './base.js';

const uploadRoutes = new Hono();

// POST / - 上传文件（需登录）
uploadRoutes.post('/', requireAuth, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file) {
      return c.json({
        success: false,
        message: 'No file provided'
      }, 400);
    }

    // TODO: 实现文件上传逻辑
    // 需要配置R2或其他存储服务

    return c.json({
      success: true,
      message: 'Upload endpoint - to be implemented',
      data: {
        filename: file.name,
        size: file.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({
      success: false,
      message: 'Internal server error'
    }, 500);
  }
});

export { uploadRoutes };
