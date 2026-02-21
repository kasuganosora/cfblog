/**
 * Shared server-side helpers for frontend views
 */

export function esc(text) {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function escJs(text) {
  if (!text) return '';
  return String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"')
    .replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/</g, '\\x3c').replace(/>/g, '\\x3e');
}

export async function getSettings(c) {
  try {
    const { getCachedSettings } = await import('../../utils/cache.js');
    return await getCachedSettings(c.env?.BUCKET, c.env?.DB);
  } catch { return {}; }
}

export async function getCurrentUser(c) {
  try {
    const sessionId = c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1];
    if (sessionId) {
      const { validateSessionId } = await import('../../utils/auth.js');
      const session = await validateSessionId(sessionId, c.env?.SESSION_SECRET);
      if (session?.userId && c.env?.DB) {
        const { User } = await import('../../models/User.js');
        const userModel = new User(c.env.DB);
        const user = await userModel.findById(session.userId);
        if (user) {
          return { id: user.id, displayName: user.display_name || user.username, email: user.email };
        }
      }
    }
  } catch {}
  return null;
}
