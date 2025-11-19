import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lsyimggqennkyxgajzvn.supabase.co';

export interface Plan {
  id: number;
  price_id: string;
  plan_type: string;
  price: number;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  price_id: string;
  status: string;
  activation_method?: string;
  volunteer_hours_required?: number;
  volunteer_hours_completed?: number;
  created_at: string;
  updated_at: string;
  plans?: Plan;
}

export interface FamilyMember {
  id: string;
  subscription_id: string;
  user_id: string;
  is_primary: boolean;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  relationship?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  user_id: string;
  subscription_id?: string;
  action: string;
  from_tier?: string;
  to_tier?: string;
  amount?: number;
  stripe_invoice_id?: string;
  created_at: string;
}

export interface SubscriptionStatus {
  subscription: Subscription | null;
  familyMembers: FamilyMember[];
  history: SubscriptionHistory[];
}

export interface VolunteerHour {
  id: string;
  user_id: string;
  hours: number;
  date: string;
  description: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VolunteerOpportunity {
  id: string;
  title: string;
  description: string;
  opportunity_type: string;
  status: string;
  start_date?: string;
  end_date?: string;
  hours_required: number;
  capacity?: number;
  current_volunteers?: number;
  location?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  required_skills?: string[];
  category?: string;
  image_url?: string;
  date_time?: string;
  duration_hours?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  userAssignmentStatus?: string | null;
}

export interface VolunteerAssignment {
  id: string;
  opportunity_id: string;
  user_id: string;
  status: string;
  assigned_date: string;
  completed_date?: string;
  hours_logged?: number;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  volunteer_opportunities?: VolunteerOpportunity;
  hours_entries?: VolunteerHour[];
  total_approved_hours?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  recipient_groups: string[];
  is_published: boolean;
  send_email: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface VolunteerProgress {
  subscription: Subscription | null;
  volunteerHours: VolunteerHour[];
  assignments: VolunteerAssignment[];
  upcomingOpportunities: VolunteerOpportunity[];
  summary: {
    totalApprovedHours: number;
    totalPendingHours: number;
    hoursNeeded: number;
    percentageComplete: number;
    membershipActivated: boolean;
    activeAssignments: number;
    completedAssignments: number;
    hoursByOpportunity: {
      opportunityId: string;
      opportunityTitle: string | null;
      approved: number;
      pending: number;
      total: number;
    }[];
  };
}

export interface MembershipAnalytics {
  summary: {
    totalSubscriptions: number;
    activationCounts: {
      payment: number;
      volunteer: number;
      donation: number;
    };
    paidMemberships: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
  };
  recentActivity: SubscriptionHistory[];
}

export interface Recommendation {
  id: string;
  type: 'volunteer' | 'event' | 'payment' | 'member' | 'role';
  title: string;
  description: string;
  actionText: string;
  actionUrl: string;
  priority: number;
  metadata?: any;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
  total: number;
  generated_at: string;
}

// Event & Gamification Types
export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  capacity: number;
  status: string;
  featured_image_url?: string;
  created_at: string;
  created_by: string;
  registrations_count?: number;
}

export interface Gallery {
  id: string;
  title: string;
  description: string;
  event_id?: string;
  created_at: string;
  is_published: boolean;
  photos_count?: number;
  cover_image_url?: string;
}

export interface Photo {
  id: string;
  gallery_id: string;
  image_url: string;
  caption?: string;
  uploaded_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  achievement_criteria: any;
  points_value: number;
  badge_type: string;
  created_at: string;
  awarded_count?: number;
}

export interface MemberBadge {
  id: string;
  member_id: string;
  badge_id: string;
  awarded_at: string;
  awarded_by?: string;
  reason?: string;
  member_name?: string;
  member_email?: string;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  rules: string;
  start_date: string;
  end_date: string;
  prize_description: string;
  sponsor_name?: string;
  sponsor_logo_url?: string;
  status: string;
  max_submissions_per_member: number;
  created_at: string;
  submissions_count?: number;
}

export interface ContestSubmission {
  id: string;
  contest_id: string;
  member_id: string;
  submission_text?: string;
  attachment_url?: string;
  submitted_at: string;
  status: string;
  admin_notes?: string;
  member_name?: string;
  member_email?: string;
}

export const membershipApi = createApi({
  reducerPath: 'membershipApi',
  baseQuery: fetchBaseQuery({ baseUrl: SUPABASE_URL }),
  tagTypes: ['Subscription', 'FamilyMembers', 'Analytics', 'VolunteerHours', 'Opportunities', 'Assignments', 'Announcements', 'Events', 'Galleries', 'Photos', 'Badges', 'MemberBadges', 'Contests', 'Submissions', 'Payments', 'Subscriptions'],
  endpoints: (builder) => ({
    // Get current user's subscription status
    getSubscriptionStatus: builder.query<SubscriptionStatus, void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-subscription-status');
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['Subscription', 'FamilyMembers'],
    }),

    // Create subscription for paid tiers (individual, family)
    createSubscription: builder.mutation<{ checkoutUrl: string }, { planType: string; customerEmail: string }>({
      queryFn: async ({ planType, customerEmail }) => {
        try {
          const { data, error } = await supabase.functions.invoke('create-subscription', {
            body: { planType, customerEmail }
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Subscription'],
    }),

    // Create free student subscription
    createStudentSubscription: builder.mutation<{ subscription: Subscription }, void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('create-student-subscription');
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Subscription'],
    }),

    // Manage subscription (cancel or change tier)
    manageSubscription: builder.mutation<any, { action: 'cancel' | 'change_tier'; newTier?: string }>({
      queryFn: async ({ action, newTier }) => {
        try {
          const { data, error } = await supabase.functions.invoke('manage-subscription', {
            body: { action, newTier }
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Subscription'],
    }),

    // Add family member
    addFamilyMember: builder.mutation<{ member: FamilyMember }, Partial<FamilyMember>>({
      queryFn: async (memberData) => {
        try {
          const { data, error } = await supabase.functions.invoke('manage-family-members', {
            body: { action: 'add', memberData }
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['FamilyMembers'],
    }),

    // Remove family member
    removeFamilyMember: builder.mutation<void, string>({
      queryFn: async (memberId) => {
        try {
          const { data, error } = await supabase.functions.invoke('manage-family-members', {
            body: { action: 'remove', memberId }
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['FamilyMembers'],
    }),

    // Get membership analytics (admin only)
    getMembershipAnalytics: builder.query<MembershipAnalytics, void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-membership-analytics');

          if (error) {
            // SECURITY FIX: Return proper error instead of hiding with mock data
            console.error('Failed to fetch membership analytics:', error);
            return {
              error: {
                status: 'FETCH_ERROR',
                error: 'Unable to load membership analytics. Please ensure the analytics service is running.'
              }
            };
          }

          return { data: data.data };
        } catch (error: any) {
          // SECURITY FIX: Return proper error instead of masking with fake data
          console.error('Analytics API error:', error.message);
          return {
            error: {
              status: 'FETCH_ERROR',
              error: error.message || 'Failed to fetch analytics data'
            }
          };
        }
      },
      providesTags: ['Analytics'],
    }),

    // Create volunteer-based subscription
    createVolunteerSubscription: builder.mutation<{ subscription: Subscription }, void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('create-volunteer-subscription');
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Subscription', 'VolunteerHours'],
    }),

    // Log volunteer hours
    logVolunteerHours: builder.mutation<any, { hours: number; date: string; description: string; opportunityId?: string }>({
      queryFn: async ({ hours, date, description, opportunityId }) => {
        try {
          const { data, error } = await supabase.functions.invoke('log-volunteer-hours', {
            body: { hours, date, description, opportunityId }
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['VolunteerHours', 'Subscription'],
    }),

    // Get volunteer progress
    getVolunteerProgress: builder.query<VolunteerProgress, void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-volunteer-progress');
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['VolunteerHours', 'Subscription'],
    }),

    // Admin approve volunteer hours
    approveVolunteerHours: builder.mutation<any, { volunteerHourId: string; action: 'approve' | 'reject'; rejectionReason?: string; adminNotes?: string }>({
      queryFn: async ({ volunteerHourId, action, rejectionReason, adminNotes }) => {
        try {
          const { data, error } = await supabase.functions.invoke('admin-approve-volunteer-hours', {
            body: { volunteerHourId, action, rejectionReason, adminNotes }
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['VolunteerHours', 'Subscription', 'Analytics'],
    }),

    // List volunteer opportunities
    listOpportunities: builder.query<{ opportunities: VolunteerOpportunity[]; total: number }, { status?: string; category?: string; includeUserAssignments?: boolean }>({
      queryFn: async ({ status, category, includeUserAssignments }) => {
        try {
          const params = new URLSearchParams();
          if (status) params.append('status', status);
          if (category) params.append('category', category);
          if (includeUserAssignments) params.append('includeUserAssignments', 'true');
          
          const queryString = params.toString();
          const url = `list-opportunities${queryString ? `?${queryString}` : ''}`;
          
          const { data, error } = await supabase.functions.invoke(url);
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['Opportunities'],
    }),

    // Create volunteer opportunity (Admin only)
    createOpportunity: builder.mutation<{ opportunity: VolunteerOpportunity; message: string }, Partial<VolunteerOpportunity>>({
      queryFn: async (opportunityData) => {
        try {
          const { data, error } = await supabase.functions.invoke('create-opportunity', {
            body: opportunityData
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Opportunities'],
    }),

    // Update volunteer opportunity (Admin only)
    updateOpportunity: builder.mutation<{ opportunity: VolunteerOpportunity; message: string }, { id: string; updates: Partial<VolunteerOpportunity> }>({
      queryFn: async ({ id, updates }) => {
        try {
          const { data, error } = await supabase.functions.invoke(`update-opportunity?id=${id}`, {
            body: updates
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Opportunities', 'Assignments'],
    }),

    // Delete volunteer opportunity (Admin only)
    deleteOpportunity: builder.mutation<{ message: string }, string>({
      queryFn: async (opportunityId) => {
        try {
          const { data, error } = await supabase.functions.invoke(`delete-opportunity?id=${opportunityId}`);
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Opportunities', 'Assignments'],
    }),

    // Signup for volunteer opportunity
    signupForOpportunity: builder.mutation<{ assignment: VolunteerAssignment; message: string }, string>({
      queryFn: async (opportunityId) => {
        try {
          const { data, error } = await supabase.functions.invoke('signup-for-opportunity', {
            body: { opportunityId }
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Assignments', 'Opportunities', 'VolunteerHours'],
    }),

    // Withdraw from volunteer opportunity
    withdrawFromOpportunity: builder.mutation<{ message: string }, string>({
      queryFn: async (opportunityId) => {
        try {
          const { data, error } = await supabase.functions.invoke(`withdraw-from-opportunity?opportunityId=${opportunityId}`);
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Assignments', 'Opportunities', 'VolunteerHours'],
    }),

    // Get member's volunteer assignments
    getMemberAssignments: builder.query<{ assignments: VolunteerAssignment[]; total: number }, { status?: string }>({
      queryFn: async ({ status }) => {
        try {
          const queryString = status ? `?status=${status}` : '';
          const { data, error } = await supabase.functions.invoke(`get-member-assignments${queryString}`);
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['Assignments'],
    }),

    // List announcements
    listAnnouncements: builder.query<{ announcements: Announcement[]; total: number; limit: number; offset: number }, { limit?: number; offset?: number; includeUnpublished?: boolean }>({
      queryFn: async ({ limit = 20, offset = 0, includeUnpublished = false }) => {
        try {
          const params = new URLSearchParams();
          params.append('limit', limit.toString());
          params.append('offset', offset.toString());
          if (includeUnpublished) params.append('includeUnpublished', 'true');
          
          const queryString = params.toString();
          const url = `list-announcements${queryString ? `?${queryString}` : ''}`;
          
          const { data, error } = await supabase.functions.invoke(url);
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['Announcements'],
    }),

    // Create announcement (Admin only)
    createAnnouncement: builder.mutation<{ announcement: Announcement; message: string }, Partial<Announcement>>({
      queryFn: async (announcementData) => {
        try {
          const { data, error } = await supabase.functions.invoke('create-announcement', {
            body: announcementData
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Announcements'],
    }),

    // Update announcement (Admin only)
    updateAnnouncement: builder.mutation<{ announcement: Announcement; message: string }, { id: string; updates: Partial<Announcement> }>({
      queryFn: async ({ id, updates }) => {
        try {
          const { data, error } = await supabase.functions.invoke(`update-announcement?id=${id}`, {
            body: updates
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Announcements'],
    }),

    // Delete announcement (Admin only)
    deleteAnnouncement: builder.mutation<{ message: string }, string>({
      queryFn: async (announcementId) => {
        try {
          const { data, error } = await supabase.functions.invoke(`delete-announcement?id=${announcementId}`);

          if (error) throw error;

          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Announcements'],
    }),

    // Generate announcement using AI (Admin only)
    generateAnnouncementAI: builder.mutation<{ title: string; content: string; generated_at: string }, { prompt: string }>({
      queryFn: async ({ prompt }) => {
        try {
          const { data, error } = await supabase.functions.invoke('generate-announcement-ai', {
            body: { prompt }
          });

          if (error) throw error;

          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
    }),

    // Get personalized recommendations for member
    getRecommendations: builder.query<RecommendationsResponse, void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('get-recommendations');

          if (error) throw error;

          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['Subscription', 'VolunteerHours'],
    }),

    // ===== EVENT MANAGEMENT ENDPOINTS =====
    listEvents: builder.query<{ events: Event[] }, { status?: string }>({
      queryFn: async ({ status }) => {
        try {
          const params = status ? `?status=${status}` : '';
          const { data, error } = await supabase.functions.invoke(`list-events${params}`);
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['Events'],
    }),

    createEvent: builder.mutation<{ event: Event; message: string }, Partial<Event>>({
      queryFn: async (eventData) => {
        try {
          const { data, error } = await supabase.functions.invoke('create-event', {
            body: eventData
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Events'],
    }),

    updateEvent: builder.mutation<{ event: Event; message: string }, { id: string; updates: Partial<Event> }>({
      queryFn: async ({ id, updates }) => {
        try {
          const { data, error } = await supabase.functions.invoke(`update-event?id=${id}`, {
            body: updates
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Events'],
    }),

    deleteEvent: builder.mutation<{ message: string }, string>({
      queryFn: async (eventId) => {
        try {
          const { data, error } = await supabase.functions.invoke(`delete-event?id=${eventId}`);
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Events'],
    }),

    // ===== GALLERY MANAGEMENT ENDPOINTS =====
    listGalleries: builder.query<{ galleries: Gallery[] }, void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('list-galleries');
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['Galleries'],
    }),

    createGallery: builder.mutation<{ gallery: Gallery; message: string }, Partial<Gallery>>({
      queryFn: async (galleryData) => {
        try {
          const { data, error } = await supabase.functions.invoke('create-gallery', {
            body: galleryData
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Galleries'],
    }),

    uploadPhoto: builder.mutation<{ photo: Photo; message: string }, { gallery_id: string; image_url: string; caption?: string }>({
      queryFn: async (photoData) => {
        try {
          const { data, error } = await supabase.functions.invoke('upload-photo', {
            body: photoData
          });

          if (error) throw error;

          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Photos', 'Galleries'],
    }),

    updateGallery: builder.mutation<{ success: boolean; gallery: Gallery; message: string }, {
      gallery_id: string;
      title?: string;
      description?: string;
      is_published?: boolean;
      event_id?: string;
    }>({
      queryFn: async (updateData) => {
        try {
          const { data, error } = await supabase.functions.invoke('update-gallery', {
            body: updateData
          });

          if (error) throw error;

          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Galleries'],
    }),

    deleteGallery: builder.mutation<{ success: boolean; message: string; deleted_id: string }, { gallery_id: string }>({
      queryFn: async (deleteData) => {
        try {
          const { data, error } = await supabase.functions.invoke('delete-gallery', {
            body: deleteData
          });

          if (error) throw error;

          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Galleries'],
    }),

    syncExternalGallery: builder.mutation<{ success: boolean; gallery: Gallery; message: string }, { gallery_id: string }>({
      queryFn: async (syncData) => {
        try {
          const { data, error } = await supabase.functions.invoke('sync-external-gallery', {
            body: syncData
          });

          if (error) throw error;

          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Galleries'],
    }),

    // ===== BADGE MANAGEMENT ENDPOINTS =====
    listBadges: builder.query<{ badges: Badge[] }, void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('list-badges');
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['Badges'],
    }),

    getMemberBadges: builder.query<{ badges: MemberBadge[] }, { badge_id?: string }>({
      queryFn: async ({ badge_id }) => {
        try {
          const params = badge_id ? `?badge_id=${badge_id}` : '';
          const { data, error } = await supabase.functions.invoke(`get-member-badges${params}`);
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['MemberBadges'],
    }),

    awardBadge: builder.mutation<{ memberBadge: MemberBadge; message: string }, { badge_id: string; member_email: string; reason?: string }>({
      queryFn: async (awardData) => {
        try {
          const { data, error } = await supabase.functions.invoke('award-badge', {
            body: awardData
          });
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['MemberBadges', 'Badges'],
    }),

    checkAchievements: builder.mutation<{ message: string; awardsGiven: number }, void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('check-achievements');
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['MemberBadges', 'Badges'],
    }),

    // ===== CONTEST MANAGEMENT ENDPOINTS =====
    listContests: builder.query<{ contests: Contest[] }, { status?: string }>({
      queryFn: async ({ status }) => {
        try {
          const params = status ? `?status=${status}` : '';
          const { data, error } = await supabase.functions.invoke(`list-contests${params}`);
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['Contests'],
    }),

    createContest: builder.mutation<{ contest: Contest; message: string }, Partial<Contest>>({
      queryFn: async (contestData) => {
        try {
          const { data, error } = await supabase.functions.invoke('create-contest', {
            body: contestData
          });

          if (error) throw error;

          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Contests'],
    }),

    // ===== EVENT REGISTRATION ENDPOINTS =====
    registerForEvent: builder.mutation<{
      success: boolean;
      message: string;
      registration: any;
      event: Event;
      status: string;
    }, {
      event_id: string;
      notes?: string;
      guest_count?: number;
      dietary_restrictions?: string;
      emergency_contact?: string;
    }>({
      queryFn: async (registrationData) => {
        try {
          const { data, error } = await supabase.functions.invoke('register-for-event', {
            body: registrationData
          });

          if (error) throw error;

          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Events'],
    }),

    cancelEventRegistration: builder.mutation<{
      success: boolean;
      message: string;
      cancelled_registration_id: string;
      event: Event;
      promoted_user: any;
    }, {
      event_id: string;
      registration_id?: string;
    }>({
      queryFn: async (cancellationData) => {
        try {
          const { data, error } = await supabase.functions.invoke('cancel-event-registration', {
            body: cancellationData
          });

          if (error) throw error;

          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Events'],
    }),

    // Payment Integration
    createPaymentIntent: builder.mutation<{
      success: boolean;
      client_secret: string;
      payment_intent_id: string;
      payment_id: string;
      amount: number;
      currency: string;
    }, {
      amount: number;
      currency?: string;
      payment_type: 'event_registration' | 'membership' | 'donation' | 'other';
      event_id?: string;
      membership_id?: string;
      campaign_id?: string;
      description: string;
      metadata?: Record<string, string>;
    }>({
      queryFn: async (paymentData) => {
        try {
          const { data, error } = await supabase.functions.invoke('create-payment-intent', {
            body: paymentData
          });

          if (error) throw error;

          return { data: data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['Payments'],
    }),

    getUserPayments: builder.query<any[], void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          return { data: data || [] };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['Payments'],
    }),

    getUserSubscriptions: builder.query<any[], void>({
      queryFn: async () => {
        try {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          return { data: data || [] };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
        }
      },
      providesTags: ['Subscriptions'],
    }),
  }),
});

export const {
  useGetSubscriptionStatusQuery,
  useCreateSubscriptionMutation,
  useCreateStudentSubscriptionMutation,
  useManageSubscriptionMutation,
  useAddFamilyMemberMutation,
  useRemoveFamilyMemberMutation,
  useGetMembershipAnalyticsQuery,
  useCreateVolunteerSubscriptionMutation,
  useLogVolunteerHoursMutation,
  useGetVolunteerProgressQuery,
  useApproveVolunteerHoursMutation,
  useListOpportunitiesQuery,
  useCreateOpportunityMutation,
  useUpdateOpportunityMutation,
  useDeleteOpportunityMutation,
  useSignupForOpportunityMutation,
  useWithdrawFromOpportunityMutation,
  useGetMemberAssignmentsQuery,
  useListAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useGenerateAnnouncementAIMutation,
  useGetRecommendationsQuery,
  // Event & Gamification hooks
  useListEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useListGalleriesQuery,
  useCreateGalleryMutation,
  useUploadPhotoMutation,
  useUpdateGalleryMutation,
  useDeleteGalleryMutation,
  useSyncExternalGalleryMutation,
  useListBadgesQuery,
  useGetMemberBadgesQuery,
  useAwardBadgeMutation,
  useCheckAchievementsMutation,
  useListContestsQuery,
  useCreateContestMutation,
  // Event Registration hooks
  useRegisterForEventMutation,
  useCancelEventRegistrationMutation,
  // Payment hooks
  useCreatePaymentIntentMutation,
  useGetUserPaymentsQuery,
  useGetUserSubscriptionsQuery,
} = membershipApi;
