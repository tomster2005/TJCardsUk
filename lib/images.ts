/**
 * Supabase Storage Image Transformation
 *
 * Supabase Storage supports on-the-fly image resizing via query parameters
 * on public bucket URLs. No additional infrastructure is required.
 *
 * Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
 *
 * Format: <storage-url>/object/public/<bucket>/<path>?width=N&quality=N
 *
 * Rules applied here:
 *  - Only transform URLs that belong to our Supabase project storage.
 *  - Signed URLs (personal-card-images) are left untouched — the
 *    transformation API does not work with signed URLs.
 *  - Non-Supabase URLs (community uploads stored elsewhere) are returned as-is.
 *  - The original URL is always returned unchanged for the detail view.
 */

const SUPABASE_STORAGE_PREFIX =
  "https://pnouhcbgsyucsofunjor.supabase.co/storage/v1/object/public/";

function isTransformableUrl(url: string): boolean {
  return url.startsWith(SUPABASE_STORAGE_PREFIX);
}

/**
 * Returns a resized Supabase Storage URL for thumbnail use.
 * Falls back to the original URL for signed URLs or non-Supabase sources.
 *
 * @param url    Original image URL from the database
 * @param width  Target render width in CSS pixels (used as the pixel budget)
 * @param quality JPEG/WebP quality 1–100 (default 75)
 */
export function thumbUrl(
  url: string | null | undefined,
  width: number,
  quality = 75,
): string | undefined {
  if (!url) return undefined;
  if (!isTransformableUrl(url)) return url;
  // Supabase transformation params are appended as query string.
  // width is in pixels; we request 2× for HiDPI screens but cap at 400px
  // since card images are never displayed larger than ~260px even on detail.
  const px = Math.min(width * 2, 400);
  return `${url}?width=${px}&quality=${quality}`;
}
