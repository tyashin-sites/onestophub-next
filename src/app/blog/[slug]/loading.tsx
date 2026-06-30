import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Instant skeleton shown the moment a post link is clicked (Suspense), so
// navigation always feels immediate even on a cold render.
export default function BlogPostLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <article className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
          <div className="mb-6 h-4 w-24 animate-pulse rounded bg-cream" />
          <div className="mb-3 h-3 w-32 animate-pulse rounded bg-cream" />
          <div className="mb-4 h-10 w-3/4 animate-pulse rounded bg-cream" />
          <div className="mb-8 h-5 w-1/2 animate-pulse rounded bg-cream" />
          <div className="mb-8 aspect-[16/9] w-full animate-pulse rounded-lg bg-cream" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 animate-pulse rounded bg-cream"
                style={{ width: `${90 - (i % 3) * 12}%` }}
              />
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
