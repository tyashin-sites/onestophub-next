import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { api } from '@/lib/api';
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
  title: { default: 'OneStopHub — Personalised Gifts & Lifestyle Products', template: '%s · OneStopHub' },
  description:
    'OneStopHub — handpicked gifts, accessories, stationery, T-shirts, and personalised hampers for every occasion. Fast delivery across India.',
  robots: ROBOTS_NOINDEX
    ? { index: false, follow: false, googleBot: { index: false, follow: false } }
    : undefined,
  openGraph: {
    title: 'OneStopHub — Personalised Gifts & Lifestyle Products',
    description: 'Handpicked gifts, accessories, stationery & personalised hampers.',
    type: 'website',
    locale: 'en_IN',
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
    <html lang="en">
      <head>
        {/* Same-origin: served by Tyashin dispatch on storefront hosts.
            Returns 404 on direct *.workers.dev — fallback vars in globals.css. */}
        <link rel="stylesheet" href="/brand-kit.css" />
        <link rel="preconnect" href="https://website-api.tyashin.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="/tyashin-runtime.js" defer />
      </head>
      <body className="bg-brand-bg text-brand-text antialiased">
        <Providers initialStore={initialStore} initialCategories={initialCategories}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
