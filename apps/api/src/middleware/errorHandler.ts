import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Zod validation errors
const handleZodError = (error: ZodError) => {
  const errors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return {
    statusCode: 400,
    message: 'Validation failed',
    errors,
  };
};

// Handle Mongoose validation errors
const handleMongooseError = (error: mongoose.Error.ValidationError) => {
  const errors = Object.values(error.errors).map(err => ({
    field: err.path,
    message: err.message,
    code: err.kind,
  }));

  return {
    statusCode: 400,
    message: 'Database validation failed',
    errors,
  };
};

// Handle Mongoose duplicate key errors
const handleMongooseDuplicateKey = (error: any) => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];

  return {
    statusCode: 409,
    message: 'Duplicate value',
    errors: [{
      field,
      message: `${field} '${value}' already exists`,
      code: 'DUPLICATE',
    }],
  };
};

// Handle Mongoose cast errors
const handleMongooseCastError = (error: mongoose.Error.CastError) => {
  return {
    statusCode: 400,
    message: 'Invalid ID format',
    errors: [{
      field: error.path,
      message: `Invalid ${error.path}: ${error.value}`,
      code: 'INVALID_ID',
    }],
  };
};

// Send error in development
const sendErrorDev = (err: any, res: Response) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });
};

// Send error in production
const sendErrorProd = (err: any, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR:', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      timestamp: new Date().toISOString(),
    });
  }
};

// Main error handling middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';

  // Log error
  logger.error(`Error: ${err.message}`, {
    statusCode: error.statusCode,
    status: error.status,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  });

  // Handle specific error types
  if (err instanceof ZodError) {
    const { statusCode, message, errors } = handleZodError(err);
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const { statusCode, message, errors } = handleMongooseError(err);
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  if (err.code === 11000) {
    const { statusCode, message, errors } = handleMongooseDuplicateKey(err);
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    const { statusCode, message, errors } = handleMongooseCastError(err);
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again.';
    error = new AppError(message, 401);
  }

  // Handle Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new AppError(message, 400);
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(err);
};