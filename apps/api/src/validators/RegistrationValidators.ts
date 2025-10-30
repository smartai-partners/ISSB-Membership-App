import { z } from 'zod';
import mongoose from 'mongoose';
import { RegistrationStatus, EventStatus } from '@issb/types';

// ============================================================================
// UTILITY SCHEMAS AND HELPERS
// ============================================================================

/**
 * Validates MongoDB ObjectId
 */
export const objectIdSchema = z.string().refine(
  (id) => mongoose.Types.ObjectId.isValid(id),
  'Invalid ObjectId format'
);

/**
 * Pagination schema for query parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

/**
 * Date range schema for filtering
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
  {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  }
);

// ============================================================================
// ATTENDANCE SCHEMAS
// ============================================================================

/**
 * Check-in validation schema
 */
export const checkInSchema = z.object({
  id: objectIdSchema,
  checkInTime: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.checkInTime) {
      const now = new Date();
      const checkInTime = new Date(data.checkInTime);
      // Allow check-in within reasonable time frame (event start ± 24 hours)
      return checkInTime <= now;
    }
    return true;
  },
  {
    message: 'Check-in time cannot be in the future',
    path: ['checkInTime'],
  }
);

/**
 * Check-out validation schema
 */
export const checkOutSchema = z.object({
  id: objectIdSchema,
  checkOutTime: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.checkOutTime) {
      const now = new Date();
      const checkOutTime = new Date(data.checkOutTime);
      // Allow check-out within reasonable time frame (event end ± 24 hours)
      return checkOutTime <= now;
    }
    return true;
  },
  {
    message: 'Check-out time cannot be in the future',
    path: ['checkOutTime'],
  }
);

/**
 * Manual attendance update schema
 */
export const attendanceUpdateSchema = z.object({
  registrationId: objectIdSchema,
  attended: z.boolean().optional(),
  checkInTime: z.coerce.date().optional(),
  checkOutTime: z.coerce.date().optional(),
}).refine(
  (data) => {
    // If there's a check-out time, check-in time must exist and be before check-out
    if (data.checkOutTime && data.checkInTime) {
      return new Date(data.checkInTime) < new Date(data.checkOutTime);
    }
    // If attended is true, check-in time must exist
    if (data.attended && !data.checkInTime) {
      return false;
    }
    return true;
  },
  {
    message: 'Check-in time must be before check-out time, and attended requires check-in time',
  }
);

/**
 * No-show marking schema
 */
export const noShowSchema = z.object({
  id: objectIdSchema,
  reason: z.string().max(500).optional(),
});

// ============================================================================
// REGISTRATION CREATION SCHEMAS
// ============================================================================

/**
 * Create registration schema
 */
export const createRegistrationSchema = z.object({
  eventId: objectIdSchema,
  userId: objectIdSchema.optional(), // Will be extracted from authenticated user
}).refine(
  async (data) => {
    // Additional business logic validation will be handled in the controller
    // This is a placeholder for any async validation that might be needed
    return true;
  },
  {
    message: 'Unable to create registration',
  }
);

/**
 * Batch registration schema (for admin use)
 */
export const batchRegistrationSchema = z.object({
  eventId: objectIdSchema,
  userIds: z.array(objectIdSchema).min(1).max(50),
  status: z.nativeEnum(RegistrationStatus).optional(),
}).refine(
  (data) => {
    if (data.status === RegistrationStatus.ATTENDED) {
      return false; // Cannot batch create as already attended
    }
    return true;
  },
  {
    message: 'Cannot batch create registrations with ATTENDED status',
    path: ['status'],
  }
);

// ============================================================================
// REGISTRATION FILTERING SCHEMAS
// ============================================================================

/**
 * Registration filter query schema
 */
export const registrationFilterSchema = z.object({
  ...paginationSchema.shape,
  status: z.union([
    z.nativeEnum(RegistrationStatus),
    z.array(z.nativeEnum(RegistrationStatus))
  ]).optional(),
  eventId: objectIdSchema.optional(),
  userId: objectIdSchema.optional(),
  search: z.string().max(100).optional(),
  ...dateRangeSchema.shape,
  sortBy: z.enum([
    'registeredAt',
    'updatedAt',
    'status',
    'checkInTime',
    'checkOutTime'
  ]).default('registeredAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).refine(
  (data) => {
    // Validate date range if both dates are provided
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  }
);

/**
 * Event-specific registration filter schema
 */
export const eventRegistrationFilterSchema = z.object({
  ...paginationSchema.shape,
  status: z.union([
    z.nativeEnum(RegistrationStatus),
    z.array(z.nativeEnum(RegistrationStatus))
  ]).optional(),
  attended: z.coerce.boolean().optional(),
  checkInStatus: z.enum([
    'checked_in',
    'checked_out', 
    'not_checked_in'
  ]).optional(),
  sortBy: z.enum([
    'registeredAt',
    'updatedAt',
    'userName',
    'checkInTime'
  ]).default('registeredAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * User registration filter schema
 */
export const userRegistrationFilterSchema = z.object({
  status: z.union([
    z.nativeEnum(RegistrationStatus),
    z.array(z.nativeEnum(RegistrationStatus))
  ]).optional(),
  upcoming: z.coerce.boolean().optional(),
  past: z.coerce.boolean().optional(),
  eventType: z.string().optional(),
  eventTier: z.string().optional(),
  sortBy: z.enum([
    'eventDate',
    'registeredAt',
    'status'
  ]).default('eventDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// REGISTRATION CANCELLATION SCHEMAS
// ============================================================================

/**
 * Cancel registration schema
 */
export const cancelRegistrationSchema = z.object({
  id: objectIdSchema,
  reason: z.string().max(500).optional(),
  cancelType: z.enum(['user_request', 'admin_cancellation', 'automatic']).optional(),
}).refine(
  (data) => {
    // Validate reason for admin cancellations
    if (data.cancelType === 'admin_cancellation' && !data.reason) {
      return false;
    }
    return true;
  },
  {
    message: 'Cancellation reason is required for admin cancellations',
    path: ['reason'],
  }
);

/**
 * Bulk cancellation schema
 */
export const bulkCancelSchema = z.object({
  registrationIds: z.array(objectIdSchema).min(1).max(100),
  reason: z.string().max(500),
  cancelType: z.enum(['user_request', 'admin_cancellation']).default('admin_cancellation'),
  notifyUsers: z.boolean().default(true),
});

// ============================================================================
// STATUS UPDATE SCHEMAS
// ============================================================================

/**
 * Status update schema
 */
export const statusUpdateSchema = z.object({
  id: objectIdSchema,
  status: z.nativeEnum(RegistrationStatus),
  reason: z.string().max(500).optional(),
  effectiveDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    // Cannot update to certain statuses without proper authorization/business logic
    const restrictedStatuses = [RegistrationStatus.ATTENDED];
    if (restrictedStatuses.includes(data.status) && !data.reason) {
      return false;
    }
    return true;
  },
  {
    message: 'Status reason is required for this status change',
    path: ['reason'],
  }
);

/**
 * Registration status transition validation
 * This schema validates that the status transition is allowed
 */
export const statusTransitionSchema = z.object({
  currentStatus: z.nativeEnum(RegistrationStatus),
  newStatus: z.nativeEnum(RegistrationStatus),
  hasAttended: z.boolean().default(false),
  checkInTime: z.date().optional(),
  checkOutTime: z.date().optional(),
}).refine(
  (data) => {
    const { currentStatus, newStatus, hasAttended, checkInTime, checkOutTime } = data;
    
    // Business rule validations
    if (currentStatus === RegistrationStatus.ATTENDED && newStatus !== RegistrationStatus.ATTENDED) {
      return false; // Cannot change status after attendance
    }
    
    if (currentStatus === RegistrationStatus.CANCELLED && newStatus !== RegistrationStatus.REGISTERED) {
      return false; // Only way back from cancelled is to register again
    }
    
    if (newStatus === RegistrationStatus.ATTENDED && !checkInTime) {
      return false; // Must have check-in time to mark as attended
    }
    
    if (newStatus === RegistrationStatus.NO_SHOW && hasAttended) {
      return false; // Cannot mark as no-show if already attended
    }
    
    // Check-in/check-out consistency
    if (checkOutTime && !checkInTime) {
      return false; // Cannot check out without checking in
    }
    
    if (checkInTime && checkOutTime && new Date(checkOutTime) <= new Date(checkInTime)) {
      return false; // Check-out must be after check-in
    }
    
    return true;
  },
  {
    message: 'Invalid status transition based on current state and business rules',
  }
);

// ============================================================================
// CAPACITY AND WAITLIST SCHEMAS
// ============================================================================

/**
 * Waitlist promotion schema
 */
export const waitlistPromotionSchema = z.object({
  eventId: objectIdSchema,
  capacity: z.number().int().positive().optional(),
  notifyPromoted: z.boolean().default(true),
});

/**
 * Registration capacity validation schema
 */
export const capacityCheckSchema = z.object({
  eventId: objectIdSchema,
  currentRegistrations: z.number().int().nonnegative(),
  capacity: z.number().int().positive().optional(),
  waitlistCount: z.number().int().nonnegative().default(0),
});

// ============================================================================
// ATTENDANCE TRACKING AND REPORTING SCHEMAS
// ============================================================================

/**
 * Attendance tracking query schema
 */
export const attendanceTrackingSchema = z.object({
  eventId: objectIdSchema.optional(),
  registrationIds: z.array(objectIdSchema).optional(),
  dateRange: dateRangeSchema.optional(),
  includeNoShows: z.boolean().default(false),
  sortBy: z.enum(['checkInTime', 'checkOutTime', 'duration']).default('checkInTime'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Attendance report generation schema
 */
export const attendanceReportSchema = z.object({
  eventId: objectIdSchema,
  reportType: z.enum([
    'attendance_summary',
    'check_in_times',
    'no_shows',
    'duration_analysis',
    'capacity_utilization'
  ]),
  dateRange: dateRangeSchema.optional(),
  groupBy: z.enum(['hour', 'day', 'status', 'user_tier']).optional(),
  includeStatistics: z.boolean().default(true),
});

/**
 * Real-time attendance tracking schema
 */
export const realTimeAttendanceSchema = z.object({
  eventId: objectIdSchema,
  includeWaitingList: z.boolean().default(false),
  refreshInterval: z.number().int().positive().max(300).default(30), // seconds
});

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

/**
 * Validation result type for registration operations
 */
export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type CancelRegistrationInput = z.infer<typeof cancelRegistrationSchema>;
export type RegistrationFilterInput = z.infer<typeof registrationFilterSchema>;
export type AttendanceUpdateInput = z.infer<typeof attendanceUpdateSchema>;
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
export type BulkCancelInput = z.infer<typeof bulkCancelSchema>;
export type AttendanceTrackingInput = z.infer<typeof attendanceTrackingSchema>;
export type AttendanceReportInput = z.infer<typeof attendanceReportSchema>;
export type CapacityCheckInput = z.infer<typeof capacityCheckSchema>;

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

export const RegistrationValidators = {
  // Core schemas
  createRegistration: createRegistrationSchema,
  checkIn: checkInSchema,
  checkOut: checkOutSchema,
  cancelRegistration: cancelRegistrationSchema,
  
  // Filtering and queries
  registrationFilter: registrationFilterSchema,
  eventRegistrationFilter: eventRegistrationFilterSchema,
  userRegistrationFilter: userRegistrationFilterSchema,
  
  // Status management
  statusUpdate: statusUpdateSchema,
  statusTransition: statusTransitionSchema,
  
  // Attendance
  attendanceUpdate: attendanceUpdateSchema,
  attendanceTracking: attendanceTrackingSchema,
  attendanceReport: attendanceReportSchema,
  realTimeAttendance: realTimeAttendanceSchema,
  
  // Batch operations
  batchRegistration: batchRegistrationSchema,
  bulkCancel: bulkCancelSchema,
  
  // Capacity and waitlist
  waitlistPromotion: waitlistPromotionSchema,
  capacityCheck: capacityCheckSchema,
  
  // Utility schemas
  objectId: objectIdSchema,
  pagination: paginationSchema,
  dateRange: dateRangeSchema,
  noShow: noShowSchema,
};

export default RegistrationValidators;