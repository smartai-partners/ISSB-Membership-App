import { clsx, type ClassValue } from 'clsx';

/**
 * Utility function to merge class names
 * Combines clsx for conditional classes with custom handling
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}