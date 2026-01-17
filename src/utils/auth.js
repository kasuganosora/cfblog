/**
 * Authentication Utilities
 * SessionID generation and validation
 */

import { createHmac } from 'node:crypto';

/**
 * Generate SessionID
 * Format: userId:timestamp:random:HMAC
 */
export const generateSessionId = (userId, secret) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const data = `${userId}:${timestamp}:${random}`;
  const signature = createHmac('sha1', secret).update(data).digest('hex');

  return `${data}:${signature}`;
};

/**
 * Validate SessionID
 */
export const validateSessionId = (sessionId, secret) => {
  try {
    const parts = sessionId.split(':');
    if (parts.length !== 4) {
      return false;
    }

    const [userId, timestamp, random, signature] = parts;
    const data = `${userId}:${timestamp}:${random}`;
    const expectedSignature = createHmac('sha1', secret).update(data).digest('hex');

    if (signature !== expectedSignature) {
      return false;
    }

    // Check timestamp (5 minutes validity)
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
 * Hash password (SHA-256)
 */
export const hashPassword = (password) => {
  const crypto = require('node:crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Verify password
 */
export const verifyPassword = (password, hash) => {
  const crypto = require('node:crypto');
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  return passwordHash === hash;
};

/**
 * Generate random token
 */
export const generateToken = (length = 32) => {
  const crypto = require('node:crypto');
  return crypto.randomBytes(length).toString('hex');
};
