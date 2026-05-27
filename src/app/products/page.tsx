import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductsListing from './ProductsListing';
import { api } from '@/lib/api';
import type { ApiCategory, ApiProduct } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse OneStopHub — gifts, accessories, T-shirts, stationery, and more.',
};

interface SearchParams {
  category?: string;
  categoryId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: string;
}

const PAGE_SIZE = 60;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Next 15 searchParams is async.
  const sp = await searchParams;

  const sortBy = sp.sortBy || 'createdAt';
  const sortOrder = sp.sortOrder || 'desc';
  const search = sp.search || '';
  const categorySlug = sp.category || '';
  const categoryId = sp.categoryId || '';

  // Fetch the first page server-side so initial paint shows products without
  // a client round-trip. Subsequent pages load via "Load more" on the client.
  let initialProducts: ApiProduct[] = [];
  let initialMeta = { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 };
  let categories: ApiCategory[] = [];
  try {
    const params: Record<string, string | number> = {
      limit: PAGE_SIZE,
      page: 1,
      sortBy,
      sortOrder,
    };
    if (search) params.search = search;
    if (categoryId) params.categoryId = categoryId;
    else if (categorySlug) params.category = categorySlug;

    const [pRes, cRes] = await Promise.all([api.getProducts(params), api.getCategories()]);
    initialProducts = pRes.data ?? [];
    initialMeta = pRes.meta ?? initialMeta;
    categories = cRes.data ?? [];
  } catch (err) {
    console.error('[products]', err);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-brand-surface py-10 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-brand-text md:text-4xl">Our Shop</h1>
            <p className="mt-2 text-brand-text-muted">Find the perfect gift for every occasion</p>
          </div>
        </section>
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <ProductsListing
              initialProducts={initialProducts}
              initialMeta={initialMeta}
              categories={categories}
              initialSearch={search}
              initialCategorySlug={categorySlug}
              initialSortBy={sortBy}
              initialSortOrder={sortOrder}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
