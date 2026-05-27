'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Trash2, Minus, Plus } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart, useStore, toast, toastError } from '@/components/Providers';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const { cart, loading, updateItem, removeItem, clearCart, applyCoupon, removeCoupon } = useCart();
  const { store } = useStore();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

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
        <section className="bg-brand-surface py-10 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-brand-text md:text-4xl">Shopping Cart</h1>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container mx-auto max-w-4xl px-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-brand-lg bg-brand-surface" />
                ))}
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-xl text-brand-text-muted">Your cart is empty</p>
                <Link
                  href="/products"
                  className="mt-6 inline-block rounded-full border-2 border-brand-primary px-8 py-3 text-sm font-semibold uppercase tracking-wider text-brand-primary transition-colors hover:bg-brand-primary hover:text-brand-primary-contrast"
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
                      className="flex gap-4 rounded-brand-lg border border-brand-border bg-brand-bg p-4"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-brand-md bg-brand-surface">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-brand-text-muted">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-brand-text">{item.name}</h3>
                        <p className="mt-1 text-sm font-bold text-brand-primary">
                          {formatPrice(item.price, currency)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => handleQty(item.productId, item.variantId, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-border transition-colors hover:bg-brand-surface"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleQty(item.productId, item.variantId, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-border transition-colors hover:bg-brand-surface"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId || undefined)}
                            className="ml-auto p-1 text-brand-text-muted transition-colors hover:text-brand-danger"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => clearCart()}
                    className="text-xs uppercase tracking-wider text-brand-text-muted transition-colors hover:text-brand-danger"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="lg:col-span-1">
                  <div className="sticky top-24 rounded-brand-lg border border-brand-border bg-brand-bg p-6">
                    <h3 className="mb-4 text-lg font-semibold text-brand-text">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-brand-text-muted">Subtotal</span>
                        <span>{formatPrice(cart.subtotal, currency)}</span>
                      </div>
                      {cart.discountAmount > 0 && (
                        <div className="flex justify-between text-brand-success">
                          <span>Discount {cart.couponCode && `(${cart.couponCode})`}</span>
                          <span>-{formatPrice(cart.discountAmount, currency)}</span>
                        </div>
                      )}
                      {!cart.taxInclusive && cart.taxAmount != null && cart.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-brand-text-muted">
                            {cart.taxName || store?.taxName || 'Tax'}
                            {store?.taxRate && <span className="ml-1 text-xs">({store.taxRate}%)</span>}
                          </span>
                          <span>{formatPrice(cart.taxAmount, currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-brand-border pt-2 text-base font-semibold">
                        <span>Total</span>
                        <span className="text-brand-primary">{formatPrice(cart.total, currency)}</span>
                      </div>
                    </div>

                    {cart.couponCode ? (
                      <div className="mt-4 flex items-center justify-between rounded-brand-md bg-brand-surface p-2">
                        <span className="text-xs text-brand-text-muted">
                          Coupon: <strong>{cart.couponCode}</strong>
                        </span>
                        <button
                          onClick={() => removeCoupon()}
                          className="text-xs text-brand-danger hover:underline"
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
                          className="min-w-0 flex-1 rounded-brand-md border border-brand-border bg-brand-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                          className="shrink-0 rounded-brand-md bg-brand-surface px-4 py-2 text-sm font-semibold text-brand-text-muted transition-colors hover:bg-brand-primary/10"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    <Link
                      href="/checkout"
                      className="mt-6 block w-full rounded-full bg-brand-primary py-3 text-center text-sm font-semibold uppercase tracking-wider text-brand-primary-contrast transition-colors hover:bg-brand-primary/90"
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
