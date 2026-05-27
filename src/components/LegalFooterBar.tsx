/**
 * Tyashin legal-pages footer bar.
 *
 * Renders the slim coloured strip at the very bottom of every page with the
 * T&C / Privacy / Return Policy links + the copyright line. Data comes from
 * the public `/api/v1/public/legal` endpoint which exposes
 * `projects.legalPages` (admin-edited HTML lives at the same Tyashin-owned
 * routes: /terms-and-conditions, /privacy-policy, /return-policy).
 *
 * Rendering server-side ensures the bar appears immediately on first paint
 * (the platform's tyashin-runtime.js also injects this client-side on
 * dispatched hosts — we duplicate it here for direct workers.dev / SSR
 * parity). On dispatched hosts the runtime's injection will overwrite ours;
 * the result is visually identical.
 */
import Link from 'next/link';

const PROJECT_ID = process.env.PROJECT_ID || '69dc76525f72612b58028164';
const API_URL = process.env.TYASHIN_API_URL || 'https://website-api.tyashin.com';

interface LegalPageRef {
  title?: string;
  slug?: string;
}
interface LegalResponse {
  pages?: {
    termsAndConditions?: LegalPageRef;
    privacyPolicy?: LegalPageRef;
    returnPolicy?: LegalPageRef;
  };
  copyrightText?: string;
  showFooterBar?: boolean;
  footerBarTheme?: { bgColor?: string; textColor?: string; linkColor?: string };
}

async function loadLegalPages(): Promise<LegalResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/legal?projectId=${PROJECT_ID}`, {
      headers: { 'X-API-Key': process.env.TYASHIN_API_KEY || '' },
      next: { revalidate: 300 },
    });
    const json = (await res.json()) as { success: boolean; data?: LegalResponse };
    return json.success ? json.data ?? null : null;
  } catch {
    return null;
  }
}

export default async function LegalFooterBar() {
  const lp = await loadLegalPages();
  if (!lp || lp.showFooterBar === false) return null;

  const theme = lp.footerBarTheme || {};
  const bg = theme.bgColor || '#6b2e38';
  const fg = theme.textColor || '#fcfaf8';
  const linkColor = theme.linkColor || fg;

  const year = new Date().getFullYear();
  const copyright = (lp.copyrightText || `© {year} OneStopHub. All rights reserved.`).replace(
    '{year}',
    String(year),
  );

  const refs: LegalPageRef[] = [
    lp.pages?.termsAndConditions,
    lp.pages?.privacyPolicy,
    lp.pages?.returnPolicy,
  ].filter((p): p is LegalPageRef => Boolean(p?.slug));

  return (
    <div style={{ background: bg, color: fg }} className="py-3 text-xs">
      <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 md:flex-row">
        <span>{copyright}</span>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {refs.map((ref) => (
            <Link
              key={ref.slug}
              href={`/${ref.slug}`}
              style={{ color: linkColor }}
              className="hover:underline"
            >
              {ref.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
