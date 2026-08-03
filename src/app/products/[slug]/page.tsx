import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs, { type Crumb } from '@/components/Breadcrumbs';
import RelatedProducts from '@/components/RelatedProducts';
import ReviewsSection from '@/components/ReviewsSection';
import ProductDetailClient from './ProductDetailClient';
import { api, ApiError } from '@/lib/api';
import { getCategoryLandingHref } from '@/lib/category-routing';
import { pageMetadata } from '@/lib/seo';
import type { ProductReviewsPayload } from '@/lib/types';

// Pre-render every product at build → product pages open instantly from cache
// instead of an on-demand SSR round-trip. ISR keeps prices/stock fresh;
// dynamicParams lets new products render on first hit then cache.
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const res = await api.getProducts({ limit: 200 });
    return (res.data ?? []).map((p: { slug: string }) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Metadata + JSON-LD                                                 */
/*  This is the single most SEO-critical surface on the site. pageMetadata */
/*  emits the full <title>/<meta>/OG + Twitter + canonical; schema.org   */
/*  Product+Offer JSON-LD is injected by the Tyashin platform edge so    */
/*  Google rich results + LLM crawlers can quote prices and stock.       */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await api.getProduct(slug);
    const p = res.data;
    const title = p.seo?.metaTitle || p.name;
    const description =
      p.seo?.metaDescription ||
      p.shortDescription ||
      (p.description ? p.description.slice(0, 160) : `${p.name} — available at OneStopHub.`);
    const img = p.seo?.ogImage || p.images.find((i) => i.isPrimary)?.url || p.images[0]?.url;
    return pageMetadata({ title, description, path: `/products/${slug}`, image: img });
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product;
  try {
    const res = await api.getProduct(slug);
    product = res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    console.error('[pdp]', err);
    notFound();
  }

  const primaryImage = product.images.find((i) => i.isPrimary) || product.images[0];
  const currency = product.currency || 'INR';

  // Category (for the breadcrumb) + published reviews (for the JSON-LD).
  // Reviews come back `enabled: false` until the store turns on review
  // display — in that case neither the section nor the schema mentions them.
  let categoryName: string | undefined;
  let categorySlug: string | undefined;
  let reviewsPayload: ProductReviewsPayload | undefined;
  try {
    const [cRes, rRes] = await Promise.allSettled([
      api.getCategories(),
      api.getProductReviews(product._id, 1, 10),
    ]);
    if (cRes.status === 'fulfilled' && product.categoryId) {
      const cat = (cRes.value.data ?? []).find((c) => c._id === product.categoryId);
      categoryName = cat?.name;
      categorySlug = cat?.slug;
    }
    if (rRes.status === 'fulfilled') reviewsPayload = rRes.value.data;
  } catch {
    /* non-fatal — page renders without breadcrumb category / review schema */
  }

  const reviewsEnabled = reviewsPayload?.enabled === true;
  const reviewStats = reviewsEnabled ? reviewsPayload?.stats : undefined;

  // schema.org Product / Offer — the GEO/AEO surface. AggregateRating and
  // Review nodes are DATA-DRIVEN: emitted only when review display is on and
  // real published reviews exist (never fabricate — Google penalizes it), and
  // they mirror exactly what <ReviewsSection> renders on this page.
  const inStock = product.trackInventory ? product.stock > 0 : true;
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.shortDescription,
    image: product.images.map((i) => i.url).filter(Boolean),
    sku: product.sku || undefined,
    brand: { '@type': 'Brand', name: 'OneStopHub' },
    offers: {
      '@type': 'Offer',
      price: (product.price / 100).toFixed(2),
      priceCurrency: currency,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://www.1stophub.shop/products/${product.slug}`,
    },
    ...(reviewStats && reviewStats.totalReviews > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(reviewStats.averageRating.toFixed(1)),
            reviewCount: reviewStats.totalReviews,
          },
          review: (reviewsPayload?.reviews ?? []).slice(0, 3).map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.customerName },
            reviewRating: {
              '@type': 'Rating',
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            name: r.title || undefined,
            reviewBody: r.body,
            datePublished: r.createdAt,
          })),
        }
      : {}),
  };

  const crumbs: Crumb[] = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/products' },
    ...(categoryName && categorySlug
      ? [{ label: categoryName, href: getCategoryLandingHref(categorySlug) }]
      : []),
    { label: product.name },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs crumbs={crumbs} />

          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            {/* Image gallery is interactive — delegated to client component */}
            <ProductDetailClient
              product={product}
              primaryImageUrl={primaryImage?.url}
              primaryImageAlt={primaryImage?.alt || product.name}
            />
          </div>

          {/* Customer reviews — hidden until the store enables display */}
          <ReviewsSection productId={product._id} />

          {/* Internal-link mesh: every PDP links 6–8 siblings */}
          <RelatedProducts slug={product.slug} />
        </div>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
