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

export const membershipApi = createApi({
  reducerPath: 'membershipApi',
  baseQuery: fetchBaseQuery({ baseUrl: SUPABASE_URL }),
  tagTypes: ['Subscription', 'FamilyMembers', 'Analytics', 'VolunteerHours', 'Opportunities', 'Assignments'],
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
          
          if (error) throw error;
          
          return { data: data.data };
        } catch (error: any) {
          return { error: { status: 'FETCH_ERROR', error: error.message } };
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
} = membershipApi;
