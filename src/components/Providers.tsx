'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Toaster, toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { Cart, StoreInfo, ApiCategory } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Store context (currency, payment methods, tax, shipping countries) */
/* ------------------------------------------------------------------ */

interface StoreCtx {
  store: StoreInfo | null;
  loading: boolean;
}
const StoreContext = createContext<StoreCtx>({ store: null, loading: true });
export const useStore = () => useContext(StoreContext);

/* ------------------------------------------------------------------ */
/*  Category context — used by Footer + filter bar                     */
/* ------------------------------------------------------------------ */

interface CategoryCtx {
  categories: ApiCategory[];
  loading: boolean;
}
const CategoryContext = createContext<CategoryCtx>({ categories: [], loading: true });
export const useCategories = () => useContext(CategoryContext);

/* ------------------------------------------------------------------ */
/*  Cart context — wraps the server-side cart at /cart                 */
/* ------------------------------------------------------------------ */

interface CartCtx {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  addToCart: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  updateItem: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  refreshCart: () => Promise<void>;
}
const CartContext = createContext<CartCtx | null>(null);
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside <Providers>');
  return ctx;
};

/**
 * Single source of truth for all client-side providers. Mounted once in
 * `app/layout.tsx` so every route can read store/category/cart state without
 * each page re-fetching.
 */
export function Providers({
  initialStore,
  initialCategories,
  children,
}: {
  initialStore: StoreInfo | null;
  initialCategories: ApiCategory[];
  children: ReactNode;
}) {
  const [store, setStore] = useState<StoreInfo | null>(initialStore);
  const [storeLoading, setStoreLoading] = useState(!initialStore);
  const [categories, setCategories] = useState<ApiCategory[]>(initialCategories);
  const [catLoading, setCatLoading] = useState(initialCategories.length === 0);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(true);

  // Refresh store + categories on mount only if SSR didn't seed them.
  useEffect(() => {
    if (!initialStore) {
      api
        .getStoreInfo()
        .then((res) => setStore(res.data))
        .catch(() => {})
        .finally(() => setStoreLoading(false));
    }
    if (initialCategories.length === 0) {
      api
        .getCategories()
        .then((res) => setCategories(res.data))
        .catch(() => {})
        .finally(() => setCatLoading(false));
    }
  }, [initialStore, initialCategories.length]);

  const refreshCart = useCallback(async () => {
    try {
      const res = await api.getCart();
      setCart(res.data);
    } catch {
      setCart({ items: [], discountAmount: 0, subtotal: 0, total: 0, currency: 'INR' });
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(async (productId: string, quantity = 1, variantId?: string) => {
    const res = await api.addToCart(productId, quantity, variantId);
    setCart(res.data);
  }, []);
  const updateItem = useCallback(async (productId: string, quantity: number, variantId?: string) => {
    const res = await api.updateCartItem(productId, quantity, variantId);
    setCart(res.data);
  }, []);
  const removeItem = useCallback(async (productId: string, variantId?: string) => {
    const res = await api.removeCartItem(productId, variantId);
    setCart(res.data);
  }, []);
  const clearCart = useCallback(async () => {
    const res = await api.clearCart();
    setCart(res.data);
  }, []);
  const applyCoupon = useCallback(async (code: string) => {
    const res = await api.applyCoupon(code);
    setCart(res.data);
  }, []);
  const removeCoupon = useCallback(async () => {
    const res = await api.removeCoupon();
    setCart(res.data);
  }, []);

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <StoreContext.Provider value={{ store, loading: storeLoading }}>
      <CategoryContext.Provider value={{ categories, loading: catLoading }}>
        <CartContext.Provider
          value={{
            cart,
            loading: cartLoading,
            itemCount,
            addToCart,
            updateItem,
            removeItem,
            clearCart,
            applyCoupon,
            removeCoupon,
            refreshCart,
          }}
        >
          {children}
          <Toaster position="top-right" richColors closeButton />
        </CartContext.Provider>
      </CategoryContext.Provider>
    </StoreContext.Provider>
  );
}

/** Common error → toast helper used by client pages. */
export function toastError(err: unknown, fallback = 'Something went wrong') {
  const msg =
    err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback;
  toast.error(msg);
}

export { toast };
