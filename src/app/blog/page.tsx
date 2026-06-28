import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SectionHeading from '@/components/SectionHeading';
import { api } from '@/lib/api';
import type { BlogPost, ApiMeta } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Gift-guides, styling tips, and stories from OneStopHub — your destination for personalised gifts and lifestyle products.',
  openGraph: {
    title: 'Blog · OneStopHub',
    description: 'Gift-guides, styling tips, and stories from OneStopHub.',
    type: 'website',
  },
};

const PAGE_SIZE = 12;

interface SearchParams {
  page?: string;
  category?: string;
  tag?: string;
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1', 10);

  let posts: BlogPost[] = [];
  let meta: ApiMeta = { total: 0, page, limit: PAGE_SIZE, totalPages: 1 };
  try {
    const params: Record<string, string | number> = { limit: PAGE_SIZE, page };
    if (sp.category) params.category = sp.category;
    if (sp.tag) params.tag = sp.tag;
    const res = await api.getBlogPosts(params);
    posts = res.data ?? [];
    meta = res.meta ?? meta;
  } catch (err) {
    console.error('[blog]', err);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-cream py-10 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              {sp.tag ? `Posts tagged "${sp.tag}"` : sp.category ? sp.category : 'OneStopHub Blog'}
            </h1>
            {!sp.tag && !sp.category && (
              <p className="mt-2 text-muted-foreground">
                Gift-guides, styling tips, and stories from our shelves to yours.
              </p>
            )}
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container mx-auto max-w-5xl px-4">
            {posts.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
                {meta.totalPages > 1 && <Pagination meta={meta} basePath="/blog" sp={sp} />}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  const date = post.publishedAt ? new Date(post.publishedAt) : null;
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-all duration-300 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-cream">
        {post.featuredImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featuredImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl text-muted-foreground">
            {post.title[0]}
          </div>
        )}
        {post.pinned && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
            Featured
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {date && (
          <time
            dateTime={date.toISOString()}
            className="mb-2 text-xs uppercase tracking-wider text-muted-foreground"
          >
            {date.toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
        )}
        <h3 className="font-display text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
        )}
        {post.authorName && (
          <p className="mt-auto pt-3 text-xs text-muted-foreground">By {post.authorName}</p>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <SectionHeading eyebrow="Coming Soon" title="Stories on the way" />
      <p className="mx-auto max-w-md text-muted-foreground">
        We&apos;re writing our first posts — gift-guides for every occasion, styling tips, and
        behind-the-scenes stories. Check back soon.
      </p>
      <Link
        href="/products"
        className="mt-8 inline-block rounded-full border-2 border-primary px-8 py-3 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        Browse the Shop
      </Link>
    </div>
  );
}

function Pagination({
  meta,
  basePath,
  sp,
}: {
  meta: ApiMeta;
  basePath: string;
  sp: SearchParams;
}) {
  const make = (p: number) => {
    const qs = new URLSearchParams();
    if (p > 1) qs.set('page', String(p));
    if (sp.category) qs.set('category', sp.category);
    if (sp.tag) qs.set('tag', sp.tag);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const prev = meta.page > 1 ? make(meta.page - 1) : null;
  const next = meta.page < meta.totalPages ? make(meta.page + 1) : null;
  return (
    <nav className="mt-10 flex items-center justify-center gap-3 text-sm">
      {prev ? (
        <Link
          href={prev}
          className="rounded-full border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:bg-cream"
        >
          ← Newer
        </Link>
      ) : (
        <span className="rounded-full border border-border px-4 py-2 text-muted-foreground opacity-50">
          ← Newer
        </span>
      )}
      <span className="text-muted-foreground">
        Page {meta.page} of {meta.totalPages}
      </span>
      {next ? (
        <Link
          href={next}
          className="rounded-full border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:bg-cream"
        >
          Older →
        </Link>
      ) : (
        <span className="rounded-full border border-border px-4 py-2 text-muted-foreground opacity-50">
          Older →
        </span>
      )}
    </nav>
  );
}
