/**
 * One-time script to generate PBKDF2-SHA256 hash for admin initial password.
 * Usage: node scripts/gen-admin-hash.js [password]
 * Default password: Admin@2026!
 */
const { webcrypto } = require('crypto');
const crypto = webcrypto;

const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password) {
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
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8
  );

  return `pbkdf2:${ITERATIONS}:${bufferToHex(salt)}:${bufferToHex(derivedBits)}`;
}

const password = process.argv[2] || 'Admin@2026!';
hashPassword(password).then(hash => {
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
});
