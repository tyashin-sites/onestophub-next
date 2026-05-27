'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import ProductGridSkeleton from '@/components/ProductGridSkeleton';
import { api } from '@/lib/api';
import type { ApiCategory, ApiMeta, ApiProduct } from '@/lib/types';

interface Props {
  initialProducts: ApiProduct[];
  initialMeta: ApiMeta;
  categories: ApiCategory[];
  initialSearch: string;
  initialCategorySlug: string;
  initialSortBy: string;
  initialSortOrder: string;
  /** When set, the listing is locked to this category (used by /category/[slug]). */
  fixedCategorySlug?: string;
}

const PAGE_SIZE = 60;

/**
 * Client-side filter/sort/search + pagination controller for the PLP. Reads
 * initial state from `searchParams` (server-prefetched first page) and pushes
 * URL changes via `router.push` so deep links stay shareable.
 *
 * Differences vs the Lovable original:
 *   - Pagination is "Load more" instead of infinite-scroll virtualization. Same
 *     UX outcome, no react-virtual dependency, friendlier for SSR/SEO.
 *   - Search input is debounced and routed; sort + category use immediate routing.
 */
export default function ProductsListing({
  initialProducts,
  initialMeta,
  categories,
  initialSearch,
  initialCategorySlug,
  initialSortBy,
  initialSortOrder,
  fixedCategorySlug,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategorySlug = fixedCategorySlug || initialCategorySlug;

  const [products, setProducts] = useState<ApiProduct[]>(initialProducts);
  const [meta, setMeta] = useState<ApiMeta>(initialMeta);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [, startTransition] = useTransition();

  // Reset when the route changes (e.g. user switches category from filter pill).
  const lastKeyRef = useRef('');
  useEffect(() => {
    const key = JSON.stringify({
      initialCategorySlug,
      initialSearch,
      initialSortBy,
      initialSortOrder,
    });
    if (lastKeyRef.current && lastKeyRef.current !== key) {
      setProducts(initialProducts);
      setMeta(initialMeta);
    }
    lastKeyRef.current = key;
  }, [initialCategorySlug, initialSearch, initialSortBy, initialSortOrder, initialProducts, initialMeta]);

  const pushParams = (next: URLSearchParams) => {
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const setCategory = (slug: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (slug) next.set('category', slug);
    else next.delete('category');
    next.delete('categoryId');
    next.delete('page');
    pushParams(next);
  };

  const setSort = (value: string) => {
    const [by, order] = value.split('_');
    const next = new URLSearchParams(searchParams.toString());
    next.set('sortBy', by);
    next.set('sortOrder', order);
    next.delete('page');
    pushParams(next);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams.toString());
    const v = searchInput.trim();
    if (v) next.set('search', v);
    else next.delete('search');
    next.delete('page');
    pushParams(next);
  };

  const loadMore = async () => {
    if (loadingMore || meta.page >= meta.totalPages) return;
    setLoadingMore(true);
    try {
      const params: Record<string, string | number> = {
        limit: PAGE_SIZE,
        page: meta.page + 1,
        sortBy: initialSortBy,
        sortOrder: initialSortOrder,
      };
      if (initialSearch) params.search = initialSearch;
      if (activeCategorySlug) params.category = activeCategorySlug;
      const res = await api.getProducts(params);
      setProducts((prev) => [...prev, ...(res.data ?? [])]);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      console.error('[products] load more', err);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      {/* Search */}
      <form onSubmit={submitSearch} className="mb-8">
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="mx-auto block w-full max-w-md rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </form>

      {/* Category filter — hidden on dedicated /category/[slug] landing pages */}
      {!fixedCategorySlug && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setCategory('')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              !activeCategorySlug
                ? 'bg-primary text-primary-foreground'
                : 'bg-cream text-muted-foreground hover:bg-primary/10'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setCategory(cat.slug)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeCategorySlug === cat.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-cream text-muted-foreground hover:bg-primary/10'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Sort */}
      <div className="mb-6 flex justify-end">
        <select
          value={`${initialSortBy}_${initialSortOrder}`}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="createdAt_desc">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A-Z</option>
          <option value="soldCount_desc">Bestselling</option>
        </select>
      </div>

      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-xl text-muted-foreground">No products found</p>
          <p className="mt-2 text-sm text-muted-foreground">Try a different search or category</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
          {meta.page < meta.totalPages && (
            <div className="mt-10 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full border-2 border-primary px-8 py-3 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
              {loadingMore && (
                <div className="mt-6">
                  <ProductGridSkeleton count={4} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
