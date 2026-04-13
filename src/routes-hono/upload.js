/**
 * Upload Routes - Hono Version
 * File upload, listing, deletion, and serving via R2
 */

import { Hono } from 'hono';
import path from 'node:path';
import { Attachment } from '../models/Attachment.js';
import { requireAuth, requireAdmin, serverErrorResponse, errorResponse, safeParseInt } from './base.js';

const uploadRoutes = new Hono();

// Allowed MIME types (SVG removed to prevent XSS via embedded JavaScript)
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/markdown',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Allowed file extensions mapped to their expected MIME types for validation
const ALLOWED_EXTENSIONS = new Map([
  ['jpg',  'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png',  'image/png'],
  ['gif',  'image/gif'],
  ['webp', 'image/webp'],
  ['pdf',  'application/pdf'],
  ['txt',  'text/plain'],
  ['md',   'text/markdown'],
  ['zip',  'application/zip'],
  ['doc',  'application/msword'],
  ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
]);

// Magic byte signatures (first few bytes) for common file types
const MAGIC_BYTES = [
  { bytes: [0xFF, 0xD8, 0xFF],                     ext: 'jpg'   },
  { bytes: [0x89, 0x50, 0x4E, 0x47],               ext: 'png'   },
  { bytes: [0x47, 0x49, 0x46],                     ext: 'gif'   },
  { bytes: [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50], ext: 'webp' },
  { bytes: [0x25, 0x50, 0x44, 0x46],               ext: 'pdf'   },
  { bytes: [0x50, 0x4B, 0x03, 0x04],               ext: 'zip'   }, // zip/docx share this signature
  { bytes: [0xD0, 0xCF, 0x11, 0xE0],               ext: 'doc'   },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed download prefixes — file serving is restricted to these R2 prefixes
const ALLOWED_SERVE_PREFIXES = ['images/'];

/**
 * Validate file magic bytes against the claimed extension.
 * Returns the detected extension string, or null if no match / unrecognized.
 */
function detectExtensionFromMagicBytes(buffer) {
  const bytes = new Uint8Array(buffer);
  for (const sig of MAGIC_BYTES) {
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (sig.bytes[i] !== null && bytes[i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) return sig.ext;
  }
  return null;
}

// POST / - Upload file (requires login)
uploadRoutes.post('/', requireAuth, async (c) => {
  try {
    const db = c.env?.DB;
    const bucket = c.env?.BUCKET;
    if (!db) return c.json(serverErrorResponse('Database not available').json(), 500);
    if (!bucket) return c.json(serverErrorResponse('Storage not configured').json(), 500);

    // Early rejection by Content-Length header before parsing the body
    const contentLength = parseInt(c.req.header('content-length') || '0', 10);
    if (contentLength > MAX_FILE_SIZE) {
      return c.json(errorResponse('File too large. Maximum size: 10MB').json(), 413);
    }

    const formData = await c.req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return c.json(errorResponse('No file provided').json(), 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return c.json(errorResponse('File too large. Maximum size: 10MB').json(), 400);
    }

    if (file.size === 0) {
      return c.json(errorResponse('Empty file').json(), 400);
    }

    // --- File type validation (layered) ---

    // 1. Client Content-Type must be in allow-list
    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json(errorResponse('File type not allowed: ' + file.type).json(), 400);
    }

    // 2. Derive extension from the original filename and validate it against allow-list
    const rawName = file.name || '';
    const rawBaseName = rawName.replace(/\.[^.]*$/, '') || 'unnamed';
    const rawExt = (rawName.includes('.')) ? rawName.split('.').pop().toLowerCase() : '';

    if (!rawExt || !ALLOWED_EXTENSIONS.has(rawExt)) {
      return c.json(errorResponse('File extension not allowed: .' + rawExt).json(), 400);
    }

    // 3. Ensure the claimed extension is consistent with the claimed MIME type
    const expectedMime = ALLOWED_EXTENSIONS.get(rawExt);
    if (expectedMime && file.type !== expectedMime) {
      return c.json(errorResponse('File extension .' + rawExt + ' does not match Content-Type ' + file.type).json(), 400);
    }

    // 4. Magic-byte validation — read the first bytes and verify against claimed extension
    const arrayBuffer = await file.arrayBuffer();
    const detectedExt = detectExtensionFromMagicBytes(arrayBuffer);

    if (detectedExt && detectedExt !== rawExt) {
      // If we could detect a type but it doesn't match the claimed extension, reject.
      // Special case: both 'zip' and 'docx' share the same ZIP signature; allow zip sig for docx.
      if (!(rawExt === 'docx' && detectedExt === 'zip')) {
        return c.json(errorResponse('File content does not match the claimed extension (.'
          + rawExt + '). Detected: .' + detectedExt).json(), 400);
      }
    }

    // Hexo-compatible path: images/{YYYY}/{MM}/{sanitized-filename}
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sanitized = rawBaseName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-') || 'file';
    const baseName = path.basename(sanitized, '.' + rawExt) || 'file';

    // Double-check storage key doesn't contain traversal
    const safeBaseName = path.basename(baseName + '.' + rawExt);

    // Check for duplicate and append suffix if needed
    let storageKey = `images/${year}/${month}/${safeBaseName}`;
    let attempt = 0;
    while (await bucket.head(storageKey)) {
      attempt++;
      storageKey = `images/${year}/${month}/${baseName}-${attempt}.${rawExt}`;
    }

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
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
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

    const id = safeParseInt(c.req.param('id'));
    if (id === null) {
      return c.json(errorResponse('Invalid attachment ID').json(), 400);
    }
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

    const urlPath = new URL(c.req.url).pathname;
    const key = urlPath.replace(/^.*\/api\/upload\/file\//, '');
    if (!key) return c.json(errorResponse('File key is required').json(), 400);

    // --- Path traversal protection ---
    // Normalize and reject any key that attempts directory traversal
    // or escapes the allowed prefix namespace.
    const normalizedKey = path.posix.normalize(key);
    // path.posix.normalize resolves '..' segments; reject if result escapes allowed prefixes
    if (normalizedKey.startsWith('..') || normalizedKey.startsWith('/')) {
      return c.json(errorResponse('Invalid file key').json(), 400);
    }
    // Ensure the key falls under one of the allowed serve prefixes
    const prefixOk = ALLOWED_SERVE_PREFIXES.some(prefix => normalizedKey.startsWith(prefix));
    if (!prefixOk) {
      return c.json(errorResponse('Invalid file key').json(), 400);
    }

    const object = await bucket.get(normalizedKey);
    if (!object) return c.json({ success: false, message: 'File not found' }, 404);

    const headers = new Headers();
    const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (object.httpEtag) headers.set('ETag', object.httpEtag);

    // Set Content-Disposition: attachment for non-image types to prevent
    // inline rendering of potentially dangerous content (e.g. PDF, text)
    if (!contentType.startsWith('image/')) {
      const filename = normalizedKey.split('/').pop();
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    }

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Serve file error:', error);
    return c.json(serverErrorResponse('Failed to serve file').json(), 500);
  }
});

export { uploadRoutes };