/**
 * Category URL helpers — ported from the Lovable repo verbatim so deep links
 * like /products?category=t-shirts continue to resolve identically.
 *
 *   /category/<slug>            — dedicated category landing page (SSR-friendly)
 *   /products?category=<slug>   — products listing scoped to a category
 *   /products?categoryId=<id>   — legacy form (kept for back-compat with old links)
 */

export const CATEGORY_QUERY_PARAM = 'category';
export const LEGACY_CATEGORY_ID_QUERY_PARAM = 'categoryId';

export interface CategoryFilterValues {
  categorySlug: string;
  categoryId: string;
}

export const getProductsCategoryHref = (slug: string): string => {
  const encodedSlug = encodeURIComponent(slug);
  return `/products?${CATEGORY_QUERY_PARAM}=${encodedSlug}`;
};

export const getCategoryLandingHref = (slug: string): string => {
  const encodedSlug = encodeURIComponent(slug);
  return `/category/${encodedSlug}`;
};

export const readCategoryFilters = (searchParams: URLSearchParams): CategoryFilterValues => ({
  categorySlug: searchParams.get(CATEGORY_QUERY_PARAM) || '',
  categoryId: searchParams.get(LEGACY_CATEGORY_ID_QUERY_PARAM) || '',
});

export const getProductsCategoryApiParams = ({
  categoryId,
  categorySlug,
}: CategoryFilterValues): Record<string, string> => {
  if (categoryId) return { [LEGACY_CATEGORY_ID_QUERY_PARAM]: categoryId };
  if (categorySlug) return { [CATEGORY_QUERY_PARAM]: categorySlug };
  return {};
};
