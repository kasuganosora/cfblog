/**
 * Slug Utilities
 * Generate URL-friendly slugs
 */

/**
 * Generate slug from text
 */
export const generateSlug = (text) => {
  return text
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
