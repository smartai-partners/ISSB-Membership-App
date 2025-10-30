import { Event, EventRegistration, EventFilter, CreateInput, UpdateInput } from '@issb/types';

// Event List Component Props
export interface EventListProps {
  title?: string;
  subtitle?: string;
  variant?: 'grid' | 'list' | 'compact';
  showFilters?: boolean;
  showSearch?: boolean;
  showViewToggle?: boolean;
  showPagination?: boolean;
  featuredOnly?: boolean;
  upcomingOnly?: boolean;
  myEventsOnly?: boolean;
  userId?: string;
  filters?: Partial<EventFilter>;
  onEventSelect?: (event: Event) => void;
  onCreateEvent?: () => void;
  className?: string;
}

// Event Card Component Props
export interface EventCardProps {
  event: Event;
  variant?: 'default' | 'featured' | 'compact' | 'minimal';
  showRegistrationButton?: boolean;
  showCapacity?: boolean;
  showTags?: boolean;
  registrationStatus?: 'registered' | 'waitlist' | 'full' | 'closed' | 'not_started';
  onRegister?: (event: Event) => void;
  onViewDetails?: (event: Event) => void;
  onCancelRegistration?: (event: Event) => void;
  className?: string;
}

// Event Details Component Props
export interface EventDetailsProps {
  eventId: string;
  onBack?: () => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onRegister?: (event: Event) => void;
  onCancelRegistration?: (registrationId: string) => void;
  className?: string;
}

// Event Registration Form Props
export interface EventRegistrationFormProps {
  event: Event;
  onSuccess: (registration: EventRegistration) => void;
  onCancel: () => void;
  className?: string;
}

// Event Creation Component Props
export interface EventCreationProps {
  onSuccess?: (event: Event) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateInput<Event>>;
  isEdit?: boolean;
  eventId?: string;
  className?: string;
}

// Event Management Component Props
export interface EventManagementProps {
  onEventSelect?: (event: Event) => void;
  onEventCreate?: () => void;
  className?: string;
}

// Event Store Types (re-exported from store)
export type { EventState } from './EventStore';

// Additional utility types for events
export interface EventFormData {
  title: string;
  description: string;
  type: string;
  tier: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  location: string;
  isVirtual: boolean;
  virtualLink: string;
  capacity?: number;
  tags: string[];
  attachments: string[];
}

export interface RegistrationData {
  specialRequirements: string;
  dietaryRestrictions: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  marketingConsent: boolean;
}

export interface EventMetrics {
  totalEvents: number;
  activeEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalRegistrations: number;
  averageAttendance: number;
  capacityUtilization: number;
}

export interface BulkAction {
  selectedEventIds: string[];
  action: 'publish' | 'unpublish' | 'cancel' | 'delete';
  reason?: string;
  notifyAttendees: boolean;
}