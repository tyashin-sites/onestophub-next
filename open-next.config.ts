import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import kvIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache';
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue';

/**
 * Persist Next.js's ISR / fetch cache to the `NEXT_CACHE_WORKERS_KV` KV
 * namespace. Without this, every request walks the upstream Tyashin API
 * (which then walks Mongo in asia-south1) — ~2.5s TTFB from Canadian POPs,
 * ~1-2s from Indian POPs. With KV-backed caching, the first request per URL
 * pays that cost; subsequent requests within the revalidation window are
 * ~50ms regardless of POP.
 */
// queue: without it OpenNext uses a dummy queue and stale ISR pages are never
// regenerated (x-nextjs-cache: STALE until the next deploy). Needs the
// NEXT_CACHE_DO_QUEUE Durable Object + WORKER_SELF_REFERENCE binding in
// wrangler.jsonc — tyashin-platform CLAUDE.md §12c-bis.
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: doQueue,
});
