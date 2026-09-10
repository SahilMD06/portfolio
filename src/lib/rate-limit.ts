import 'server-only';

/**
 * Fixed-window rate limiter held in process memory.
 *
 * Deliberately simple: this protects the login form and the contact form on a
 * single-instance deployment. It is NOT shared across serverless instances — if
 * the site is ever scaled horizontally this should move to Redis or Postgres.
 * Documented as a known limitation in README.md.
 */

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

/** Bounded so a flood of unique keys cannot grow the map without limit. */
const MAX_KEYS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
      if (buckets.size >= MAX_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * Best-effort client identifier. Only trusted behind a proxy that sets these
 * headers (Vercel does); it is a throttling hint, never an authorisation input.
 */
export function clientKey(headers: Headers, scope: string): string {
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown';
  return `${scope}:${ip}`;
}
