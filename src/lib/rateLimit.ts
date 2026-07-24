// =====================================================
// IN-MEMORY RATE LIMITER (Edge Runtime)
// =====================================================
// Simple sliding window rate limiter for MVP.
// Zero external dependencies, works in Edge Runtime.
//
// Future: swap the Map store with Upstash Redis for
// production multi-instance support.
// =====================================================

import { type NextRequest } from 'next/server';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests allowed in window
}

interface RateLimitEntry {
  count: number;
  resetAt: number; // Timestamp when the window resets
}

// Per-path-type rate limit configs
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 requests per 15min
  api: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 requests per minute
  storefront: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
};

// In-memory store (per-edge-instance). For MVP this is fine.
// Future: swap with Upstash Redis for production multi-instance support.
const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Simple sliding window rate limiter for Edge Runtime.
 * Returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  identifier: string, // e.g. IP or userId
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetInMs: number } {
  cleanup();

  const now = Date.now();
  const key = `${identifier}:${config.windowMs}`;
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetInMs: config.windowMs };
  }

  entry.count += 1;
  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetInMs: entry.resetAt - now };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetInMs: entry.resetAt - now,
  };
}

/**
 * Extracts a client identifier from the request.
 * Priority: x-forwarded-for > x-real-ip > cf-connecting-ip > fallback
 */
export function getClientIdentifier(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    'unknown'
  );
}
