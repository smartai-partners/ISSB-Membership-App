# Event Components

A comprehensive set of React components for managing events in your application. This package includes components for displaying event lists, event details, registration forms, event creation, and administrative management tools.

## Features

- **Event Listing**: Display events in grid or list view with filtering and search
- **Event Cards**: Reusable event preview cards with multiple variants
- **Event Details**: Full event view with registration, sharing, and calendar integration
- **Registration Workflow**: Multi-step registration form with validation
- **Event Creation**: Step-by-step event creation wizard
- **Admin Management**: Bulk operations, analytics, and management tools
- **State Management**: Zustand store for event data and operations
- **TypeScript Support**: Full type safety with comprehensive interfaces

## Components

### EventList

Displays a list of events with filtering, search, and pagination capabilities.

```tsx
import { EventList } from '@/features/events';

<EventList
  title="Upcoming Events"
  variant="grid"
  showFilters={true}
  showSearch={true}
  onEventSelect={(event) => navigateToEvent(event.id)}
  onCreateEvent={() => openEventCreation()}
/>
```

**Props:**
- `title?: string` - Optional title for the event list
- `subtitle?: string` - Optional subtitle
- `variant?: 'grid' | 'list' | 'compact'` - Display variant
- `showFilters?: boolean` - Show filter controls
- `showSearch?: boolean` - Show search input
- `featuredOnly?: boolean` - Show only featured events
- `upcomingOnly?: boolean` - Show only upcoming events
- `myEventsOnly?: boolean` - Show only user's events

### EventCard

Reusable event preview card component.

```tsx
import { EventCard } from '@/features/events';

<EventCard
  event={eventData}
  variant="default"
  showCapacity={true}
  showTags={true}
  registrationStatus="registered"
  onViewDetails={(event) => openEventDetails(event.id)}
  onRegister={(event) => startRegistration(event)}
/>
```

**Props:**
- `event: Event` - Event data to display
- `variant?: 'default' | 'featured' | 'compact' | 'minimal'` - Card style variant
- `showCapacity?: boolean` - Show capacity information
- `showTags?: boolean` - Show event tags
- `registrationStatus?: 'registered' | 'waitlist' | 'full' | 'closed' | 'not_started'` - User's registration status

### EventDetails

Full event view with detailed information and actions.

```tsx
import { EventDetails } from '@/features/events';

<EventDetails
  eventId="event-id"
  onBack={() => navigateBack()}
  onEdit={(event) => openEventCreation(event)}
  onDelete={(event) => confirmAndDelete(event)}
  onRegister={(event) => startRegistration(event)}
/>
```

**Features:**
- Event information display
- Registration/cancellation
- Calendar integration
- Social sharing
- Admin actions (edit/delete)

### EventRegistration

Multi-step registration form with validation.

```tsx
import { EventRegistration } from '@/features/events';

<EventRegistration
  event={eventData}
  onSuccess={(registration) => handleRegistrationSuccess(registration)}
  onCancel={() => closeRegistration()}
/>
```

**Features:**
- Multi-step form with progress indicator
- Emergency contact information
- Dietary restrictions selection
- Terms and conditions agreement
- Form validation

### EventCreation

Step-by-step event creation wizard.

```tsx
import { EventCreation } from '@/features/events';

<EventCreation
  onSuccess={(event) => handleEventCreated(event)}
  onCancel={() => closeCreation()}
  isEdit={false}
/>
```

**Features:**
- 4-step creation process
- Date/time validation
- Location and virtual event support
- Capacity management
- Tags and attachments
- Event preview

### EventManagement

Administrative interface for managing events.

```tsx
import { EventManagement } from '@/features/events';

<EventManagement
  onEventSelect={(event) => openEventDetails(event.id)}
  onEventCreate={() => openEventCreation()}
/>
```

**Features:**
- Event metrics and analytics
- Bulk operations
- Status management
- Capacity utilization tracking
- Admin controls

## State Management

The package includes a Zustand store for managing event state:

```tsx
import { useEventStore } from '@/features/events';

const {
  events,
  currentEvent,
  isLoading,
  error,
  fetchEvents,
  createEvent,
  updateEvent,
  registerForEvent,
  cancelRegistration
} = useEventStore();
```

**Store Actions:**
- `fetchEvents(filters)` - Fetch events with optional filters
- `fetchFeaturedEvents()` - Get featured events
- `fetchUpcomingEvents()` - Get upcoming events
- `fetchMyEvents(userId)` - Get user's events
- `createEvent(eventData)` - Create new event
- `updateEvent(id, eventData)` - Update existing event
- `deleteEvent(id)` - Delete event
- `registerForEvent(eventId, registrationData)` - Register for event
- `cancelRegistration(registrationId)` - Cancel registration

## Installation

Make sure you have the required dependencies:

```bash
npm install zustand lucide-react
```

## Usage with React Router

Example integration with React Router:

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { EventDetails } from '@/features/events';

function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  if (!eventId) {
    navigate('/events');
    return null;
  }

  return (
    <EventDetails
      eventId={eventId}
      onBack={() => navigate('/events')}
      onEdit={(event) => navigate(`/events/${event.id}/edit`)}
      onDelete={(event) => {
        // Handle delete
        navigate('/events');
      }}
    />
  );
}
```

## Customization

All components support custom styling through CSS classes and the `className` prop. Components use Tailwind CSS classes by default and follow the design system established in your UI components.

## Type Safety

All components are fully typed with TypeScript interfaces. The components work with the types defined in `@issb/types`:

- `Event` - Core event data structure
- `EventRegistration` - Registration information
- `EventFilter` - Filtering options
- `EventType`, `EventStatus`, `MembershipTier` - Enums

## Error Handling

Components include built-in error handling and loading states:

```tsx
if (isLoading) {
  return <div>Loading events...</div>;
}

if (error) {
  return <div>Error: {error}</div>;
}
```

## Accessibility

All components follow accessibility best practices:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- Focus management

## Contributing

When adding new components or modifying existing ones:

1. Follow the established TypeScript interfaces
2. Use the existing UI component library
3. Include proper error handling and loading states
4. Add comprehensive JSDoc documentation
5. Include unit tests for new functionality

## API Integration

The components expect the following API endpoints:

- `GET /events` - Fetch events list
- `GET /events/:id` - Get event details
- `POST /events` - Create new event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event
- `POST /events/:id/register` - Register for event
- `DELETE /registrations/:id` - Cancel registration

Ensure your backend API matches these expectations or modify the store actions accordingly.