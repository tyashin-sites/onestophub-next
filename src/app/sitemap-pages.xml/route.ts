import { getSiteRoutes } from '@/lib/site-routes';
import { siteUrl } from '@/lib/seo';

/**
 * /sitemap-pages.xml — the SITE'S OWN code-page sitemap.
 *
 * The Tyashin platform intercepts `/sitemap.xml` and serves it as a
 * sitemap-INDEX that references THIS file the moment the site publishes it.
 * This route is NOT in the platform registry, so it dispatches straight to the
 * site Worker (good). It lists every indexable, code-defined page the site
 * serves, sourced from `getSiteRoutes()`.
 *
 * It deliberately does NOT include catalog detail URLs (`/products/[slug]`,
 * `/category/[slug]`) or blog POSTS (`/blog/[slug]`): those are platform-owned
 * data and belong in the platform's own `/sitemap-content.xml`.
 *
 * ORIGIN = `siteUrl('/')` — the SAME helper `lib/seo.ts` uses to build every
 * page's `<link rel=canonical>` / Open Graph URL. The sitemap MUST list the
 * exact canonical URL of each page, so it shares ONE origin source with the
 * canonicals; deriving it independently (e.g. from the request Host) risks a
 * sitemap-vs-canonical host mismatch that makes Google drop the URLs. We do NOT
 * read the request Host: OpenNext strips `x-forwarded-host` before the handler,
 * and the raw dispatch Host is the workers.dev target — neither is canonical.
 * Build-time constant → the route can be static.
 */
export const dynamic = 'force-static';

// Normalise to a bare origin (no trailing slash) so `${ORIGIN}${path}` is clean.
const ORIGIN = siteUrl('/').replace(/\/+$/, '');

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function GET(): Response {
  const lastmod = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (build date)

  const urls = getSiteRoutes()
    .map((route) => {
      const loc = escapeXml(`${ORIGIN}${route.path}`);
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${route.changeFrequency}</changefreq>`,
        `    <priority>${route.priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
