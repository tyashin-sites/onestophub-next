'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, useStore, toast, toastError } from '@/components/Providers';
import { formatPrice } from '@/lib/format';
import type { ApiProduct } from '@/lib/types';

interface Props {
  product: ApiProduct;
  primaryImageUrl?: string;
  primaryImageAlt?: string;
}

export default function ProductDetailClient({ product }: Props) {
  const { addToCart } = useCart();
  const { store } = useStore();
  const router = useRouter();

  const initialVariantId =
    product.hasVariants && product.variants.length > 0
      ? (product.variants.find((v) => v.isActive)?.id ?? null)
      : null;

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(initialVariantId);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const displayPrice =
    selectedVariant && selectedVariant.price > 0 ? selectedVariant.price : product.price;
  const currency = store?.currency || product.currency || 'INR';

  const taxRate = store?.taxRate ?? 0;
  const taxName = store?.taxName;
  const taxInclusive = store?.taxInclusive ?? false;
  const taxAmount =
    taxRate > 0 && taxName
      ? Math.round(
          taxInclusive
            ? (displayPrice * taxRate) / (100 + taxRate)
            : (displayPrice * taxRate) / 100,
        )
      : 0;
  const totalWithTax = taxInclusive ? displayPrice : displayPrice + taxAmount;

  // Group variants by option-key (size, colour, etc.).
  const optionGroups = useMemo(() => {
    if (!product.hasVariants || product.variants.length === 0) return {} as Record<string, string[]>;
    const keys = Object.keys(product.variants[0].attributes || {});
    const out: Record<string, string[]> = {};
    for (const k of keys) {
      out[k] = [
        ...new Set(product.variants.filter((v) => v.isActive).map((v) => v.attributes[k])),
      ];
    }
    return out;
  }, [product]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addToCart(product._id, quantity, selectedVariantId || undefined);
      toast.success(`Added ${product.name} × ${quantity}`, {
        action: { label: 'View cart', onClick: () => router.push('/cart') },
      });
    } catch (err) {
      toastError(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      {/* Image gallery */}
      <div>
        <div className="mb-4 aspect-square overflow-hidden rounded-lg bg-cream">
          {product.images[selectedImage] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[selectedImage].url}
              alt={product.images[selectedImage].alt || product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                  i === selectedImage ? 'border-primary' : 'border-border'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt || ''} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{product.name}</h1>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-2xl font-bold text-primary">
            {formatPrice(displayPrice, currency)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > displayPrice && (
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice, currency)}
            </span>
          )}
        </div>

        {taxName && taxRate > 0 &&
          (taxInclusive ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-sage">Inclusive of all taxes</span>
            </div>
          ) : (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>
                + {taxName} {taxRate}%
              </span>
              <span className="text-border">·</span>
              <span>Tax: {formatPrice(taxAmount, currency)}</span>
              <span className="text-border">·</span>
              <span className="font-semibold text-foreground">
                Total: {formatPrice(totalWithTax, currency)}
              </span>
            </div>
          ))}

        {product.shortDescription && (
          <p className="mt-4 text-muted-foreground">{product.shortDescription}</p>
        )}

        {/* Variant pickers */}
        {product.hasVariants &&
          Object.entries(optionGroups).map(([optionName, values]) => (
            <div key={optionName} className="mt-6">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                {optionName}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {values.map((val) => {
                  const matching = product.variants.find(
                    (v) => v.isActive && v.attributes[optionName] === val,
                  );
                  const isSelected = selectedVariant?.attributes[optionName] === val;
                  return (
                    <button
                      key={val}
                      onClick={() => matching && setSelectedVariantId(matching.id)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:border-primary'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

        {/* Quantity */}
        <div className="mt-6">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Quantity</label>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-lg transition-colors hover:bg-cream"
            >
              −
            </button>
            <span className="w-8 text-center text-lg">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-lg transition-colors hover:bg-cream"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={adding}
          className="mt-8 w-full rounded-full bg-primary py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {adding ? 'Adding…' : 'Add to Cart'}
        </button>

        {/* Description */}
        {product.description && (
          <div className="mt-8 border-t border-border pt-8">
            <h3 className="mb-3 text-lg font-semibold text-foreground">Description</h3>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </div>
          </div>
        )}

        {product.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-cream px-3 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
