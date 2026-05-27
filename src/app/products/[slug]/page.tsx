import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductDetailClient from './ProductDetailClient';
import { api, ApiError } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Metadata + JSON-LD                                                 */
/*  This is the single most SEO-critical surface on the site. We emit  */
/*  full <title>/<meta>/OG + schema.org Product+Offer JSON-LD so       */
/*  Google rich results + LLM crawlers can quote prices and stock.     */
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
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        images: img ? [{ url: img, alt: p.name }] : undefined,
      },
    };
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

  // schema.org Product / Offer — the GEO/AEO surface.
  const inStock = product.trackInventory ? product.stock > 0 : true;
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.shortDescription,
    image: product.images.map((i) => i.url).filter(Boolean),
    sku: product.sku || undefined,
    offers: {
      '@type': 'Offer',
      price: (product.price / 100).toFixed(2),
      priceCurrency: currency,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://www.1stophub.shop/products/${product.slug}`,
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/products"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Shop
          </Link>

          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            {/* Image gallery is interactive — delegated to client component */}
            <ProductDetailClient
              product={product}
              primaryImageUrl={primaryImage?.url}
              primaryImageAlt={primaryImage?.alt || product.name}
            />
          </div>
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
