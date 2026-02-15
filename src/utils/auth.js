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
 * Helper: Convert hex string to Uint8Array
 */
const hexToBuffer = (hex) => {
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

    if (signature !== expectedSignature) {
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
 * PBKDF2 password hashing configuration
 */
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16; // 128 bits

/**
 * Hash password using PBKDF2-SHA256 with random salt
 * Format: pbkdf2:iterations:salt_hex:hash_hex
 */
export const hashPassword = async (password) => {
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
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8
  );

  return `pbkdf2:${PBKDF2_ITERATIONS}:${bufferToHex(salt)}:${bufferToHex(derivedBits)}`;
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

  return bufferToHex(derivedBits) === expectedHashHex;
};

/**
 * Generate random token
 */
export const generateToken = async (length = 32) => {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return bufferToHex(buffer);
};
