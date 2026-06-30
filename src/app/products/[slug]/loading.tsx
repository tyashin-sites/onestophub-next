import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Instant skeleton shown the moment a product link is clicked (Suspense), so
// the PDP always feels immediate even on a cold render.
export default function ProductLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
          <div className="mb-6 h-4 w-28 animate-pulse rounded bg-cream" />
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-square w-full animate-pulse rounded-lg bg-cream" />
            <div className="space-y-4">
              <div className="h-9 w-3/4 animate-pulse rounded bg-cream" />
              <div className="h-7 w-32 animate-pulse rounded bg-cream" />
              <div className="space-y-2 pt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 animate-pulse rounded bg-cream"
                    style={{ width: `${95 - (i % 2) * 18}%` }}
                  />
                ))}
              </div>
              <div className="h-12 w-full animate-pulse rounded-lg bg-cream" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
