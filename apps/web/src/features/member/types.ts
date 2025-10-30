// Member Portal Types

export interface MemberProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  bio?: string;
  avatarUrl?: string;
  joinDate: string;
  membershipTier: MembershipTier;
  status: MemberStatus;
}

export interface MembershipDetails {
  id: string;
  memberId: string;
  tier: MembershipTier;
  status: MemberStatus;
  joinDate: string;
  renewalDate?: string;
  benefits: string[];
  perks: string[];
  nextPayment?: {
    amount: number;
    date: string;
  };
  paymentHistory: PaymentRecord[];
  tierHistory: TierChange[];
}

export interface MemberEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: EventCategory;
  status: EventStatus;
  registrationRequired: boolean;
  registrationDeadline?: string;
  capacity?: number;
  registeredCount: number;
  tags: string[];
  imageUrl?: string;
  isRegistered: boolean;
}

export interface VolunteerOpportunity {
  id: string;
  title: string;
  description: string;
  organization: string;
  location: string;
  commitment: string;
  skills: string[];
  impact: string;
  urgency: VolunteerUrgency;
  startDate: string;
  endDate?: string;
  spotsAvailable: number;
  totalSpots: number;
  tags: string[];
  contactPerson: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface ApplicationStatus {
  id: string;
  type: ApplicationType;
  title: string;
  description: string;
  status: ApplicationStatusType;
  submittedAt: string;
  lastUpdatedAt: string;
  expectedReviewDate?: string;
  reviewedBy?: string;
  notes?: string;
  documents?: ApplicationDocument[];
  milestones: ApplicationMilestone[];
  nextAction?: {
    title: string;
    description: string;
    dueDate?: string;
  };
}

export interface ApplicationDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ApplicationMilestone {
  id: string;
  title: string;
  description: string;
  completedAt?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  status: PaymentStatus;
  description: string;
  method: PaymentMethod;
}

export interface TierChange {
  id: string;
  fromTier: MembershipTier;
  toTier: MembershipTier;
  changedAt: string;
  reason: string;
  approvedBy: string;
}

// Enums
export type MembershipTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type EventCategory = 'social' | 'educational' | 'networking' | 'community' | 'workshop' | 'conference';
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
export type VolunteerUrgency = 'low' | 'medium' | 'high' | 'critical';
export type ApplicationType = 'membership' | 'volunteer' | 'event' | 'scholarship' | 'board' | 'other';
export type ApplicationStatusType = 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'withdrawn';
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';
export type PaymentMethod = 'credit-card' | 'bank-transfer' | 'paypal' | 'check' | 'cash';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
  errors?: string[];
}

// Form Types
export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  bio?: string;
}

export interface EventRegistrationData {
  eventId: string;
  dietaryRestrictions?: string;
  emergencyContact?: string;
  specialRequests?: string;
}

export interface VolunteerApplicationData {
  opportunityId: string;
  availability: string[];
  experience: string;
  motivation: string;
  references?: string[];
}

// Loading and Error States
export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
}

export interface ErrorState {
  error: string | null;
  hasError: boolean;
}

export interface FormState extends LoadingState, ErrorState {
  isSuccess: boolean;
  successMessage?: string;
}

// Component Props Types
export interface MemberProfileProps {
  profile: MemberProfile | null;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: ProfileUpdateData) => Promise<boolean>;
  formState: FormState;
}

export interface MembershipDetailsProps {
  membership: MembershipDetails | null;
  loading: boolean;
  error: string | null;
}

export interface EventListProps {
  events: MemberEvent[];
  loading: boolean;
  error: string | null;
  onRegister: (eventId: string) => Promise<boolean>;
  onUnregister: (eventId: string) => Promise<boolean>;
  onLoadMore: () => void;
  hasMore: boolean;
}

export interface VolunteerOpportunitiesProps {
  opportunities: VolunteerOpportunity[];
  loading: boolean;
  error: string | null;
  onApply: (opportunityId: string, data: VolunteerApplicationData) => Promise<boolean>;
  onLoadMore: () => void;
  hasMore: boolean;
}

export interface ApplicationStatusProps {
  applications: ApplicationStatus[];
  loading: boolean;
  error: string | null;
  onWithdraw: (applicationId: string) => Promise<boolean>;
  onResubmit: (applicationId: string) => Promise<boolean>;
}