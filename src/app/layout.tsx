import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { api } from '@/lib/api';
import type { StoreInfo, ApiCategory } from '@/lib/types';

const BRAND_KIT_CSS_URL =
  process.env.BRAND_KIT_CSS_URL || 'https://website-api.tyashin.com/brand-kit.css';

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
        <link rel="stylesheet" href={BRAND_KIT_CSS_URL} />
        <link rel="preconnect" href="https://website-api.tyashin.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://website-api.tyashin.com/tyashin-runtime.js" defer />
      </head>
      <body className="bg-brand-bg text-brand-text antialiased">
        <Providers initialStore={initialStore} initialCategories={initialCategories}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
