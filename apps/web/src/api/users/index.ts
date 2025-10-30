// ============================================================================
// USER API EXPORTS
// ============================================================================

// Main API client
export { default as userApi, UserApi } from './userApi';

// Types
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
} from './userApi';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Re-export commonly used types from @issb/types
export type {
  User,
  UserProfile,
  UserFilter,
  PaginatedResponse,
  UserStatus,
  UserRole,
  MembershipTier,
} from '@issb/types';

// ============================================================================
// API ENDPOINTS CONSTANTS
// ============================================================================

export const USER_ENDPOINTS = {
  BASE: '/users',
  PROFILE: '/profile',
  AVATAR: '/avatar',
  BULK: '/bulk',
  EXPORT: '/export',
  IMPORT: '/import',
  SUGGESTIONS: '/suggestions',
  RECENT: '/recent',
  STATISTICS: '/statistics',
  COUNT: '/count',
  PASSWORD: '/password',
  VERIFY_EMAIL: '/verify-email',
  CHECK_EMAIL: '/check-email',
  ACTIVITY: '/activity',
} as const;

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Basic usage examples:
 * 
 * // Get all users
 * const users = await userApi.getUsers({ page: 1, limit: 10 });
 * 
 * // Create a new user
 * const newUser = await userApi.createUser({
 *   email: 'user@example.com',
 *   password: 'password123',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   role: UserRole.MEMBER,
 * });
 * 
 * // Update user
 * const updatedUser = await userApi.updateUser('user-id', {
 *   firstName: 'Jane',
 * });
 * 
 * // Search users
 * const searchResults = await userApi.searchUsers({
 *   search: 'john',
 *   role: [UserRole.MEMBER],
 *   status: [UserStatus.ACTIVE],
 * });
 * 
 * // Bulk operations
 * const result = await userApi.bulkOperation({
 *   userIds: ['id1', 'id2'],
 *   operation: 'activate',
 * });
 * 
 * // Profile management
 * const profile = await userApi.getUserProfile('user-id');
 * await userApi.updateUserProfile('user-id', {
 *   bio: 'Software developer',
 *   location: 'New York',
 * });
 * 
 * // Upload avatar
 * const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
 * const { avatarUrl } = await userApi.uploadAvatar('user-id', file);
 */
