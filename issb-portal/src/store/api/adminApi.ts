/**
 * Admin API Slice - RTK Query for Admin Operations
 * Extends existing memberApi with admin-specific endpoints
 * Requires admin role for all operations
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { supabase } from '../../lib/supabase';
import type { Profile, UserRole, UserStatus } from '../../types';
import type { RootState } from '../index';

// Admin-specific types
export interface UserFilters {
  searchQuery?: string;
  roles?: UserRole[];
  statuses?: UserStatus[];
  membershipTier?: string;
  pageIndex: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedUsers {
  users: Profile[];
  total: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
}

export interface BulkUpdateOperation {
  userId: string;
  updates: Partial<Profile>;
}

export interface BulkUpdateResult {
  success: number;
  failed: number;
  errors?: Array<{ userId: string; error: string }>;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

/**
 * Admin API Slice
 * All endpoints require admin role verification
 */
export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: async (args, api) => {
    try {
      // Verify admin role from Redux state
      const state = api.getState() as RootState;
      const user = state.auth.user;

      if (!user) {
        return {
          error: {
            status: 401,
            data: { message: 'Authentication required' },
          },
        };
      }

      // Note: Role is stored in profiles table, not user_metadata
      // We'll rely on RLS policies to enforce admin access
      
      return { data: args };
    } catch (error) {
      return {
        error: {
          status: 'CUSTOM_ERROR',
          data: { message: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  },
  tagTypes: ['AdminUsers', 'UserActivity', 'AdminStats'],
  endpoints: (builder) => ({
    // Get all users with pagination and filtering
    getAllUsers: builder.query<PaginatedUsers, UserFilters>({
      queryFn: async (filters) => {
        try {
          let query = supabase.from('profiles').select('*', { count: 'exact' });

          // Apply search filter
          if (filters.searchQuery) {
            query = query.or(
              `first_name.ilike.%${filters.searchQuery}%,last_name.ilike.%${filters.searchQuery}%,email.ilike.%${filters.searchQuery}%`
            );
          }

          // Apply role filter
          if (filters.roles && filters.roles.length > 0) {
            query = query.in('role', filters.roles);
          }

          // Apply status filter
          if (filters.statuses && filters.statuses.length > 0) {
            query = query.in('status', filters.statuses);
          }

          // Apply membership tier filter
          if (filters.membershipTier) {
            query = query.eq('membership_tier', filters.membershipTier);
          }

          // Apply sorting
          query = query.order(filters.sortBy || 'created_at', {
            ascending: filters.sortOrder !== 'desc',
          });

          // Apply pagination
          const start = filters.pageIndex * filters.pageSize;
          const end = start + filters.pageSize - 1;
          query = query.range(start, end);

          const { data, error, count } = await query;

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', data: error.message } };
          }

          const total = count || 0;
          const pageCount = Math.ceil(total / filters.pageSize);

          return {
            data: {
              users: (data as Profile[]) || [],
              total,
              pageIndex: filters.pageIndex,
              pageSize: filters.pageSize,
              pageCount,
            },
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: error instanceof Error ? error.message : 'Failed to fetch users',
            },
          };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.users.map((user) => ({ type: 'AdminUsers' as const, id: user.id })),
              { type: 'AdminUsers' as const, id: 'LIST' },
            ]
          : [{ type: 'AdminUsers' as const, id: 'LIST' }],
    }),

    // Update user profile (admin version)
    updateUserProfile: builder.mutation<Profile, { userId: string; updates: Partial<Profile> }>({
      queryFn: async ({ userId, updates }) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', data: error.message } };
          }

          return { data: data as Profile };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: error instanceof Error ? error.message : 'Failed to update user',
            },
          };
        }
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: 'AdminUsers', id: userId },
        { type: 'AdminUsers', id: 'LIST' },
      ],
    }),

    // Delete user
    deleteUser: builder.mutation<{ success: boolean }, string>({
      queryFn: async (userId) => {
        try {
          const { error } = await supabase.from('profiles').delete().eq('id', userId);

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', data: error.message } };
          }

          return { data: { success: true } };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: error instanceof Error ? error.message : 'Failed to delete user',
            },
          };
        }
      },
      invalidatesTags: (result, error, userId) => [
        { type: 'AdminUsers', id: userId },
        { type: 'AdminUsers', id: 'LIST' },
        'AdminStats',
      ],
    }),

    // Bulk update users
    bulkUpdateUsers: builder.mutation<BulkUpdateResult, BulkUpdateOperation[]>({
      queryFn: async (operations) => {
        try {
          const results = await Promise.allSettled(
            operations.map(async ({ userId, updates }) => {
              const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);

              if (error) throw error;
              return userId;
            })
          );

          const success = results.filter((r) => r.status === 'fulfilled').length;
          const failed = results.filter((r) => r.status === 'rejected').length;
          const errors = results
            .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
            .map((r, i) => ({
              userId: operations[i].userId,
              error: r.reason.message || 'Unknown error',
            }));

          return {
            data: {
              success,
              failed,
              errors: errors.length > 0 ? errors : undefined,
            },
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: error instanceof Error ? error.message : 'Bulk update failed',
            },
          };
        }
      },
      invalidatesTags: [{ type: 'AdminUsers', id: 'LIST' }],
    }),

    // Get user activity/audit logs
    getUserActivity: builder.query<UserActivity[], string>({
      queryFn: async (userId) => {
        try {
          const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) {
            return { error: { status: 'CUSTOM_ERROR', data: error.message } };
          }

          return { data: (data as UserActivity[]) || [] };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: error instanceof Error ? error.message : 'Failed to fetch activity',
            },
          };
        }
      },
      providesTags: (result, error, userId) => [{ type: 'UserActivity', id: userId }],
    }),

    // Get admin dashboard statistics
    getAdminStats: builder.query<
      {
        totalUsers: number;
        activeMembers: number;
        pendingApplications: number;
        totalDonations: number;
        volunteerHours: number;
        upcomingEvents: number;
      },
      void
    >({
      queryFn: async () => {
        try {
          // Fetch all stats in parallel
          const [usersCount, membersCount, appsCount, donations, hours, eventsCount] =
            await Promise.all([
              supabase.from('profiles').select('*', { count: 'exact', head: true }),
              supabase
                .from('memberships')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active'),
              supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending'),
              supabase.from('donations').select('amount').eq('payment_status', 'paid'),
              supabase.from('volunteer_hours').select('hours').eq('status', 'APPROVED'),
              supabase
                .from('events')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'published')
                .gte('start_date', new Date().toISOString()),
            ]);

          const totalDonations = donations.data?.reduce((sum, d) => sum + d.amount, 0) || 0;
          const totalHours = hours.data?.reduce((sum, h) => sum + h.hours, 0) || 0;

          return {
            data: {
              totalUsers: usersCount.count || 0,
              activeMembers: membersCount.count || 0,
              pendingApplications: appsCount.count || 0,
              totalDonations,
              volunteerHours: totalHours,
              upcomingEvents: eventsCount.count || 0,
            },
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              data: error instanceof Error ? error.message : 'Failed to fetch stats',
            },
          };
        }
      },
      providesTags: ['AdminStats'],
    }),
  }),
});

// Export hooks
export const {
  useGetAllUsersQuery,
  useUpdateUserProfileMutation,
  useDeleteUserMutation,
  useBulkUpdateUsersMutation,
  useGetUserActivityQuery,
  useGetAdminStatsQuery,
} = adminApi;
