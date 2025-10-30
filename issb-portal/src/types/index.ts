// User and Profile Types
export type UserRole = 'admin' | 'board' | 'member' | 'student' | 'applicant';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type MembershipTier = 'student' | 'individual' | 'family';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  membership_tier?: MembershipTier;
  status: UserStatus;
  profile_image_url?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

// Membership Types
export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface Membership {
  id: string;
  user_id: string;
  tier: MembershipTier;
  status: MembershipStatus;
  start_date: string;
  end_date: string;
  auto_renewal: boolean;
  amount: number;
  payment_status: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;
  volunteer_hours_required: number;
  volunteer_hours_completed: number;
  family_member_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  membership_id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  created_at: string;
}

// Event Types
export type EventType = 'meeting' | 'workshop' | 'social' | 'fundraiser' | 'volunteer' | 'other';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type RegistrationStatus = 'registered' | 'attended' | 'cancelled' | 'no_show';

export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: EventType;
  status: EventStatus;
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  location?: string;
  is_virtual: boolean;
  virtual_link?: string;
  capacity?: number;
  current_registrations: number;
  allowed_tiers: MembershipTier[];
  image_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  registration_date: string;
  attendance_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  dietary_restrictions?: string;
  special_requirements?: string;
  created_at: string;
  updated_at: string;
}

// Volunteer Types
export type OpportunityType = 'event' | 'ongoing' | 'project' | 'administrative';
export type OpportunityStatus = 'open' | 'filled' | 'closed' | 'cancelled';
export type AssignmentStatus = 'assigned' | 'completed' | 'cancelled' | 'no_show';
export type HoursStatus = 'pending' | 'approved' | 'rejected';

export interface VolunteerOpportunity {
  id: string;
  title: string;
  description: string;
  opportunity_type: OpportunityType;
  status: OpportunityStatus;
  start_date?: string;
  end_date?: string;
  hours_required: number;
  capacity?: number;
  current_volunteers: number;
  location?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  required_skills?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VolunteerAssignment {
  id: string;
  opportunity_id: string;
  user_id: string;
  status: AssignmentStatus;
  assigned_date: string;
  completed_date?: string;
  hours_logged: number;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VolunteerHours {
  id: string;
  user_id: string;
  opportunity_id?: string;
  assignment_id?: string;
  hours: number;
  date: string;
  description: string;
  status: HoursStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// Donation Types
export type DonationType = 'one_time' | 'recurring' | 'membership';
export type RecurringInterval = 'monthly' | 'quarterly' | 'yearly';

export interface Donation {
  id: string;
  user_id?: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  currency: string;
  donation_type: DonationType;
  payment_status: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;
  stripe_payment_id?: string;
  is_anonymous: boolean;
  is_recurring: boolean;
  recurring_interval?: RecurringInterval;
  next_donation_date?: string;
  campaign?: string;
  purpose?: string;
  tax_receipt_sent: boolean;
  tax_receipt_sent_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Application Types
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';

export interface Application {
  id: string;
  user_id: string;
  membership_tier: MembershipTier;
  status: ApplicationStatus;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  date_of_birth: string;
  occupation?: string;
  employer?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  reason_for_joining?: string;
  how_did_you_hear?: string;
  agreed_to_terms: boolean;
  agreed_to_code_of_conduct: boolean;
  reference_1_name?: string;
  reference_1_email?: string;
  reference_1_phone?: string;
  reference_1_verified: boolean;
  reference_2_name?: string;
  reference_2_email?: string;
  reference_2_phone?: string;
  reference_2_verified: boolean;
  documents_verified: boolean;
  background_check_completed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// System Settings Types
export type SettingType = 'string' | 'number' | 'boolean' | 'json' | 'date';

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  setting_type: SettingType;
  category: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
