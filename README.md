# OneStopHub — Next.js storefront

Tyashin-managed Next.js (App Router) storefront for project `onestophub`
(`69dc76525f72612b58028164`), deployed as a per-project Cloudflare Worker via
OpenNext.

This site is a **thin renderer over Tyashin's public e-commerce API**. It owns
no data — products, cart, orders, payments, brand kit, plugins all live in the
platform. Compare to `tyashin-sites/team-website-moj7aqqd` (Thridify) for the
deployment pattern.

## Page ownership

The Tyashin dispatch layer intercepts platform-owned routes _before_ this
Worker sees them. We must **not** implement them:

- `/order-confirmation/<orderNumber>`, `/order-status`, `/order-status/lookup`
- `/cart-recovery/<token>`, `/unsubscribe/<token>`, `/email-preferences/<token>`
- `/reviews/<orderNumber>`
- `/returns/new`, `/returns/<rma>`, `/returns/status/<rma>`
- `/privacy-request`, `/consent-center`
- `/sitemap.xml`, `/robots.txt`, `/brand-kit.css`, `/tyashin-runtime.js`

We own: `/`, `/products`, `/category/[slug]`, `/c/[slug]`, `/products/[slug]`,
`/cart`, `/checkout`, `/about`, `/contact`, `/faq`.

## SSR vs CSR split

| Route | Rendering | Why |
|---|---|---|
| `/`, `/products`, `/category/[slug]`, `/products/[slug]` | **SSR (RSC)** | Indexable HTML for Google / Perplexity / ChatGPT |
| `/about`, `/contact`, `/faq` | **SSR** | SEO surfaces |
| `/cart`, `/checkout` | **CSR** ("use client") | Behind a session cookie, never indexed |

## Plugins

The platform injects analytics (YOM) and chatbot scripts into every HTML
response automatically — see `services/site-serving/plugin-injection.ts` in the
backend. Do **not** add them here.

## Local dev

```bash
cp .env.example .env.local   # fill TYASHIN_API_KEY from project admin
npm install
npm run dev                  # next dev on :3000
npm run preview              # opennext build + wrangler dev (simulate prod)
```

## Deploy

Push to `main` → GitHub Actions runs the OpenNext build, deploys the Worker,
pulls per-project secrets from Tyashin, and notifies the platform webhook.
Required repo secrets: `CF_ACCOUNT_ID`, `CF_API_TOKEN`, `TYASHIN_API_URL`,
`TYASHIN_BUILD_SECRET`.
