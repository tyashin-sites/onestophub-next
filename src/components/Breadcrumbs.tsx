import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  /** Omit for the current page (last crumb, rendered as plain text). */
  href?: string;
}

/**
 * Visible breadcrumb trail. Must mirror the BreadcrumbList JSON-LD the
 * platform edge injects for this path — same names, same order.
 */
export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
            {c.href ? (
              <Link href={c.href} className="transition-colors hover:text-primary">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="line-clamp-1 font-medium text-foreground">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
