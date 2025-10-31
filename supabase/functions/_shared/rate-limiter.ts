/**
 * Phase 1A Security: Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP address
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (for production, use Redis or Supabase)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiter middleware for Edge Functions
 * @param req - Request object
 * @param config - Rate limit configuration
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  req: Request,
  config: RateLimitConfig
): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const identifier = config.identifier || getClientIdentifier(req);
  const now = Date.now();
  
  // Clean up expired entries
  cleanupExpiredEntries(now);
  
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || entry.resetTime < now) {
    // First request or window expired, create new entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    
    return {
      allowed: true,
      remainingRequests: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }
  
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: entry.resetTime,
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(identifier, entry);
  
  return {
    allowed: true,
    remainingRequests: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client identifier from request
 * Uses IP address or fallback to user agent
 */
function getClientIdentifier(req: Request): string {
  // Try to get real IP from various headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || (forwardedFor?.split(',')[0]) || 'unknown';
  
  // Combine with user agent for better uniqueness
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  return `${ip}-${userAgent}`;
}

/**
 * Clean up expired entries to prevent memory leaks
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter,
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': 'Exceeded',
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      },
    }
  );
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  AUTH: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 per minute
  VOLUNTEER_SIGNUP: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  FORM_SUBMISSION: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  API_GENERAL: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
};
