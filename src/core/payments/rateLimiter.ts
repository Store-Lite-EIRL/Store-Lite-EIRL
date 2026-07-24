/**
 * RateLimiter — Sliding window rate limiter.
 *
 * Tracks request timestamps per key and allows/denies based on
 * a configurable window and max requests per window.
 */
export class RateLimiter {
  private store = new Map<string, number[]>();
  private readonly window: number;
  private readonly maxRequests: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(windowMs = 30_000, maxRequests = 3) {
    this.window = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if a request for the given key is allowed.
   * Returns `true` if under the limit, `false` if rate-limited.
   */
  check(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.window;

    let timestamps = this.store.get(key) ?? [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= this.maxRequests) {
      return false;
    }

    timestamps.push(now);
    this.store.set(key, timestamps);
    return true;
  }

  /**
   * Start periodic cleanup of stale entries to prevent memory leaks.
   */
  startCleanup(intervalMs = 60_000): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.store) {
        const valid = timestamps.filter((t) => t > now - this.window);
        if (valid.length === 0) {
          this.store.delete(key);
        } else {
          this.store.set(key, valid);
        }
      }
    }, intervalMs);
  }

  /**
   * Stop the cleanup interval.
   */
  stopCleanup(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Module-level singleton for the payment charge route.
 */
export const paymentRateLimiter = new RateLimiter();
paymentRateLimiter.startCleanup();
