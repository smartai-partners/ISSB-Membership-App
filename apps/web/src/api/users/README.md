# User API Service

A comprehensive TypeScript API service for managing users, profiles, and related operations in the ISSB web application.

## Features

- ✅ **CRUD Operations** - Create, Read, Update, Delete users
- ✅ **Profile Management** - Manage user profiles and avatars
- ✅ **Advanced Search** - Search users with filters and pagination
- ✅ **Bulk Operations** - Perform actions on multiple users
- ✅ **Type Safety** - Full TypeScript support with shared types
- ✅ **Error Handling** - Comprehensive error handling with detailed messages
- ✅ **Pagination** - Built-in pagination support
- ✅ **Filtering** - Multiple filter options (role, status, tier, date range, etc.)

## Installation

The API service is already configured in your project. Simply import and use:

```typescript
import { userApi } from '@/api/users';
```

## Quick Start

### Get All Users

```typescript
import { userApi, UserStatus, UserRole } from '@/api/users';

// Basic usage
const users = await userApi.getUsers();

// With pagination
const paginatedUsers = await userApi.getUsers({
  page: 1,
  limit: 20,
});

// With filtering
const activeMembers = await userApi.getUsers({
  status: [UserStatus.ACTIVE],
  role: [UserRole.MEMBER],
  page: 1,
  limit: 10,
});
```

### Create User

```typescript
import { userApi, UserCreateData } from '@/api/users';

const userData: UserCreateData = {
  email: 'john.doe@example.com',
  password: 'SecurePassword123!',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.MEMBER,
  phone: '+1234567890',
  dateOfBirth: new Date('1990-01-01'),
};

const newUser = await userApi.createUser(userData);
```

### Update User

```typescript
const updatedUser = await userApi.updateUser('user-id', {
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '+0987654321',
});
```

### Delete User

```typescript
// Soft delete
await userApi.deleteUser('user-id');

// Permanent delete (admin only)
await userApi.permanentlyDeleteUser('user-id');
```

## User Search & Filtering

### Search Users

```typescript
const searchResults = await userApi.searchUsers({
  search: 'john',
  page: 1,
  limit: 10,
});
```

### Advanced Filtering

```typescript
const filteredUsers = await userApi.getUsers({
  role: [UserRole.MEMBER, UserRole.BOARD],
  tier: [MembershipTier.REGULAR],
  status: [UserStatus.ACTIVE],
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
});
```

### Get User Suggestions

```typescript
const suggestions = await userApi.getUserSuggestions('john', 5);
// Returns: [{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }, ...]
```

## Profile Management

### Get User Profile

```typescript
const profile = await userApi.getUserProfile('user-id');
```

### Update Profile

```typescript
await userApi.updateUserProfile('user-id', {
  bio: 'Software developer with 5+ years experience',
  location: 'New York, NY',
  occupation: 'Senior Developer',
  organization: 'Tech Corp',
  website: 'https://johndoe.dev',
  socialMedia: {
    linkedin: 'https://linkedin.com/in/johndoe',
    twitter: 'https://twitter.com/johndoe',
  },
  languages: ['English', 'Spanish', 'French'],
  interests: ['Technology', 'Open Source', 'AI'],
});
```

### Upload Avatar

```typescript
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
if (fileInput?.files?.[0]) {
  const { avatarUrl } = await userApi.uploadAvatar('user-id', fileInput.files[0]);
  console.log('Avatar uploaded:', avatarUrl);
}
```

### Delete Avatar

```typescript
await userApi.deleteAvatar('user-id');
```

## Bulk Operations

### Bulk Status Changes

```typescript
const result = await userApi.bulkOperation({
  userIds: ['id1', 'id2', 'id3'],
  operation: 'activate',
});

console.log(`Success: ${result.success}, Failed: ${result.failed}`);
if (result.errors.length > 0) {
  console.log('Errors:', result.errors);
}
```

### Bulk Role Changes

```typescript
const result = await userApi.bulkOperation({
  userIds: ['id1', 'id2'],
  operation: 'changeRole',
  data: {
    role: UserRole.BOARD,
  },
});
```

### Import Users from CSV

```typescript
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
if (fileInput?.files?.[0]) {
  const result = await userApi.importUsers(fileInput.files[0]);
  console.log(`Imported: ${result.success}, Failed: ${result.failed}`);
}
```

### Export Users to CSV

```typescript
const blob = await userApi.exportUsers({
  status: [UserStatus.ACTIVE],
  role: [UserRole.MEMBER],
});

// Download the file
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'users.csv';
document.body.appendChild(a);
a.click();
window.URL.revokeObjectURL(url);
document.body.removeChild(a);
```

## User Status Management

```typescript
// Activate user
await userApi.activateUser('user-id');

// Deactivate user
await userApi.deactivateUser('user-id');

// Suspend user
await userApi.suspendUser('user-id', 'Violation of terms of service');

// Unsuspend user
await userApi.unsuspendUser('user-id');

// Ban user
await userApi.banUser('user-id', 'Spam and abuse');
```

## Password Management

### Change User Password (Admin)

```typescript
await userApi.changeUserPassword('user-id', 'NewSecurePassword123!');
```

### Request Password Reset

```typescript
await userApi.requestPasswordReset('user@example.com');
```

### Reset Password with Token

```typescript
await userApi.resetPassword('reset-token', 'NewPassword123!', 'NewPassword123!');
```

## Statistics & Analytics

### Get User Statistics

```typescript
const stats = await userApi.getUserStatistics();
console.log('Total users:', stats.total);
console.log('Active users:', stats.active);
console.log('By role:', stats.byRole);
console.log('By tier:', stats.byTier);
console.log('Recent registrations:', stats.recentRegistrations);
```

### Get Users Count

```typescript
const totalCount = await userApi.getUsersCount();
const activeCount = await userApi.getUsersCount({
  status: [UserStatus.ACTIVE],
});
```

## Email Verification

### Resend Email Verification

```typescript
await userApi.resendEmailVerification('user-id');
```

### Verify Email with Token

```typescript
const verifiedUser = await userApi.verifyEmail('verification-token');
```

## Utility Methods

### Check if Email Exists

```typescript
const emailExists = await userApi.checkEmailExists('user@example.com');
if (emailExists) {
  console.log('Email is already registered');
}
```

### Get User Activity Logs

```typescript
const activities = await userApi.getUserActivityLogs('user-id', 50);
activities.forEach(activity => {
  console.log(`${activity.action} at ${activity.createdAt}`);
});
```

## Error Handling

All API methods include comprehensive error handling:

```typescript
try {
  const user = await userApi.getUser('user-id');
  // Handle success
} catch (error) {
  if (error instanceof Error) {
    console.error('API Error:', error.message);
    
    // Handle specific error types
    if (error.message.includes('not found')) {
      // Handle 404
    } else if (error.message.includes('validation')) {
      // Handle validation errors
    }
  }
}
```

## Type Definitions

### UserSearchParams

```typescript
interface UserSearchParams extends UserFilter {
  page?: number;
  limit?: number;
}

interface UserFilter {
  role?: UserRole[];
  tier?: MembershipTier[];
  status?: UserStatus[];
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### BulkOperationRequest

```typescript
interface BulkOperationRequest {
  userIds: string[];
  operation: 'activate' | 'deactivate' | 'suspend' | 'delete' | 'changeRole' | 'changeTier';
  data?: {
    role?: UserRole;
    tier?: MembershipTier;
  };
}
```

### UserProfileUpdateData

```typescript
interface UserProfileUpdateData {
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
```

## API Endpoints

The service uses the following REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get users with pagination and filters |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create new user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user (soft) |
| DELETE | `/users/:id/permanent` | Permanent delete |
| GET | `/users/:id/profile` | Get user profile |
| PUT | `/users/:id/profile` | Update user profile |
| POST | `/users/:id/avatar` | Upload avatar |
| DELETE | `/users/:id/avatar` | Delete avatar |
| POST | `/users/bulk` | Bulk operations |
| GET | `/users/export` | Export users |
| POST | `/users/import` | Import users |
| GET | `/users/suggestions` | Get user suggestions |
| GET | `/users/recent` | Get recent users |
| GET | `/users/statistics` | Get user statistics |
| GET | `/users/count` | Get users count |
| POST | `/users/:id/suspend` | Suspend user |
| POST | `/users/:id/password/reset` | Reset password |
| POST | `/users/password/reset/request` | Request password reset |
| POST | `/users/password/reset/confirm` | Confirm password reset |
| POST | `/users/:id/verify-email/resend` | Resend verification |
| POST | `/users/verify-email` | Verify email |
| GET | `/users/check-email` | Check email exists |
| GET | `/users/:id/activity` | Get user activity |

## Best Practices

1. **Always use try-catch** for error handling
2. **Validate data** before sending to API
3. **Use pagination** for large datasets
4. **Implement loading states** in UI components
5. **Handle bulk operations** carefully with proper feedback
6. **Use proper TypeScript types** for type safety
7. **Cache frequently accessed data** when appropriate

## Contributing

When adding new methods to the UserApi class:

1. Follow the existing naming conventions
2. Include comprehensive JSDoc comments
3. Add proper TypeScript types
4. Include error handling
5. Update this README with examples
6. Add tests if applicable

## Support

For issues or questions about the User API service, please refer to the project documentation or contact the development team.
