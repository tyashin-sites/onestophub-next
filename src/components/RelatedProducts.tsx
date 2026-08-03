import ProductCard from '@/components/ProductCard';
import SectionHeading from '@/components/SectionHeading';
import { api } from '@/lib/api';
import type { ApiProduct } from '@/lib/types';

/**
 * Server-rendered "You may also like" grid on the product detail page.
 *
 * This is a deliberate SEO surface, not just a merchandising nicety: it gives
 * every product page real inbound links from its siblings, so PDPs stop being
 * dead-end near-orphans (GSC "no referring internal links"). Renders nothing
 * if the API has no related products.
 */
export default async function RelatedProducts({ slug }: { slug: string }) {
  let related: ApiProduct[];
  try {
    const res = await api.getRelatedProducts(slug, 8);
    // Defensive on shape: data is { products: [...] } today; tolerate a bare
    // array too so an API change degrades to "no grid", never a 500.
    const raw: unknown = res.data;
    const list = Array.isArray(raw)
      ? raw
      : (raw as { products?: ApiProduct[] } | null)?.products;
    if (!Array.isArray(list) || list.length === 0) return null;
    related = list as ApiProduct[];
  } catch {
    return null;
  }

  return (
    <section className="mt-16">
      <SectionHeading eyebrow="Keep exploring" title="You may also like" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {related.slice(0, 8).map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}
