/**
 * Browser session id used by Tyashin's cart endpoints (X-Session-Id header).
 * The platform keys carts by `projectId + sessionId` (see backend §13). Sharing
 * this key with the existing Lovable storefront means a same-origin canary
 * bucket flip preserves the user's cart end-to-end. Do NOT rename it.
 */
const SESSION_KEY = 'tyashin_session_id';

export function getSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side render — no per-user session. The caller (e.g. SSR product
    // page) does not mutate the cart; it only fetches public data using the
    // API key. Use a stable placeholder so the backend doesn't reject the
    // header. Cart endpoints never run server-side here.
    return 'ssr-anonymous';
  }
  let sid = window.localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}
