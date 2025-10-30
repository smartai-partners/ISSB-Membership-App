import { z } from 'zod';
import {
  MembershipTier,
  MembershipStatus,
  RenewalType,
  UserStatus,
  Currency
} from '../../../../packages/types/src';

// ============================================================================
// CORE VALIDATION SCHEMAS
// ============================================================================

/**
 * Currency validation
 */
const currencySchema = z.string()
  .min(3, 'Currency must be a valid 3-letter code')
  .max(3, 'Currency must be a valid 3-letter code')
  .transform(val => val.toUpperCase());

/**
 * Date validation helpers
 */
const dateSchema = z.date({
  required_error: 'Date is required',
  invalid_type_error: 'Invalid date format',
});

/**
 * Future date validation
 */
const futureDateSchema = dateSchema.refine(
  (date) => date > new Date(),
  'Date must be in the future'
);

/**
 * Past date validation
 */
const pastDateSchema = dateSchema.refine(
  (date) => date < new Date(),
  'Date must be in the past'
);

/**
 * Amount validation (positive numbers with 2 decimal places)
 */
const amountSchema = z.number()
  .positive('Amount must be positive')
  .max(999999.99, 'Amount exceeds maximum limit')
  .transform(val => Math.round(val * 100) / 100); // Round to 2 decimal places

/**
 * Payment method validation
 */
const paymentMethodSchema = z.object({
  id: z.string().uuid('Invalid payment method ID').optional(),
  type: z.enum(['card', 'bank_transfer', 'paypal', 'other']).default('other'),
  last4: z.string().length(4, 'Card last 4 digits required').optional(),
  brand: z.string().optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(new Date().getFullYear()).optional(),
});

// ============================================================================
// MEMBERSHIP VALIDATORS
// ============================================================================

/**
 * Create Membership Validator
 */
export const createMembershipSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  tier: z.nativeEnum(MembershipTier, {
    errorMap: () => ({ message: 'Invalid membership tier' })
  }),
  startDate: futureDateSchema.optional(),
  renewalType: z.nativeEnum(RenewalType, {
    errorMap: () => ({ message: 'Invalid renewal type' })
  }),
  autoRenew: z.boolean().default(false),
  paymentMethod: paymentMethodSchema.optional(),
  amount: amountSchema.optional(),
  currency: currencySchema.default('USD'),
  benefits: z.array(z.string()).default([]),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;

/**
 * Update Membership Validator
 */
export const updateMembershipSchema = z.object({
  tier: z.nativeEnum(MembershipTier).optional().refine(
    (val) => val !== undefined,
    'At least one field must be provided for update'
  ),
  status: z.nativeEnum(MembershipStatus).optional(),
  startDate: dateSchema.optional(),
  endDate: futureDateSchema.optional(),
  renewalType: z.nativeEnum(RenewalType).optional(),
  autoRenew: z.boolean().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  amount: amountSchema.optional(),
  currency: currencySchema.optional(),
  benefits: z.array(z.string()).optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;

/**
 * Renew Membership Validator
 */
export const renewMembershipSchema = z.object({
  membershipId: z.string().uuid('Invalid membership ID'),
  renewalType: z.nativeEnum(RenewalType, {
    errorMap: () => ({ message: 'Invalid renewal type' })
  }),
  autoRenew: z.boolean().default(false),
  paymentMethod: paymentMethodSchema.optional(),
  amount: amountSchema.optional(),
  currency: currencySchema.default('USD'),
  applyDiscount: z.boolean().default(false),
  discountCode: z.string().optional(),
}).refine(
  (data) => data.paymentMethod || data.amount,
  'Either payment method or amount must be provided'
);

export type RenewMembershipInput = z.infer<typeof renewMembershipSchema>;

/**
 * Membership Tier Upgrade Validator
 */
export const upgradeMembershipSchema = z.object({
  membershipId: z.string().uuid('Invalid membership ID'),
  newTier: z.nativeEnum(MembershipTier, {
    errorMap: () => ({ message: 'Invalid membership tier' })
  }),
  paymentMethod: paymentMethodSchema.optional(),
  amount: amountSchema.optional(),
  currency: currencySchema.default('USD'),
  proration: z.boolean().default(true), // Whether to apply proration for the upgrade
  effectiveDate: futureDateSchema.optional(),
  notifyUser: z.boolean().default(true),
}).refine(
  (data) => data.paymentMethod || data.amount,
  'Payment method or amount must be provided for upgrade'
);

export type UpgradeMembershipInput = z.infer<typeof upgradeMembershipSchema>;

/**
 * Cancel Membership Validator
 */
export const cancelMembershipSchema = z.object({
  membershipId: z.string().uuid('Invalid membership ID'),
  reason: z.enum([
    'user_request',
    'payment_failed',
    'policy_violation',
    'inactivity',
    'other'
  ]).optional(),
  cancellationType: z.enum(['immediate', 'end_of_period']).default('immediate'),
  refundAmount: amountSchema.optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type CancelMembershipInput = z.infer<typeof cancelMembershipSchema>;

// ============================================================================
// MEMBERSHIP FILTER VALIDATORS
// ============================================================================

/**
 * Membership Filter Validator
 */
export const membershipFilterSchema = z.object({
  userId: z.string().uuid().optional(),
  tier: z.nativeEnum(MembershipTier).optional(),
  status: z.nativeEnum(MembershipStatus).optional(),
  renewalType: z.nativeEnum(RenewalType).optional(),
  autoRenew: z.boolean().optional(),
  search: z.string().max(100, 'Search term too long').optional(),
  dateRange: z.object({
    start: dateSchema,
    end: dateSchema,
  }).optional().refine(
    (range) => !range || range.start <= range.end,
    'Start date must be before end date'
  ),
  amountRange: z.object({
    min: amountSchema,
    max: amountSchema,
  }).optional().refine(
    (range) => !range || range.min <= range.max,
    'Minimum amount must be less than or equal to maximum amount'
  ),
  expiringWithinDays: z.number().int().min(1).max(365).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum([
    'createdAt',
    'updatedAt',
    'startDate',
    'endDate',
    'amount',
    'tier',
    'status'
  ]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).refine(
  (data) => data.page && data.limit,
  'Page and limit are required'
);

export type MembershipFilterInput = z.infer<typeof membershipFilterSchema>;

/**
 * Membership Search Validator (for advanced search)
 */
export const membershipSearchSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters'),
  filters: z.object({
    tier: z.array(z.nativeEnum(MembershipTier)).optional(),
    status: z.array(z.nativeEnum(MembershipStatus)).optional(),
    dateRange: z.object({
      start: dateSchema,
      end: dateSchema,
    }).optional(),
  }).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});

export type MembershipSearchInput = z.infer<typeof membershipSearchSchema>;

// ============================================================================
// BULK MEMBERSHIP OPERATIONS
// ============================================================================

/**
 * Bulk Update Memberships Validator
 */
export const bulkUpdateMembershipsSchema = z.object({
  membershipIds: z.array(z.string().uuid('Invalid membership ID'))
    .min(1, 'At least one membership ID required')
    .max(100, 'Cannot update more than 100 memberships at once'),
  updates: z.object({
    status: z.nativeEnum(MembershipStatus).optional(),
    autoRenew: z.boolean().optional(),
    renewalType: z.nativeEnum(RenewalType).optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    'At least one update field must be provided'
  ),
  reason: z.string().max(200, 'Reason cannot exceed 200 characters').optional(),
});

export type BulkUpdateMembershipsInput = z.infer<typeof bulkUpdateMembershipsSchema>;

/**
 * Bulk Renew Memberships Validator
 */
export const bulkRenewMembershipsSchema = z.object({
  membershipIds: z.array(z.string().uuid('Invalid membership ID'))
    .min(1, 'At least one membership ID required')
    .max(50, 'Cannot renew more than 50 memberships at once'),
  renewalType: z.nativeEnum(RenewalType, {
    errorMap: () => ({ message: 'Invalid renewal type' })
  }),
  autoRenew: z.boolean().default(false),
  paymentMethodId: z.string().uuid().optional(),
  applyDiscount: z.boolean().default(false),
  discountCode: z.string().optional(),
});

export type BulkRenewMembershipsInput = z.infer<typeof bulkRenewMembershipsSchema>;

// ============================================================================ MEMBERSHIP ANALYTICS AND REPORTS
// ============================================================================

/**
 * Membership Analytics Validator
 */
export const membershipAnalyticsSchema = z.object({
  dateRange: z.object({
    start: dateSchema,
    end: dateSchema,
  }).optional(),
  includeInactive: z.boolean().default(false),
  groupBy: z.enum(['tier', 'status', 'renewalType', 'month', 'quarter']).default('tier'),
  metrics: z.array(z.enum([
    'totalMembers',
    'newMembers',
    'renewals',
    'cancellations',
    'revenue',
    'retentionRate'
  ])).default(['totalMembers']),
});

export type MembershipAnalyticsInput = z.infer<typeof membershipAnalyticsSchema>;

/**
 * Membership Report Validator
 */
export const membershipReportSchema = z.object({
  type: z.enum(['membership_summary', 'renewal_status', 'revenue_analysis', 'churn_analysis']),
  dateRange: z.object({
    start: dateSchema,
    end: dateSchema,
  }),
  filters: z.object({
    tier: z.array(z.nativeEnum(MembershipTier)).optional(),
    status: z.array(z.nativeEnum(MembershipStatus)).optional(),
    renewalType: z.array(z.nativeEnum(RenewalType)).optional(),
  }).optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  includeCharts: z.boolean().default(false),
});

export type MembershipReportInput = z.infer<typeof membershipReportSchema>;

// ============================================================================
// MEMBERSHIP PAYMENT VALIDATORS
// ============================================================================

/**
 * Process Payment Validator
 */
export const processPaymentSchema = z.object({
  membershipId: z.string().uuid('Invalid membership ID'),
  amount: amountSchema,
  currency: currencySchema,
  paymentMethod: paymentMethodSchema,
  description: z.string().max(200, 'Description too long').optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;

/**
 * Refund Validator
 */
export const refundSchema = z.object({
  membershipId: z.string().uuid('Invalid membership ID'),
  amount: amountSchema.optional(), // If not provided, full refund
  reason: z.enum([
    'user_request',
    'duplicate_charge',
    'fraudulent_charge',
    'service_issue',
    'other'
  ]),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type RefundInput = z.infer<typeof refundSchema>;

// ============================================================================
// VALIDATION HELPERS AND UTILITIES
// ============================================================================

/**
 * Validate membership dates (start before end)
 */
export const validateMembershipDates = (startDate: Date, endDate: Date): boolean => {
  return startDate < endDate;
};

/**
 * Check if membership is renewable
 */
export const canRenewMembership = (
  membership: {
    status: MembershipStatus;
    endDate: Date;
    autoRenew: boolean;
  }
): boolean => {
  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (membership.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    membership.status === MembershipStatus.ACTIVE &&
    daysUntilExpiry > 0 &&
    !membership.autoRenew
  );
};

/**
 * Calculate proration amount for tier upgrade
 */
export const calculateProration = (
  currentTier: MembershipTier,
  newTier: MembershipTier,
  currentAmount: number,
  newAmount: number,
  daysRemaining: number,
  totalDaysInPeriod: number
): number => {
  const remainingRatio = daysRemaining / totalDaysInPeriod;
  const currentTierRemainingCost = currentAmount * remainingRatio;
  const newTierFullCost = newAmount;
  
  return Math.max(0, newTierFullCost - currentTierRemainingCost);
};

/**
 * Validate discount code
 */
export const validateDiscountCode = (code: string): boolean => {
  // Basic validation - in real implementation, this would check against database
  const pattern = /^[A-Z0-9]{6,12}$/;
  return pattern.test(code);
};

// ============================================================================
// EXPORT ALL VALIDATORS
// ============================================================================

export const MembershipValidators = {
  // Core validators
  create: createMembershipSchema,
  update: updateMembershipSchema,
  renew: renewMembershipSchema,
  upgrade: upgradeMembershipSchema,
  cancel: cancelMembershipSchema,
  
  // Filter and search
  filter: membershipFilterSchema,
  search: membershipSearchSchema,
  
  // Bulk operations
  bulkUpdate: bulkUpdateMembershipsSchema,
  bulkRenew: bulkRenewMembershipsSchema,
  
  // Analytics and reports
  analytics: membershipAnalyticsSchema,
  report: membershipReportSchema,
  
  // Payment processing
  processPayment: processPaymentSchema,
  refund: refundSchema,
  
  // Utility functions
  validateMembershipDates,
  canRenewMembership,
  calculateProration,
  validateDiscountCode,
};

export default MembershipValidators;