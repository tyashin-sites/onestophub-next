import { Star } from 'lucide-react';
import InlineReviewForm from '@/components/InlineReviewForm';
import { api } from '@/lib/api';
import type { ProductReviewsPayload } from '@/lib/types';

function Stars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= Math.round(value) ? 'fill-accent text-accent' : 'text-border'}`}
        />
      ))}
    </span>
  );
}

/**
 * Server-rendered customer reviews on the PDP: star summary + histogram +
 * published reviews + a "write a review" affordance.
 *
 * Renders NOTHING unless the store has review display enabled — the public
 * reviews endpoint returns `enabled: false` (or, on older API versions, no
 * `enabled` field) in that case, and hidden means hidden. When the section
 * renders, its content matches the AggregateRating/Review JSON-LD emitted for
 * this page, which is what makes the markup rich-result eligible.
 */
export default async function ReviewsSection({ productId }: { productId: string }) {
  let payload: ProductReviewsPayload;
  try {
    const res = await api.getProductReviews(productId, 1, 10);
    payload = res.data;
  } catch {
    return null;
  }
  if (payload?.enabled !== true) return null;

  // Shape-defensive: a payload surprise degrades to "no section", never a 500.
  const reviews = Array.isArray(payload.reviews) ? payload.reviews : [];
  const stats = payload.stats;
  const total = typeof stats?.totalReviews === 'number' ? stats.totalReviews : 0;
  if (total > 0 && (!stats || typeof stats.averageRating !== 'number')) return null;

  return (
    <section id="reviews" className="mt-16">
      <h2 className="text-2xl font-semibold text-foreground md:text-3xl">Customer Reviews</h2>

      {total === 0 ? (
        <div className="mt-6 flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">
            No reviews yet — be the first to share your experience.
          </p>
          <InlineReviewForm productId={productId} />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-start">
            {/* Summary */}
            <div className="shrink-0 md:w-64">
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-foreground">
                  {stats.averageRating.toFixed(1)}
                </span>
                <span className="pb-1 text-sm text-muted-foreground">out of 5</span>
              </div>
              <div className="mt-1">
                <Stars value={stats.averageRating} size="h-5 w-5" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on {total} verified {total === 1 ? 'review' : 'reviews'}
              </p>
              <div className="mt-4 flex flex-col gap-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.distribution?.[star] ?? 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-6 text-muted-foreground">{star}★</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
                        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6">
                <InlineReviewForm productId={productId} />
              </div>
            </div>

            {/* Review list */}
            <div className="flex-1 divide-y divide-border">
              {reviews.map((r) => (
                <article key={r._id} className="py-5 first:pt-0">
                  <div className="flex items-center gap-3">
                    <Stars value={r.rating} />
                    <span className="text-sm font-semibold text-foreground">{r.customerName}</span>
                    <span className="text-xs text-muted-foreground">
                      Verified buyer ·{' '}
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {r.title && (
                    <h3 className="mt-2 text-sm font-semibold text-foreground">{r.title}</h3>
                  )}
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {r.body}
                  </p>
                  {r.reply?.body && (
                    <div className="mt-3 rounded-md bg-cream p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Response from OneStopHub
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{r.reply.body}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
