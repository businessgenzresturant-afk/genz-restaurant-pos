/**
 * Rate Limiting Middleware
 * 
 * Implements in-memory rate limiting to prevent abuse and DDoS attacks.
 * 
 * PRODUCTION NOTE: For production deployments with multiple servers,
 * replace this with a distributed rate limiter using Redis:
 * - npm install @upstash/ratelimit @upstash/redis
 * - Use Upstash Redis or similar service
 */

import { RATE_LIMIT } from './constants';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetAt < now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  check(identifier: string, maxRequests: number, windowMs: number): { success: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || entry.resetAt < now) {
      // New window
      const resetAt = now + windowMs;
      this.store.set(identifier, { count: 1, resetAt });
      return { success: true, remaining: maxRequests - 1, resetAt };
    }

    if (entry.count >= maxRequests) {
      // Rate limit exceeded
      return { success: false, remaining: 0, resetAt: entry.resetAt };
    }

    // Increment count
    entry.count++;
    this.store.set(identifier, entry);
    return { success: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

// Singleton instance
const rateLimiter = new InMemoryRateLimiter();

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom identifier (defaults to IP address) */
  identifier?: string;
}

/**
 * Rate limit check for API routes
 * @param request - The incoming request
 * @param config - Rate limit configuration
 * @returns Object with success status and rate limit info
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetAt: number } {
  // Get identifier (IP address or custom)
  const identifier = config.identifier || getClientIdentifier(request);
  
  return rateLimiter.check(identifier, config.maxRequests, config.windowMs);
}

/**
 * Get client identifier from request (IP address or fallback)
 */
function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const headers = request.headers;
  
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Preset configurations for common rate limit scenarios
 */
export const RateLimitPresets = {
  /** Strict limit for authentication endpoints */
  AUTH: RATE_LIMIT.AUTH as RateLimitConfig,
  
  /** Standard limit for API endpoints */
  API: RATE_LIMIT.API as RateLimitConfig,
  
  /** Generous limit for read-only endpoints */
  READ: RATE_LIMIT.READ as RateLimitConfig,
  
  /** Very generous limit for public KDS displays */
  PUBLIC: RATE_LIMIT.PUBLIC as RateLimitConfig,
};

/**
 * Helper to create rate limit response
 */
export function createRateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}
