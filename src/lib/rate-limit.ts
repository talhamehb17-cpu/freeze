import "server-only";

import { serverEnv } from "@/lib/env";

/**
 * In-process sliding-window rate limiter (spec §38).
 *
 * Single-instance safe and dependency-free. For a multi-instance deployment,
 * swap `store` for Redis/Upstash behind the same interface — callers do not
 * change.
 */

interface Bucket {
  hits: number[];
}

const store = new Map<string, Bucket>();
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  const windowMs = serverEnv.rateLimit.windowSeconds * 1000;
  for (const [key, bucket] of store) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
    if (bucket.hits.length === 0) store.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  limit: number;
  resetSeconds: number;
}

export function rateLimit(key: string, overrides?: { max?: number; windowSeconds?: number }): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const max = overrides?.max ?? serverEnv.rateLimit.max;
  const windowMs = (overrides?.windowSeconds ?? serverEnv.rateLimit.windowSeconds) * 1000;

  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= max) {
    store.set(key, bucket);
    const oldest = bucket.hits[0] ?? now;
    return {
      ok: false,
      remaining: 0,
      limit: max,
      resetSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.hits.push(now);
  store.set(key, bucket);
  return {
    ok: true,
    remaining: max - bucket.hits.length,
    limit: max,
    resetSeconds: Math.ceil(windowMs / 1000),
  };
}

/** Clear a bucket after a successful human action (e.g. a completed signup). */
export function releaseRateLimit(key: string) {
  store.delete(key);
}
