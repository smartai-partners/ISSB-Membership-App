import api from '../../services/api';
import {
  Event,
  EventRegistration,
  EventFilter,
  PaginatedResponse,
  CreateInput,
  UpdateInput,
  ApiResponse
} from '@issb/types';

// ============================================================================
// EVENT CRUD ENDPOINTS
// ============================================================================

/**
 * Fetch events with filtering, pagination, and sorting
 */
export const fetchEvents = async (
  filters: EventFilter = {}
): Promise<PaginatedResponse<Event>> => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.set(key, value.toString());
        }
      }
    });

    const response = await api.get<PaginatedResponse<Event>>(`/events?${params}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch events');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch events');
  }
};

/**
 * Fetch a single event by ID
 */
export const fetchEventById = async (id: string): Promise<Event> => {
  try {
    const response = await api.get<ApiResponse<Event>>(`/events/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch event');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch event');
  }
};

/**
 * Create a new event
 */
export const createEvent = async (eventData: CreateInput<Event>): Promise<Event> => {
  try {
    const response = await api.post<ApiResponse<Event>>('/events', eventData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create event');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to create event');
  }
};

/**
 * Update an existing event
 */
export const updateEvent = async (id: string, eventData: UpdateInput<Event>): Promise<Event> => {
  try {
    const response = await api.put<ApiResponse<Event>>(`/events/${id}`, eventData);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update event');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to update event');
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (id: string): Promise<boolean> => {
  try {
    const response = await api.delete<ApiResponse>(`/events/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete event');
    }
    
    return true;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to delete event');
  }
};

/**
 * Cancel an event with notification to attendees
 */
export const cancelEvent = async (
  id: string, 
  reason: string, 
  notifyAttendees: boolean = true
): Promise<Event> => {
  try {
    const response = await api.patch<ApiResponse<Event>>(`/events/${id}/cancel`, {
      reason,
      notifyAttendees
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to cancel event');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to cancel event');
  }
};

// ============================================================================
// EVENT SPECIALIZED ENDPOINTS
// ============================================================================

/**
 * Fetch featured events
 */
export const fetchFeaturedEvents = async (): Promise<Event[]> => {
  try {
    const response = await api.get<ApiResponse<Event[]>>('/events/featured');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch featured events');
    }
    
    return response.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch featured events');
  }
};

/**
 * Fetch upcoming events
 */
export const fetchUpcomingEvents = async (limit?: number): Promise<Event[]> => {
  try {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get<ApiResponse<Event[]>>(`/events/upcoming${params}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch upcoming events');
    }
    
    return response.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch upcoming events');
  }
};

/**
 * Fetch events for a specific organizer
 */
export const fetchOrganizerEvents = async (organizerId: string): Promise<Event[]> => {
  try {
    const response = await api.get<ApiResponse<Event[]>>(`/events/organizer/${organizerId}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch organizer events');
    }
    
    return response.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch organizer events');
  }
};

/**
 * Search events with advanced search capabilities
 */
export const searchEvents = async (
  query: string,
  filters: Partial<EventFilter> = {}
): Promise<PaginatedResponse<Event>> => {
  try {
    const params = new URLSearchParams({
      q: query,
      ...Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => acc.append(key, v.toString()));
          } else {
            acc.set(key, value.toString());
          }
        }
        return acc;
      }, new URLSearchParams())
    });

    const response = await api.get<PaginatedResponse<Event>>(`/events/search?${params}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to search events');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to search events');
  }
};

// ============================================================================
// REGISTRATION MANAGEMENT
// ============================================================================

/**
 * Register for an event
 */
export const registerForEvent = async (
  eventId: string,
  registrationData?: {
    specialRequirements?: string;
    dietaryRestrictions?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  }
): Promise<EventRegistration> => {
  try {
    const response = await api.post<ApiResponse<EventRegistration>>(
      `/events/${eventId}/register`, 
      registrationData || {}
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to register for event');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to register for event');
  }
};

/**
 * Cancel event registration
 */
export const cancelEventRegistration = async (registrationId: string): Promise<boolean> => {
  try {
    const response = await api.delete<ApiResponse>(`/events/registrations/${registrationId}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to cancel registration');
    }
    
    return true;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to cancel registration');
  }
};

/**
 * Check registration status for an event
 */
export const checkRegistrationStatus = async (
  eventId: string,
  userId: string
): Promise<EventRegistration | null> => {
  try {
    const response = await api.get<ApiResponse<EventRegistration | null>>(
      `/events/${eventId}/registration-status/${userId}`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to check registration status');
    }
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to check registration status');
  }
};

/**
 * Get all registrations for an event (admin/organizer only)
 */
export const getEventRegistrations = async (
  eventId: string,
  status?: string[]
): Promise<EventRegistration[]> => {
  try {
    const params = status?.length ? `?status=${status.join(',')}` : '';
    const response = await api.get<ApiResponse<EventRegistration[]>>(
      `/events/${eventId}/registrations${params}`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch event registrations');
    }
    
    return response.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch event registrations');
  }
};

/**
 * Update registration status (admin/organizer only)
 */
export const updateRegistrationStatus = async (
  registrationId: string,
  status: 'registered' | 'waitlist' | 'cancelled' | 'attended' | 'no_show',
  notes?: string
): Promise<EventRegistration> => {
  try {
    const response = await api.patch<ApiResponse<EventRegistration>>(
      `/events/registrations/${registrationId}/status`,
      { status, notes }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update registration status');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to update registration status');
  }
};

// ============================================================================
// ATTENDANCE TRACKING
// ============================================================================

/**
 * Check in a user to an event
 */
export const checkInUser = async (
  eventId: string,
  userId: string,
  checkInTime?: Date
): Promise<EventRegistration> => {
  try {
    const response = await api.post<ApiResponse<EventRegistration>>(
      `/events/${eventId}/check-in`,
      { 
        userId, 
        checkInTime: checkInTime?.toISOString() || new Date().toISOString() 
      }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to check in user');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to check in user');
  }
};

/**
 * Check out a user from an event
 */
export const checkOutUser = async (
  eventId: string,
  userId: string,
  checkOutTime?: Date
): Promise<EventRegistration> => {
  try {
    const response = await api.post<ApiResponse<EventRegistration>>(
      `/events/${eventId}/check-out`,
      { 
        userId, 
        checkOutTime: checkOutTime?.toISOString() || new Date().toISOString() 
      }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to check out user');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to check out user');
  }
};

/**
 * Bulk check-in attendees
 */
export const bulkCheckIn = async (
  eventId: string,
  userIds: string[]
): Promise<{ successful: string[], failed: { userId: string, error: string }[] }> => {
  try {
    const response = await api.post<ApiResponse<{
      successful: string[];
      failed: { userId: string, error: string }[];
    }>>(`/events/${eventId}/bulk-check-in`, { userIds });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to perform bulk check-in');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to perform bulk check-in');
  }
};

/**
 * Get attendance report for an event
 */
export const getAttendanceReport = async (
  eventId: string
): Promise<{
  totalRegistered: number;
  totalCheckedIn: number;
  totalCheckedOut: number;
  noShows: number;
  attendanceRate: number;
  attendees: EventRegistration[];
}> => {
  try {
    const response = await api.get<ApiResponse<{
      totalRegistered: number;
      totalCheckedIn: number;
      totalCheckedOut: number;
      noShows: number;
      attendanceRate: number;
      attendees: EventRegistration[];
    }>>(`/events/${eventId}/attendance-report`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch attendance report');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch attendance report');
  }
};

// ============================================================================
// CAPACITY MANAGEMENT
// ============================================================================

/**
 * Check if an event has available capacity
 */
export const checkEventCapacity = async (eventId: string): Promise<{
  hasCapacity: boolean;
  availableSpots: number;
  totalCapacity?: number;
  currentRegistrations: number;
}> => {
  try {
    const response = await api.get<ApiResponse<{
      hasCapacity: boolean;
      availableSpots: number;
      totalCapacity?: number;
      currentRegistrations: number;
    }>>(`/events/${eventId}/capacity`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to check event capacity');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to check event capacity');
  }
};

/**
 * Update event capacity
 */
export const updateEventCapacity = async (
  eventId: string,
  capacity: number
): Promise<Event> => {
  try {
    const response = await api.patch<ApiResponse<Event>>(
      `/events/${eventId}/capacity`,
      { capacity }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update event capacity');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to update event capacity');
  }
};

/**
 * Get waitlist for a full event
 */
export const getWaitlist = async (eventId: string): Promise<EventRegistration[]> => {
  try {
    const response = await api.get<ApiResponse<EventRegistration[]>>(
      `/events/${eventId}/waitlist`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch waitlist');
    }
    
    return response.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch waitlist');
  }
};

/**
 * Promote users from waitlist to registered (when spots become available)
 */
export const promoteFromWaitlist = async (
  eventId: string,
  userIds: string[]
): Promise<EventRegistration[]> => {
  try {
    const response = await api.post<ApiResponse<EventRegistration[]>>(
      `/events/${eventId}/promote-waitlist`,
      { userIds }
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to promote from waitlist');
    }
    
    return response.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to promote from waitlist');
  }
};

// ============================================================================
// REAL-TIME UPDATES (WebSocket Integration)
// ============================================================================

/**
 * Subscribe to real-time event updates
 */
export const subscribeToEventUpdates = (
  eventId: string,
  callbacks: {
    onRegistrationUpdate?: (registration: EventRegistration) => void;
    onCapacityUpdate?: (capacity: { available: number; total?: number }) => void;
    onEventUpdate?: (event: Event) => void;
    onEventCancelled?: () => void;
    onError?: (error: string) => void;
  }
): () => void => {
  // WebSocket URL would typically come from environment variables
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
  const ws = new WebSocket(`${wsUrl}/events/${eventId}/updates`);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'registration_update':
          callbacks.onRegistrationUpdate?.(data.payload);
          break;
        case 'capacity_update':
          callbacks.onCapacityUpdate?.(data.payload);
          break;
        case 'event_update':
          callbacks.onEventUpdate?.(data.payload);
          break;
        case 'event_cancelled':
          callbacks.onEventCancelled?.();
          break;
        case 'error':
          callbacks.onError?.(data.payload);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      callbacks.onError?.('Failed to parse update message');
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    callbacks.onError?.('Connection error');
  };
  
  // Return unsubscribe function
  return () => {
    ws.close();
  };
};

/**
 * Subscribe to all events updates (for dashboard, admin panels)
 */
export const subscribeToAllEventUpdates = (
  callbacks: {
    onEventCreated?: (event: Event) => void;
    onEventUpdated?: (event: Event) => void;
    onEventDeleted?: (eventId: string) => void;
    onEventCancelled?: (eventId: string) => void;
    onError?: (error: string) => void;
  }
): () => void => {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
  const ws = new WebSocket(`${wsUrl}/events/updates`);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'event_created':
          callbacks.onEventCreated?.(data.payload);
          break;
        case 'event_updated':
          callbacks.onEventUpdated?.(data.payload);
          break;
        case 'event_deleted':
          callbacks.onEventDeleted?.(data.payload);
          break;
        case 'event_cancelled':
          callbacks.onEventCancelled?.(data.payload);
          break;
        case 'error':
          callbacks.onError?.(data.payload);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      callbacks.onError?.('Failed to parse update message');
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    callbacks.onError?.('Connection error');
  };
  
  return () => {
    ws.close();
  };
};

// ============================================================================
// EVENT ANALYTICS & REPORTS
// ============================================================================

/**
 * Get event analytics
 */
export const getEventAnalytics = async (
  eventId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
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
}> => {
  try {
    const params = dateRange ? `?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}` : '';
    const response = await api.get<ApiResponse<{
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
    }>>(`/events/${eventId}/analytics${params}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch event analytics');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch event analytics');
  }
};

/**
 * Export event data (CSV, Excel, etc.)
 */
export const exportEventData = async (
  eventId: string,
  format: 'csv' | 'excel' | 'pdf' = 'csv',
  includeAttendees: boolean = true,
  includeAnalytics: boolean = true
): Promise<Blob> => {
  try {
    const response = await api.get(
      `/events/${eventId}/export`,
      {
        params: { format, includeAttendees, includeAnalytics },
        responseType: 'blob'
      }
    );
    
    return response;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to export event data');
  }
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk update events
 */
export const bulkUpdateEvents = async (
  eventIds: string[],
  updates: {
    status?: string;
    capacity?: number;
    tags?: string[];
  }
): Promise<{ updated: number; failed: string[] }> => {
  try {
    const response = await api.patch<ApiResponse<{
      updated: number;
      failed: string[];
    }>>('/events/bulk-update', {
      eventIds,
      updates
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to bulk update events');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to bulk update events');
  }
};

/**
 * Bulk delete events
 */
export const bulkDeleteEvents = async (
  eventIds: string[],
  confirmDelete: boolean = false
): Promise<{ deleted: number; failed: string[] }> => {
  try {
    const response = await api.delete<ApiResponse<{
      deleted: number;
      failed: string[];
    }>>('/events/bulk-delete', {
      data: { eventIds, confirmDelete }
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to bulk delete events');
    }
    
    return response.data!;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to bulk delete events');
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate event data before sending to API
 */
export const validateEventData = (eventData: Partial<CreateInput<Event>>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!eventData.title || eventData.title.length < 3) {
    errors.push('Event title must be at least 3 characters');
  }
  
  if (!eventData.description || eventData.description.length < 10) {
    errors.push('Event description must be at least 10 characters');
  }
  
  if (!eventData.startDate || !eventData.endDate) {
    errors.push('Start date and end date are required');
  } else if (new Date(eventData.endDate) <= new Date(eventData.startDate)) {
    errors.push('End date must be after start date');
  }
  
  if (eventData.capacity && eventData.capacity < 1) {
    errors.push('Event capacity must be at least 1');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format event data for display
 */
export const formatEventData = (event: Event): {
  duration: string;
  registrationStatus: string;
  capacityStatus: string;
  isUpcoming: boolean;
  isOngoing: boolean;
  isPast: boolean;
} => {
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  let registrationStatus = 'Open';
  if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
    registrationStatus = 'Closed';
  }
  
  let capacityStatus = '';
  if (event.capacity) {
    const available = event.capacity - event.registeredCount;
    if (available <= 0) {
      capacityStatus = 'Full';
    } else if (available <= 5) {
      capacityStatus = `Only ${available} spots left`;
    } else {
      capacityStatus = `${available} spots available`;
    }
  } else {
    capacityStatus = 'No capacity limit';
  }
  
  return {
    duration: `${durationHours}h ${durationMinutes}m`,
    registrationStatus,
    capacityStatus,
    isUpcoming: startDate > now,
    isOngoing: startDate <= now && endDate >= now,
    isPast: endDate < now
  };
};

/**
 * Check if user can register for an event
 */
export const canUserRegister = (
  event: Event,
  userTier: string,
  currentRegistrations: number = 0
): {
  canRegister: boolean;
  reason?: string;
  warnings?: string[];
} => {
  const warnings: string[] = [];
  let canRegister = true;
  let reason: string | undefined;
  
  // Check if event is published
  if (event.status !== 'published') {
    canRegister = false;
    reason = 'Event is not published';
  }
  
  // Check tier restrictions
  const tierHierarchy = {
    regular: 1,
    board: 2,
    admin: 3
  };
  
  const userLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
  const requiredLevel = tierHierarchy[event.tier as keyof typeof tierHierarchy] || 0;
  
  if (userLevel < requiredLevel) {
    canRegister = false;
    reason = 'Your membership tier does not allow registration for this event';
  }
  
  // Check registration deadline
  if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
    canRegister = false;
    reason = 'Registration deadline has passed';
  }
  
  // Check capacity
  if (event.capacity && currentRegistrations >= event.capacity) {
    canRegister = false;
    reason = 'Event is full';
  } else if (event.capacity && (event.capacity - currentRegistrations) <= 5) {
    warnings.push(`Only ${event.capacity - currentRegistrations} spots remaining`);
  }
  
  return { canRegister, reason, warnings };
};

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const eventApi = {
  // CRUD
  fetchEvents,
  fetchEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  cancelEvent,
  
  // Specialized queries
  fetchFeaturedEvents,
  fetchUpcomingEvents,
  fetchOrganizerEvents,
  searchEvents,
  
  // Registration
  registerForEvent,
  cancelEventRegistration,
  checkRegistrationStatus,
  getEventRegistrations,
  updateRegistrationStatus,
  
  // Attendance
  checkInUser,
  checkOutUser,
  bulkCheckIn,
  getAttendanceReport,
  
  // Capacity
  checkEventCapacity,
  updateEventCapacity,
  getWaitlist,
  promoteFromWaitlist,
  
  // Real-time
  subscribeToEventUpdates,
  subscribeToAllEventUpdates,
  
  // Analytics
  getEventAnalytics,
  exportEventData,
  
  // Bulk operations
  bulkUpdateEvents,
  bulkDeleteEvents,
  
  // Utilities
  validateEventData,
  formatEventData,
  canUserRegister
};

export default eventApi;
