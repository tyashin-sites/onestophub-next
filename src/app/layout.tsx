import type { Metadata } from 'next';
import { Playfair_Display, Nunito_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

// Self-hosted, preloaded, swap — replaces the render-blocking Google Fonts
// @import that used to sit at the top of globals.css. Exposes the CSS vars
// (--font-display / --font-body) consumed by globals.css + tailwind.config.ts.
const display = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});
const body = Nunito_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});
import LegalFooterBar from '@/components/LegalFooterBar';
import { api } from '@/lib/api';
import { SITE, siteUrl } from '@/lib/seo';
import type { StoreInfo, ApiCategory } from '@/lib/types';

/**
 * Brand kit + Tyashin runtime are intercepted by the Tyashin dispatch layer
 * BEFORE the request reaches this Worker — but only when the page is served
 * via the storefront's own origin (www.1stophub.shop or any dispatched host).
 * On those origins, `/brand-kit.css` and `/tyashin-runtime.js` return the
 * project's brand kit + runtime same-origin.
 *
 * When the Worker is accessed directly at *.workers.dev (dev / QA), these URLs
 * 404 because the dispatch interception isn't in front of the Worker. That's
 * fine — globals.css ships fallback CSS variables so the site is still themed.
 */
const ROBOTS_NOINDEX = process.env.ROBOTS_NOINDEX === 'true';

export const metadata: Metadata = {
  // metadataBase makes every relative OG/canonical URL (incl. per-page
  // pageMetadata output) resolve to an absolute https://www.<domain> URL.
  metadataBase: new URL(siteUrl('/')),
  title: { default: 'OneStopHub — Personalised Gifts & Lifestyle Products', template: '%s · OneStopHub' },
  description:
    'OneStopHub — handpicked gifts, accessories, stationery, T-shirts, and personalised hampers for every occasion. Fast delivery across India.',
  alternates: { canonical: siteUrl('/') },
  robots: ROBOTS_NOINDEX
    ? { index: false, follow: false, googleBot: { index: false, follow: false } }
    : undefined,
  openGraph: {
    title: 'OneStopHub — Personalised Gifts & Lifestyle Products',
    description: 'Handpicked gifts, accessories, stationery & personalised hampers.',
    type: 'website',
    url: siteUrl('/'),
    siteName: SITE.name,
    locale: SITE.locale,
    images: [{ url: SITE.defaultOgImage }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OneStopHub — Personalised Gifts & Lifestyle Products',
    description: 'Handpicked gifts, accessories, stationery & personalised hampers.',
    images: [SITE.defaultOgImage],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // SSR-seed store info + categories so first paint shows correct currency/tax
  // labels and the footer renders categories without a client round-trip.
  let initialStore: StoreInfo | null = null;
  let initialCategories: ApiCategory[] = [];
  try {
    const [s, c] = await Promise.all([api.getStoreInfo(), api.getCategories()]);
    initialStore = s.data;
    initialCategories = c.data ?? [];
  } catch (err) {
    console.error('[layout] seed fetch failed:', err);
  }

  return (
    // PERF: font CSS vars + inline base background on <html>/<body> so the
    // theme color paints on the very first frame (no white-flash filmstrip
    // frames that inflate mobile Speed Index). Background hex is the resolved
    // value of --background (30 33% 98%) ≈ a warm near-white cream.
    <html lang="en" className={`${display.variable} ${body.variable}`} style={{ backgroundColor: '#FBF8F5' }}>
      <head>
        {/* Brand kit is NOT linked here — the Tyashin dispatch layer INLINES it
            as a <style> on customer hosts (no render-blocking request). Adding
            a <link href="/brand-kit.css"> would re-introduce a render-blocking
            resource AND suppress the platform inline (which keys off the link's
            absence). */}
        {/* Blog RSS auto-discovery — feed itself is served by the Tyashin
            platform at /blog/rss.xml (same-origin, intercepted at dispatch
            on customer hosts; proxied to onestophub.sites.tyashin.com on
            direct workers.dev). Letting crawlers and feed readers find it
            is the cheapest distribution surface we have. */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="OneStopHub Blog"
          href="/blog/rss.xml"
        />
        <link rel="preconnect" href="https://website-api.tyashin.com" />
        {/* Playfair Display + Nunito Sans are pulled by the @import in
            globals.css — no extra <link> tags needed. */}
        <script src="/tyashin-runtime.js" defer />
      </head>
      <body
        className="bg-background text-foreground antialiased overflow-x-clip"
        style={{ backgroundColor: '#FBF8F5' }}
      >
        <Providers initialStore={initialStore} initialCategories={initialCategories}>
          {children}
          <LegalFooterBar />
        </Providers>
      </body>
    </html>
  );
}
