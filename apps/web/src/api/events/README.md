# Event API Service

Comprehensive event management API service for the ISSB web application. This service provides CRUD operations, registration management, attendance tracking, search and filtering, real-time updates, and capacity management for events.

## Features

### 🎯 Core Functionality
- **Event CRUD Operations** - Create, read, update, delete events
- **Registration Management** - Handle event registrations, cancellations, and status updates
- **Attendance Tracking** - Check-in/check-out attendees and generate attendance reports
- **Event Search & Filtering** - Advanced search with multiple filters and sorting options
- **Capacity Management** - Track and manage event capacity with waitlist functionality
- **Real-time Updates** - WebSocket integration for live updates

### 📊 Analytics & Reports
- Event analytics and metrics
- Export event data in multiple formats (CSV, Excel, PDF)
- Attendance reports and statistics
- Bulk operations for managing multiple events

### 🔒 Security & Validation
- Type-safe API calls using TypeScript
- Comprehensive error handling
- Data validation utilities
- Permission-based access control

## Installation

The API service is already set up in the project. It uses the shared types from `@issb/types` package.

```typescript
import { eventApi } from '@/api/events';
// or
import eventApi from '@/api/events';
```

## API Reference

### Event CRUD Operations

#### Fetch Events
```typescript
import { fetchEvents } from '@/api/events';

const events = await fetchEvents({
  type: ['conference', 'workshop'],
  status: ['published'],
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  search: 'networking',
  sortBy: 'startDate',
  sortOrder: 'asc',
  page: 1,
  limit: 20
});
```

#### Create Event
```typescript
import { createEvent } from '@/api/events';

const newEvent = await createEvent({
  title: 'Annual Conference 2025',
  description: 'Join us for our annual conference...',
  type: EventType.CONFERENCE,
  tier: MembershipTier.REGULAR,
  startDate: new Date('2025-06-15T09:00:00Z'),
  endDate: new Date('2025-06-15T17:00:00Z'),
  location: 'Convention Center',
  isVirtual: false,
  capacity: 500,
  registrationDeadline: new Date('2025-06-01T23:59:59Z'),
  tags: ['networking', 'professional'],
  attachments: []
});
```

#### Update Event
```typescript
import { updateEvent } from '@/api/events';

const updatedEvent = await updateEvent(eventId, {
  title: 'Updated Conference Title',
  capacity: 750
});
```

### Registration Management

#### Register for Event
```typescript
import { registerForEvent } from '@/api/events';

const registration = await registerForEvent(eventId, {
  specialRequirements: 'Wheelchair access needed',
  dietaryRestrictions: ['vegetarian', 'gluten-free'],
  emergencyContact: {
    name: 'John Doe',
    phone: '+1234567890',
    relationship: 'Spouse'
  }
});
```

#### Cancel Registration
```typescript
import { cancelEventRegistration } from '@/api/events';

await cancelEventRegistration(registrationId);
```

#### Check Registration Status
```typescript
import { checkRegistrationStatus } from '@/api/events';

const status = await checkRegistrationStatus(eventId, userId);
if (status) {
  console.log(`Registration status: ${status.status}`);
}
```

### Attendance Tracking

#### Check In User
```typescript
import { checkInUser } from '@/api/events';

const registration = await checkInUser(eventId, userId);
```

#### Bulk Check In
```typescript
import { bulkCheckIn } from '@/api/events';

const result = await bulkCheckIn(eventId, ['user1', 'user2', 'user3']);
console.log(`Successfully checked in: ${result.successful.length} users`);
console.log(`Failed: ${result.failed.length} users`);
```

#### Get Attendance Report
```typescript
import { getAttendanceReport } from '@/api/events';

const report = await getAttendanceReport(eventId);
console.log(`Attendance rate: ${report.attendanceRate}%`);
console.log(`Total checked in: ${report.totalCheckedIn}`);
```

### Capacity Management

#### Check Event Capacity
```typescript
import { checkEventCapacity } from '@/api/events';

const capacity = await checkEventCapacity(eventId);
console.log(`Available spots: ${capacity.availableSpots}`);
console.log(`Has capacity: ${capacity.hasCapacity}`);
```

#### Promote from Waitlist
```typescript
import { promoteFromWaitlist } from '@/api/events';

const promoted = await promoteFromWaitlist(eventId, ['user1', 'user2']);
```

### Real-time Updates

#### Subscribe to Event Updates
```typescript
import { subscribeToEventUpdates } from '@/api/events';

const unsubscribe = subscribeToEventUpdates(eventId, {
  onRegistrationUpdate: (registration) => {
    console.log('New registration:', registration);
  },
  onCapacityUpdate: (capacity) => {
    console.log('Capacity updated:', capacity);
  },
  onEventUpdate: (event) => {
    console.log('Event updated:', event);
  },
  onEventCancelled: () => {
    console.log('Event was cancelled');
  },
  onError: (error) => {
    console.error('WebSocket error:', error);
  }
});

// Later, unsubscribe
unsubscribe();
```

#### Subscribe to All Event Updates
```typescript
import { subscribeToAllEventUpdates } from '@/api/events';

const unsubscribe = subscribeToAllEventUpdates({
  onEventCreated: (event) => {
    console.log('New event created:', event.title);
  },
  onEventUpdated: (event) => {
    console.log('Event updated:', event.title);
  },
  onEventDeleted: (eventId) => {
    console.log('Event deleted:', eventId);
  }
});
```

### Search & Filtering

#### Search Events
```typescript
import { searchEvents } from '@/api/events';

const results = await searchEvents('networking conference', {
  type: [EventType.CONFERENCE],
  location: 'New York',
  upcoming: true
});
```

#### Fetch Specialized Event Lists
```typescript
import { fetchFeaturedEvents, fetchUpcomingEvents } from '@/api/events';

const featured = await fetchFeaturedEvents();
const upcoming = await fetchUpcomingEvents(10); // Limit to 10 events
```

### Analytics & Reports

#### Get Event Analytics
```typescript
import { getEventAnalytics } from '@/api/events';

const analytics = await getEventAnalytics(eventId, {
  start: new Date('2025-01-01'),
  end: new Date('2025-12-31')
});

console.log('Registration trend:', analytics.registrationStats.trend);
console.log('Attendance rate:', analytics.attendanceStats.attendanceRate);
```

#### Export Event Data
```typescript
import { exportEventData } from '@/api/events';

const blob = await exportEventData(eventId, 'excel', true, true);
const url = URL.createObjectURL(blob);
// Trigger download
```

### Bulk Operations

#### Bulk Update Events
```typescript
import { bulkUpdateEvents } from '@/api/events';

const result = await bulkUpdateEvents(
  ['event1', 'event2', 'event3'],
  {
    status: 'published',
    tags: ['featured', 'important']
  }
);
console.log(`Updated: ${result.updated} events`);
console.log(`Failed: ${result.failed.length} events`);
```

### Utility Functions

#### Validate Event Data
```typescript
import { validateEventData } from '@/api/events';

const validation = validateEventData(eventData);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

#### Check if User Can Register
```typescript
import { canUserRegister } from '@/api/events';

const { canRegister, reason, warnings } = canUserRegister(
  event,
  'board', // user tier
  currentRegistrations
);

if (!canRegister) {
  console.error('Cannot register:', reason);
}

if (warnings.length > 0) {
  console.warn('Warnings:', warnings);
}
```

#### Format Event Data for Display
```typescript
import { formatEventData } from '@/api/events';

const formatted = formatEventData(event);
console.log('Duration:', formatted.duration);
console.log('Is upcoming:', formatted.isUpcoming);
console.log('Capacity status:', formatted.capacityStatus);
```

## Error Handling

All API functions throw descriptive errors that can be caught and handled:

```typescript
try {
  const event = await fetchEventById(eventId);
  // Handle success
} catch (error) {
  if (error.message.includes('Failed to fetch')) {
    // Handle network/API errors
    console.error('API Error:', error.message);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

## WebSocket Configuration

Real-time features require WebSocket server configuration:

```typescript
// .env file
VITE_WS_URL=ws://localhost:3000
```

## Type Safety

The API service is fully typed and uses the shared types from `@issb/types`:

```typescript
import { Event, EventRegistration, EventFilter } from '@issb/types';
import { fetchEvents } from '@/api/events';

// All functions are type-safe
const events = await fetchEvents(filter: EventFilter): Promise<PaginatedResponse<Event>>
```

## Best Practices

### 1. Always Handle Errors
```typescript
try {
  const result = await eventApi.createEvent(eventData);
  // Success handling
} catch (error) {
  // Show user-friendly error message
  toast.error(error.message);
}
```

### 2. Use Real-time Updates Sparingly
```typescript
// Subscribe only when component is mounted
// Unsubscribe when component unmounts
useEffect(() => {
  const unsubscribe = subscribeToEventUpdates(eventId, callbacks);
  return unsubscribe;
}, [eventId]);
```

### 3. Validate Data Before API Calls
```typescript
const validation = validateEventData(eventData);
if (!validation.isValid) {
  // Show validation errors to user
  setErrors(validation.errors);
  return;
}
```

### 4. Check Permissions and Capacity
```typescript
const { canRegister, reason } = canUserRegister(event, userTier);
if (!canRegister) {
  // Show reason to user
  alert(reason);
  return;
}
```

## Integration with State Management

The API service works well with Zustand stores:

```typescript
import { create } from 'zustand';
import { eventApi, Event } from '@/api/events';

interface EventState {
  events: Event[];
  fetchEvents: () => Promise<void>;
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  fetchEvents: async () => {
    try {
      const response = await eventApi.fetchEvents();
      set({ events: response.data });
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }
}));
```

## Performance Considerations

1. **Use pagination** for large event lists
2. **Cache frequently accessed events** in state management
3. **Unsubscribe from WebSocket** when no longer needed
4. **Use specialized endpoints** for specific use cases (e.g., `fetchUpcomingEvents` instead of filtering all events)
5. **Debounce search queries** to avoid excessive API calls

## Testing

Example test cases:

```typescript
import { fetchEvents } from '@/api/events';
import api from '@/services/api';

jest.mock('@/services/api');

describe('Event API', () => {
  it('should fetch events with filters', async () => {
    const mockResponse = {
      success: true,
      data: {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      }
    };

    (api.get as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchEvents({ status: ['published'] });
    expect(result.data).toEqual([]);
  });
});
```

## Contributing

When adding new API endpoints:

1. Add the function to `eventApi.ts`
2. Export it in `index.ts`
3. Document it in this README
4. Add TypeScript types
5. Include error handling
6. Add validation if needed
7. Write tests

## Support

For questions or issues with the Event API service, please refer to:
- API documentation in this README
- TypeScript type definitions in `@issb/types`
- Error messages and console logs
- Project documentation and examples
