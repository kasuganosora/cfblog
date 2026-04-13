/**
 * Authentication Utilities
 * SessionID generation and validation
 * Using Web Crypto API for Cloudflare Workers compatibility
 */

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses crypto.subtle.timingSafeEqual when available (Cloudflare Workers, modern browsers),
 * falls back to a manual byte-by-byte XOR comparison.
 *
 * Note: Early return on differing lengths is acceptable here because the length
 * of an HMAC hex digest is deterministic (always 64 chars for SHA-256), so an
 * attacker cannot learn secret bytes from length-check timing alone.
 */
const timingSafeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;

  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  if (typeof crypto.subtle.timingSafeEqual === 'function') {
    try {
      return crypto.subtle.timingSafeEqual(bufA, bufB);
    } catch (_e) {
      // Fall through to manual comparison if the native call fails
    }
  }

  // Manual constant-time fallback (byte-by-byte XOR, independent of value)
  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
};

/**
 * Helper: Convert ArrayBuffer to hex string
 */
const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Helper: Convert hex string to Uint8Array
 * Throws if the input is not a valid even-length hex string.
 */
const hexToBuffer = (hex) => {
  if (typeof hex !== 'string') {
    throw new TypeError(`hexToBuffer: expected a string, got ${typeof hex}`);
  }
  if (hex.length % 2 !== 0) {
    throw new Error(`hexToBuffer: invalid hex string — odd length (${hex.length})`);
  }
  if (hex.length === 0) {
    return new Uint8Array(0);
  }
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(`hexToBuffer: invalid hex string — contains non-hex characters`);
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

/**
 * Generate HMAC-SHA256 signature
 */
async function hmacSha256(message, secret) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
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
 * Format: userId:timestamp:random:HMAC-SHA256
 */
export const generateSessionId = async (userId, secret) => {
  const timestamp = Date.now();
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const random = bufferToHex(randomBytes).substring(0, 16);
  const data = `${userId}:${timestamp}:${random}`;
  const signature = await hmacSha256(data, secret);

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
    const expectedSignature = await hmacSha256(data, secret);

    if (!timingSafeEqual(signature, expectedSignature)) {
      return false;
    }

    const sessionTime = parseInt(timestamp);
    if (isNaN(sessionTime)) {
      return false;
    }
    const currentTime = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (currentTime - sessionTime > maxAge) {
      return false;
    }

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return false;
    }

    return {
      userId: parsedUserId,
      timestamp: sessionTime
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

/**
 * PBKDF2 password hashing configuration
 */
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16; // 128 bits

/**
 * Hash password using PBKDF2-SHA256 with random salt
 * Format: pbkdf2:iterations:salt_hex:hash_hex
 */
export const hashPassword = async (password, iterations) => {
  if (iterations === undefined) {
    iterations = PBKDF2_ITERATIONS;
  }
  if (!Number.isFinite(iterations) || iterations < 1 || iterations !== Math.floor(iterations)) {
    throw new RangeError('hashPassword: iterations must be a positive integer');
  }

  const encoder = new TextEncoder();
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8
  );

  return `pbkdf2:${iterations}:${bufferToHex(salt)}:${bufferToHex(derivedBits)}`;
};

/**
 * Verify password against PBKDF2 hash
 */
export const verifyPassword = async (password, storedHash) => {
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    return false;
  }

  const [, iterationsStr, saltHex, expectedHashHex] = parts;
  const iterations = parseInt(iterationsStr);
  if (!Number.isFinite(iterations) || iterations < 1 || iterations !== Math.floor(iterations)) {
    return false;
  }
  const salt = hexToBuffer(saltHex);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8
  );

  return timingSafeEqual(bufferToHex(derivedBits), expectedHashHex);
};

/**
 * Generate random token
 */
export const generateToken = async (length = 32) => {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return bufferToHex(buffer);
};

/**
 * Extract the value of the "session" cookie from a Cookie header string.
 *
 * The regex uses (?:^|;\s*) to anchor "session=" to either the start of the
 * header or after a semicolon, preventing prefix-collision matches where a
 * cookie such as "prefixsession=..." would also be captured.
 */
export const getSessionCookie = (cookieHeader) => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null;
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]*)/);
  return match ? match[1] : null;
};

/**
 * Determine the client's IP address from request headers.
 *
 * SECURITY WARNING — X-Forwarded-For can be trivially spoofed by clients.
 * An attacker can set any value in this header before it reaches your server.
 * Only trust X-Forwarded-For when you are behind a **known, trusted reverse
 * proxy** that overwrites (rather than appends to) the header.  In all other
 * cases the value is unreliable.
 *
 * When running on Cloudflare Workers, prefer CF-Connecting-IP, which is set
 * by the Cloudflare edge and cannot be forged by the client.
 */
export const getClientIp = (headers) => {
  // CF-Connecting-IP — set by Cloudflare edge; not spoofable by the client.
  const cfIp = headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp.trim();

  // X-Forwarded-For — only trust if you are behind a known proxy.
  // SECURITY: Untrusted clients can inject arbitrary values here.
  const xff = headers.get('X-Forwarded-For');
  if (xff) {
    // Convention: rightmost untrusted-to-trusted; leftmost is the original client.
    // If behind a single trusted proxy the leftmost entry is the client IP.
    return xff.split(',')[0]?.trim() || '0.0.0.0';
  }

  return '0.0.0.0';
};
