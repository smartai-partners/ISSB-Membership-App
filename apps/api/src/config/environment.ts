import dotenv from 'dotenv';
import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  API_PREFIX: z.string().default('/api/v1'),
  API_VERSION: z.string().default('v1'),
  
  // Database
  MONGODB_URI: z.string(),
  MONGODB_TEST_URI: z.string().optional(),
  
  // Security
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().default('12'),
  SESSION_SECRET: z.string(),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.string().default('true'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  // File Upload
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('10485760'),
  ALLOWED_FILE_TYPES: z.string().default('jpg,jpeg,png,pdf,doc,docx'),
  IMAGE_MAX_WIDTH: z.string().default('2048'),
  IMAGE_MAX_HEIGHT: z.string().default('2048'),
  IMAGE_QUALITY: z.string().default('85'),
  
  // Email
  EMAIL_SERVICE: z.string().default('smtp'),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_SECURE: z.string().default('false'),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@issb.org'),
  EMAIL_FROM_NAME: z.string().default('ISSB Membership Portal'),
  
  // Logging
  LOG_LEVEL: z.string().default('info'),
  LOG_FILE: z.string().default('./logs/app.log'),
  LOG_MAX_SIZE: z.string().default('20m'),
  LOG_MAX_FILES: z.string().default('5'),
  ENABLE_FILE_LOGGING: z.string().default('true'),
  ENABLE_CONSOLE_LOGGING: z.string().default('true'),
  ENABLE_COLORIZED_LOGGING: z.string().default('true'),
  
  // Development
  DEBUG: z.string().default('false'),
  VERBOSE_LOGGING: z.string().default('false'),
  HOT_RELOAD: z.string().default('true'),
  ENABLE_API_DOCS: z.string().default('false'),
  
  // Membership Settings
  DEFAULT_MEMBERSHIP_TIER: z.string().default('regular'),
  MAX_PENDING_APPLICATIONS: z.string().default('50'),
  BOARD_MEMBERSHIP_DURATION: z.string().default('365'),
  APPLICATION_REVIEW_DAYS: z.string().default('30'),
  EVENT_REGISTRATION_DEADLINE_DAYS: z.string().default('7'),
  
  // Validation
  MIN_PASSWORD_LENGTH: z.string().default('8'),
  MAX_PASSWORD_LENGTH: z.string().default('128'),
  EMAIL_VERIFICATION_REQUIRED: z.string().default('true'),
  PHONE_VERIFICATION_REQUIRED: z.string().default('false'),
  REQUIRE_TWO_FACTOR_AUTH: z.string().default('false'),
  
  // Document Validation
  VERIFY_DOCUMENTS: z.string().default('true'),
  REQUIRE_REFERENCES: z.string().default('true'),
  REFERENCE_VERIFICATION_REQUIRED: z.string().default('true'),
});

// Environment variable interface
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: string;
  API_PREFIX: string;
  API_VERSION: string;
  
  // Database
  MONGODB_URI: string;
  MONGODB_TEST_URI?: string;
  
  // Security
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  BCRYPT_ROUNDS: string;
  SESSION_SECRET: string;
  
  // CORS
  CORS_ORIGIN: string;
  CORS_CREDENTIALS: string;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
  
  // File Upload
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: string;
  ALLOWED_FILE_TYPES: string;
  IMAGE_MAX_WIDTH: string;
  IMAGE_MAX_HEIGHT: string;
  IMAGE_QUALITY: string;
  
  // Email
  EMAIL_SERVICE: string;
  EMAIL_HOST?: string;
  EMAIL_PORT?: string;
  EMAIL_SECURE: string;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  EMAIL_FROM: string;
  EMAIL_FROM_NAME: string;
  
  // Logging
  LOG_LEVEL: string;
  LOG_FILE: string;
  LOG_MAX_SIZE: string;
  LOG_MAX_FILES: string;
  ENABLE_FILE_LOGGING: string;
  ENABLE_CONSOLE_LOGGING: string;
  ENABLE_COLORIZED_LOGGING: string;
  
  // Development
  DEBUG: string;
  VERBOSE_LOGGING: string;
  HOT_RELOAD: string;
  ENABLE_API_DOCS: string;
  
  // Membership Settings
  DEFAULT_MEMBERSHIP_TIER: string;
  MAX_PENDING_APPLICATIONS: string;
  BOARD_MEMBERSHIP_DURATION: string;
  APPLICATION_REVIEW_DAYS: string;
  EVENT_REGISTRATION_DEADLINE_DAYS: string;
  
  // Validation
  MIN_PASSWORD_LENGTH: string;
  MAX_PASSWORD_LENGTH: string;
  EMAIL_VERIFICATION_REQUIRED: string;
  PHONE_VERIFICATION_REQUIRED: string;
  REQUIRE_TWO_FACTOR_AUTH: string;
  
  // Document Validation
  VERIFY_DOCUMENTS: string;
  REQUIRE_REFERENCES: string;
  REFERENCE_VERIFICATION_REQUIRED: string;
}

// Load environment variables
const loadEnvironmentVariables = (): Environment => {
  // Load environment variables from .env file
  dotenv.config();
  
  try {
    // Validate environment variables
    const validatedEnv = envSchema.parse(process.env);
    
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Environment variables validation failed:\n${missingVars}`);
    }
    throw error;
  }
};

// Validate environment for specific contexts
const validateEnvironment = (context: 'development' | 'production' | 'test' = 'development'): Environment => {
  const env = loadEnvironmentVariables();
  
  // Check for critical missing variables
  const criticalVars = ['MONGODB_URI', 'JWT_SECRET', 'SESSION_SECRET'];
  const missingCritical = criticalVars.filter(varName => !process.env[varName]);
  
  if (missingCritical.length > 0) {
    throw new Error(`Missing critical environment variables: ${missingCritical.join(', ')}`);
  }
  
  // Validate database URI
  if (!env.MONGODB_URI.startsWith('mongodb://') && !env.MONGODB_URI.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }
  
  // Validate JWT secrets
  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  if (context !== 'test' && env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
    throw new Error('JWT_SECRET must be changed from the default value in production');
  }
  
  // Validate file size limits
  const maxFileSize = parseInt(env.MAX_FILE_SIZE);
  if (isNaN(maxFileSize) || maxFileSize <= 0) {
    throw new Error('MAX_FILE_SIZE must be a valid positive number');
  }
  
  // Validate allowed file types
  const allowedTypes = env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim().toLowerCase());
  const invalidTypes = allowedTypes.filter(type => !/^[a-z0-9]+$/i.test(type));
  
  if (invalidTypes.length > 0) {
    throw new Error(`Invalid file types found: ${invalidTypes.join(', ')}`);
  }
  
  return env;
};

// Type-safe environment access
const env = loadEnvironmentVariables();

// Environment validation functions
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isProduction = () => env.NODE_ENV === 'production';
export const isTest = () => env.NODE_ENV === 'test';

// Utility functions
export const getEnv = (key: keyof Environment, defaultValue?: string): string => {
  return process.env[key] || defaultValue || '';
};

export const getBooleanEnv = (key: keyof Environment, defaultValue: boolean = false): boolean => {
  const value = process.env[key]?.toLowerCase();
  return value === 'true' ? true : value === 'false' ? false : defaultValue;
};

export const getNumberEnv = (key: keyof Environment, defaultValue: number = 0): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

export const getArrayEnv = (key: keyof Environment, separator: string = ','): string[] => {
  const value = process.env[key];
  return value ? value.split(separator).map(item => item.trim()) : [];
};

export {
  env,
  loadEnvironmentVariables,
  validateEnvironment,
};