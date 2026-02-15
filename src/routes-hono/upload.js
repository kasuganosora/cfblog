/**
 * Upload Routes - Hono Version
 * File upload, listing, deletion, and serving via R2
 */

import { Hono } from 'hono';
import { Attachment } from '../models/Attachment.js';
import { requireAuth, requireAdmin, serverErrorResponse, errorResponse } from './base.js';

const uploadRoutes = new Hono();

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'text/plain', 'text/markdown',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// POST / - Upload file (requires login)
uploadRoutes.post('/', requireAuth, async (c) => {
  try {
    const db = c.env?.DB;
    const bucket = c.env?.BUCKET;
    if (!db) return c.json(serverErrorResponse('Database not available').json(), 500);
    if (!bucket) return c.json(serverErrorResponse('Storage not configured').json(), 500);

    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return c.json(errorResponse('No file provided').json(), 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json(errorResponse('File too large. Maximum size: 10MB').json(), 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json(errorResponse('File type not allowed: ' + file.type).json(), 400);
    }

    // Hexo-compatible path: images/{YYYY}/{MM}/{sanitized-filename}
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
    const baseName = sanitized.replace(/\.[^.]+$/, '');
    const ext = sanitized.split('.').pop() || 'bin';

    // Check for duplicate and append suffix if needed
    let storageKey = `images/${year}/${month}/${baseName}.${ext}`;
    let attempt = 0;
    while (await bucket.head(storageKey)) {
      attempt++;
      storageKey = `images/${year}/${month}/${baseName}-${attempt}.${ext}`;
    }

    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(storageKey, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    const filename = storageKey.split('/').pop();
    const attachmentModel = new Attachment(db);
    const attachment = await attachmentModel.createAttachment({
      filename,
      original_name: file.name,
      mime_type: file.type,
      file_size: file.size,
      storage_key: storageKey,
      upload_user_id: c.get('userId')
    });

    return c.json({
      success: true,
      message: 'File uploaded successfully',
      data: { ...attachment, url: `/api/upload/file/${storageKey}` }
    }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return c.json(serverErrorResponse('Upload failed').json(), 500);
  }
});

// GET /list - List attachments (admin only)
uploadRoutes.get('/list', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    if (!db) return c.json(serverErrorResponse('Database not available').json(), 500);

    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const mime_type = url.searchParams.get('type') || undefined;

    const attachmentModel = new Attachment(db);
    const result = await attachmentModel.getAttachmentList({ page, limit, mime_type });

    result.data = result.data.map(a => ({
      ...a,
      url: `/api/upload/file/${a.storage_key}`
    }));

    return c.json(result);
  } catch (error) {
    console.error('List attachments error:', error);
    return c.json(serverErrorResponse('Internal server error').json(), 500);
  }
});

// DELETE /:id - Delete attachment (admin only)
uploadRoutes.delete('/:id', requireAdmin, async (c) => {
  try {
    const db = c.env?.DB;
    const bucket = c.env?.BUCKET;
    if (!db) return c.json(serverErrorResponse('Database not available').json(), 500);
    if (!bucket) return c.json(serverErrorResponse('Storage not configured').json(), 500);

    const id = parseInt(c.req.param('id'));
    const attachmentModel = new Attachment(db);
    const attachment = await attachmentModel.deleteAttachment(id);

    await bucket.delete(attachment.storage_key);

    return c.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    const status = error.message === 'Attachment not found' ? 404 : 500;
    return c.json(errorResponse(error.message).json(), status);
  }
});

// GET /file/* - Serve file from R2 (public)
uploadRoutes.get('/file/*', async (c) => {
  try {
    const bucket = c.env?.BUCKET;
    if (!bucket) return c.json(serverErrorResponse('Storage not configured').json(), 500);

    const path = new URL(c.req.url).pathname;
    const key = path.replace(/^.*\/api\/upload\/file\//, '');
    if (!key) return c.json(errorResponse('File key is required').json(), 400);

    const object = await bucket.get(key);
    if (!object) return c.json({ success: false, message: 'File not found' }, 404);

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (object.httpEtag) headers.set('ETag', object.httpEtag);

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Serve file error:', error);
    return c.json(serverErrorResponse('Failed to serve file').json(), 500);
  }
});

export { uploadRoutes };
