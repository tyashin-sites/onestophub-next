import Link from 'next/link';

interface Props {
  currentPage: number;
  totalPages: number;
  /** Path the page links point at, e.g. /products or /category/t-shirts. */
  basePath: string;
  /** Query params to preserve across pages (search, sortBy, …). */
  params?: Record<string, string>;
}

function hrefFor(basePath: string, params: Record<string, string>, page: number): string {
  const qs = new URLSearchParams(params);
  if (page > 1) qs.set('page', String(page));
  else qs.delete('page');
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

/**
 * Crawlable pagination: real <a href="?page=N"> links rendered server-side,
 * so Google can reach products beyond the first page. The client-side "Load
 * more" button is a progressive enhancement on top of this — never the only
 * path to deeper pages.
 */
export default function PaginationNav({ currentPage, totalPages, basePath, params = {} }: Props) {
  if (totalPages <= 1) return null;

  // Compact window: 1 … (p-1) p (p+1) … last
  const pages: (number | '…')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  const linkCls =
    'rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary';

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link href={hrefFor(basePath, params, currentPage - 1)} className={linkCls} rel="prev">
          ← Prev
        </Link>
      )}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(basePath, params, p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={
              p === currentPage
                ? 'rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground'
                : linkCls
            }
          >
            {p}
          </Link>
        ),
      )}
      {currentPage < totalPages && (
        <Link href={hrefFor(basePath, params, currentPage + 1)} className={linkCls} rel="next">
          Next →
        </Link>
      )}
    </nav>
  );
}
