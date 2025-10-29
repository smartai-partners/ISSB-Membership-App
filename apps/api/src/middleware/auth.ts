import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { logAuth, logSecurity } from '../config/logger';
import User from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tier: string;
  };
}

// Generate JWT token
export const generateToken = (payload: any, expiresIn: string = '15m'): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn });
};

// Generate refresh token
export const generateRefreshToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

// Verify refresh token
export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
};

// Authentication middleware
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      logAuth('No token provided', false, undefined, undefined, req.ip, req.get('User-Agent'));
      return next(new AppError('Access denied. No token provided.', 401));
    }

    // Verify token
    const decoded: any = verifyToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.id).select('+email');
    if (!user) {
      logAuth('User not found', false, decoded.id, decoded.email, req.ip, req.get('User-Agent'));
      return next(new AppError('Token is no longer valid. User not found.', 401));
    }

    // Check if user is active
    if (user.status !== 'active') {
      logAuth('Inactive user', false, user._id.toString(), user.email, req.ip, req.get('User-Agent'));
      return next(new AppError('Account is not active. Please contact support.', 401));
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Grant access to protected route
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tier: user.tier,
    };

    logAuth('Authentication successful', true, user._id.toString(), user.email, req.ip, req.get('User-Agent'));
    next();
  } catch (error) {
    logAuth('Authentication failed', false, undefined, undefined, req.ip, req.get('User-Agent'));
    
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired. Please log in again.', 401));
    }
    
    next(new AppError('Authentication failed', 500));
  }
};

// Role-based authorization
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Access denied. User not authenticated.', 401));
    }

    if (!roles.includes(req.user.role)) {
      logSecurity('Unauthorized role access', 'medium', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        resource: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      return next(new AppError('Access denied. Insufficient permissions.', 403));
    }

    next();
  };
};

// Tier-based authorization (for membership tiers)
export const authorizeTier = (...tiers: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Access denied. User not authenticated.', 401));
    }

    if (!tiers.includes(req.user.tier)) {
      logSecurity('Unauthorized tier access', 'medium', {
        userId: req.user.id,
        userTier: req.user.tier,
        requiredTiers: tiers,
        resource: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      return next(new AppError('Access denied. Insufficient membership tier.', 403));
    }

    next();
  };
};

// Combined role and tier authorization
export const authorizeAccess = (roles: string[] = [], tiers: string[] = []) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Access denied. User not authenticated.', 401));
    }

    const hasRole = roles.length === 0 || roles.includes(req.user.role);
    const hasTier = tiers.length === 0 || tiers.includes(req.user.tier);

    if (!hasRole || !hasTier) {
      logSecurity('Unauthorized access attempt', 'medium', {
        userId: req.user.id,
        userRole: req.user.role,
        userTier: req.user.tier,
        requiredRoles: roles,
        requiredTiers: tiers,
        resource: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      return next(new AppError('Access denied. Insufficient permissions.', 403));
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded: any = verifyToken(token);
    const user = await User.findById(decoded.id).select('+email');
    
    if (user && user.status === 'active') {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        tier: user.tier,
      };
    }
  } catch (error) {
    // Silently continue without authentication
    if (process.env.NODE_ENV === 'development') {
      console.log('Optional auth failed:', error.message);
    }
  }

  next();
};

// Check if user owns the resource
export const checkOwnership = (userIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Access denied. User not authenticated.', 401));
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
    
    // Admins and board members can access any resource
    if (req.user.role === 'admin' || req.user.role === 'board') {
      return next();
    }

    // Regular users can only access their own resources
    if (resourceUserId && resourceUserId !== req.user.id) {
      logSecurity('Unauthorized resource access attempt', 'high', {
        userId: req.user.id,
        userRole: req.user.role,
        resourceUserId,
        resource: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      return next(new AppError('Access denied. You can only access your own resources.', 403));
    }

    next();
  };
};

// Rate limiting for sensitive operations
export const sensitiveOperationLimit = (maxAttempts: number = 3, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; firstAttempt: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const userAttempts = attempts.get(key);

    if (!userAttempts) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }

    // Reset if window has passed
    if (now - userAttempts.firstAttempt > windowMs) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      logSecurity('Rate limit exceeded for sensitive operation', 'high', {
        userId: req.user?.id,
        ip: req.ip,
        attempts: userAttempts.count,
        windowMs,
        resource: req.originalUrl,
        method: req.method,
      });
      
      return next(new AppError('Too many attempts. Please try again later.', 429));
    }

    userAttempts.count++;
    next();
  };
};