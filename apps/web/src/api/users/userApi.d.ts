// ============================================================================
// USER API TYPE DECLARATIONS
// ============================================================================

declare module '@/api/users' {
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

  export const USER_ENDPOINTS: {
    readonly BASE: '/users';
    readonly PROFILE: '/profile';
    readonly AVATAR: '/avatar';
    readonly BULK: '/bulk';
    readonly EXPORT: '/export';
    readonly IMPORT: '/import';
    readonly SUGGESTIONS: '/suggestions';
    readonly RECENT: '/recent';
    readonly STATISTICS: '/statistics';
    readonly COUNT: '/count';
    readonly PASSWORD: '/password';
    readonly VERIFY_EMAIL: '/verify-email';
    readonly CHECK_EMAIL: '/check-email';
    readonly ACTIVITY: '/activity';
  };

  export class UserApi {
    // CRUD Operations
    getUsers(params?: UserSearchParams): Promise<UserListResponse>;
    getUser(id: string): Promise<User>;
    createUser(userData: UserCreateData): Promise<User>;
    updateUser(id: string, userData: Partial<UserUpdateData>): Promise<User>;
    deleteUser(id: string): Promise<void>;
    permanentlyDeleteUser(id: string): Promise<void>;

    // Profile Management
    getUserProfile(userId: string): Promise<UserProfile>;
    updateUserProfile(userId: string, profileData: UserProfileUpdateData): Promise<UserProfile>;
    uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }>;
    deleteAvatar(userId: string): Promise<void>;

    // User Search
    searchUsers(params: UserSearchParams): Promise<UserListResponse>;
    getUserSuggestions(query: string, limit?: number): Promise<User[]>;
    getUsersByRole(role: UserRole, params?: Partial<UserSearchParams>): Promise<UserListResponse>;
    getUsersByStatus(status: UserStatus, params?: Partial<UserSearchParams>): Promise<UserListResponse>;
    getRecentUsers(limit?: number): Promise<User[]>;

    // Bulk Operations
    bulkOperation(request: BulkOperationRequest): Promise<BulkOperationResponse>;
    exportUsers(params?: UserSearchParams): Promise<Blob>;
    importUsers(file: File): Promise<BulkOperationResponse>;

    // Status Management
    activateUser(id: string): Promise<User>;
    deactivateUser(id: string): Promise<User>;
    suspendUser(id: string, reason?: string): Promise<User>;
    unsuspendUser(id: string): Promise<User>;
    banUser(id: string, reason?: string): Promise<User>;

    // Password Management
    changeUserPassword(userId: string, newPassword: string): Promise<void>;
    requestPasswordReset(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<void>;

    // Statistics
    getUserStatistics(): Promise<UserStatistics>;
    getUsersCount(filter?: UserFilter): Promise<number>;

    // Email Verification
    resendEmailVerification(userId: string): Promise<void>;
    verifyEmail(token: string): Promise<User>;

    // Utilities
    checkEmailExists(email: string): Promise<boolean>;
    getUserActivityLogs(userId: string, limit?: number): Promise<any[]>;
  }

  const userApi: UserApi;
  export default userApi;

  // Re-export commonly used types
  export type {
    User,
    UserProfile,
    UserFilter,
    PaginatedResponse,
    UserStatus,
    UserRole,
    MembershipTier,
  };
}
