/**
 * Return a stable identity URL for checkpointing and deduplication.
 * Douyin adds changing query parameters and may expose the same work through
 * /user/self?modal_id=..., /video/..., or /note/... routes.
 */
export function canonicalizeVideoUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'douyin.com') {
      const direct = url.pathname.match(/^\/(video|note)\/(\d+)/);
      if (direct) return `https://www.douyin.com/${direct[1]}/${direct[2]}`;
      const modalId = url.searchParams.get('modal_id');
      if (modalId && /^\d+$/.test(modalId)) {
        return `https://www.douyin.com/video/${modalId}`;
      }
    }
    url.hash = '';
    return url.toString();
  } catch {
    return rawUrl.trim();
  }
}
