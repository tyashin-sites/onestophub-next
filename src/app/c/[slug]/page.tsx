import { permanentRedirect } from 'next/navigation';

/**
 * Legacy short-form `/c/<slug>` route — redirects to the canonical
 * `/category/<slug>` landing. Kept so existing inbound links stay valid.
 */
export default async function CategoryShortAlias({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/category/${slug}`);
}
