/**
 * Slug Utilities
 * Generate URL-friendly slugs with Chinese pinyin support
 */

import { toPinyin } from './pinyin-data.js';

/**
 * Generate slug from text (Chinese converted to pinyin)
 */
export const generateSlug = (text) => {
  return toPinyin(text)
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')          // Replace multiple - with single -
    .replace(/^-+/, '')               // Trim - from start
    .replace(/-+$/, '');              // Trim - from end
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
