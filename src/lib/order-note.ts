/**
 * Order note (a.k.a. "Special order instructions") storage.
 *
 * Shared between the cart page and the checkout page so the shopper can type
 * the note on either surface and see it on the other. Persists across full
 * page reloads. Cleared when the order is placed.
 *
 * Implementation choice: localStorage, not the server cart. The cart-service
 * on the backend keys cart items by sessionId, but `customerNote` isn't a
 * cart field — it lives only on the order payload at checkout time. Keeping
 * it client-side avoids backend changes for cross-page sync. The checkout
 * page picks it up from localStorage as the initial form value and POSTs it
 * with the rest of the order data.
 */

const KEY = 'tyashin_order_note';

export function getOrderNote(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function setOrderNote(value: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = value.trim();
    if (trimmed) window.localStorage.setItem(KEY, value);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* localStorage blocked — best-effort, lose the value */
  }
}

export function clearOrderNote(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Custom event the cart + checkout pages dispatch on edit so the other view
 * (in case both are open in different tabs) picks up the change. Same-tab
 * sync is handled by listening to the input directly; this covers tabs.
 */
export const ORDER_NOTE_EVENT = 'tyashin:order-note-changed';
