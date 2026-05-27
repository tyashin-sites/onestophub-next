/**
 * Tyashin storefront API client.
 *
 *   - Server-side calls (RSC, generateMetadata, route handlers) use the env var
 *     `TYASHIN_API_KEY` and skip session-id headers — these calls only read
 *     public catalog data.
 *   - Client-side calls (cart, checkout) read the same key via
 *     `NEXT_PUBLIC_TYASHIN_API_KEY` (the X-API-Key is a public storefront key
 *     by design; same exposure level as the Lovable SPA today) and include
 *     the browser's `tyashin_session_id` so the cart binds to the visitor.
 *
 * SINGLE POINT OF CHANGE: every API call in the app must go through `apiFetch`
 * so retries, error envelopes, base-URL pinning, and auth headers stay
 * consistent.
 */

import { getSessionId } from './session';
import type {
  ApiEnvelope,
  ApiProduct,
  ApiCategory,
  Cart,
  StoreInfo,
  GeoData,
  ShippingQuoteData,
  ShippingQuoteRequest,
  CheckoutRequest,
  CheckoutResponse,
  ApiMeta,
} from './types';

const STOREFRONT_BASE =
  (typeof process !== 'undefined' && process.env.TYASHIN_STOREFRONT_URL) ||
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_TYASHIN_STOREFRONT_URL) ||
  'https://website-api.tyashin.com/api/v1/public/ecommerce';

function getApiKey(): string {
  // On the server, prefer the private env var. In the client bundle, Next
  // inlines `NEXT_PUBLIC_*` at build time.
  if (typeof window === 'undefined') {
    return process.env.TYASHIN_API_KEY || process.env.NEXT_PUBLIC_TYASHIN_API_KEY || '';
  }
  return process.env.NEXT_PUBLIC_TYASHIN_API_KEY || '';
}

export class ApiError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface FetchOpts extends RequestInit {
  /** Skip the session-id header (server-side reads). Defaults to auto-detect. */
  noSession?: boolean;
  /** Disable Next's fetch cache for this call. Cart/checkout pass true. */
  noStore?: boolean;
  /** RSC revalidation seconds. Defaults to 60s for catalog reads. */
  revalidate?: number;
}

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<ApiEnvelope<T>> {
  const { noSession, noStore, revalidate, headers, ...rest } = opts;
  const isServer = typeof window === 'undefined';
  const apiKey = getApiKey();

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    ...(headers as Record<string, string> | undefined),
  };
  if (!noSession && !isServer) {
    reqHeaders['X-Session-Id'] = getSessionId();
  }

  // Next 15 fetch cache controls. Catalog reads cache, cart/checkout don't.
  const nextOpts: { revalidate?: number } = {};
  if (typeof revalidate === 'number') nextOpts.revalidate = revalidate;

  const res = await fetch(STOREFRONT_BASE + path, {
    ...rest,
    headers: reqHeaders,
    cache: noStore ? 'no-store' : undefined,
    next: Object.keys(nextOpts).length ? nextOpts : undefined,
  });

  let json: ApiEnvelope<T>;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError(`Non-JSON response from ${path}`, 'BAD_RESPONSE', res.status);
  }
  if (!json.success) {
    throw new ApiError(json.error?.message || 'Request failed', json.error?.code, res.status);
  }
  return json;
}

/* ------------------------------------------------------------------ */
/*  Storefront API surface                                             */
/* ------------------------------------------------------------------ */

export const api = {
  /* -- public catalog reads (SSR-friendly, cacheable) ---------------- */

  getStoreInfo: () => apiFetch<StoreInfo>('/store-info', { noSession: true, revalidate: 300 }),

  getProducts: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString();
    return apiFetch<ApiProduct[]>(`/products${qs ? '?' + qs : ''}`, {
      noSession: true,
      revalidate: 60,
    });
  },

  getProduct: (slug: string) =>
    apiFetch<ApiProduct>(`/products/${encodeURIComponent(slug)}`, {
      noSession: true,
      revalidate: 60,
    }),

  getCategories: () =>
    apiFetch<ApiCategory[]>('/categories', { noSession: true, revalidate: 300 }),

  getCategory: (slug: string) =>
    apiFetch<ApiCategory>(`/categories/${encodeURIComponent(slug)}`, {
      noSession: true,
      revalidate: 300,
    }),

  /* -- cart (browser-only) ------------------------------------------ */

  getCart: () => apiFetch<Cart>('/cart', { noStore: true }),

  addToCart: (productId: string, quantity = 1, variantId?: string) =>
    apiFetch<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId, quantity }),
      noStore: true,
    }),

  updateCartItem: (productId: string, quantity: number, variantId?: string) =>
    apiFetch<Cart>(
      `/cart/items/${encodeURIComponent(productId)}${
        variantId ? `?variantId=${encodeURIComponent(variantId)}` : ''
      }`,
      { method: 'PATCH', body: JSON.stringify({ quantity }), noStore: true },
    ),

  removeCartItem: (productId: string, variantId?: string) =>
    apiFetch<Cart>(
      `/cart/items/${encodeURIComponent(productId)}${
        variantId ? `?variantId=${encodeURIComponent(variantId)}` : ''
      }`,
      { method: 'PATCH', body: JSON.stringify({ quantity: 0 }), noStore: true },
    ),

  clearCart: () => apiFetch<Cart>('/cart', { method: 'DELETE', noStore: true }),

  applyCoupon: (code: string) =>
    apiFetch<Cart>('/cart/coupon', {
      method: 'POST',
      body: JSON.stringify({ code }),
      noStore: true,
    }),

  removeCoupon: () => apiFetch<Cart>('/cart/coupon', { method: 'DELETE', noStore: true }),

  /* -- checkout (browser-only) -------------------------------------- */

  getGeo: () => apiFetch<GeoData>('/geo', { noStore: true }),

  getShippingQuote: (data: ShippingQuoteRequest) =>
    apiFetch<ShippingQuoteData>('/shipping/quote', {
      method: 'POST',
      body: JSON.stringify(data),
      noStore: true,
    }),

  checkout: (data: CheckoutRequest) =>
    apiFetch<CheckoutResponse>('/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
      noStore: true,
    }),
};

export type { ApiMeta };
