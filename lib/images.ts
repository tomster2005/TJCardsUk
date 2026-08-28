const SUPABASE_STORAGE_PREFIX =
  "https://pnouhcbgsyucsofunjor.supabase.co/storage/v1/object/public/";

const R2_PUBLIC_PREFIX =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "https://pub-938bfbdd04af44fab33822083b71fb2a.r2.dev";

function isSupabaseUrl(url: string): boolean {
  return url.startsWith(SUPABASE_STORAGE_PREFIX);
}

/**
 * Returns a display URL for an image.
 * - Supabase public URLs: resized via Supabase transformation API
 * - R2 URLs: returned as-is (R2 serves via Cloudflare CDN, no resize needed)
 * - Signed URLs / anything else: returned as-is
 */
export function thumbUrl(
  url: string | null | undefined,
  width: number,
  quality = 75,
): string | undefined {
  if (!url) return undefined;
  if (isSupabaseUrl(url)) {
    const px = Math.min(width * 2, 400);
    return `${url}?width=${px}&quality=${quality}`;
  }
  return url;
}
