import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import kvIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache';

/**
 * Persist Next.js's ISR / fetch cache to the `NEXT_CACHE_WORKERS_KV` KV
 * namespace. Without this, every request walks the upstream Tyashin API
 * (which then walks Mongo in asia-south1) — ~2.5s TTFB from Canadian POPs,
 * ~1-2s from Indian POPs. With KV-backed caching, the first request per URL
 * pays that cost; subsequent requests within the revalidation window are
 * ~50ms regardless of POP.
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
});
