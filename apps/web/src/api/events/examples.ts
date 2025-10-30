/**
 * Event API Usage Examples
 * 
 * This file demonstrates how to use the Event API service in various scenarios.
 * These examples can be used as reference when implementing event functionality.
 */

import eventApi, {
  fetchEvents,
  fetchEventById,
  createEvent,
  registerForEvent,
  subscribeToEventUpdates,
  canUserRegister,
  formatEventData
} from './eventApi';
import { Event, EventFilter, EventType, EventStatus, MembershipTier } from '@issb/types';

// ============================================================================
// BASIC EVENT OPERATIONS
// ============================================================================

/**
 * Example 1: Fetch and display events with basic filtering
 */
export const fetchAndDisplayEvents = async () => {
  try {
    // Fetch published conference events
    const filters: EventFilter = {
      type: [EventType.CONFERENCE],
      status: [EventStatus.PUBLISHED],
      sortBy: 'startDate',
      sortOrder: 'asc',
      page: 1,
      limit: 20
    };

    const response = await fetchEvents(filters);
    
    console.log(`Found ${response.pagination.total} events`);
    console.log('Events:', response.data);

    return response.data;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  }
};

/**
 * Example 2: Create a new event
 */
export const createNewEvent = async () => {
  try {
    const eventData = {
      title: 'Annual Tech Conference 2025',
      description: 'Join us for our annual technology conference featuring industry leaders and innovative sessions.',
      type: EventType.CONFERENCE,
      tier: MembershipTier.REGULAR,
      startDate: new Date('2025-09-15T09:00:00Z'),
      endDate: new Date('2025-09-15T18:00:00Z'),
      location: 'San Francisco Convention Center',
      isVirtual: false,
      capacity: 500,
      registrationDeadline: new Date('2025-09-01T23:59:59Z'),
      tags: ['technology', 'networking', 'innovation'],
      attachments: []
    };

    const newEvent = await createEvent(eventData);
    
    console.log('Event created successfully:', newEvent);
    return newEvent;
  } catch (error) {
    console.error('Failed to create event:', error);
    throw error;
  }
};

/**
 * Example 3: Fetch single event with detailed information
 */
export const getEventDetails = async (eventId: string) => {
  try {
    const event = await fetchEventById(eventId);
    
    // Format event data for display
    const formatted = formatEventData(event);
    
    console.log('Event Details:');
    console.log(`Title: ${event.title}`);
    console.log(`Duration: ${formatted.duration}`);
    console.log(`Status: ${formatted.isUpcoming ? 'Upcoming' : formatted.isOngoing ? 'Ongoing' : 'Past'}`);
    console.log(`Registration: ${formatted.registrationStatus}`);
    console.log(`Capacity: ${formatted.capacityStatus}`);
    
    return { event, formatted };
  } catch (error) {
    console.error('Failed to fetch event details:', error);
    throw error;
  }
};

// ============================================================================
// EVENT REGISTRATION
// ============================================================================

/**
 * Example 4: Register for an event with additional information
 */
export const registerForEventWithDetails = async (eventId: string, userId: string) => {
  try {
    // First check if user can register
    const event = await fetchEventById(eventId);
    const permission = canUserRegister(event, 'board', 50); // Assuming user tier is 'board'
    
    if (!permission.canRegister) {
      console.error('Cannot register:', permission.reason);
      return null;
    }
    
    if (permission.warnings && permission.warnings.length > 0) {
      console.warn('Registration warnings:', permission.warnings);
    }
    
    // Register with additional information
    const registrationData = {
      specialRequirements: 'I require wheelchair accessibility and ASL interpretation',
      dietaryRestrictions: ['vegetarian', 'gluten-free'],
      emergencyContact: {
        name: 'John Doe',
        phone: '+1-555-0123',
        relationship: 'Spouse'
      }
    };
    
    const registration = await eventApi.registerForEvent(eventId, registrationData);
    
    console.log('Successfully registered for event:', registration);
    return registration;
  } catch (error) {
    console.error('Failed to register for event:', error);
    throw error;
  }
};

/**
 * Example 5: Check event capacity before registration
 */
export const checkCapacityBeforeRegister = async (eventId: string) => {
  try {
    const capacity = await eventApi.checkEventCapacity(eventId);
    
    console.log('Event Capacity Information:');
    console.log(`Available spots: ${capacity.availableSpots}`);
    console.log(`Total capacity: ${capacity.totalCapacity || 'Unlimited'}`);
    console.log(`Current registrations: ${capacity.currentRegistrations}`);
    console.log(`Has capacity: ${capacity.hasCapacity}`);
    
    if (!capacity.hasCapacity) {
      console.log('Event is full. Consider joining waitlist.');
      return null;
    }
    
    if (capacity.availableSpots <= 5) {
      console.warn(`Only ${capacity.availableSpots} spots remaining!`);
    }
    
    return capacity;
  } catch (error) {
    console.error('Failed to check event capacity:', error);
    throw error;
  }
};

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

/**
 * Example 6: Advanced event search
 */
export const advancedEventSearch = async () => {
  try {
    const searchQuery = 'networking workshop';
    const filters: Partial<EventFilter> = {
      type: [EventType.WORKSHOP, EventType.CONFERENCE],
      status: [EventStatus.PUBLISHED],
      upcoming: true,
      location: 'New York',
      tags: ['networking', 'professional'],
      sortBy: 'startDate',
      sortOrder: 'asc'
    };
    
    const results = await eventApi.searchEvents(searchQuery, filters);
    
    console.log(`Found ${results.pagination.total} events matching "${searchQuery}"`);
    console.log('Search results:', results.data);
    
    return results.data;
  } catch (error) {
    console.error('Failed to search events:', error);
    throw error;
  }
};

/**
 * Example 7: Filter events by multiple criteria
 */
export const filterEventsByCriteria = async () => {
  try {
    const filters: EventFilter = {
      // Date range filters
      dateRange: {
        start: new Date('2025-01-01'),
        end: new Date('2025-12-31')
      },
      
      // Event type filters
      type: [EventType.CONFERENCE, EventType.WORKSHOP, EventType.WEBINAR],
      
      // Membership tier filters
      tier: [MembershipTier.REGULAR, MembershipTier.BOARD],
      
      // Capacity filters
      hasCapacity: true,
      minCapacity: 50,
      maxCapacity: 500,
      
      // Sorting
      sortBy: 'startDate',
      sortOrder: 'desc',
      
      // Pagination
      page: 1,
      limit: 10
    };
    
    const response = await fetchEvents(filters);
    
    console.log(`Found ${response.pagination.total} events`);
    console.log('Filtered events:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Failed to filter events:', error);
    throw error;
  }
};

// ============================================================================
// REAL-TIME UPDATES
// ============================================================================

/**
 * Example 8: Subscribe to real-time event updates
 */
export const subscribeToRealTimeUpdates = (eventId: string) => {
  console.log('Subscribing to real-time updates for event:', eventId);
  
  const unsubscribe = subscribeToEventUpdates(eventId, {
    onRegistrationUpdate: (registration) => {
      console.log('New registration:', {
        userId: registration.userId,
        status: registration.status,
        registeredAt: registration.registeredAt
      });
      
      // Update UI or show notification
      // showNotification(`New registration for event`);
    },
    
    onCapacityUpdate: (capacity) => {
      console.log('Capacity updated:', capacity);
      
      // Update capacity display
      // updateCapacityDisplay(capacity.available, capacity.total);
    },
    
    onEventUpdate: (event) => {
      console.log('Event updated:', event.title);
      
      // Refresh event details or show update notification
      // refreshEventDetails(event.id);
    },
    
    onEventCancelled: () => {
      console.log('Event was cancelled');
      
      // Show cancellation message and redirect
      // showCancellationMessage();
      // navigateTo('/events');
    },
    
    onError: (error) => {
      console.error('Real-time update error:', error);
      
      // Show error message or attempt reconnection
      // showErrorMessage('Connection lost. Attempting to reconnect...');
    }
  });
  
  // Return unsubscribe function for cleanup
  return unsubscribe;
};

/**
 * Example 9: Subscribe to all events updates (for admin dashboard)
 */
export const subscribeToAllEventsUpdates = () => {
  console.log('Subscribing to all events updates');
  
  const unsubscribe = eventApi.subscribeToAllEventUpdates({
    onEventCreated: (event) => {
      console.log('New event created:', event.title);
      // Update events list
      // addEventToList(event);
    },
    
    onEventUpdated: (event) => {
      console.log('Event updated:', event.title);
      // Update specific event in list
      // updateEventInList(event);
    },
    
    onEventDeleted: (eventId) => {
      console.log('Event deleted:', eventId);
      // Remove event from list
      // removeEventFromList(eventId);
    },
    
    onEventCancelled: (eventId) => {
      console.log('Event cancelled:', eventId);
      // Mark event as cancelled in list
      // markEventAsCancelled(eventId);
    },
    
    onError: (error) => {
      console.error('Events updates error:', error);
    }
  });
  
  return unsubscribe;
};

// ============================================================================
// ATTENDANCE TRACKING
// ============================================================================

/**
 * Example 10: Check in attendees to an event
 */
export const checkInAttendee = async (eventId: string, userId: string) => {
  try {
    const registration = await eventApi.checkInUser(eventId, userId);
    
    console.log('Attendee checked in:', {
      userId,
      eventId,
      checkInTime: registration.attendance?.checkInTime
    });
    
    return registration;
  } catch (error) {
    console.error('Failed to check in attendee:', error);
    throw error;
  }
};

/**
 * Example 11: Generate attendance report
 */
export const generateAttendanceReport = async (eventId: string) => {
  try {
    const report = await eventApi.getAttendanceReport(eventId);
    
    console.log('Attendance Report:');
    console.log(`Total Registered: ${report.totalRegistered}`);
    console.log(`Total Checked In: ${report.totalCheckedIn}`);
    console.log(`Total Checked Out: ${report.totalCheckedOut}`);
    console.log(`No Shows: ${report.noShows}`);
    console.log(`Attendance Rate: ${report.attendanceRate.toFixed(2)}%`);
    
    return report;
  } catch (error) {
    console.error('Failed to generate attendance report:', error);
    throw error;
  }
};

// ============================================================================
// CAPACITY MANAGEMENT
// ============================================================================

/**
 * Example 12: Manage waitlist
 */
export const manageWaitlist = async (eventId: string) => {
  try {
    // Get current waitlist
    const waitlist = await eventApi.getWaitlist(eventId);
    
    console.log('Current waitlist:', waitlist);
    
    // Promote some users from waitlist when spots become available
    const availableSpots = 5;
    const usersToPromote = waitlist
      .slice(0, availableSpots)
      .map(reg => reg.userId);
    
    if (usersToPromote.length > 0) {
      const promoted = await eventApi.promoteFromWaitlist(eventId, usersToPromote);
      console.log('Promoted from waitlist:', promoted);
    }
    
    return { waitlist, promoted: usersToPromote.length };
  } catch (error) {
    console.error('Failed to manage waitlist:', error);
    throw error;
  }
};

/**
 * Example 13: Update event capacity
 */
export const updateEventCapacity = async (eventId: string, newCapacity: number) => {
  try {
    const event = await eventApi.updateEventCapacity(eventId, newCapacity);
    
    console.log('Event capacity updated:', {
      eventId,
      oldCapacity: event.capacity,
      registeredCount: event.registeredCount,
      availableSpots: (event.capacity || 0) - event.registeredCount
    });
    
    return event;
  } catch (error) {
    console.error('Failed to update event capacity:', error);
    throw error;
  }
};

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Example 14: Bulk update multiple events
 */
export const bulkUpdateEvents = async (eventIds: string[]) => {
  try {
    const updates = {
      status: 'published',
      tags: ['featured', 'important'],
      capacity: 200
    };
    
    const result = await eventApi.bulkUpdateEvents(eventIds, updates);
    
    console.log('Bulk update results:', {
      successful: result.successful.length,
      failed: result.failed.length,
      failedEvents: result.failed
    });
    
    return result;
  } catch (error) {
    console.error('Failed to bulk update events:', error);
    throw error;
  }
};

// ============================================================================
// ANALYTICS AND REPORTS
// ============================================================================

/**
 * Example 15: Get event analytics
 */
export const getEventAnalytics = async (eventId: string) => {
  try {
    const dateRange = {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31')
    };
    
    const analytics = await eventApi.getEventAnalytics(eventId, dateRange);
    
    console.log('Event Analytics:');
    console.log('Registration Stats:', analytics.registrationStats);
    console.log('Attendance Stats:', analytics.attendanceStats);
    console.log('Capacity Stats:', analytics.capacityStats);
    
    return analytics;
  } catch (error) {
    console.error('Failed to get event analytics:', error);
    throw error;
  }
};

/**
 * Example 16: Export event data
 */
export const exportEventData = async (eventId: string) => {
  try {
    const blob = await eventApi.exportEventData(eventId, 'excel', true, true);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-${eventId}-export.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Event data exported successfully');
  } catch (error) {
    console.error('Failed to export event data:', error);
    throw error;
  }
};

// ============================================================================
// REACT COMPONENT EXAMPLES
// ============================================================================

/**
 * Example 17: Event list component with real-time updates
 */
export const EventListComponent = () => {
  // This would be a React component
  /*
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetchEvents({ status: [EventStatus.PUBLISHED] });
        setEvents(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEvents();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToAllEventsUpdates({
      onEventCreated: (event) => {
        setEvents(prev => [event, ...prev]);
      },
      onEventUpdated: (event) => {
        setEvents(prev => prev.map(e => e.id === event.id ? event : e));
      },
      onEventDeleted: (eventId) => {
        setEvents(prev => prev.filter(e => e.id !== eventId));
      }
    });
    
    return unsubscribe;
  }, []);
  
  if (isLoading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
  */
};

/**
 * Example 18: Event registration component with capacity checking
 */
export const EventRegistrationComponent = () => {
  // This would be a React component
  /*
  const [event, setEvent] = useState<Event | null>(null);
  const [capacity, setCapacity] = useState<CapacityCheck | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  useEffect(() => {
    const loadEventData = async () => {
      const [eventData, capacityData] = await Promise.all([
        fetchEventById(eventId),
        checkEventCapacity(eventId)
      ]);
      
      setEvent(eventData);
      setCapacity(capacityData);
    };
    
    loadEventData();
    
    // Subscribe to capacity updates
    const unsubscribe = subscribeToEventUpdates(eventId, {
      onCapacityUpdate: (newCapacity) => {
        setCapacity(newCapacity);
      }
    });
    
    return unsubscribe;
  }, [eventId]);
  
  const handleRegister = async () => {
    if (!event || !capacity?.hasCapacity) return;
    
    setIsRegistering(true);
    
    try {
      const permission = canUserRegister(event, userTier, event.registeredCount);
      if (!permission.canRegister) {
        alert(permission.reason);
        return;
      }
      
      await registerForEventWithDetails(event.id, userId);
      alert('Successfully registered for event!');
    } catch (error) {
      alert('Registration failed: ' + error.message);
    } finally {
      setIsRegistering(false);
    }
  };
  
  if (!event || !capacity) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>{event.title}</h2>
      <p>Available spots: {capacity.availableSpots}</p>
      {capacity.hasCapacity ? (
        <button onClick={handleRegister} disabled={isRegistering}>
          {isRegistering ? 'Registering...' : 'Register Now'}
        </button>
      ) : (
        <div>
          <p>Event is full</p>
          <button>Join Waitlist</button>
        </div>
      )}
    </div>
  );
  */
};

// ============================================================================
// ERROR HANDLING EXAMPLES
// ============================================================================

/**
 * Example 19: Comprehensive error handling
 */
export const robustEventOperation = async (eventId: string) => {
  try {
    // Validate inputs
    if (!eventId) {
      throw new Error('Event ID is required');
    }
    
    // Fetch event with timeout
    const event = await Promise.race([
      fetchEventById(eventId),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
    ]);
    
    // Check permissions
    const permission = canUserRegister(event, 'board', 0);
    if (!permission.canRegister) {
      throw new Error(`Registration not allowed: ${permission.reason}`);
    }
    
    // Check capacity
    const capacity = await eventApi.checkEventCapacity(eventId);
    if (!capacity.hasCapacity) {
      throw new Error('Event is at full capacity');
    }
    
    // Attempt registration
    const registration = await eventApi.registerForEvent(eventId);
    
    console.log('Registration successful:', registration);
    return registration;
    
  } catch (error) {
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.error('Request timed out. Please try again.');
      } else if (error.message.includes('capacity')) {
        console.error('Event is full. Consider joining the waitlist.');
      } else if (error.message.includes('permission')) {
        console.error('You do not have permission to register for this event.');
      } else {
        console.error('Registration failed:', error.message);
      }
    } else {
      console.error('An unexpected error occurred');
    }
    
    throw error;
  }
};

/**
 * Example 20: Retry mechanism for failed requests
 */
export const retryEventOperation = async (
  operation: () => Promise<any>,
  maxRetries: number = 3,
  delay: number = 1000
) => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        console.error(`All ${maxRetries} attempts failed`);
        break;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError!;
};

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export const EventApiExamples = {
  // Basic operations
  fetchAndDisplayEvents,
  createNewEvent,
  getEventDetails,
  
  // Registration
  registerForEventWithDetails,
  checkCapacityBeforeRegister,
  
  // Search and filtering
  advancedEventSearch,
  filterEventsByCriteria,
  
  // Real-time updates
  subscribeToRealTimeUpdates,
  subscribeToAllEventsUpdates,
  
  // Attendance
  checkInAttendee,
  generateAttendanceReport,
  
  // Capacity management
  manageWaitlist,
  updateEventCapacity: updateEventCapacity,
  
  // Bulk operations
  bulkUpdateEvents,
  
  // Analytics
  getEventAnalytics,
  exportEventData,
  
  // Error handling
  robustEventOperation,
  retryEventOperation
};

export default EventApiExamples;
