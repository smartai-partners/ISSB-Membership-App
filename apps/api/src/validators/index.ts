// ============================================================================
// VALIDATORS INDEX
// ============================================================================
// Central export point for all validators and validation utilities

// ============================================================================
// USER VALIDATORS
// ============================================================================

export * from './UserValidators';

// ============================================================================
// COMMON VALIDATION HELPERS
// ============================================================================

export * from './helpers';

// ============================================================================
// MEMBERSHIP VALIDATORS
// ============================================================================

export {
  createMembershipSchema,
  updateMembershipSchema,
  renewMembershipSchema,
  upgradeMembershipSchema,
  cancelMembershipSchema,
  membershipFilterSchema,
  membershipSearchSchema,
  bulkUpdateMembershipsSchema,
  bulkRenewMembershipsSchema,
  membershipAnalyticsSchema,
  membershipReportSchema,
  processPaymentSchema,
  refundSchema,
  MembershipValidators,
  validateMembershipDates,
  canRenewMembership,
  calculateProration,
  validateDiscountCode,
} from './MembershipValidators';

export type {
  CreateMembershipInput,
  UpdateMembershipInput,
  RenewMembershipInput,
  UpgradeMembershipInput,
  CancelMembershipInput,
  MembershipFilterInput,
  MembershipSearchInput,
  BulkUpdateMembershipsInput,
  BulkRenewMembershipsInput,
  MembershipAnalyticsInput,
  MembershipReportInput,
  ProcessPaymentInput,
  RefundInput,
} from './MembershipValidators';

// ============================================================================
// REGISTRATION VALIDATORS
// ============================================================================

export * from './RegistrationValidators';

// ============================================================================
// EXTERNAL VALIDATORS (from types package)
// ============================================================================

// Re-export validators from types package
export {
  // Event Validators
  createEventSchema,
  updateEventSchema,
  eventRegistrationSchema,
  eventFilterSchema,
  eventSearchSchema,
  bulkEventUpdateSchema,
  bulkEventRegistrationSchema,
  
  // Application Validators
  createApplicationSchema,
  updateApplicationSchema,
  submitApplicationSchema,
  applicationReviewSchema,
  bulkReviewApplicationSchema,
  applicationFilterSchema,
  
  // Volunteer Validators
  createOpportunitySchema,
  updateOpportunitySchema,
  applyForOpportunitySchema,
  reviewApplicationSchema,
  volunteerFilterSchema,
  opportunitySearchSchema,
} from '@issb/types';

// ============================================================================
// VALIDATOR UTILITIES
// ============================================================================

/**
 * Validator configuration constants
 */
export const VALIDATOR_CONFIG = {
  // String length limits
  strings: {
    short: 50,
    medium: 200,
    long: 1000,
    veryLong: 5000,
  },
  
  // Array size limits
  arrays: {
    small: 10,
    medium: 50,
    large: 100,
    veryLarge: 1000,
  },
  
  // Pagination limits
  pagination: {
    minPage: 1,
    maxPage: 1000,
    minLimit: 1,
    maxLimit: 100,
    defaultLimit: 20,
  },
  
  // File upload limits
  files: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
} as const;

// ============================================================================
// VALIDATION ERROR TYPES
// ============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface PaginatedValidationResult<T> extends ValidationResult<T> {
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================================
// QUICK VALIDATION HELPERS
// ============================================================================

/**
 * Quick validation function that throws on error
 */
export const validateOrThrow = <T>(
  schema: import('zod').ZodSchema<T>,
  data: unknown,
  errorMessage = 'Validation failed'
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof import('zod').ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      throw new Error(`${errorMessage}: ${JSON.stringify(formattedErrors)}`);
    }
    throw error;
  }
};

/**
 * Safe validation function that doesn't throw
 */
export const safeValidate = <T>(
  schema: import('zod').ZodSchema<T>,
  data: unknown
): ValidationResult<T> => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof import('zod').ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      };
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
 * Create a validation middleware for Express routes
 */
export const createValidationMiddleware = <T>(
  schema: import('zod').ZodSchema<T>
) => {
  return (req: any, res: any, next: any) => {
    const result = safeValidate(schema, req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.errors,
        timestamp: new Date().toISOString(),
      });
    }
    
    req.validatedData = result.data;
    next();
  };
};

/**
 * Create a query validation middleware for Express routes
 */
export const createQueryValidationMiddleware = <T>(
  schema: import('zod').ZodSchema<T>
) => {
  return (req: any, res: any, next: any) => {
    const result = safeValidate(schema, req.query);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: result.errors,
        timestamp: new Date().toISOString(),
      });
    }
    
    req.validatedQuery = result.data;
    next();
  };
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example usage in controllers:
 * 
 * // User validation examples
 * import { 
 *   userRegistrationSchema,
 *   userLoginSchema,
 *   adminUserUpdateSchema,
 *   userQuerySchema,
 *   validateUserRegistration
 * } from '../validators';
 * 
 * // Validate user registration
 * const registrationData = userRegistrationSchema.parse(request.body);
 * 
 * // Or use helper function
 * const result = validateUserRegistration(request.body);
 * if (!result.success) {
 *   return res.status(400).json({ errors: result.errors });
 * }
 * 
 * // Validate query parameters
 * const queryData = userQuerySchema.parse(request.query);
 * 
 * // Membership validation examples
 * import { 
 *   createMembershipSchema, 
 *   updateMembershipSchema,
 *   membershipFilterSchema 
 * } from '../validators/MembershipValidators';
 * 
 * // Validate create membership request
 * const createData = createMembershipSchema.parse(request.body);
 * 
 * // Validate update membership request
 * const updateData = updateMembershipSchema.partial().parse(request.body);
 * 
 * // Validate filter query parameters
 * const filterData = membershipFilterSchema.parse(request.query);
 * 
 * // Using middleware
 * router.post('/register', createValidationMiddleware(userRegistrationSchema), handler);
 * router.get('/users', createQueryValidationMiddleware(userQuerySchema), handler);
 */