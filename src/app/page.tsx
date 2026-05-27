import Link from 'next/link';
import { Gift, Truck, Heart, Star } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SectionHeading from '@/components/SectionHeading';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';
import { getCategoryLandingHref } from '@/lib/category-routing';
import type { ApiCategory, ApiProduct } from '@/lib/types';

/** Home page — server-rendered. Catalog reads are cached 60s by the API client. */
export default async function HomePage() {
  let categories: ApiCategory[] = [];
  let featured: ApiProduct[] = [];
  try {
    const [c, p] = await Promise.all([
      api.getCategories(),
      api.getProducts({ limit: 8, sortBy: 'soldCount', sortOrder: 'desc' }),
    ]);
    categories = c.data ?? [];
    featured = p.data ?? [];
  } catch (err) {
    console.error('[home]', err);
  }

  const features = [
    { Icon: Gift, title: 'Curated Gifts', desc: 'Hand-picked items for every occasion' },
    { Icon: Truck, title: 'Fast Delivery', desc: 'Quick & safe shipping across India' },
    { Icon: Heart, title: 'Made with Love', desc: 'Each product selected with care' },
    { Icon: Star, title: 'Premium Quality', desc: 'Only the best for your little ones' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero — banner image background with dark gradient + cream copy */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-banner.jpg"
              alt="One Stop Hub collection"
              className="h-full w-full object-cover"
              width={1920}
              height={800}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
          </div>

          <div className="relative container mx-auto px-4 py-24 md:py-36 lg:py-44">
            <div className="max-w-xl animate-fade-in-up">
              <p className="mb-4 font-body text-sm uppercase tracking-[0.3em] text-cream">
                Welcome to
              </p>
              <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-cream md:text-5xl lg:text-6xl">
                One Stop Hub
              </h1>
              <p className="mb-8 max-w-md font-body text-base leading-relaxed text-cream/90 md:text-lg">
                Your destination for thoughtful gifts, adorable accessories &amp; creative
                essentials for every little one.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="rounded-full bg-accent px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  Shop Now
                </Link>
                <Link
                  href="/about"
                  className="rounded-full border border-cream/40 bg-transparent px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-cream transition-colors hover:bg-cream/10"
                >
                  Our Story
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features strip */}
        <section className="border-b border-border bg-cream py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              {features.map(({ Icon, title, desc }) => (
                <div key={title} className="flex flex-col items-center gap-2 text-center">
                  <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-blush/40">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground md:text-base">{title}</h3>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="bg-background py-16 md:py-24">
            <div className="container mx-auto px-4">
              <SectionHeading eyebrow="Browse" title="Our Categories" />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-3">
                {categories.map((cat) => (
                  <Link
                    key={cat._id}
                    href={getCategoryLandingHref(cat.slug)}
                    className="group relative aspect-square overflow-hidden rounded-lg"
                  >
                    {cat.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-cream">
                        <span className="text-2xl font-semibold text-muted-foreground">
                          {cat.name[0]}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                      <h3 className="text-lg font-semibold text-white md:text-xl">{cat.name}</h3>
                      {cat.description && (
                        <p className="mt-1 text-xs text-white/80 md:text-sm">{cat.description}</p>
                      )}
                      <p className="mt-1 text-xs text-white/60">{cat.productCount} products</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <section className="bg-cream py-16 md:py-24">
            <div className="container mx-auto px-4">
              <SectionHeading eyebrow="Handpicked" title="Featured Products" />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {featured.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Link
                  href="/products"
                  className="inline-block rounded-full border-2 border-primary px-8 py-3 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  View All Products
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Custom WhatsApp CTA */}
        <section className="bg-blush/30 py-16 md:py-24">
          <div className="container mx-auto max-w-2xl px-4 text-center">
            <h2 className="mb-4 text-3xl font-semibold text-foreground md:text-4xl">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="mb-8 text-muted-foreground">
              We offer custom &amp; personalised gifting solutions. Tell us what you need and
              we&apos;ll make it happen!
            </p>
            <a
              href="https://wa.me/919625912577"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-primary px-8 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
              WhatsApp Us
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
