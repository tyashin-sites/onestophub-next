'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus } from 'lucide-react';
import { useCart, useStore, toast, toastError } from './Providers';
import { formatPrice } from '@/lib/format';
import type { ApiProduct } from '@/lib/types';

/**
 * Product card — used on home (featured), category, and listing pages.
 * Faithful port of Lovable's ApiProductCard: hover image carousel, discount
 * badge, qty stepper, inline add-to-cart with a "View cart" toast action.
 */
export default function ProductCard({ product }: { product: ApiProduct }) {
  const primaryImage = product.images.find((i) => i.isPrimary) || product.images[0];
  const primaryIdx = primaryImage ? product.images.indexOf(primaryImage) : 0;
  const defaultIdx = primaryIdx >= 0 ? primaryIdx : 0;

  const [currentImageIdx, setCurrentImageIdx] = useState(defaultIdx);
  const [isHovering, setIsHovering] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { store } = useStore();
  const { addToCart } = useCart();
  const router = useRouter();

  const currency = store?.currency || product.currency || 'INR';
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const onMouseEnter = useCallback(() => {
    if (product.images.length <= 1) {
      setIsHovering(true);
      return;
    }
    setIsHovering(true);
    let idx = defaultIdx;
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % product.images.length;
      setCurrentImageIdx(idx);
    }, 1200);
  }, [product.images.length, defaultIdx]);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentImageIdx(defaultIdx);
  }, [defaultIdx]);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      await addToCart(product._id, quantity);
      toast.success(`Added ${product.name} × ${quantity}`, {
        action: { label: 'View cart', onClick: () => router.push('/cart') },
      });
      setQuantity(1);
    } catch (err) {
      toastError(err);
    } finally {
      setAdding(false);
    }
  };

  const displayImage = product.images[currentImageIdx] || primaryImage;
  const href = `/products/${product.slug}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-brand-lg border border-brand-border bg-brand-bg transition-all duration-300 hover:shadow-lg">
      <Link
        href={href}
        className="relative block aspect-square shrink-0 overflow-hidden bg-brand-surface"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage.url}
            alt={displayImage.alt || product.name}
            className={`h-full w-full object-cover transition-all duration-500 ${
              isHovering ? 'scale-110' : 'scale-100'
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-text-muted">
            No image
          </div>
        )}
        {discount > 0 && (
          <span className="absolute right-3 top-3 rounded-brand-sm bg-brand-danger px-2 py-0.5 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}
        {product.images.length > 1 && isHovering && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {product.images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === currentImageIdx ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <Link href={href}>
            <h3 className="line-clamp-1 text-base font-semibold text-brand-text group-hover:text-brand-primary">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 line-clamp-2 text-xs text-brand-text-muted">
            {product.shortDescription || product.description}
          </p>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-brand-primary">
              {formatPrice(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-brand-text-muted line-through">
                {formatPrice(product.compareAtPrice, currency)}
              </span>
            )}
          </div>
          {store && store.taxName && (
            <p className="mt-0.5 text-[10px] text-brand-text-muted">
              {store.taxInclusive
                ? `inclusive of all taxes`
                : `+ ${store.taxName}${store.taxRate ? ` ${store.taxRate}%` : ''}`}
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center self-stretch overflow-hidden rounded-full border border-brand-border sm:shrink-0 sm:self-auto">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuantity((q) => Math.max(1, q - 1));
              }}
              className="flex h-8 flex-1 items-center justify-center text-brand-text-muted transition-colors hover:bg-brand-surface hover:text-brand-text sm:w-8 sm:flex-none"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 select-none text-center text-sm font-semibold">{quantity}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuantity((q) => q + 1);
              }}
              className="flex h-8 flex-1 items-center justify-center text-brand-text-muted transition-colors hover:bg-brand-surface hover:text-brand-text sm:w-8 sm:flex-none"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full rounded-full bg-brand-primary py-2 text-xs font-semibold uppercase tracking-wider text-brand-primary-contrast transition-colors hover:bg-brand-primary/90 disabled:opacity-60 sm:flex-1"
          >
            {adding ? 'Adding…' : `Add ${quantity > 1 ? quantity : ''} to Cart`.trim()}
          </button>
        </div>
      </div>
    </div>
  );
}
