import { z } from 'zod';
import { ValidationError } from '@issb/types';

// ============================================================================
// COMMON VALIDATION HELPERS
// ============================================================================

/**
 * Email validation with common patterns
 */
export const emailSchema = z.string().email('Please provide a valid email address');

/**
 * Password validation with strength requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot be more than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
  );

/**
 * Password confirmation validation
 */
export const passwordConfirmationSchema = z.string().min(1, 'Password confirmation is required');

/**
 * Name validation (first name, last name)
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name cannot be more than 50 characters')
  .regex(
    /^[a-zA-Z\s'-]+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  );

/**
 * Phone number validation (international format)
 */
export const phoneSchema = z
  .string()
  .regex(
    /^[\+]?[1-9][\d]{0,15}$/,
    'Please provide a valid phone number'
  )
  .optional()
  .or(z.literal('').transform(() => undefined));

/**
 * URL validation for websites, social media links
 */
export const urlSchema = z
  .string()
  .url('Please provide a valid URL')
  .optional()
  .or(z.literal('').transform(() => undefined));

/**
 * Date validation for birth dates, etc.
 */
export const dateSchema = z
  .string()
  .refine(
    (val) => !isNaN(Date.parse(val)),
    'Please provide a valid date'
  )
  .transform((val) => new Date(val));

/**
 * Optional date validation
 */
export const optionalDateSchema = z
  .string()
  .optional()
  .or(z.literal('').transform(() => undefined))
  .refine(
    (val) => !val || !isNaN(Date.parse(val)),
    'Please provide a valid date'
  )
  .transform((val) => (val ? new Date(val) : undefined));

/**
 * Pagination validation schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

/**
 * Sort validation schema
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Search validation schema
 */
export const searchSchema = z.object({
  search: z.string().optional(),
});

/**
 * Date range validation schema
 */
export const dateRangeSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
}).refine(
  (data) => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo,
  {
    message: 'Start date must be before or equal to end date',
    path: ['dateFrom'],
  }
);

/**
 * MongoDB ObjectId validation
 */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

/**
 * Array validation for enums
 */
export const enumArraySchema = <T extends z.ZodTypeAny>(enumSchema: T) =>
  z.array(enumSchema).optional().or(z.literal('').transform(() => undefined));

/**
 * Boolean validation with optional transformation
 */
export const optionalBooleanSchema = z
  .coerce.boolean()
  .optional()
  .or(z.literal('true').transform(() => true))
  .or(z.literal('false').transform(() => false));

/**
 * Social media URL validation (allows common platforms)
 */
export const socialMediaUrlSchema = z
  .string()
  .url('Please provide a valid URL')
  .refine(
    (url) => {
      const socialDomains = [
        'linkedin.com',
        'twitter.com',
        'instagram.com',
        'facebook.com',
        'github.com',
        'youtube.com',
        'tiktok.com',
        'pinterest.com',
      ];
      return socialDomains.some((domain) => url.toLowerCase().includes(domain));
    },
    'Please provide a valid social media URL'
  )
  .optional()
  .or(z.literal('').transform(() => undefined));

/**
 * Bio validation (for user profiles)
 */
export const bioSchema = z
  .string()
  .max(500, 'Bio cannot be more than 500 characters')
  .optional()
  .or(z.literal('').transform(() => undefined));

/**
 * Location validation
 */
export const locationSchema = z
  .string()
  .max(100, 'Location cannot be more than 100 characters')
  .optional()
  .or(z.literal('').transform(() => undefined));

/**
 * Organization/Company validation
 */
export const organizationSchema = z
  .string()
  .max(100, 'Organization cannot be more than 100 characters')
  .optional()
  .or(z.literal('').transform(() => undefined));

/**
 * Occupation validation
 */
export const occupationSchema = z
  .string()
  .max(100, 'Occupation cannot be more than 100 characters')
  .optional()
  .or(z.literal('').transform(() => undefined));

/**
 * Website URL validation (more lenient than general URL)
 */
export const websiteSchema = urlSchema;

/**
 * Array of strings validation with length limits
 */
export const stringArraySchema = (maxLength = 50, maxItems = 10) =>
  z.array(z.string().max(maxLength)).max(maxItems).optional();

/**
 * Language code validation (ISO 639-1)
 */
export const languageCodeSchema = z
  .string()
  .regex(/^[a-z]{2}$/, 'Language code must be 2 lowercase letters (e.g., en, es, fr)')
  .optional()
  .or(z.literal('').transform(() => undefined));

/**
 * String array for languages/certifications/interests
 */
export const languagesSchema = stringArraySchema(50, 10);
export const interestsSchema = stringArraySchema(50, 20);

/**
 * Certification validation schema
 */
export const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required').max(100),
  issuingOrganization: z.string().min(1, 'Issuing organization is required').max(100),
  issueDate: dateSchema,
  expiryDate: optionalDateSchema.optional(),
  certificateNumber: z.string().max(100).optional(),
  url: urlSchema.optional(),
  verified: z.boolean().default(false),
});

/**
 * Experience validation schema
 */
export const experienceSchema = z.object({
  organization: z.string().min(1, 'Organization is required').max(100),
  position: z.string().min(1, 'Position is required').max(100),
  startDate: dateSchema,
  endDate: optionalDateSchema.optional(),
  description: z.string().max(500).optional(),
  type: z.enum(['professional', 'volunteer', 'education', 'certification']),
});

/**
 * Reference validation schema
 */
export const referenceSchema = z.object({
  name: z.string().min(1, 'Reference name is required').max(100),
  email: emailSchema,
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format'),
  organization: z.string().min(1, 'Organization is required').max(100),
  relationship: z.string().min(1, 'Relationship is required').max(100),
  yearsKnown: z.coerce.number().min(0).max(50),
  verified: z.boolean().default(false),
});

// ============================================================================
// VALIDATION ERROR FORMATTING
// ============================================================================

/**
 * Format Zod validation errors into a standardized format
 */
export const formatZodErrors = (error: z.ZodError): ValidationError[] => {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
};

/**
 * Format validation errors for API response
 */
export const formatValidationErrors = (errors: ValidationError[]): Record<string, string> => {
  const formatted: Record<string, string> = {};
  errors.forEach((error) => {
    formatted[error.field] = error.message;
  });
  return formatted;
};

/**
 * Create a comprehensive error response
 */
export const createValidationErrorResponse = (
  errors: ValidationError[],
  message = 'Validation failed'
) => ({
  success: false,
  message,
  errors,
  timestamp: new Date().toISOString(),
});

/**
 * Validate and format data with error handling
 */
export const validateData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage = 'Validation failed'
): { success: true; data: T } | { success: false; errors: ValidationError[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: formatZodErrors(error) };
    }
    return {
      success: false,
      errors: [
        {
          field: 'general',
          message: 'An unexpected error occurred',
          code: 'unknown_error',
        },
      ],
    };
  }
};

/**
 * Validate query parameters with pagination, sorting, and filtering
 */
export const createQueryValidator = <T extends z.ZodTypeAny>(
  baseSchema: T
) => {
  return z.object({
    ...baseSchema.shape,
    ...paginationSchema.shape,
    ...sortSchema.shape,
    ...searchSchema.shape,
    ...dateRangeSchema.shape,
  });
};

// ============================================================================
// REGEX PATTERNS (for reference)
// ============================================================================

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  OBJECT_ID: /^[0-9a-fA-F]{24}$/,
  LANGUAGE_CODE: /^[a-z]{2}$/,
  NAME: /^[a-zA-Z\s'-]+$/,
};

// ============================================================================
// EXPORTS
// ============================================================================

export * from 'zod';
export {
  emailSchema,
  passwordSchema,
  passwordConfirmationSchema,
  nameSchema,
  phoneSchema,
  urlSchema,
  dateSchema,
  optionalDateSchema,
  paginationSchema,
  sortSchema,
  searchSchema,
  dateRangeSchema,
  objectIdSchema,
  enumArraySchema,
  optionalBooleanSchema,
  socialMediaUrlSchema,
  bioSchema,
  locationSchema,
  organizationSchema,
  occupationSchema,
  websiteSchema,
  stringArraySchema,
  languageCodeSchema,
  languagesSchema,
  interestsSchema,
  certificationSchema,
  experienceSchema,
  referenceSchema,
  formatZodErrors,
  formatValidationErrors,
  createValidationErrorResponse,
  validateData,
  createQueryValidator,
  REGEX_PATTERNS,
};
