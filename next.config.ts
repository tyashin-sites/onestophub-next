import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();

const nextConfig = {
  images: {
    remotePatterns: [
      // Tyashin-served product images live on the platform API host.
      { protocol: 'https' as const, hostname: 'website-api.tyashin.com' },
      // Allow any HTTPS source — Tyashin generated images and external CDNs.
      { protocol: 'https' as const, hostname: '**' },
    ],
  },
  // Speed up CI deploys; the platform's typecheck/lint runs in `npm run lp` against the backend, not here.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      // Legacy Lovable route — Lovable repo had `/shop` aliased to `/products`.
      { source: '/shop', destination: '/products', permanent: true },
      // Lovable repo had a client-rendered `/order-confirmation`, but in Tyashin
      // the order-confirmation page is **owned by the platform** (intercepted at
      // dispatch). Sending here without an order number should not 404 — bounce
      // the user to /order-status which is also Tyashin-owned.
      { source: '/order-confirmation', destination: '/order-status', permanent: false },
    ];
  },
  async rewrites() {
    // Brand-kit assets (logo, etc.) live in the project's R2 bucket and are
    // served at the storefront host by the platform fallback. The new Worker
    // doesn't serve them, so proxy through to the currently-active production
    // host. After cutover this rewrite stops doing anything (same origin) but
    // it's harmless to keep.
    return [
      { source: '/brand/:path*', destination: 'https://www.1stophub.shop/brand/:path*' },
    ];
  },
};

export default nextConfig;
