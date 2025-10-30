import { z } from 'zod';
import {
  UserRole,
  UserStatus,
  MembershipTier,
  UserProfile,
  UserRegistration as IUserRegistration,
  UserLogin as IUserLogin,
  PasswordChange as IPasswordChange,
  UserFilter,
} from '@issb/types';
import {
  emailSchema,
  passwordSchema,
  passwordConfirmationSchema,
  nameSchema,
  phoneSchema,
  dateSchema,
  optionalDateSchema,
  paginationSchema,
  sortSchema,
  searchSchema,
  dateRangeSchema,
  objectIdSchema,
  enumArraySchema,
  optionalBooleanSchema,
  bioSchema,
  locationSchema,
  organizationSchema,
  occupationSchema,
  websiteSchema,
  socialMediaUrlSchema,
  stringArraySchema,
  languagesSchema,
  interestsSchema,
  certificationSchema,
  experienceSchema,
  createQueryValidator,
  validateData,
  formatZodErrors,
} from './helpers';

// ============================================================================
// USER PROFILE VALIDATION SCHEMAS
// ============================================================================

/**
 * User profile update schema (for current user's own profile)
 */
export const userProfileUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: optionalDateSchema.optional(),
  avatar: websiteSchema.optional(),
  profile: z
    .object({
      bio: bioSchema,
      location: locationSchema,
      occupation: occupationSchema,
      organization: organizationSchema,
      website: websiteSchema,
      socialMedia: z
        .object({
          linkedin: socialMediaUrlSchema,
          twitter: socialMediaUrlSchema,
          instagram: socialMediaUrlSchema,
          facebook: socialMediaUrlSchema,
        })
        .optional(),
      languages: languagesSchema,
      interests: interestsSchema,
    })
    .optional(),
});

/**
 * User profile validation schema (full profile object)
 */
export const userProfileSchema = z.object({
  id: objectIdSchema,
  userId: objectIdSchema,
  bio: bioSchema,
  location: locationSchema,
  occupation: occupationSchema,
  organization: organizationSchema,
  website: websiteSchema,
  socialMedia: z
    .object({
      linkedin: socialMediaUrlSchema,
      twitter: socialMediaUrlSchema,
      instagram: socialMediaUrlSchema,
      facebook: socialMediaUrlSchema,
    })
    .optional(),
  languages: languagesSchema,
  interests: interestsSchema,
  certifications: z.array(certificationSchema).optional().default([]),
  experience: z.array(experienceSchema).optional().default([]),
});

// ============================================================================
// USER REGISTRATION VALIDATION SCHEMAS
// ============================================================================

/**
 * User registration schema
 */
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordConfirmationSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema.optional(),
  dateOfBirth: optionalDateSchema.optional(),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the terms and conditions'),
  agreeToPrivacy: z
    .boolean()
    .refine((val) => val === true, 'You must agree to the privacy policy'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

/**
 * TypeScript type for validated registration data
 */
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;

// ============================================================================
// USER LOGIN VALIDATION SCHEMAS
// ============================================================================

/**
 * User login schema
 */
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: optionalBooleanSchema,
});

/**
 * TypeScript type for validated login data
 */
export type UserLoginInput = z.infer<typeof userLoginSchema>;

// ============================================================================
// PASSWORD MANAGEMENT VALIDATION SCHEMAS
// ============================================================================

/**
 * Password change schema (for authenticated users)
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: passwordConfirmationSchema,
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }
);

/**
 * TypeScript type for validated password change data
 */
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset schema (using token)
 */
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: passwordConfirmationSchema,
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

/**
 * TypeScript type for validated password reset data
 */
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

// ============================================================================
// ADMIN USER MANAGEMENT VALIDATION SCHEMAS
// ============================================================================

/**
 * Admin user update schema (can update all fields including sensitive ones)
 */
export const adminUserUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  dateOfBirth: optionalDateSchema.optional(),
  role: z.nativeEnum(UserRole).optional(),
  tier: z.nativeEnum(MembershipTier).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  avatar: websiteSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update',
  }
);

/**
 * TypeScript type for validated admin user update data
 */
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

/**
 * Bulk user status update schema
 */
export const bulkUserStatusUpdateSchema = z.object({
  userIds: z.array(objectIdSchema).min(1, 'At least one user ID is required'),
  status: z.nativeEnum(UserStatus),
  reason: z.string().max(200, 'Reason cannot be more than 200 characters').optional(),
});

/**
 * TypeScript type for bulk user status update
 */
export type BulkUserStatusUpdateInput = z.infer<typeof bulkUserStatusUpdateSchema>;

/**
 * Single user status update schema
 */
export const userStatusUpdateSchema = z.object({
  status: z.nativeEnum(UserStatus),
  reason: z.string().max(200, 'Reason cannot be more than 200 characters').optional(),
});

/**
 * TypeScript type for user status update
 */
export type UserStatusUpdateInput = z.infer<typeof userStatusUpdateSchema>;

// ============================================================================
// USER FILTERING AND QUERY VALIDATION SCHEMAS
// ============================================================================

/**
 * User filter schema for listing users
 */
export const userFilterSchema = z.object({
  role: z
    .union([
      z.string().transform((val) => val.split(',')),
      z.array(z.nativeEnum(UserRole)),
    ])
    .optional(),
  tier: z
    .union([
      z.string().transform((val) => val.split(',')),
      z.array(z.nativeEnum(MembershipTier)),
    ])
    .optional(),
  status: z
    .union([
      z.string().transform((val) => val.split(',')),
      z.array(z.nativeEnum(UserStatus)),
    ])
    .optional(),
  search: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z
    .enum([
      'createdAt',
      'updatedAt',
      'lastLoginAt',
      'firstName',
      'lastName',
      'email',
      'role',
      'tier',
      'status',
    ])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).refine(
  (data) => !data.dateFrom || !data.dateTo || data.dateFrom <= data.dateTo,
  {
    message: 'Start date must be before or equal to end date',
    path: ['dateFrom'],
  }
);

/**
 * User query schema (combines filter with pagination)
 */
export const userQuerySchema = createQueryValidator(userFilterSchema);

/**
 * TypeScript type for validated user filter
 */
export type UserFilterInput = z.infer<typeof userFilterSchema>;

/**
 * TypeScript type for validated user query (with pagination)
 */
export type UserQueryInput = z.infer<typeof userQuerySchema>;

// ============================================================================
// USER SEARCH AND EXPORT VALIDATION SCHEMAS
// ============================================================================

/**
 * User search schema (for advanced search functionality)
 */
export const userSearchSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters').max(100),
  fields: z
    .array(
      z.enum([
        'email',
        'firstName',
        'lastName',
        'phone',
        'profile.bio',
        'profile.location',
        'profile.occupation',
        'profile.organization',
      ])
    )
    .optional()
    .default(['email', 'firstName', 'lastName']),
  exactMatch: optionalBooleanSchema.default(false),
});

/**
 * TypeScript type for user search
 */
export type UserSearchInput = z.infer<typeof userSearchSchema>;

/**
 * User export schema
 */
export const userExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
  filters: userFilterSchema.partial().optional(),
  fields: z
    .array(
      z.enum([
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'tier',
        'status',
        'phone',
        'dateOfBirth',
        'createdAt',
        'updatedAt',
        'lastLoginAt',
        'emailVerifiedAt',
        'profile.bio',
        'profile.location',
        'profile.occupation',
        'profile.organization',
      ])
    )
    .optional()
    .default(['id', 'email', 'firstName', 'lastName', 'role', 'tier', 'status', 'createdAt']),
});

/**
 * TypeScript type for user export
 */
export type UserExportInput = z.infer<typeof userExportSchema>;

// ============================================================================
// USER ACTIVATION AND VERIFICATION VALIDATION SCHEMAS
// ============================================================================

/**
 * User email verification schema
 */
export const userEmailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * User account activation schema (admin action)
 */
export const userActivationSchema = z.object({
  userId: objectIdSchema,
  sendWelcomeEmail: optionalBooleanSchema.default(true),
});

/**
 * TypeScript type for user activation
 */
export type UserActivationInput = z.infer<typeof userActivationSchema>;

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validate user registration data
 */
export const validateUserRegistration = (
  data: unknown
): { success: true; data: UserRegistrationInput } | { success: false; errors: any[] } => {
  return validateData(userRegistrationSchema, data, 'Invalid registration data');
};

/**
 * Validate user login data
 */
export const validateUserLogin = (
  data: unknown
): { success: true; data: UserLoginInput } | { success: false; errors: any[] } => {
  return validateData(userLoginSchema, data, 'Invalid login data');
};

/**
 * Validate password change data
 */
export const validatePasswordChange = (
  data: unknown
): { success: true; data: PasswordChangeInput } | { success: false; errors: any[] } => {
  return validateData(passwordChangeSchema, data, 'Invalid password change data');
};

/**
 * Validate admin user update data
 */
export const validateAdminUserUpdate = (
  data: unknown
): { success: true; data: AdminUserUpdateInput } | { success: false; errors: any[] } => {
  return validateData(adminUserUpdateSchema, data, 'Invalid user update data');
};

/**
 * Validate user profile update data
 */
export const validateUserProfileUpdate = (
  data: unknown
): { success: true; data: z.infer<typeof userProfileUpdateSchema> } | { success: false; errors: any[] } => {
  return validateData(userProfileUpdateSchema, data, 'Invalid profile update data');
};

/**
 * Validate user query parameters
 */
export const validateUserQuery = (
  data: unknown
): { success: true; data: UserQueryInput } | { success: false; errors: any[] } => {
  return validateData(userQuerySchema, data, 'Invalid query parameters');
};

/**
 * Validate user status update
 */
export const validateUserStatusUpdate = (
  data: unknown
): { success: true; data: UserStatusUpdateInput } | { success: false; errors: any[] } => {
  return validateData(userStatusUpdateSchema, data, 'Invalid status update data');
};

/**
 * Validate bulk user status update
 */
export const validateBulkUserStatusUpdate = (
  data: unknown
): { success: true; data: BulkUserStatusUpdateInput } | { success: false; errors: any[] } => {
  return validateData(bulkUserStatusUpdateSchema, data, 'Invalid bulk status update data');
};

/**
 * Validate user search parameters
 */
export const validateUserSearch = (
  data: unknown
): { success: true; data: UserSearchInput } | { success: false; errors: any[] } => {
  return validateData(userSearchSchema, data, 'Invalid search parameters');
};

/**
 * Validate user export parameters
 */
export const validateUserExport = (
  data: unknown
): { success: true; data: UserExportInput } | { success: false; errors: any[] } => {
  return validateData(userExportSchema, data, 'Invalid export parameters');
};

// ============================================================================
// ENUM ARRAYS FOR FRONTEND USE
// ============================================================================

/**
 * Array of user roles for frontend dropdowns
 */
export const USER_ROLES = Object.values(UserRole);

/**
 * Array of user statuses for frontend dropdowns
 */
export const USER_STATUSES = Object.values(UserStatus);

/**
 * Array of membership tiers for frontend dropdowns
 */
export const MEMBERSHIP_TIERS = Object.values(MembershipTier);

// ============================================================================
// EXPORTS
// ============================================================================

export {
  userProfileUpdateSchema,
  userProfileSchema,
  userRegistrationSchema,
  userLoginSchema,
  passwordChangeSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  adminUserUpdateSchema,
  bulkUserStatusUpdateSchema,
  userStatusUpdateSchema,
  userFilterSchema,
  userQuerySchema,
  userSearchSchema,
  userExportSchema,
  userEmailVerificationSchema,
  userActivationSchema,
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange,
  validateAdminUserUpdate,
  validateUserProfileUpdate,
  validateUserQuery,
  validateUserStatusUpdate,
  validateBulkUserStatusUpdate,
  validateUserSearch,
  validateUserExport,
  USER_ROLES,
  USER_STATUSES,
  MEMBERSHIP_TIERS,
};

// Re-export types for convenience
export type {
  UserRegistrationInput,
  UserLoginInput,
  PasswordChangeInput,
  PasswordResetInput,
  AdminUserUpdateInput,
  BulkUserStatusUpdateInput,
  UserStatusUpdateInput,
  UserFilterInput,
  UserQueryInput,
  UserSearchInput,
  UserExportInput,
  UserActivationInput,
};
