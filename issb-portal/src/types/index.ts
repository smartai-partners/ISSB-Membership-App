// User and Profile Types
export type UserRole = 'admin' | 'board' | 'member' | 'student' | 'applicant';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type MembershipTier = 'standard'; // Simplified to single tier

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
  total_volunteer_hours: number;
  membership_fee_waived: boolean;
  waiver_granted_at?: string;
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
  donation_amount_applied: number;
  balance_due: number;
  waived_through_volunteering: boolean;
  waiver_volunteer_hours: number;
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
export type OpportunityStatus = 'DRAFT' | 'ACTIVE' | 'open' | 'filled' | 'closed' | 'cancelled';
export type AssignmentStatus = 'assigned' | 'completed' | 'cancelled' | 'no_show';
export type HoursStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'pending' | 'approved' | 'rejected';
export type SignupStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface VolunteerOpportunity {
  id: string;
  title: string;
  description: string;
  opportunity_type: OpportunityType;
  status: OpportunityStatus;
  start_date?: string;
  end_date?: string;
  date_time?: string;
  hours_required: number;
  duration_hours?: number;
  capacity?: number;
  max_volunteers?: number;
  current_volunteers: number;
  location?: string;
  category?: string;
  image_url?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  required_skills?: string[];
  created_by: string;
  admin_id?: string;
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
  signup_id?: string;
  hours: number;
  date: string;
  description: string;
  status: HoursStatus;
  counts_toward_waiver: boolean;
  membership_year?: number;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VolunteerSignup {
  id: string;
  opportunity_id: string;
  member_id: string;
  status: SignupStatus;
  notes?: string;
  signed_up_at: string;
  confirmed_at?: string;
  cancelled_at?: string;
  completed_at?: string;
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
  applied_to_membership: boolean;
  membership_id?: string;
  amount_applied_to_membership: number;
  remaining_donation_amount: number;
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
  volunteer_commitment: boolean;
  donation_amount: number;
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

// Help Assistant Types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export type ConversationStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface EscalatedConversation {
  id: string;
  user_id?: string;
  conversation_data: {
    messages: ConversationMessage[];
    user_email?: string;
    application_id?: string;
    [key: string]: any;
  };
  status: ConversationStatus;
  escalated_reason?: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}


// Accessibility Audit Types
export type WCAGLevel = 'A' | 'AA' | 'AAA';
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
// Phase 3C.2: Extended status workflow
export type IssueStatus = 'open' | 'assigned' | 'in_progress' | 'under_review' | 'resolved' | 'closed' | 'wont_fix';
export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';
export type VerificationStatus = 'pending' | 'verified' | 'failed';
export type AuditPriority = 'critical' | 'high' | 'medium' | 'low';

export interface AccessibilityAudit {
  id: string;
  page_url: string;
  page_title?: string;
  audit_date: string;
  compliance_score: number;
  wcag_level: WCAGLevel;
  auditor_id?: string;
  total_issues: number;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
  notes?: string;
  // Phase 3C.2: Enhanced fields
  progress_percentage?: number;
  assigned_team?: string;
  overall_deadline?: string;
  priority?: AuditPriority;
  tags?: string[];
  component_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AccessibilityIssue {
  id: string;
  audit_id: string;
  issue_type: string;
  severity: IssueSeverity;
  wcag_criterion?: string;
  wcag_criteria?: string;
  description: string;
  affected_component?: string;
  recommended_fix?: string;
  recommendation?: string;
  element_selector?: string;
  status: IssueStatus;
  // Phase 3C.2: Enhanced fields
  assigned_to?: string;
  assigned_to_name?: string;
  priority?: IssuePriority;
  deadline?: string;
  resolution_notes?: string;
  verification_status?: VerificationStatus;
  estimated_effort?: string;
  actual_effort?: string;
  screenshot_before?: string;
  screenshot_after?: string;
  code_example?: string;
  affected_users?: string;
  component_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditWithIssues extends AccessibilityAudit {
  issues: AccessibilityIssue[];
}

export interface AuditSummaryMetrics {
  totalAudits: number;
  averageComplianceScore: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  resolvedIssues: number;
  openIssues: number;
}

// Phase 3C.2: Team Members
export type TeamRole = 'developer' | 'designer' | 'qa' | 'manager';
export type TeamName = 'frontend' | 'backend' | 'design' | 'qa';

export interface TeamMember {
  id: string;
  user_id?: string;
  email: string;
  full_name: string;
  role: TeamRole;
  team?: TeamName;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 3C.2: Filter Presets
export interface FilterPreset {
  id: string;
  user_id: string;
  preset_name: string;
  filters: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 3C.2: Audit Timeline
export type TimelineActionType = 'created' | 'status_changed' | 'assigned' | 'resolved' | 'commented';

export interface AuditTimeline {
  id: string;
  audit_id?: string;
  issue_id?: string;
  action_type: TimelineActionType;
  old_value?: string;
  new_value?: string;
  changed_by?: string;
  changed_by_name?: string;
  notes?: string;
  created_at: string;
}

// Phase 3C.2: Bulk Operations
export interface BulkUpdateResult {
  success: number;
  failed: number;
  total: number;
  errors?: Array<{ id: string; error: string }>;
}

// Phase 3C.2: Analytics
export interface AuditAnalytics {
  totalAudits: number;
  averageComplianceScore: number;
  averageProgress: number;
  totalIssues: number;
  statusBreakdown: Record<string, number>;
  severityBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  teamBreakdown: Record<string, number>;
  componentBreakdown: Record<string, number>;
  trendData: Array<{
    week: string;
    created: number;
    resolved: number;
  }>;
}
