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

export interface MembershipAnalytics {
  summary: {
    totalSubscriptions: number;
    tierCounts: {
      student: number;
      individual: number;
      family: number;
    };
    totalFamilyMembers: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
  };
  recentActivity: SubscriptionHistory[];
}

export const membershipApi = createApi({
  reducerPath: 'membershipApi',
  baseQuery: fetchBaseQuery({ baseUrl: SUPABASE_URL }),
  tagTypes: ['Subscription', 'FamilyMembers', 'Analytics'],
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
} = membershipApi;
