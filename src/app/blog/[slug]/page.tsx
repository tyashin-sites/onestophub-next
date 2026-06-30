import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { api, ApiError } from '@/lib/api';
import { pageMetadata } from '@/lib/seo';
import type { BlogPost } from '@/lib/types';

const SITE_ORIGIN = 'https://www.1stophub.shop';

// Pre-render every published post at build → served instantly from cache, so
// clicking a post in the list is immediate (no on-demand SSR round-trip). ISR
// keeps them fresh; dynamicParams lets posts added after build render on first
// hit then cache.
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const res = await api.getBlogPosts({ limit: 100 });
    return (res.data ?? []).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await api.getBlogPost(slug);
    const p = res.data;
    const title = p.seo?.metaTitle || p.title;
    const description =
      p.seo?.metaDescription ||
      p.excerpt ||
      (p.content ? p.content.replace(/<[^>]+>/g, ' ').slice(0, 160) : title);
    const img = p.seo?.ogImage || p.featuredImage;
    // Base OG/Twitter/canonical via the shared helper, then layer the
    // article-specific OG fields (BlogPosting JSON-LD comes from the edge).
    const base = pageMetadata({ title, description, path: `/blog/${slug}`, image: img, type: 'article' });
    return {
      ...base,
      openGraph: {
        ...base.openGraph,
        type: 'article',
        publishedTime: p.publishedAt,
        authors: p.authorName ? [p.authorName] : undefined,
        tags: p.tags,
      },
    };
  } catch {
    return { title: 'Blog post' };
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post: BlogPost;
  try {
    const res = await api.getBlogPost(slug);
    post = res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    console.error('[blog post]', err);
    notFound();
  }

  const date = post.publishedAt ? new Date(post.publishedAt) : null;

  // schema.org BlogPosting — GEO/AEO surface for ChatGPT/Perplexity citations.
  const plainTextBody = (post.content || '').replace(/<[^>]+>/g, ' ').slice(0, 1000);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || plainTextBody.slice(0, 200),
    image: post.featuredImage ? [post.featuredImage] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: post.authorName
      ? { '@type': 'Person', name: post.authorName }
      : { '@type': 'Organization', name: 'OneStopHub' },
    publisher: {
      '@type': 'Organization',
      name: 'OneStopHub',
      logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/logo.jpg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_ORIGIN}/blog/${post.slug}` },
    keywords: post.tags?.join(', '),
  };

  // Render content. The backend says `contentFormat` is either 'html' or
  // 'markdown'. For markdown we'd need a renderer; for now treat both as
  // HTML — that matches what the admin RTE produces for OneStopHub today.
  const html =
    post.contentFormat === 'markdown'
      ? // Trivial markdown→HTML fallback (paragraphs only) so unwrapped MD doesn't
        // appear as one giant blob. Upgrade to a real parser later if we ever
        // start authoring in markdown.
        post.content
          .split(/\n{2,}/)
          .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
          .join('')
      : post.content;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <article className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <header className="mb-8">
            {date && (
              <time
                dateTime={date.toISOString()}
                className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
              >
                {date.toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            )}
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-foreground md:text-5xl">
              {post.title}
            </h1>
            {post.authorName && (
              <p className="mt-3 text-sm text-muted-foreground">By {post.authorName}</p>
            )}
            {post.excerpt && (
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
            )}
          </header>

          {/* Only show a standalone hero when the body doesn't already lead with
              it. Auto-generated posts inline the featured image at the top of
              `content`, so rendering featuredImage again here showed it twice. */}
          {post.featuredImage && !post.content?.includes(post.featuredImage) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.featuredImage}
              alt={post.title}
              className="mb-8 aspect-[16/9] w-full rounded-lg object-cover"
            />
          )}

          <div
            // Same prose styling as the legal pages so admin-edited RTE content
            // renders cleanly without bringing in @tailwindcss/typography.
            className="prose-content leading-relaxed text-foreground/85
              [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground
              [&_h3]:mt-7 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground
              [&_h4]:mt-5 [&_h4]:font-semibold [&_h4]:text-foreground
              [&_p]:mt-4
              [&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80
              [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1
              [&_strong]:font-semibold [&_strong]:text-foreground
              [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-accent
              [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
              [&_img]:my-6 [&_img]:rounded-lg
              [&_pre]:my-4 [&_pre]:rounded [&_pre]:bg-cream [&_pre]:p-4 [&_pre]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="rounded-full bg-cream px-3 py-1 text-xs text-muted-foreground hover:bg-blush/40"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </article>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
