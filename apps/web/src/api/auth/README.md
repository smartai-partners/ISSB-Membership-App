# Authentication API Service

Centralized authentication API service for managing user authentication, registration, and session management.

## Features

- **User Authentication**: Login, logout, and session management
- **User Registration**: New account creation with validation
- **Password Management**: Forgot password, reset password, and change password
- **Email Verification**: Email verification and resend verification codes
- **Profile Management**: Get and update user profiles with avatar upload
- **Session Management**: Active sessions monitoring and revocation
- **Two-Factor Authentication**: Enable/disable and verify 2FA
- **Token Management**: Secure token storage and retrieval
- **Error Handling**: Comprehensive error handling with typed errors

## Installation

The API service is automatically available through the existing project structure. It uses:

- `@issb/types` for shared TypeScript types
- Axios for HTTP requests (configured in `services/api.ts`)
- Zustand for state management (integrated with auth store)

## Usage

### Basic Authentication

```typescript
import { authApi } from '@/api/auth';

// Login
try {
  const response = await authApi.login({
    email: 'user@example.com',
    password: 'password123',
    rememberMe: true,
  });
  
  if (response.success) {
    console.log('Logged in:', response.user);
  }
} catch (error) {
  console.error('Login failed:', error.message);
}

// Register
try {
  const response = await authApi.register({
    email: 'user@example.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
    agreeToTerms: true,
    agreeToPrivacy: true,
  });
  
  if (response.success) {
    console.log('Registered:', response.user);
  }
} catch (error) {
  console.error('Registration failed:', error.message);
}
```

### Password Management

```typescript
// Forgot Password
try {
  await authApi.forgotPassword({ email: 'user@example.com' });
  console.log('Password reset email sent');
} catch (error) {
  console.error('Failed to send reset email:', error.message);
}

// Reset Password
try {
  await authApi.resetPassword({
    password: 'NewSecurePass123!',
    confirmPassword: 'NewSecurePass123!',
    token: 'reset-token-from-email',
  });
  console.log('Password reset successfully');
} catch (error) {
  console.error('Password reset failed:', error.message);
}

// Change Password (Authenticated)
try {
  await authApi.changePassword({
    currentPassword: 'old-password',
    newPassword: 'NewSecurePass123!',
    confirmPassword: 'NewSecurePass123!',
  });
  console.log('Password changed successfully');
} catch (error) {
  console.error('Password change failed:', error.message);
}
```

### Email Verification

```typescript
// Verify Email
try {
  await authApi.verifyEmail({
    email: 'user@example.com',
    verificationCode: '123456',
  });
  console.log('Email verified successfully');
} catch (error) {
  console.error('Email verification failed:', error.message);
}

// Resend Verification
try {
  await authApi.resendVerification({ email: 'user@example.com' });
  console.log('Verification email resent');
} catch (error) {
  console.error('Failed to resend verification:', error.message);
}
```

### User Profile Management

```typescript
// Get Current User
try {
  const user = await authApi.getCurrentUser();
  console.log('Current user:', user);
} catch (error) {
  console.error('Failed to get user:', error.message);
}

// Update Profile
try {
  const updatedUser = await authApi.updateProfile({
    firstName: 'John',
    lastName: 'Smith',
    phone: '+1234567890',
  });
  console.log('Profile updated:', updatedUser);
} catch (error) {
  console.error('Profile update failed:', error.message);
}

// Upload Avatar
try {
  const fileInput = document.getElementById('avatar') as HTMLInputElement;
  if (fileInput.files?.[0]) {
    const result = await authApi.uploadAvatar(fileInput.files[0]);
    console.log('Avatar uploaded:', result.avatarUrl);
  }
} catch (error) {
  console.error('Avatar upload failed:', error.message);
}
```

### Session Management

```typescript
// Get Active Sessions
try {
  const sessions = await authApi.getActiveSessions();
  sessions.forEach(session => {
    console.log(`Session ${session.id}: ${session.device} - ${session.location}`);
  });
} catch (error) {
  console.error('Failed to get sessions:', error.message);
}

// Revoke Session
try {
  await authApi.revokeSession('session-id');
  console.log('Session revoked');
} catch (error) {
  console.error('Failed to revoke session:', error.message);
}

// Revoke All Other Sessions
try {
  await authApi.revokeAllSessions();
  console.log('All other sessions revoked');
} catch (error) {
  console.error('Failed to revoke sessions:', error.message);
}
```

### Two-Factor Authentication

```typescript
// Enable 2FA
try {
  const result = await authApi.toggleTwoFactor(true, '123456');
  console.log('2FA enabled');
  console.log('QR Code:', result.qrCode);
  console.log('Backup codes:', result.backupCodes);
} catch (error) {
  console.error('Failed to enable 2FA:', error.message);
}

// Verify 2FA Code
try {
  const result = await authApi.verifyTwoFactor('123456');
  if (result.valid) {
    console.log('2FA code valid');
  }
} catch (error) {
  console.error('2FA verification failed:', error.message);
}
```

### Token Management

```typescript
import { authApi } from '@/api/auth';

// Check Authentication Status
if (authApi.isAuthenticated()) {
  console.log('User is authenticated');
}

// Get Stored Tokens
const { token, refreshToken } = authApi.getStoredTokens();

// Store Tokens (usually handled automatically)
authApi.storeTokens('jwt-token', 'refresh-token');

// Clear Tokens (usually handled automatically)
authApi.clearStoredTokens();
```

### Error Handling

All API methods throw typed errors that include detailed information:

```typescript
try {
  await authApi.login(credentials);
} catch (error) {
  if (error instanceof authApi.ApiError) {
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Field errors:', error.errors);
    
    // Handle specific error codes
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        // Handle invalid login
        break;
      case 'EMAIL_NOT_VERIFIED':
        // Handle unverified email
        break;
      case 'ACCOUNT_LOCKED':
        // Handle locked account
        break;
      default:
        // Handle other errors
    }
  }
}
```

## Integration with Auth Store

The API service is designed to work seamlessly with the Zustand auth store:

```typescript
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';

// The auth store automatically uses these API methods
// No additional integration code needed

const { login, logout, refreshToken } = useAuthStore.getState();

// These actions use the authApi under the hood
await login('user@example.com', 'password');
await logout();
await refreshToken();
```

## API Endpoints

The service expects the following backend endpoints:

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh authentication token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/verify-email` - Verify email address
- `POST /auth/resend-verification` - Resend verification email
- `POST /auth/change-password` - Change password (authenticated)
- `GET /auth/me` - Get current user profile
- `PATCH /auth/profile` - Update user profile
- `POST /auth/avatar` - Upload avatar
- `DELETE /auth/avatar` - Remove avatar
- `GET /auth/check-email` - Check email availability
- `POST /auth/validate-password` - Validate password strength
- `GET /auth/sessions` - Get active sessions
- `DELETE /auth/sessions/:id` - Revoke specific session
- `DELETE /auth/sessions/all` - Revoke all other sessions
- `POST /auth/2fa` - Toggle two-factor authentication
- `POST /auth/2fa/verify` - Verify 2FA code

## Response Format

All API methods expect responses in the following format:

```typescript
{
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}
```

Where `ValidationError` has the structure:
```typescript
{
  field: string;
  message: string;
  code: string;
}
```

## Security Considerations

1. **Token Storage**: Tokens are stored in sessionStorage for better security than localStorage
2. **Authorization Headers**: Automatically set for authenticated requests
3. **Error Handling**: Errors don't expose sensitive information
4. **Session Management**: Users can monitor and revoke active sessions
5. **Two-Factor Authentication**: Support for enhanced security
6. **Password Validation**: Server-side password strength validation

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

- Request/response types for all API methods
- Error types with detailed information
- Integration with shared types from `@issb/types`
- Proper type safety throughout the service

## Browser Compatibility

- Modern browsers with ES6+ support
- Axios for cross-browser HTTP requests
- No external dependencies beyond existing project setup