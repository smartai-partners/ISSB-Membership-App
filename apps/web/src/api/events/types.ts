// ============================================================================
// EVENT API TYPES
// ============================================================================

// Re-export types from shared package
export type {
  Event,
  EventRegistration,
  EventFilter,
  EventType,
  EventStatus,
  RegistrationStatus,
  MembershipTier,
  PaginatedResponse,
  ApiResponse,
  CreateInput,
  UpdateInput
} from '@issb/types';

// ============================================================================
// API-SPECIFIC TYPES
// ============================================================================

/**
 * Event creation input type
 */
export type CreateEventInput = {
  title: string;
  description: string;
  type: string;
  tier: string;
  startDate: string | Date;
  endDate: string | Date;
  location: string;
  isVirtual: boolean;
  virtualLink?: string;
  capacity?: number;
  registrationDeadline?: string | Date;
  tags?: string[];
  attachments?: string[];
};

/**
 * Event update input type
 */
export type UpdateEventInput = Partial<CreateEventInput>;

/**
 * Registration input type
 */
export type RegistrationInput = {
  eventId: string;
  userId: string;
  specialRequirements?: string;
  dietaryRestrictions?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
};

/**
 * Search input type
 */
export type SearchInput = {
  query: string;
  filters?: Partial<EventFilter>;
};

/**
 * WebSocket message types for real-time updates
 */
export type WebSocketMessage =
  | { type: 'registration_update'; payload: EventRegistration }
  | { type: 'capacity_update'; payload: { available: number; total?: number } }
  | { type: 'event_update'; payload: Event }
  | { type: 'event_cancelled'; payload: string }
  | { type: 'event_created'; payload: Event }
  | { type: 'event_updated'; payload: Event }
  | { type: 'event_deleted'; payload: string }
  | { type: 'error'; payload: string };

/**
 * WebSocket callbacks interface
 */
export interface EventUpdateCallbacks {
  onRegistrationUpdate?: (registration: EventRegistration) => void;
  onCapacityUpdate?: (capacity: { available: number; total?: number }) => void;
  onEventUpdate?: (event: Event) => void;
  onEventCancelled?: () => void;
  onError?: (error: string) => void;
}

export interface AllEventsUpdateCallbacks {
  onEventCreated?: (event: Event) => void;
  onEventUpdated?: (event: Event) => void;
  onEventDeleted?: (eventId: string) => void;
  onEventCancelled?: (eventId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Capacity check result
 */
export type CapacityCheck = {
  hasCapacity: boolean;
  availableSpots: number;
  totalCapacity?: number;
  currentRegistrations: number;
};

/**
 * Bulk operation result
 */
export type BulkOperationResult = {
  successful: string[];
  failed: { userId?: string; eventId?: string; error: string }[];
};

/**
 * Registration status check result
 */
export type RegistrationStatusResult = EventRegistration | null;

/**
 * Event validation result
 */
export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

/**
 * User registration permission check
 */
export type RegistrationPermission = {
  canRegister: boolean;
  reason?: string;
  warnings?: string[];
};

/**
 * Formatted event data for display
 */
export type FormattedEventData = {
  duration: string;
  registrationStatus: string;
  capacityStatus: string;
  isUpcoming: boolean;
  isOngoing: boolean;
  isPast: boolean;
};

/**
 * Event analytics data
 */
export type EventAnalytics = {
  registrationStats: {
    total: number;
    byStatus: Record<string, number>;
    trend: { date: string; count: number }[];
  };
  attendanceStats: {
    totalRegistered: number;
    totalAttended: number;
    attendanceRate: number;
  };
  capacityStats: {
    capacity: number;
    utilization: number;
    waitlistCount: number;
  };
};

/**
 * Attendance report data
 */
export type AttendanceReport = {
  totalRegistered: number;
  totalCheckedIn: number;
  totalCheckedOut: number;
  noShows: number;
  attendanceRate: number;
  attendees: EventRegistration[];
};

/**
 * Check-in/check-out data
 */
export type CheckInOutData = {
  userId: string;
  checkInTime?: string | Date;
  checkOutTime?: string | Date;
};

/**
 * Event export options
 */
export type ExportOptions = {
  format: 'csv' | 'excel' | 'pdf';
  includeAttendees: boolean;
  includeAnalytics: boolean;
};

/**
 * Bulk update data
 */
export type BulkUpdateData = {
  eventIds: string[];
  updates: {
    status?: string;
    capacity?: number;
    tags?: string[];
  };
};

/**
 * Bulk delete data
 */
export type BulkDeleteData = {
  eventIds: string[];
  confirmDelete: boolean;
};

/**
 * Waitlist promotion data
 */
export type WaitlistPromotionData = {
  eventId: string;
  userIds: string[];
};

/**
 * Date range filter
 */
export type DateRangeFilter = {
  start?: string | Date;
  end?: string | Date;
};

/**
 * Event filter with additional options
 */
export type ExtendedEventFilter = EventFilter & {
  organizerId?: string;
  hasCapacity?: boolean;
  minCapacity?: number;
  maxCapacity?: number;
  upcoming?: boolean;
  past?: boolean;
  thisWeek?: boolean;
  thisMonth?: boolean;
  tags?: string[];
  requiresTags?: string[];
};

/**
 * Specialized event query types
 */
export type FeaturedEventsQuery = {
  limit?: number;
};

export type UpcomingEventsQuery = {
  limit?: number;
  includeVirtual?: boolean;
  includePhysical?: boolean;
};

export type OrganizerEventsQuery = {
  organizerId: string;
  status?: string[];
  includeDrafts?: boolean;
};

/**
 * Registration management types
 */
export type RegistrationManagement = {
  eventId: string;
  registrations: EventRegistration[];
  totalCount: number;
  page: number;
  limit: number;
};

export type RegistrationStatusUpdate = {
  registrationId: string;
  status: 'registered' | 'waitlist' | 'cancelled' | 'attended' | 'no_show';
  notes?: string;
};

/**
 * Waitlist management types
 */
export type WaitlistManagement = {
  eventId: string;
  waitlist: EventRegistration[];
  availableSpots: number;
  totalWaiting: number;
};

/**
 * Event cancellation data
 */
export type EventCancellation = {
  eventId: string;
  reason: string;
  notifyAttendees: boolean;
  refundPolicy?: 'full' | 'partial' | 'none';
};

/**
 * Event status transition
 */
export type StatusTransition = {
  eventId: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
};

/**
 * Capacity update data
 */
export type CapacityUpdate = {
  eventId: string;
  capacity: number;
  reason?: string;
};

/**
 * Emergency contact data
 */
export type EmergencyContact = {
  name: string;
  phone: string;
  relationship: string;
};

/**
 * Special requirements data
 */
export type SpecialRequirements = {
  eventId: string;
  userId: string;
  requirements: string;
  dietaryRestrictions: string[];
  emergencyContact: EmergencyContact;
};

/**
 * API error response
 */
export type ApiError = {
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp?: string;
};

/**
 * API response wrapper
 */
export type ApiResponseData<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract event-related types from the API
 */
export type EventApiTypes = {
  Event: Event;
  EventRegistration: EventRegistration;
  EventFilter: EventFilter;
  CreateEventInput: CreateEventInput;
  UpdateEventInput: UpdateEventInput;
  RegistrationInput: RegistrationInput;
  SearchInput: SearchInput;
  WebSocketMessage: WebSocketMessage;
  EventUpdateCallbacks: EventUpdateCallbacks;
  AllEventsUpdateCallbacks: AllEventsUpdateCallbacks;
  CapacityCheck: CapacityCheck;
  BulkOperationResult: BulkOperationResult;
  RegistrationStatusResult: RegistrationStatusResult;
  ValidationResult: ValidationResult;
  RegistrationPermission: RegistrationPermission;
  FormattedEventData: FormattedEventData;
  EventAnalytics: EventAnalytics;
  AttendanceReport: AttendanceReport;
  CheckInOutData: CheckInOutData;
  ExportOptions: ExportOptions;
  BulkUpdateData: BulkUpdateData;
  BulkDeleteData: BulkDeleteData;
  WaitlistPromotionData: WaitlistPromotionData;
  DateRangeFilter: DateRangeFilter;
  ExtendedEventFilter: ExtendedEventFilter;
  FeaturedEventsQuery: FeaturedEventsQuery;
  UpcomingEventsQuery: UpcomingEventsQuery;
  OrganizerEventsQuery: OrganizerEventsQuery;
  RegistrationManagement: RegistrationManagement;
  RegistrationStatusUpdate: RegistrationStatusUpdate;
  WaitlistManagement: WaitlistManagement;
  EventCancellation: EventCancellation;
  StatusTransition: StatusTransition;
  CapacityUpdate: CapacityUpdate;
  EmergencyContact: EmergencyContact;
  SpecialRequirements: SpecialRequirements;
  ApiError: ApiError;
  ApiResponseData: ApiResponseData;
};

// ============================================================================
// EXPORTS
// ============================================================================

// All types are exported above for easy importing
export default EventApiTypes;
