/**
 * SINGLE SOURCE OF TRUTH for OneStopHub's indexable, code-defined URL tree.
 *
 * Why this file exists: the Tyashin platform serves `/sitemap.xml` as a
 * sitemap-INDEX and has NO knowledge of this site's Next.js `app/` route tree,
 * so code-defined pages are missing from discovery until the site publishes its
 * own page sitemap. This module enumerates every STATIC, indexable page the
 * site actually serves. `src/app/sitemap-pages.xml/route.ts` renders it as XML.
 *
 * SCOPE — what belongs here:
 *  - Static marketing / code pages (`page.tsx` with no dynamic segment) that are
 *    indexable, INCLUDING the real list/index pages `/products` and `/blog`.
 *
 * EXCLUDED on purpose (do NOT add them here):
 *  - `/products/[slug]` (product detail) and `/category/[slug]` (category
 *    detail) — these are e-commerce CATALOG data sourced from the Tyashin API at
 *    build/runtime. They belong in the platform's own `/sitemap-content.xml`,
 *    not this code-page sitemap.
 *  - `/blog/[slug]` — blog POSTS are platform-owned content; the `/blog` index
 *    IS included, the individual posts are covered by `/sitemap-content.xml`.
 *  - `/c/[slug]` — a `permanentRedirect` alias to `/category/[slug]`, not a page.
 *  - `/cart`, `/checkout` — transactional utility pages with no canonical
 *    metadata; not indexable marketing content.
 *  - utility routes (`/api/*`, `robots.txt`, this sitemap route itself).
 *
 * Do NOT create `app/sitemap.ts` (path `/sitemap.xml`) — the platform owns that
 * path and index-references this one.
 */

export type ChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export interface SiteRoute {
  /** Root-relative path, always starting with `/`, no trailing slash (except `/`). */
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
}

/**
 * Every STATIC indexable page in `src/app/**\/page.tsx`.
 * Keep in lockstep with the app tree: a `page.tsx` that renders an indexable
 * marketing/code page and is missing here is the exact bug this file fixes.
 */
const STATIC_ROUTES: SiteRoute[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/products', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/return-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms-and-conditions', priority: 0.3, changeFrequency: 'yearly' },
];

/**
 * The complete, ordered list of indexable code-page paths this site emits to
 * its own page sitemap.
 */
export function getSiteRoutes(): SiteRoute[] {
  return [...STATIC_ROUTES];
}
