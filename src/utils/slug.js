/**
 * Slug Utilities
 * Generate URL-friendly slugs with Chinese pinyin support
 */

import { toPinyin } from './pinyin-data.js';

const MAX_SLUG_LEN = 64;
const TRUNCATE_AT = 48;

function randomSuffix(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/**
 * Generate slug from text (Chinese converted to pinyin, max 64 chars)
 */
export const generateSlug = (text) => {
  let slug = toPinyin(text)
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')          // Replace multiple - with single -
    .replace(/^-+/, '')               // Trim - from start
    .replace(/-+$/, '');              // Trim - from end

  if (slug.length > MAX_SLUG_LEN) {
    slug = slug.slice(0, TRUNCATE_AT).replace(/-+$/, '') + '-' + randomSuffix(8);
  }

  return slug;
};

/**
 * Generate unique slug
 */
export const generateUniqueSlug = async (text, checkFn, suffix = '') => {
  let slug = generateSlug(text + suffix);
  let counter = 1;

  while (await checkFn(slug)) {
    slug = generateSlug(`${text}-${counter}`);
    counter++;
  }

  return slug;
};
