import ProductCard from '@/components/ProductCard';
import SectionHeading from '@/components/SectionHeading';
import { api } from '@/lib/api';

/**
 * Server-rendered "You may also like" grid on the product detail page.
 *
 * This is a deliberate SEO surface, not just a merchandising nicety: it gives
 * every product page real inbound links from its siblings, so PDPs stop being
 * dead-end near-orphans (GSC "no referring internal links"). Renders nothing
 * if the API has no related products.
 */
export default async function RelatedProducts({ slug }: { slug: string }) {
  let related;
  try {
    const res = await api.getRelatedProducts(slug, 8);
    related = res.data ?? [];
  } catch {
    return null;
  }
  if (related.length === 0) return null;

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
