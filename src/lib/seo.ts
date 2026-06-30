// Single source of truth for OneStopHub's per-page <head> metadata.
//
// JSON-LD (Product / BlogPosting / ItemList / BreadcrumbList + sitewide
// Organization / WebSite) is injected by the Tyashin platform edge at request
// time — do NOT hand-roll it here. THIS file owns the part the edge can't:
// per-page Open Graph / Twitter Card / canonical, all absolute via metadataBase.
//
// `domain` is the only value that changes if the customer's domain differs.
import type { Metadata } from 'next';

export const SITE = {
  name: 'OneStopHub',
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN || '1stophub.shop',
  // A real asset in /public (1200×630-ish). Used when a page has no better image.
  defaultOgImage: '/hero-banner.jpg',
  locale: 'en_IN',
  twitter: '', // '@handle' if OneStopHub ever has one
};

export function siteUrl(path = '/'): string {
  const base = `https://www.${SITE.domain}`;
  const p = path === '/' ? '' : `/${path.replace(/^\/+/, '')}`;
  return `${base}${p}`;
}

/** Build a complete, absolute-URL Metadata object for one page. */
export function pageMetadata(opts: {
  title?: string;
  description: string;
  path: string;
  image?: string; // absolute or root-relative; falls back to SITE.defaultOgImage
  type?: 'website' | 'article';
}): Metadata {
  const url = siteUrl(opts.path);
  const image = opts.image || SITE.defaultOgImage;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: opts.type || 'website',
      url,
      siteName: SITE.name,
      title: opts.title || SITE.name,
      description: opts.description,
      locale: SITE.locale,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title || SITE.name,
      description: opts.description,
      images: [image],
      ...(SITE.twitter ? { site: SITE.twitter, creator: SITE.twitter } : {}),
    },
  };
}
