import type { Cart, ShippingQuoteMatch } from './types';

export interface ShippingQuoteState {
  loading: boolean;
  rate: number | null;
  estimatedDays: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  currency: string | null;
  matched: ShippingQuoteMatch | null;
}

export const EMPTY_SHIPPING_QUOTE: ShippingQuoteState = {
  loading: false,
  rate: null,
  estimatedDays: null,
  confidence: 'none',
  currency: null,
  matched: null,
};

export function getQuoteSubtotal(cart: Pick<Cart, 'subtotal' | 'discountAmount'> | null): number {
  if (!cart) return 0;
  return Math.max(cart.subtotal - cart.discountAmount, 0);
}

export function getCheckoutDisplayTotal(baseTotal: number, shippingRate: number | null): number {
  return baseTotal + (shippingRate ?? 0);
}

export function getShippingConfirmationNote(
  confidence: ShippingQuoteState['confidence'],
): string | null {
  if (confidence === 'medium' || confidence === 'low') return 'confirm at checkout';
  return null;
}
