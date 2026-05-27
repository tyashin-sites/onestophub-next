'use client';

import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart, useStore, toast, toastError } from '@/components/Providers';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import {
  EMPTY_SHIPPING_QUOTE,
  getCheckoutDisplayTotal,
  getQuoteSubtotal,
  getShippingConfirmationNote,
} from '@/lib/checkout-pricing';
import { getCountryName, getCountryOptions, normalizeCountryCode } from '@/lib/countries';
import type { StoreInfo } from '@/lib/types';

type PaymentMethod = 'online' | 'cod' | 'whatsapp';

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  EMPTY_CART: 'Your cart is empty.',
  PAYMENT_NOT_ENABLED: 'This payment method is not available. Please choose another.',
  NO_GATEWAY: 'Online payment is currently unavailable. Please try another method.',
  OUT_OF_STOCK: 'One or more items are out of stock. Please review your cart.',
  INVALID_COUPON: 'The applied coupon is no longer valid.',
  MISSING_SESSION: 'Session expired. Please reload the page.',
  NO_SHIPPING_ZONE: "We don't ship to your location. Please choose a different address.",
};

const getEnabledPaymentMethods = (s: StoreInfo | null): PaymentMethodOption[] => {
  const methods: PaymentMethodOption[] = [];
  if (s?.paymentGateway && s.paymentGateway !== 'none') methods.push({ value: 'online', label: 'Pay Online' });
  if (s?.enableCod) methods.push({ value: 'cod', label: 'Cash on Delivery' });
  if (s?.enableWhatsapp) methods.push({ value: 'whatsapp', label: 'Order via WhatsApp' });
  return methods;
};

type CheckoutField =
  | 'customerName' | 'customerEmail' | 'customerPhone'
  | 'line1' | 'city' | 'state' | 'postalCode' | 'country';

type FieldErrors = Partial<Record<CheckoutField, string>>;

const getFieldError = (message: string): FieldErrors => {
  const m = message.toLowerCase();
  if (m.includes('email')) return { customerEmail: message };
  if (m.includes('phone')) return { customerPhone: message };
  if (m.includes('name')) return { customerName: message };
  if (m.includes('address') || m.includes('line 1')) return { line1: message };
  if (m.includes('city')) return { city: message };
  if (m.includes('state') || m.includes('province') || m.includes('region')) return { state: message };
  if (m.includes('postal') || m.includes('pin code') || m.includes('zip')) return { postalCode: message };
  if (m.includes('country')) return { country: message };
  return {};
};

export default function CheckoutPage() {
  const { cart, refreshCart } = useCart();
  const { store } = useStore();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [shippingQuote, setShippingQuote] = useState(EMPTY_SHIPPING_QUOTE);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [allowedCountries, setAllowedCountries] = useState<string[]>([]);
  const [loadingDefaults, setLoadingDefaults] = useState(true);

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    customerNote: '',
  });

  const enabledMethods = useMemo(() => getEnabledPaymentMethods(store), [store]);
  const countryOptions = useMemo(() => getCountryOptions(allowedCountries), [allowedCountries]);
  const singleAllowedCountry = countryOptions.length === 1 ? countryOptions[0] : null;

  useEffect(() => {
    if (enabledMethods.length === 0) {
      setPaymentMethod(null);
      return;
    }
    const ok = paymentMethod && enabledMethods.some((m) => m.value === paymentMethod);
    if (!ok) setPaymentMethod(enabledMethods[0].value);
  }, [enabledMethods, paymentMethod]);

  const update = (field: string, value: string) => {
    setAddressError(null);
    setFieldErrors((prev) => {
      if (!prev[field as CheckoutField]) return prev;
      return { ...prev, [field]: undefined };
    });
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const currency = cart?.currency || 'INR';
  const quoteCountry = normalizeCountryCode(form.country) ?? '';
  const quoteRegion = form.state.trim();
  const quotePostalCode = form.postalCode.trim();
  const quoteSubtotal = useMemo(() => getQuoteSubtotal(cart), [cart]);
  const shippingCurrency = shippingQuote.currency || currency;
  const displayedTotal = useMemo(
    () => getCheckoutDisplayTotal(cart?.total ?? 0, shippingQuote.matched ? shippingQuote.rate : null),
    [cart?.total, shippingQuote.matched, shippingQuote.rate],
  );
  const shippingConfirmationNote = getShippingConfirmationNote(shippingQuote.confidence);

  // Geo + allowed-countries prefill
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingDefaults(true);
      const [storeRes, geoRes] = await Promise.allSettled([api.getStoreInfo(), api.getGeo()]);
      if (cancelled) return;
      const storeInfo = storeRes.status === 'fulfilled' ? storeRes.value.data : store;
      const shipping = storeInfo?.shippingCountries?.length ? storeInfo.shippingCountries : [];
      const normalized = getCountryOptions(shipping).map((c) => c.code);
      const hasRestrictions = normalized.length > 0;
      setAllowedCountries(normalized);

      const geo = geoRes.status === 'fulfilled' ? geoRes.value.data : undefined;
      const detected = normalizeCountryCode(geo?.country ?? '');
      const detectedAllowed = detected && (!hasRestrictions || normalized.includes(detected));
      const next =
        normalized.length === 1 ? normalized[0] : detectedAllowed ? detected : '';

      setForm((prev) => ({
        ...prev,
        country: prev.country || next || prev.country,
        state: prev.state || geo?.regionName || geo?.region || '',
        city: prev.city || geo?.city || '',
        postalCode: prev.postalCode || geo?.postalCode || '',
      }));
      setLoadingDefaults(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  useEffect(() => {
    if (singleAllowedCountry && form.country !== singleAllowedCountry.code) {
      setForm((prev) => ({ ...prev, country: singleAllowedCountry.code }));
    }
  }, [form.country, singleAllowedCountry]);

  // Live shipping quote — debounced
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      setShippingQuote(EMPTY_SHIPPING_QUOTE);
      setAddressError(null);
      return;
    }
    if (!quoteCountry || !quoteRegion || !quotePostalCode) {
      setShippingQuote({ ...EMPTY_SHIPPING_QUOTE, currency });
      setAddressError(null);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setShippingQuote((prev) => ({ ...prev, loading: true, currency: prev.currency || currency }));
      try {
        const res = await api.getShippingQuote({
          country: quoteCountry,
          region: quoteRegion,
          postalCode: quotePostalCode,
          subtotal: quoteSubtotal,
        });
        if (cancelled) return;
        setAddressError(null);
        setShippingQuote({
          loading: false,
          rate: res.data.matched?.rate ?? null,
          estimatedDays: res.data.matched?.estimatedDays ?? null,
          confidence: res.data.confidence,
          currency: res.data.currency || currency,
          matched: res.data.matched,
        });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : null;
        setAddressError(msg);
        setShippingQuote({ ...EMPTY_SHIPPING_QUOTE, currency });
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [cart, currency, quoteCountry, quotePostalCode, quoteRegion, quoteSubtotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    if (!enabledMethods.some((m) => m.value === paymentMethod)) {
      toast.error(ERROR_MESSAGES.PAYMENT_NOT_ENABLED);
      return;
    }
    setSubmitting(true);
    setAddressError(null);
    setFieldErrors({});

    try {
      const res = await api.checkout({
        customerEmail: form.customerEmail,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        shippingAddress: {
          fullName: form.customerName,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: quoteCountry || form.country,
          phone: form.customerPhone,
        },
        paymentMethod,
        customerNote: form.customerNote,
        items: (cart?.items ?? []).map((item) => ({
          productId: item.productId,
          ...(item.variantId ? { variantId: item.variantId } : {}),
          quantity: item.quantity,
        })),
      });
      const data = res.data;

      // The order-confirmation page is owned by Tyashin (intercepted at dispatch).
      // We just redirect to /order-confirmation/<orderNumber> after the payment
      // flow finishes — same URL pattern as the existing Lovable site.
      const confirmPath = `/order-confirmation/${data.orderNumber}`;

      if (paymentMethod === 'online' && data.razorpay) {
        const RazorpayCtor =
          (window as { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void } })
            .Razorpay;
        if (!RazorpayCtor) {
          toast.error(ERROR_MESSAGES.NO_GATEWAY);
          return;
        }
        const rzp = new RazorpayCtor({
          key: data.razorpay.keyId,
          amount: data.razorpay.amount,
          currency: data.razorpay.currency,
          order_id: data.razorpay.orderId,
          name: store?.storeName || 'OneStopHub',
          handler: () => {
            void refreshCart();
            // Hard navigation — order-confirmation is platform-owned and not in our routing table.
            window.location.assign(confirmPath);
          },
        });
        rzp.open();
        return;
      }

      if (paymentMethod === 'online' && data.stripe) {
        // Stripe path (not in use today on OneStopHub but kept for parity).
        const Stripe = (
          window as {
            Stripe?: (key: string) => {
              confirmPayment: (opts: unknown) => Promise<{ error?: { message?: string } }>;
            };
          }
        ).Stripe;
        const key = store?.stripePublishableKey;
        if (!Stripe || !key) {
          toast.error(ERROR_MESSAGES.NO_GATEWAY);
          return;
        }
        const stripe = Stripe(key);
        const { error } = await stripe.confirmPayment({
          clientSecret: data.stripe.clientSecret,
          confirmParams: { return_url: window.location.origin + confirmPath },
        });
        if (error) {
          toast.error(error.message || 'Unable to process payment.');
          return;
        }
        return;
      }

      if (paymentMethod === 'whatsapp' && data.whatsapp) {
        window.open(data.whatsapp.url, '_blank');
      }

      // COD + WhatsApp fall through to the order confirmation page.
      void refreshCart();
      window.location.assign(confirmPath);
    } catch (err: unknown) {
      console.error('[checkout]', err);
      const code =
        typeof err === 'object' && err && 'code' in err && typeof (err as { code?: unknown }).code === 'string'
          ? ((err as { code: string }).code)
          : undefined;
      const message =
        typeof err === 'object' && err && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
          ? (err as { message: string }).message
          : undefined;
      if (code === 'NO_SHIPPING_ZONE') setAddressError(message || ERROR_MESSAGES.NO_SHIPPING_ZONE);
      if (message) setFieldErrors(getFieldError(message));
      toast.error(message || (code && ERROR_MESSAGES[code]) || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-brand-md border border-brand-border bg-brand-bg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30';
  const labelClass = 'text-xs uppercase tracking-wider text-brand-text-muted mb-1 block';
  const getInputClass = (f: CheckoutField) =>
    `${inputClass}${fieldErrors[f] ? ' border-brand-danger focus:ring-brand-danger/30' : ''}`;

  // suppress unused var warning for loadingDefaults — used to disable country select
  void loadingDefaults;

  return (
    <>
      {/* Razorpay checkout script — only loaded on this page */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <section className="bg-brand-surface py-10 md:py-16">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-3xl font-bold text-brand-text md:text-4xl">Checkout</h1>
            </div>
          </section>
          <section className="py-8 md:py-12">
            <div className="container mx-auto max-w-4xl px-4">
              {!cart || cart.items.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-xl text-brand-text-muted">Your cart is empty</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
                  <div className="space-y-6 lg:col-span-2">
                    {/* Contact */}
                    <div className="rounded-brand-lg border border-brand-border bg-brand-bg p-6">
                      <h3 className="mb-4 text-lg font-semibold text-brand-text">Contact Information</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>Full Name *</label>
                          <input required value={form.customerName} onChange={(e) => update('customerName', e.target.value)} className={getInputClass('customerName')} />
                          {fieldErrors.customerName && <p className="mt-1 text-sm text-brand-danger">{fieldErrors.customerName}</p>}
                        </div>
                        <div>
                          <label className={labelClass}>Email *</label>
                          <input required type="email" value={form.customerEmail} onChange={(e) => update('customerEmail', e.target.value)} className={getInputClass('customerEmail')} />
                          {fieldErrors.customerEmail && <p className="mt-1 text-sm text-brand-danger">{fieldErrors.customerEmail}</p>}
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>Phone *</label>
                          <input required type="tel" value={form.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} className={getInputClass('customerPhone')} />
                          {fieldErrors.customerPhone && <p className="mt-1 text-sm text-brand-danger">{fieldErrors.customerPhone}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="rounded-brand-lg border border-brand-border bg-brand-bg p-6">
                      <h3 className="mb-4 text-lg font-semibold text-brand-text">Shipping Address</h3>
                      <div className="grid gap-4">
                        <div>
                          <label className={labelClass}>Address Line 1 *</label>
                          <input required value={form.line1} onChange={(e) => update('line1', e.target.value)} className={getInputClass('line1')} />
                          {fieldErrors.line1 && <p className="mt-1 text-sm text-brand-danger">{fieldErrors.line1}</p>}
                        </div>
                        <div>
                          <label className={labelClass}>Address Line 2</label>
                          <input value={form.line2} onChange={(e) => update('line2', e.target.value)} className={inputClass} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>City *</label>
                            <input required value={form.city} onChange={(e) => update('city', e.target.value)} className={getInputClass('city')} />
                            {fieldErrors.city && <p className="mt-1 text-sm text-brand-danger">{fieldErrors.city}</p>}
                          </div>
                          <div>
                            <label className={labelClass}>State *</label>
                            <input required value={form.state} onChange={(e) => update('state', e.target.value)} className={getInputClass('state')} />
                            {fieldErrors.state && <p className="mt-1 text-sm text-brand-danger">{fieldErrors.state}</p>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Postal Code *</label>
                            <input required value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} className={getInputClass('postalCode')} />
                            {fieldErrors.postalCode && <p className="mt-1 text-sm text-brand-danger">{fieldErrors.postalCode}</p>}
                          </div>
                          <div>
                            <label className={labelClass}>Country *</label>
                            {singleAllowedCountry ? (
                              <div className="flex min-h-[44px] items-center rounded-brand-md border border-brand-border bg-brand-surface px-4 py-2.5 text-sm">
                                {getCountryName(singleAllowedCountry.code)}
                              </div>
                            ) : (
                              <select
                                required
                                value={form.country}
                                onChange={(e) => update('country', e.target.value)}
                                className={getInputClass('country')}
                              >
                                <option value="">Select a country</option>
                                {countryOptions.map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            )}
                            {fieldErrors.country && <p className="mt-1 text-sm text-brand-danger">{fieldErrors.country}</p>}
                          </div>
                        </div>
                        {addressError && <p className="text-sm text-brand-danger">{addressError}</p>}
                      </div>
                    </div>

                    {/* Payment */}
                    <div className="rounded-brand-lg border border-brand-border bg-brand-bg p-6">
                      <h3 className="mb-4 text-lg font-semibold text-brand-text">Payment Method</h3>
                      <div className="space-y-2">
                        {enabledMethods.map((opt) => (
                          <label key={opt.value} className="flex cursor-pointer items-center gap-3 rounded-brand-md border border-brand-border p-3 transition-colors hover:bg-brand-surface">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={opt.value}
                              checked={paymentMethod === opt.value}
                              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                              className="accent-brand-primary"
                            />
                            <span className="text-sm">{opt.label}</span>
                          </label>
                        ))}
                        {enabledMethods.length === 0 && (
                          <p className="text-sm text-brand-danger">
                            No payment methods available. Please contact the store.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Note */}
                    <div className="rounded-brand-lg border border-brand-border bg-brand-bg p-6">
                      <label className={labelClass}>Order Note (optional)</label>
                      <textarea
                        value={form.customerNote}
                        onChange={(e) => update('customerNote', e.target.value)}
                        rows={3}
                        className={inputClass + ' resize-none'}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-24 rounded-brand-lg border border-brand-border bg-brand-bg p-6">
                      <h3 className="mb-4 text-lg font-semibold text-brand-text">Order Summary</h3>
                      <div className="mb-4 space-y-3">
                        {cart.items.map((item) => (
                          <div
                            key={`${item.productId}-${item.variantId}`}
                            className="flex justify-between text-sm"
                          >
                            <span className="truncate pr-2 text-brand-text-muted">
                              {item.name} × {item.quantity}
                            </span>
                            <span>{formatPrice(item.price * item.quantity, currency)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 border-t border-brand-border pt-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-brand-text-muted">Subtotal</span>
                          <span>{formatPrice(cart.subtotal, currency)}</span>
                        </div>
                        {cart.discountAmount > 0 && (
                          <div className="flex justify-between text-brand-success">
                            <span>Discount</span>
                            <span>-{formatPrice(cart.discountAmount, currency)}</span>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-brand-text-muted">Shipping</span>
                          <div className="text-right">
                            {shippingQuote.loading ? (
                              <span className="text-brand-text-muted">Calculating...</span>
                            ) : shippingQuote.matched && shippingQuote.rate != null ? (
                              <>
                                <span className={shippingQuote.rate === 0 ? 'font-medium text-brand-success' : undefined}>
                                  {shippingQuote.rate === 0 ? 'FREE' : formatPrice(shippingQuote.rate, shippingCurrency)}
                                </span>
                                {shippingQuote.estimatedDays && (
                                  <p className="mt-1 text-xs text-brand-text-muted">
                                    {shippingQuote.estimatedDays}
                                    {shippingConfirmationNote ? `, ${shippingConfirmationNote}` : ''}
                                  </p>
                                )}
                              </>
                            ) : quoteCountry && quoteRegion && quotePostalCode ? (
                              <span className="text-brand-danger">Unavailable</span>
                            ) : (
                              <span className="text-brand-text-muted">Enter country, state, and postal code</span>
                            )}
                          </div>
                        </div>
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
                          <span className="text-brand-primary">
                            {formatPrice(displayedTotal, shippingCurrency)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || enabledMethods.length === 0 || Boolean(addressError)}
                        className="mt-6 w-full rounded-full bg-brand-primary py-3 text-sm font-semibold uppercase tracking-wider text-brand-primary-contrast transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
                      >
                        {submitting ? 'Processing...' : 'Place Order'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
