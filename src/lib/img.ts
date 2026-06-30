/**
 * Responsive image delivery against Tyashin's optimizing media endpoint.
 *
 * Catalog images are served from `…/api/v1/public/media/*`, which (when the
 * project has Image Optimization enabled) resizes + re-encodes to AVIF/WebP on
 * the fly from the `?w=`, `?q=`, `?f=` params and the request `Accept`/Save-Data
 * headers. So to ship device-appropriate images we just point `srcSet` at a few
 * `?w=` variants of the SAME URL and let the browser pick.
 *
 * SAFE BY DESIGN: only OUR media URLs are decorated — any external/other URL is
 * returned untouched. If optimization is off, the endpoint ignores the params
 * and serves the original, so images never break.
 */

const CARD_WIDTHS = [200, 300, 400, 600] as const;

function isMediaUrl(url: string): boolean {
  return /\/api\/v1\/public\/media\//.test(url);
}

/** Decorate a media URL with a target width (+ auto format). No-op otherwise. */
export function optimizedSrc(url: string, width: number, quality?: number): string {
  if (!url || !isMediaUrl(url)) return url;
  const [path, q] = url.split('?');
  const params = new URLSearchParams(q || '');
  params.set('w', String(Math.round(width)));
  params.set('f', 'auto');
  if (quality != null) params.set('q', String(quality));
  return `${path}?${params.toString()}`;
}

/** Build a width-descriptor `srcSet`; '' for non-media URLs (so the caller skips it). */
export function imgSrcSet(url: string, widths: readonly number[] = CARD_WIDTHS): string {
  if (!url || !isMediaUrl(url)) return '';
  return widths.map((w) => `${optimizedSrc(url, w)} ${w}w`).join(', ');
}

/** Default `sizes` for a product card in the responsive grid. */
export const PRODUCT_CARD_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';
