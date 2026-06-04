/**
 * Extracts the Google Drive file ID from any Drive URL format.
 * Returns null if not a Drive URL.
 */
function extractDriveFileId(url: string): string | null {
  // https://drive.google.com/file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  // https://drive.google.com/uc?export=view&id=FILE_ID
  const queryMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch) return queryMatch[1];

  // https://drive.google.com/thumbnail?id=FILE_ID
  const thumbMatch = url.match(/thumbnail\?.*id=([a-zA-Z0-9_-]+)/);
  if (thumbMatch) return thumbMatch[1];

  return null;
}

/**
 * Returns a CDN-optimized image URL.
 *
 * Handles:
 * - Google Drive sharing links → converted to direct thumbnail URL
 * - Cloudinary URLs → injects width + auto-format + auto-quality transforms
 * - Any other URL → returned unchanged
 */
export function cdnImg(url: string | null | undefined, width: number): string {
  if (!url) return "";

  // Google Drive: proxy through our server to avoid CORS/auth redirect issues
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    const fileId = extractDriveFileId(url);
    if (fileId) {
      const driveUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
      return `/api/img-proxy?url=${encodeURIComponent(driveUrl)}`;
    }
  }

  // Cloudinary: inject width + format + quality transforms
  if (url.includes("res.cloudinary.com")) {
    if (url.includes("/upload/w_") || url.includes("/upload/f_") || url.includes("/upload/q_")) {
      return url; // already transformed
    }
    return url.replace("/upload/", `/upload/w_${width},f_auto,q_90/`);
  }

  return url;
}
