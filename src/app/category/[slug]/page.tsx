import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductsListing from '@/app/products/ProductsListing';
import { api, ApiError } from '@/lib/api';
import type { ApiCategory } from '@/lib/types';

const PAGE_SIZE = 60;

/** Per-category SEO. Indexable, full title + description from the admin-set values. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await api.getCategory(slug);
    const c = res.data;
    return {
      title: c.name,
      description: c.description || `Browse ${c.name} at OneStopHub. ${c.productCount} products.`,
      openGraph: {
        title: `${c.name} · OneStopHub`,
        description: c.description || undefined,
        type: 'website',
      },
    };
  } catch {
    return { title: 'Category' };
  }
}

export default async function CategoryLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sortBy?: string; sortOrder?: string; search?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const sortBy = sp.sortBy || 'createdAt';
  const sortOrder = sp.sortOrder || 'desc';
  const search = sp.search || '';

  let category: ApiCategory | null = null;
  let products: import('@/lib/types').ApiProduct[] = [];
  let meta = { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 };
  let categories: ApiCategory[] = [];
  try {
    const [catRes, prodRes, catsRes] = await Promise.all([
      api.getCategory(slug),
      api.getProducts({
        category: slug,
        limit: PAGE_SIZE,
        page: 1,
        sortBy,
        sortOrder,
        ...(search ? { search } : {}),
      }),
      api.getCategories(),
    ]);
    category = catRes.data;
    products = prodRes.data ?? [];
    meta = prodRes.meta ?? meta;
    categories = catsRes.data ?? [];
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    console.error('[category]', err);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-cream py-10 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              {category?.name || 'Category'}
            </h1>
            {category?.description && (
              <p className="mt-2 text-muted-foreground">{category.description}</p>
            )}
            {category?.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={category.imageUrl}
                alt={category.name}
                className="mx-auto mt-6 h-44 w-full max-w-4xl rounded-lg object-cover md:h-56"
                loading="lazy"
              />
            )}
          </div>
        </section>
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <ProductsListing
              initialProducts={products}
              initialMeta={meta}
              categories={categories}
              initialSearch={search}
              initialCategorySlug={slug}
              initialSortBy={sortBy}
              initialSortOrder={sortOrder}
              fixedCategorySlug={slug}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
