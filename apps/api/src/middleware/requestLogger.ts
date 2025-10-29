import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../config/logger';

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Request logging middleware
export const requestLogger = (req: RequestWithUser, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    contentLength: req.get('Content-Length'),
  };
  
  // Log the incoming request
  if (process.env.NODE_ENV === 'development') {
    console.log(`📝 [REQUEST] ${req.method} ${req.originalUrl}`, requestInfo);
  }

  // Override res.end to log response
  const originalEnd = res.end;
  const originalWrite = res.write;
  let responseBody = '';
  
  res.end = function(chunk: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    // Log the response
    logRequest(
      req.method,
      req.originalUrl,
      res.statusCode,
      duration,
      req.user?.id,
      req.ip || req.connection.remoteAddress
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 [RESPONSE] ${res.statusCode} ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.id,
        contentLength: res.get('Content-Length'),
      });
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add HSTS header only in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Validate content type for POST, PUT, PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (contentType) {
      if (contentType.includes('application/json') && !req.body) {
        return res.status(400).json({
          success: false,
          message: 'Request body is required for this content type',
          timestamp: new Date().toISOString(),
        });
      }
      
      if (contentType.includes('multipart/form-data') && !req.file && !req.files) {
        // This is okay for multipart form data, file might be optional
        if (process.env.NODE_ENV === 'development') {
          console.log('ℹ️ [INFO] Multipart form data without file');
        }
      }
    }
  }
  
  // Validate query parameters size
  if (Object.keys(req.query).length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Too many query parameters',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Validate request body size (basic check)
  const contentLength = req.get('Content-Length');
  if (contentLength) {
    const maxBodySize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
    if (parseInt(contentLength) > maxBodySize) {
      return res.status(413).json({
        success: false,
        message: 'Request body too large',
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  next();
};

// API key middleware (for internal APIs)
export const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.get('X-API-Key');
  const validApiKey = process.env.API_KEY;
  
  if (!validApiKey) {
    return res.status(503).json({
      success: false,
      message: 'API key validation not configured',
      timestamp: new Date().toISOString(),
    });
  }
  
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing API key',
      timestamp: new Date().toISOString(),
    });
  }
  
  next();
};

// Request timeout middleware
export const requestTimeout = (req: Request, res: Response, next: NextFunction) => {
  const timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000'); // 30 seconds default
  
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout',
        timestamp: new Date().toISOString(),
      });
    }
  }, timeout);
  
  // Clear timeout when response is sent
  res.on('finish', () => {
    clearTimeout(timeoutId);
  });
  
  res.on('close', () => {
    clearTimeout(timeoutId);
  });
  
  next();
};

// CORS preflight handler
export const corsPreflight = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    
    if (process.env.CORS_CREDENTIALS === 'true') {
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    return res.status(200).json({
      success: true,
      message: 'CORS preflight successful',
      timestamp: new Date().toISOString(),
    });
  }
  
  next();
};