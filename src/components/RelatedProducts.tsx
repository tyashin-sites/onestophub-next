import Link from 'next/link';
import SectionHeading from '@/components/SectionHeading';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import type { RelatedProduct } from '@/lib/types';

/**
 * Server-rendered "You may also like" grid on the product detail page.
 *
 * This is a deliberate SEO surface, not just a merchandising nicety: it gives
 * every product page real inbound links from its siblings, so PDPs stop being
 * dead-end near-orphans (GSC "no referring internal links").
 *
 * NOTE: /products/:slug/related returns LIGHTWEIGHT items — { id, name, slug,
 * price, compareAtPrice, thumbnailUrl, inStock } — NOT the full ApiProduct
 * shape ProductCard expects (no `images` array, `id` not `_id`). Feeding them
 * into ProductCard 500'd every PDP on 2026-08-03; render a dedicated card.
 */
export default async function RelatedProducts({ slug }: { slug: string }) {
  let related: RelatedProduct[];
  try {
    const res = await api.getRelatedProducts(slug, 8);
    const raw: unknown = res.data;
    const list = Array.isArray(raw)
      ? raw
      : (raw as { products?: RelatedProduct[] } | null)?.products;
    if (!Array.isArray(list) || list.length === 0) return null;
    related = list.filter((p) => p && typeof p.slug === 'string' && typeof p.name === 'string');
  } catch {
    return null;
  }
  if (related.length === 0) return null;

  return (
    <section className="mt-16">
      <SectionHeading eyebrow="Keep exploring" title="You may also like" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {related.slice(0, 8).map((p) => (
          <Link
            key={p.id ?? p.slug}
            href={`/products/${encodeURIComponent(p.slug)}`}
            className="group overflow-hidden rounded-lg border border-border bg-background transition-shadow hover:shadow-md"
          >
            <div className="aspect-square overflow-hidden bg-cream">
              {p.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.thumbnailUrl}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  {p.name}
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                {p.name}
              </h3>
              <div className="mt-1 flex items-baseline gap-2">
                {typeof p.price === 'number' && (
                  <span className="text-sm font-semibold text-foreground">
                    {formatPrice(p.price)}
                  </span>
                )}
                {typeof p.compareAtPrice === 'number' && p.compareAtPrice > (p.price ?? 0) && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(p.compareAtPrice)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
