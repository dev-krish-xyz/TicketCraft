/**
 * Simple in-memory token bucket rate limiter.
 * Tracks requests per minute per AI provider.
 */

interface BucketState {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, BucketState>();

const LIMITS: Record<string, number> = {
  gemini: 14, // Stay slightly under the 15 RPM limit
  groq: 28, // Groq free tier is ~30 RPM
};

export function canMakeRequest(provider: string): boolean {
  const limit = LIMITS[provider] ?? 10;
  const now = Date.now();
  const bucket = buckets.get(provider);

  if (!bucket || now - bucket.lastRefill > 60_000) {
    buckets.set(provider, { tokens: limit - 1, lastRefill: now });
    return true;
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return true;
  }

  return false;
}

export function getRemainingTokens(provider: string): number {
  const bucket = buckets.get(provider);
  if (!bucket) return LIMITS[provider] ?? 10;
  if (Date.now() - bucket.lastRefill > 60_000) return LIMITS[provider] ?? 10;
  return bucket.tokens;
}
