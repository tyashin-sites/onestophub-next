'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trash2, Minus, Plus } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart, useStore, toast, toastError } from '@/components/Providers';
import { formatPrice } from '@/lib/format';
import { getOrderNote, setOrderNote, ORDER_NOTE_EVENT } from '@/lib/order-note';

export default function CartPage() {
  const { cart, loading, updateItem, removeItem, clearCart, applyCoupon, removeCoupon } = useCart();
  const { store } = useStore();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  /**
   * "Special order instructions" — synced with the checkout page via
   * localStorage (`tyashin_order_note`). Initialized empty so SSR matches
   * the first client render; populated in the effect below.
   */
  const [note, setNote] = useState('');

  useEffect(() => {
    setNote(getOrderNote());
    const onExternalChange = (e: Event) => {
      const next = (e as CustomEvent<string>).detail ?? getOrderNote();
      setNote(next);
    };
    window.addEventListener(ORDER_NOTE_EVENT, onExternalChange);
    // Cross-tab updates: storage events fire on tabs that did NOT do the write.
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tyashin_order_note') setNote(e.newValue ?? '');
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ORDER_NOTE_EVENT, onExternalChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const onNoteChange = (value: string) => {
    setNote(value);
    setOrderNote(value);
    // Tell the checkout page (open in another tab or already mounted) to
    // refresh its initial form value. Same-tab listeners pick this up too.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ORDER_NOTE_EVENT, { detail: value }));
    }
  };

  const handleQty = async (productId: string, variantId: string | null, newQty: number) => {
    try {
      if (newQty <= 0) await removeItem(productId, variantId || undefined);
      else await updateItem(productId, newQty, variantId || undefined);
    } catch (err) {
      toastError(err);
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    try {
      await applyCoupon(code);
      toast.success('Coupon applied!');
      setCouponInput('');
    } catch (err) {
      toastError(err, 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const currency = cart?.currency || 'INR';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-cream py-10 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Shopping Cart</h1>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container mx-auto max-w-4xl px-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-lg bg-cream" />
                ))}
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-xl text-muted-foreground">Your cart is empty</p>
                <Link
                  href="/products"
                  className="mt-6 inline-block rounded-full border-2 border-primary px-8 py-3 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  {cart.items.map((item) => (
                    <div
                      key={`${item.productId}-${item.variantId}`}
                      className="flex gap-4 rounded-lg border border-border bg-background p-4"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-cream">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-foreground">{item.name}</h3>
                        <p className="mt-1 text-sm font-bold text-primary">
                          {formatPrice(item.price, currency)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => handleQty(item.productId, item.variantId, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-border transition-colors hover:bg-cream"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleQty(item.productId, item.variantId, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-border transition-colors hover:bg-cream"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId || undefined)}
                            className="ml-auto p-1 text-muted-foreground transition-colors hover:text-destructive"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/*
                   * Special order instructions — synced with the checkout
                   * page via localStorage. Editing here updates the value on
                   * /checkout (and vice-versa); the note is sent with the
                   * order payload and surfaced in the merchant's WhatsApp
                   * message when paying that way.
                   */}
                  <div className="rounded-lg border border-border bg-background p-4">
                    <label
                      htmlFor="order-note"
                      className="text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      Special Order Instructions (optional)
                    </label>
                    <textarea
                      id="order-note"
                      value={note}
                      onChange={(e) => onNoteChange(e.target.value)}
                      rows={3}
                      maxLength={1000}
                      placeholder="Gift wrap, custom message, delivery preference, etc."
                      className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <button
                    onClick={() => clearCart()}
                    className="text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-destructive"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="lg:col-span-1">
                  <div className="sticky top-24 rounded-lg border border-border bg-background p-6">
                    <h3 className="mb-4 text-lg font-semibold text-foreground">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(cart.subtotal, currency)}</span>
                      </div>
                      {cart.discountAmount > 0 && (
                        <div className="flex justify-between text-sage">
                          <span>Discount {cart.couponCode && `(${cart.couponCode})`}</span>
                          <span>-{formatPrice(cart.discountAmount, currency)}</span>
                        </div>
                      )}
                      {!cart.taxInclusive && cart.taxAmount != null && cart.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {cart.taxName || store?.taxName || 'Tax'}
                            {store?.taxRate && <span className="ml-1 text-xs">({store.taxRate}%)</span>}
                          </span>
                          <span>{formatPrice(cart.taxAmount, currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                        <span>Total</span>
                        <span className="text-primary">{formatPrice(cart.total, currency)}</span>
                      </div>
                    </div>

                    {cart.couponCode ? (
                      <div className="mt-4 flex items-center justify-between rounded-md bg-cream p-2">
                        <span className="text-xs text-muted-foreground">
                          Coupon: <strong>{cart.couponCode}</strong>
                        </span>
                        <button
                          onClick={() => removeCoupon()}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 flex gap-2 overflow-hidden">
                        <input
                          type="text"
                          placeholder="Coupon code"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                          className="shrink-0 rounded-md bg-cream px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/10"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    <Link
                      href="/checkout"
                      className="mt-6 block w-full rounded-full bg-primary py-3 text-center text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Proceed to Checkout
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
