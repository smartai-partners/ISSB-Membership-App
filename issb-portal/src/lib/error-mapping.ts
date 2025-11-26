/**
 * Map Supabase errors to user-friendly messages
 */
export function mapSupabaseError(error: any): string {
  if (!error) return 'An unknown error occurred';

  const message = error.message || error.error_description || String(error);

  // Common Supabase error patterns
  if (message.includes('JWT expired')) {
    return 'Your session has expired. Please log in again.';
  }

  if (message.includes('Invalid API key')) {
    return 'Authentication error. Please log in again.';
  }

  if (message.includes('duplicate key')) {
    return 'This record already exists.';
  }

  if (message.includes('foreign key constraint')) {
    return 'Cannot delete this record because it is referenced by other data.';
  }

  if (message.includes('violates check constraint')) {
    return 'Invalid data provided. Please check your input.';
  }

  if (message.includes('permission denied') || message.includes('insufficient_privilege')) {
    return 'You do not have permission to perform this action.';
  }

  if (message.includes('Network request failed') || message.includes('Failed to fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Return original message if no pattern matches
  return message;
}

/**
 * Map HTTP status codes to user-friendly messages
 */
export function mapHttpError(status: number): string {
  switch (status) {
    case 400:
      return 'Bad request. Please check your input.';
    case 401:
      return 'Unauthorized. Please log in.';
    case 403:
      return 'Forbidden. You do not have permission to access this resource.';
    case 404:
      return 'Resource not found.';
    case 409:
      return 'Conflict. This resource already exists.';
    case 422:
      return 'Invalid data provided.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service unavailable. Please try again later.';
    default:
      return `An error occurred (${status})`;
  }
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error_description) {
    return error.error_description;
  }

  if (error?.error) {
    return typeof error.error === 'string' ? error.error : String(error.error);
  }

  return 'An unknown error occurred';
}
