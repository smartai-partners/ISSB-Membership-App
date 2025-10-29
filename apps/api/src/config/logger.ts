import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { getBooleanEnv, getEnv } from './environment';

// Ensure logs directory exists
const logsDir = path.dirname(process.env.LOG_FILE || './logs/app.log');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  ),
);

// Define format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Define which transports the logger must use
const transports: winston.transport[] = [];

// Console transport
if (getBooleanEnv('ENABLE_CONSOLE_LOGGING')) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    })
  );
}

// File transport for all logs
if (getBooleanEnv('ENABLE_FILE_LOGGING')) {
  // All logs
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE || './logs/app.log',
      format: fileFormat,
      maxsize: getEnv('LOG_MAX_SIZE', '20m'),
      maxFiles: getEnv('LOG_MAX_FILES', '5'),
      level: 'info',
    })
  );
  
  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      format: fileFormat,
      maxsize: getEnv('LOG_MAX_SIZE', '20m'),
      maxFiles: getEnv('LOG_MAX_FILES', '3'),
      level: 'error',
    })
  );
  
  // HTTP request logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'requests.log'),
      format: fileFormat,
      maxsize: getEnv('LOG_MAX_SIZE', '20m'),
      maxFiles: getEnv('LOG_MAX_FILES', '3'),
      level: 'http',
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: getEnv('LOG_LEVEL', 'info'),
  levels,
  format: fileFormat,
  transports,
  exitOnError: false,
  
  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: fileFormat,
      maxsize: getEnv('LOG_MAX_SIZE', '20m'),
      maxFiles: getEnv('LOG_MAX_FILES', '3'),
    }),
  ],
  
  // Handle rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: fileFormat,
      maxsize: getEnv('LOG_MAX_SIZE', '20m'),
      maxFiles: getEnv('LOG_MAX_FILES', '3'),
    }),
  ],
});

// Helper functions for structured logging
export const logError = (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
  if (error instanceof Error) {
    logger.error(message, {
      error: error.message,
      stack: error.stack,
      ...meta,
    });
  } else {
    logger.error(message, { error: error || 'Unknown error', ...meta });
  }
};

export const logWarning = (message: string, meta?: Record<string, any>) => {
  logger.warn(message, meta);
};

export const logInfo = (message: string, meta?: Record<string, any>) => {
  logger.info(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, any>) => {
  logger.debug(message, meta);
};

export const logHttp = (message: string, meta?: Record<string, any>) => {
  logger.http(message, meta);
};

// Performance logging
export const logPerformance = (operation: string, duration: number, meta?: Record<string, any>) => {
  const logLevel = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
  
  logger[logLevel](`Performance: ${operation} took ${duration}ms`, {
    operation,
    duration,
    ...meta,
  });
};

// API request logging
export const logRequest = (method: string, url: string, statusCode: number, responseTime: number, userId?: string, ip?: string) => {
  const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  logger[logLevel](`${method} ${url} ${statusCode} ${responseTime}ms`, {
    method,
    url,
    statusCode,
    responseTime,
    userId,
    ip,
  });
};

// Database operation logging
export const logDatabase = (operation: string, collection: string, duration: number, meta?: Record<string, any>) => {
  const logLevel = duration > 1000 ? 'warn' : 'debug';
  
  logger[logLevel](`Database: ${operation} on ${collection} took ${duration}ms`, {
    operation,
    collection,
    duration,
    ...meta,
  });
};

// Authentication logging
export const logAuth = (action: string, success: boolean, userId?: string, email?: string, ip?: string, userAgent?: string) => {
  const logLevel = success ? 'info' : 'warn';
  
  logger[logLevel](`Auth: ${action} ${success ? 'succeeded' : 'failed'}`, {
    action,
    success,
    userId,
    email: email ? '[REDACTED]' : undefined,
    ip,
    userAgent,
  });
};

// Security event logging
export const logSecurity = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: Record<string, any>) => {
  const logLevel = severity === 'critical' || severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
  
  logger[logLevel](`Security: ${event}`, {
    event,
    severity,
    ...details,
  });
};

// Business event logging
export const logBusiness = (event: string, entity: string, action: string, details: Record<string, any>) => {
  logger.info(`Business: ${event} - ${entity}.${action}`, {
    event,
    entity,
    action,
    ...details,
  });
};

export { logger };