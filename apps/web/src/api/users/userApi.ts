import api from '../../services/api';
import type {
  User,
  UserProfile,
  UserFilter,
  PaginatedResponse,
  ApiResponse,
  CreateInput,
  UpdateInput,
  UserStatus,
  UserRole,
  MembershipTier,
  ValidationError,
} from '@issb/types';

// ============================================================================
// TYPES
// ============================================================================

export interface UserCreateData extends CreateInput<User> {
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  tier?: MembershipTier;
  status?: UserStatus;
  phone?: string;
  dateOfBirth?: Date;
}

export interface UserUpdateData extends UpdateInput<User> {
  id: string;
}

export interface UserSearchParams extends UserFilter {
  page?: number;
  limit?: number;
}

export interface UserListResponse extends PaginatedResponse<User> {}

export interface BulkOperationRequest {
  userIds: string[];
  operation: 'activate' | 'deactivate' | 'suspend' | 'delete' | 'changeRole' | 'changeTier';
  data?: {
    role?: UserRole;
    tier?: MembershipTier;
  };
}

export interface BulkOperationResponse {
  success: number;
  failed: number;
  errors: Array<{
    userId: string;
    message: string;
  }>;
}

export interface UserProfileUpdateData {
  bio?: string;
  location?: string;
  occupation?: string;
  organization?: string;
  website?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  languages?: string[];
  interests?: string[];
}

export interface PasswordChangeRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserStatistics {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  pending: number;
  byRole: Record<UserRole, number>;
  byTier: Record<MembershipTier, number>;
  recentRegistrations: number;
  last30Days: number;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class UserApi {
  private readonly baseUrl = '/users';

  // ============================================================================
  // USER CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all users with pagination and filtering
   */
  async getUsers(params?: UserSearchParams): Promise<UserListResponse> {
    try {
      const response = await api.get<UserListResponse>(this.baseUrl, { params });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>(`${this.baseUrl}/${id}`);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch user');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: UserCreateData): Promise<User> {
    try {
      const response = await api.post<ApiResponse<User>>(this.baseUrl, userData);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to create user');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, userData: Partial<UserUpdateData>): Promise<User> {
    try {
      const response = await api.put<ApiResponse<User>>(`${this.baseUrl}/${id}`, userData);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to update user');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete user');
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Permanently delete user (admin only)
   */
  async permanentlyDeleteUser(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<void>>(`${this.baseUrl}/${id}/permanent`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to permanently delete user');
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await api.get<ApiResponse<UserProfile>>(`${this.baseUrl}/${userId}/profile`);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch user profile');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profileData: UserProfileUpdateData): Promise<UserProfile> {
    try {
      const response = await api.put<ApiResponse<UserProfile>>(`${this.baseUrl}/${userId}/profile`, profileData);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to update user profile');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post<ApiResponse<{ avatarUrl: string }>>(
        `${this.baseUrl}/${userId}/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to upload avatar');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(userId: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<void>>(`${this.baseUrl}/${userId}/avatar`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete avatar');
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // USER SEARCH
  // ============================================================================

  /**
   * Search users with advanced filtering
   */
  async searchUsers(params: UserSearchParams): Promise<UserListResponse> {
    return this.getUsers({ ...params, search: params.search });
  }

  /**
   * Get user suggestions for autocomplete
   */
  async getUserSuggestions(query: string, limit: number = 10): Promise<User[]> {
    try {
      const response = await api.get<ApiResponse<User[]>>(`${this.baseUrl}/suggestions`, {
        params: { query, limit },
      });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch user suggestions');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Find users by role
   */
  async getUsersByRole(role: UserRole, params?: Partial<UserSearchParams>): Promise<UserListResponse> {
    return this.getUsers({ ...params, role: [role] });
  }

  /**
   * Find users by status
   */
  async getUsersByStatus(status: UserStatus, params?: Partial<UserSearchParams>): Promise<UserListResponse> {
    return this.getUsers({ ...params, status: [status] });
  }

  /**
   * Get recent users
   */
  async getRecentUsers(limit: number = 10): Promise<User[]> {
    try {
      const response = await api.get<ApiResponse<User[]>>(`${this.baseUrl}/recent`, {
        params: { limit },
      });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch recent users');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Perform bulk operations on users
   */
  async bulkOperation(request: BulkOperationRequest): Promise<BulkOperationResponse> {
    try {
      const response = await api.post<ApiResponse<BulkOperationResponse>>(
        `${this.baseUrl}/bulk`,
        request
      );
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to perform bulk operation');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Export users to CSV
   */
  async exportUsers(params?: UserSearchParams): Promise<Blob> {
    try {
      const response = await api.get(`${this.baseUrl}/export`, {
        params,
        responseType: 'blob',
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Import users from CSV
   */
  async importUsers(file: File): Promise<BulkOperationResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ApiResponse<BulkOperationResponse>>(
        `${this.baseUrl}/import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to import users');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // USER STATUS MANAGEMENT
  // ============================================================================

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<User> {
    return this.updateUser(id, { status: UserStatus.ACTIVE });
  }

  /**
   * Deactivate user
   */
  async deactivateUser(id: string): Promise<User> {
    return this.updateUser(id, { status: UserStatus.INACTIVE });
  }

  /**
   * Suspend user
   */
  async suspendUser(id: string, reason?: string): Promise<User> {
    try {
      const response = await api.post<ApiResponse<User>>(`${this.baseUrl}/${id}/suspend`, { reason });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to suspend user');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Unsuspend user
   */
  async unsuspendUser(id: string): Promise<User> {
    return this.updateUser(id, { status: UserStatus.ACTIVE });
  }

  /**
   * Ban user
   */
  async banUser(id: string, reason?: string): Promise<User> {
    return this.updateUser(id, { status: UserStatus.BANNED });
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  /**
   * Change user password (admin)
   */
  async changeUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>(`${this.baseUrl}/${userId}/password/reset`, {
        newPassword,
      });
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to change password');
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>(`${this.baseUrl}/password/reset/request`, {
        email,
      });
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to request password reset');
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>(`${this.baseUrl}/password/reset/confirm`, {
        token,
        newPassword,
        confirmPassword,
      });
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to reset password');
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // USER STATISTICS
  // ============================================================================

  /**
   * Get user statistics
   */
  async getUserStatistics(): Promise<UserStatistics> {
    try {
      const response = await api.get<ApiResponse<UserStatistics>>(`${this.baseUrl}/statistics`);
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch user statistics');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get users count by filter
   */
  async getUsersCount(filter?: UserFilter): Promise<number> {
    try {
      const response = await api.get<ApiResponse<{ count: number }>>(`${this.baseUrl}/count`, {
        params: filter,
      });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch users count');
      }
      return response.data.data.count;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  /**
   * Resend email verification
   */
  async resendEmailVerification(userId: string): Promise<void> {
    try {
      const response = await api.post<ApiResponse<void>>(`${this.baseUrl}/${userId}/verify-email/resend`);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to resend email verification');
      }
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<User> {
    try {
      const response = await api.post<ApiResponse<User>>(`${this.baseUrl}/verify-email`, { token });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to verify email');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const validationErrors = error.response.data.errors as ValidationError[];
      const message = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
      return new Error(message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An unexpected error occurred');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if user exists by email
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await api.get<ApiResponse<{ exists: boolean }>>(`${this.baseUrl}/check-email`, {
        params: { email },
      });
      return response.data?.data?.exists || false;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await api.get<ApiResponse<any[]>>(`${this.baseUrl}/${userId}/activity`, {
        params: { limit },
      });
      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to fetch user activity logs');
      }
      return response.data.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }
}

// ============================================================================
// EXPORT INSTANCE
// ============================================================================

export const userApi = new UserApi();
export default userApi;

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  UserCreateData,
  UserUpdateData,
  UserSearchParams,
  UserListResponse,
  BulkOperationRequest,
  BulkOperationResponse,
  UserProfileUpdateData,
  PasswordChangeRequest,
  UserStatistics,
};
