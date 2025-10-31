/**
 * Supabase API Slice - RTK Query Integration
 * Centralized data fetching and caching layer for Supabase backend
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '../../lib/supabase';
import type { 
  Profile, 
  VolunteerOpportunity, 
  VolunteerHours,
  VolunteerSignup,
  Event,
  EventRegistration,
  Membership,
  Donation,
  Application
} from '../../types';
import type { RootState } from '../index';

/**
 * Custom base query for Supabase integration
 * Handles authentication and error transformation
 */
const supabaseBaseQuery = async (args: any, api: any) => {
  try {
    // Get current session from Redux state
    const state = api.getState() as RootState;
    const token = state.auth.session?.access_token;

    // Attach auth header if token exists
    if (token) {
      supabase.realtime.setAuth(token);
    }

    return { data: args };
  } catch (error) {
    return {
      error: {
        status: 'CUSTOM_ERROR',
        data: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
};

/**
 * Main API slice for member portal
 */
export const memberApi = createApi({
  reducerPath: 'memberApi',
  baseQuery: supabaseBaseQuery,
  tagTypes: [
    'Profile', 
    'Membership', 
    'Volunteer', 
    'VolunteerHours',
    'VolunteerSignup',
    'Events', 
    'EventRegistration',
    'Applications',
    'Donations'
  ],
  endpoints: (builder) => ({
    // ==========================================
    // PROFILE ENDPOINTS
    // ==========================================
    getMemberProfile: builder.query<Profile, string>({
      queryFn: async (userId) => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as Profile };
      },
      providesTags: (result) =>
        result ? [{ type: 'Profile', id: result.id }] : ['Profile'],
    }),

    updateMemberProfile: builder.mutation<Profile, Partial<Profile> & { id: string }>({
      queryFn: async (updates) => {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', updates.id)
          .select()
          .single();

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as Profile };
      },
      invalidatesTags: (result) =>
        result ? [{ type: 'Profile', id: result.id }] : ['Profile'],
    }),

    // ==========================================
    // MEMBERSHIP ENDPOINTS
    // ==========================================
    getMembership: builder.query<Membership, string>({
      queryFn: async (userId) => {
        const { data, error } = await supabase
          .from('memberships')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as Membership };
      },
      providesTags: (result) =>
        result ? [{ type: 'Membership', id: result.id }] : ['Membership'],
    }),

    // ==========================================
    // VOLUNTEER OPPORTUNITY ENDPOINTS
    // ==========================================
    getVolunteerOpportunities: builder.query<VolunteerOpportunity[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('volunteer_opportunities')
          .select(`
            *,
            volunteer_signups(count)
          `)
          .in('status', ['ACTIVE', 'open'])
          .order('created_at', { ascending: false });

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as VolunteerOpportunity[] };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Volunteer' as const, id })),
              { type: 'Volunteer', id: 'LIST' },
            ]
          : [{ type: 'Volunteer', id: 'LIST' }],
    }),

    getVolunteerOpportunity: builder.query<VolunteerOpportunity, string>({
      queryFn: async (id) => {
        const { data, error } = await supabase
          .from('volunteer_opportunities')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as VolunteerOpportunity };
      },
      providesTags: (result) =>
        result ? [{ type: 'Volunteer', id: result.id }] : ['Volunteer'],
    }),

    signUpForVolunteer: builder.mutation<VolunteerSignup, { opportunityId: string; memberId: string; notes?: string }>({
      queryFn: async ({ opportunityId, memberId, notes }) => {
        const { data, error } = await supabase
          .from('volunteer_signups')
          .insert({
            opportunity_id: opportunityId,
            member_id: memberId,
            status: 'PENDING',
            notes,
          })
          .select()
          .single();

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as VolunteerSignup };
      },
      invalidatesTags: [{ type: 'Volunteer', id: 'LIST' }, 'VolunteerSignup'],
    }),

    // ==========================================
    // VOLUNTEER HOURS ENDPOINTS
    // ==========================================
    getVolunteerHours: builder.query<VolunteerHours[], string>({
      queryFn: async (userId) => {
        const { data, error } = await supabase
          .from('volunteer_hours')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as VolunteerHours[] };
      },
      providesTags: ['VolunteerHours'],
    }),

    logVolunteerHours: builder.mutation<VolunteerHours, Omit<VolunteerHours, 'id' | 'created_at' | 'updated_at'>>({
      queryFn: async (hours) => {
        const { data, error } = await supabase
          .from('volunteer_hours')
          .insert(hours)
          .select()
          .single();

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as VolunteerHours };
      },
      invalidatesTags: ['VolunteerHours', 'Profile'],
    }),

    // ==========================================
    // EVENT ENDPOINTS
    // ==========================================
    getEvents: builder.query<Event[], void>({
      queryFn: async () => {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .order('start_date', { ascending: true });

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as Event[] };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Events' as const, id })),
              { type: 'Events', id: 'LIST' },
            ]
          : [{ type: 'Events', id: 'LIST' }],
    }),

    registerForEvent: builder.mutation<EventRegistration, Partial<EventRegistration>>({
      queryFn: async (registration) => {
        const { data, error } = await supabase
          .from('event_registrations')
          .insert(registration)
          .select()
          .single();

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as EventRegistration };
      },
      invalidatesTags: ['EventRegistration', { type: 'Events', id: 'LIST' }],
    }),

    // ==========================================
    // DONATION ENDPOINTS
    // ==========================================
    getDonations: builder.query<Donation[], string>({
      queryFn: async (userId) => {
        const { data, error } = await supabase
          .from('donations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as Donation[] };
      },
      providesTags: ['Donations'],
    }),

    // ==========================================
    // APPLICATION ENDPOINTS
    // ==========================================
    getApplication: builder.query<Application, string>({
      queryFn: async (userId) => {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as Application };
      },
      providesTags: (result) =>
        result ? [{ type: 'Applications', id: result.id }] : ['Applications'],
    }),

    submitApplication: builder.mutation<Application, Partial<Application>>({
      queryFn: async (application) => {
        const { data, error } = await supabase
          .from('applications')
          .insert(application)
          .select()
          .single();

        if (error) {
          return { error: { status: 'CUSTOM_ERROR', data: error.message } };
        }

        return { data: data as Application };
      },
      invalidatesTags: ['Applications'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetMemberProfileQuery,
  useUpdateMemberProfileMutation,
  useGetMembershipQuery,
  useGetVolunteerOpportunitiesQuery,
  useGetVolunteerOpportunityQuery,
  useSignUpForVolunteerMutation,
  useGetVolunteerHoursQuery,
  useLogVolunteerHoursMutation,
  useGetEventsQuery,
  useRegisterForEventMutation,
  useGetDonationsQuery,
  useGetApplicationQuery,
  useSubmitApplicationMutation,
} = memberApi;
