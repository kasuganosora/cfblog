/**
 * Authentication Utilities
 * SessionID generation and validation
 * Using Web Crypto API for Cloudflare Workers compatibility
 */

/**
 * Helper: Convert ArrayBuffer to hex string
 */
const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Helper: Generate HMAC-SHA1 signature using Web Crypto API
 */
async function hmacSha1(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );

  return bufferToHex(signature);
}

/**
 * Generate SessionID
 * Format: userId:timestamp:random:HMAC
 */
export const generateSessionId = async (userId, secret) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const data = `${userId}:${timestamp}:${random}`;
  const signature = await hmacSha1(data, secret);

  return `${data}:${signature}`;
};

/**
 * Validate SessionID
 */
export const validateSessionId = async (sessionId, secret) => {
  try {
    const parts = sessionId.split(':');
    if (parts.length !== 4) {
      return false;
    }

    const [userId, timestamp, random, signature] = parts;
    const data = `${userId}:${timestamp}:${random}`;
    const expectedSignature = await hmacSha1(data, secret);

    if (signature !== expectedSignature) {
      return false;
    }

    // Check timestamp (7 days validity)
    const sessionTime = parseInt(timestamp);
    const currentTime = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (currentTime - sessionTime > maxAge) {
      return false;
    }

    return {
      userId: parseInt(userId),
      timestamp: sessionTime
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

/**
 * Hash password (SHA-256) using Web Crypto API
 */
export const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
};

/**
 * Verify password
 */
export const verifyPassword = async (password, hash) => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

/**
 * Generate random token using Web Crypto API
 */
export const generateToken = async (length = 32) => {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return bufferToHex(buffer);
};
