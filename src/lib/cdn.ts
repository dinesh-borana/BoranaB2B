/**
 * Returns a CDN-optimized image URL.
 *
 * For Cloudinary URLs: injects width + auto-format (WebP/AVIF) + auto-quality
 * transformations so the browser downloads the correct size instead of the
 * full-resolution original. A 3 MB JPEG becomes ~30–80 KB WebP at display size.
 *
 * For any other host (Supabase, S3, etc.) the URL is returned unchanged.
 *
 * @param url   - Original image URL (may be null/undefined)
 * @param width - Target display width in CSS pixels (multiply by 2 for retina)
 */
export function cdnImg(url: string | null | undefined, width: number): string {
  if (!url) return "";

  if (url.includes("res.cloudinary.com")) {
    if (url.includes("/upload/w_") || url.includes("/upload/f_") || url.includes("/upload/q_")) {
      return url; // already transformed
    }
    // q_90: explicit high quality (q_auto picks too low on mobile)
    // f_auto: WebP/AVIF where browser supports it
    return url.replace("/upload/", `/upload/w_${width},f_auto,q_90/`);
  }

  return url;
}
