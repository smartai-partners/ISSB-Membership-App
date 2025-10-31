/**
 * Phase 1A Security: Security Headers for Edge Functions
 * Provides protection against common web vulnerabilities
 */

export interface SecurityHeadersConfig {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  additionalHeaders?: Record<string, string>;
}

/**
 * Get comprehensive security headers
 */
export function getSecurityHeaders(config: SecurityHeadersConfig = {}): HeadersInit {
  const headers: Record<string, string> = {
    // Prevent clickjacking attacks
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable browser XSS protection (legacy but still useful)
    'X-XSS-Protection': '1; mode=block',
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Prevent DNS prefetching
    'X-DNS-Prefetch-Control': 'off',
    
    // Disable client-side caching for sensitive data
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
  
  // Content Security Policy (CSP)
  if (config.enableCSP !== false) {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://timing.athanplus.com https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://timing.athanplus.com https://maps.googleapis.com",
      "frame-src 'self' https://timing.athanplus.com https://maps.googleapis.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
  }
  
  // HTTP Strict Transport Security (HSTS)
  if (config.enableHSTS !== false) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }
  
  // Permissions Policy (formerly Feature Policy)
  headers['Permissions-Policy'] = [
    'geolocation=(self)',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', ');
  
  // Add additional headers if provided
  if (config.additionalHeaders) {
    Object.assign(headers, config.additionalHeaders);
  }
  
  return headers;
}

/**
 * Get CORS headers for Edge Functions
 */
export function getCorsHeaders(allowedOrigins?: string[]): HeadersInit {
  const origin = allowedOrigins ? allowedOrigins.join(', ') : '*';
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false',
  };
}

/**
 * Combine security headers with CORS headers
 */
export function getCompleteHeaders(config?: SecurityHeadersConfig): HeadersInit {
  return {
    ...getCorsHeaders(),
    ...getSecurityHeaders(config),
    'Content-Type': 'application/json',
  };
}
