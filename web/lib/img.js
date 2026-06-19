// Cloudinary delivery helpers. Insert on-the-fly transformations into a
// Cloudinary URL so we ship an appropriately sized image per context instead of
// the full-resolution upload. Non-Cloudinary URLs (e.g. the dev local-disk
// fallback served from the API's /uploads) are returned unchanged.

const ALREADY_TRANSFORMED = /\/upload\/[^/]*[,_][^/]+\//; // crude guard against double-applying

/**
 * Return a resized, auto-format, auto-quality variant of a Cloudinary image.
 * `width` caps the longest edge (c_limit never enlarges).
 */
export function cldThumb(url, width) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('/upload/')) return url; // not a Cloudinary delivery URL
  if (ALREADY_TRANSFORMED.test(url)) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}
