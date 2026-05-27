import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();

const nextConfig = {
  // Inline the storefront public API key into the client bundle at build time.
  // The X-API-Key for `/api/v1/public/*` is public by design (the existing
  // Lovable site has it in clear text); inlining here just avoids hardcoding
  // it in source. Build with `TYASHIN_API_KEY=ak_… npx @opennextjs/cloudflare build`.
  env: {
    NEXT_PUBLIC_TYASHIN_API_KEY: process.env.TYASHIN_API_KEY || '',
    NEXT_PUBLIC_TYASHIN_STOREFRONT_URL:
      process.env.TYASHIN_STOREFRONT_URL ||
      'https://website-api.tyashin.com/api/v1/public/ecommerce',
    NEXT_PUBLIC_PROJECT_ID: process.env.PROJECT_ID || '69dc76525f72612b58028164',
    NEXT_PUBLIC_TYASHIN_API_URL: process.env.TYASHIN_API_URL || 'https://website-api.tyashin.com',
  },
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
    // Tyashin serves a handful of platform-owned paths at the storefront's
    // origin via its dispatch interceptor (brand-kit.css, tyashin-runtime.js,
    // /brand/* assets, sitemap.xml, robots.txt). When the Worker is reached
    // directly at *.workers.dev the dispatch layer isn't in front of us so
    // those paths would 404.
    //
    // We can't easily ask website-api.tyashin.com to serve them — its CORP
    // header blocks cross-origin asset loads. Instead we proxy through to the
    // project's Tyashin subdomain (`{slug}.sites.tyashin.com`), which IS
    // dispatched correctly and returns the platform-owned response. The
    // browser sees same-origin → no CORS, no 404.
    //
    // In production via Tyashin dispatch these requests are intercepted BEFORE
    // they reach the Worker, so these rewrites are a no-op in that path.
    // They only matter for direct workers.dev / QA access.
    const STOREFRONT_ORIGIN =
      process.env.TYASHIN_STOREFRONT_ORIGIN || 'https://onestophub.sites.tyashin.com';
    return [
      { source: '/brand-kit.css', destination: `${STOREFRONT_ORIGIN}/brand-kit.css` },
      { source: '/tyashin-runtime.js', destination: `${STOREFRONT_ORIGIN}/tyashin-runtime.js` },
      // /brand/* assets (logo, favicon, etc.) live in R2 under the project's
      // r2Prefix. They aren't served at /brand/* on the storefront origin —
      // they're served via the public-media pass-through, which sets
      // `Access-Control-Allow-Origin: *` so a same-origin rewrite works.
      {
        source: '/brand/:path*',
        destination: `https://website-api.tyashin.com/api/v1/public/media/projects/tyashin-aditya-s-team-g8ijaf-onestophub/brand/:path*`,
      },
      { source: '/sitemap.xml', destination: `${STOREFRONT_ORIGIN}/sitemap.xml` },
      { source: '/robots.txt', destination: `${STOREFRONT_ORIGIN}/robots.txt` },
      // Tyashin-owned legal pages — admin-edited HTML lives in projects.legalPages
      // and is served via dispatch on storefront origins. Proxy them so the
      // footer-bar links resolve on direct workers.dev access too.
      { source: '/terms-and-conditions', destination: `${STOREFRONT_ORIGIN}/terms-and-conditions` },
      { source: '/privacy-policy', destination: `${STOREFRONT_ORIGIN}/privacy-policy` },
      { source: '/return-policy', destination: `${STOREFRONT_ORIGIN}/return-policy` },
    ];
  },
};

export default nextConfig;
