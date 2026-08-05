'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import WriteReviewCTA from '@/components/WriteReviewCTA';
import { api, ApiError } from '@/lib/api';
import type { EligibleReviewItem } from '@/lib/types';

/**
 * The natural write-a-review path. On mount it asks the platform which
 * purchases THIS browser can review (identity = the session id that placed
 * the order — no typing, works for guest checkout):
 *
 *   - This product is reviewable  → inline pre-verified star + text form.
 *   - Already reviewed / not bought here → the endpoint excludes it, so we
 *     fall back to the order-number lookup CTA (covers "ordered on my phone,
 *     reviewing on my laptop") and never re-prompt someone who reviewed.
 *
 * Shape-defensive throughout: any API surprise degrades to the fallback CTA,
 * never a crash.
 */
export default function InlineReviewForm({ productId }: { productId: string }) {
  const [match, setMatch] = useState<EligibleReviewItem | null>(null);
  const [checked, setChecked] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getEligibleReviews();
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        const m = items.find((i) => i && i.productId === productId && i.orderId);
        if (!cancelled) setMatch(m ?? null);
      } catch {
        /* fall back to the lookup CTA */
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!checked) return null; // brief — avoids CTA flashing before the check
  if (doneMessage) {
    return (
      <p className="rounded-md bg-cream p-4 text-sm text-foreground" role="status">
        {doneMessage}
      </p>
    );
  }
  if (!match) return <WriteReviewCTA />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || !body.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitReview(productId, {
        orderId: match.orderId,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
      });
      setDoneMessage(
        res.data?.message || 'Thank you! Your review has been submitted.',
      );
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_REVIEWED') {
        setDoneMessage('You have already reviewed this product — thank you!');
      } else {
        setError('Could not submit your review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-border p-4">
      <p className="text-sm font-semibold text-foreground">
        You bought this (order {match.orderNumber}) — how was it?
      </p>

      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={rating === i}
            aria-label={`${i} star${i > 1 ? 's' : ''}`}
            onClick={() => setRating(i)}
            onMouseEnter={() => setHoverRating(i)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                i <= (hoverRating || rating) ? 'fill-accent text-accent' : 'text-border'
              }`}
            />
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <textarea
        required
        placeholder="Share your experience…"
        value={body}
        maxLength={5000}
        rows={4}
        onChange={(e) => setBody(e.target.value)}
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={rating < 1 || !body.trim() || submitting}
        className="mt-3 rounded-full bg-primary px-6 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </form>
  );
}
