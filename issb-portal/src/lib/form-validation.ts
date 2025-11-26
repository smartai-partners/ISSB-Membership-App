import { z } from 'zod';

/**
 * Email validation
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Phone validation
 */
export const phoneSchema = z.string().regex(
  /^\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
  'Invalid phone number format'
);

/**
 * Password validation
 */
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Name validation
 */
export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters');

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

/**
 * Validate phone
 */
export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

/**
 * Validate password
 */
export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate name
 */
export function validateName(name: string): ValidationResult {
  const result = nameSchema.safeParse(name);
  return {
    valid: result.success,
    error: result.success ? undefined : result.error.errors[0]?.message,
  };
}

/**
 * Validate role
 */
export function validateRole(role: string): ValidationResult {
  const validRoles = ['user', 'admin', 'board', 'volunteer'];
  const valid = validRoles.includes(role);
  return {
    valid,
    error: valid ? undefined : 'Invalid role. Must be one of: user, admin, board, volunteer',
  };
}

/**
 * Validate status
 */
export function validateStatus(status: string): ValidationResult {
  const validStatuses = ['active', 'inactive', 'pending', 'suspended'];
  const valid = validStatuses.includes(status);
  return {
    valid,
    error: valid ? undefined : 'Invalid status. Must be one of: active, inactive, pending, suspended',
  };
}
