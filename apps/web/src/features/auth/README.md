# Authentication Components

This directory contains a complete set of authentication form components built with React Hook Form, Zod validation, and TypeScript.

## Components

### LoginForm
A comprehensive login form with email/password authentication and social login options.

**Features:**
- Email and password validation
- Remember me functionality
- Social login integration (Google, Facebook, GitHub, LinkedIn)
- Password visibility toggle
- Forgot password link
- Loading states and error handling

**Usage:**
```tsx
import { LoginForm } from '@/features/auth';

<LoginForm
  onSubmit={async (data) => {
    // Handle login logic
    await authService.login(data);
  }}
  onSocialLogin={async (provider) => {
    // Handle social login
    await authService.socialLogin(provider);
  }}
  showSocialLogin={true}
  showRememberMe={true}
/>
```

### RegisterForm
A complete registration form with password strength validation and terms acceptance.

**Features:**
- First name, last name, email, and password fields
- Password confirmation
- Password strength indicator
- Terms and conditions acceptance
- Social registration options
- Real-time validation feedback

**Usage:**
```tsx
import { RegisterForm } from '@/features/auth';

<RegisterForm
  onSubmit={async (data) => {
    // Handle registration logic
    await authService.register(data);
  }}
  requireEmailVerification={true}
/>
```

### ForgotPasswordForm
Password recovery form with email-based reset functionality.

**Features:**
- Email validation
- Success state with clear instructions
- Resend functionality
- Cooldown timer for resend requests
- Integration with password reset flow

**Usage:**
```tsx
import { ForgotPasswordForm } from '@/features/auth';

<ForgotPasswordForm
  onSubmit={async (data) => {
    // Handle password reset request
    await authService.requestPasswordReset(data.email);
  }}
/>
```

### ResetPasswordForm
Password reset form with token validation and new password requirements.

**Features:**
- Token validation from URL parameters
- Password strength validation
- Confirmation password matching
- Secure token handling
- Automatic redirection on success

**Usage:**
```tsx
import { ResetPasswordForm } from '@/features/auth';

<ResetPasswordForm
  onSubmit={async (data) => {
    // Handle password reset with token
    await authService.resetPassword(data);
  }}
/>
```

### EmailVerificationForm
Email verification form with 6-digit code validation and resend functionality.

**Features:**
- 6-digit verification code input
- Auto-fill email from URL parameters
- Resend code with cooldown timer
- Countdown display
- Code format validation and helper text

**Usage:**
```tsx
import { EmailVerificationForm } from '@/features/auth';

<EmailVerificationForm
  onSubmit={async (data) => {
    // Handle email verification
    await authService.verifyEmail(data);
  }}
  onResendCode={async (email) => {
    // Handle resend verification code
    await authService.resendVerificationCode(email);
  }}
  autoFillEmail="user@example.com"
/>
```

## Types

All components use comprehensive TypeScript types for type safety:

### Form Data Types
- `LoginFormData` - Login form data structure
- `RegisterFormData` - Registration form data structure
- `ForgotPasswordFormData` - Forgot password form data
- `ResetPasswordFormData` - Reset password form data
- `EmailVerificationFormData` - Email verification form data

### Response Types
- `AuthResponse` - Standard authentication response
- `AuthError` - Authentication error structure
- `FormState` - Form state management interface

## Validation

All forms use Zod schemas for comprehensive validation:

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Email Validation
- Proper email format
- Required field validation

### Additional Validations
- Password confirmation matching
- Terms acceptance requirements
- Verification code format (6 digits only)

## Error Handling

All components provide comprehensive error handling:

### Error Types
- Form-level errors (network, server errors)
- Field-level errors (validation failures)
- Success states with user feedback

### User Feedback
- Loading states during form submission
- Success messages on completion
- Error messages with clear descriptions
- Field-level validation hints

## Social Login Integration

Components support social login providers:
- Google
- Facebook
- GitHub
- Linkedin

### Implementation
```tsx
const handleSocialLogin = async (provider: SocialLoginProvider['provider']) => {
  await authService.socialLogin(provider);
};
```

## Styling

Components use:
- Tailwind CSS for styling
- Consistent design system
- Responsive design
- Accessibility features

## Dependencies

Required dependencies:
- `react-hook-form` - Form state management
- `@hookform/resolvers/zod` - Zod integration
- `zod` - Schema validation
- `react-router-dom` - Navigation (for some components)

## Installation

Ensure you have the required dependencies installed:

```bash
npm install react-hook-form @hookform/resolvers zod react-router-dom
```

## Example Implementation

Here's a complete example of how to use these components:

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, EmailVerificationForm } from '@/features/auth';
import { authService } from '@/services/auth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/login" element={
          <LoginForm 
            onSubmit={authService.login}
            onSocialLogin={authService.socialLogin}
          />
        } />
        <Route path="/auth/register" element={
          <RegisterForm 
            onSubmit={authService.register}
            onSocialLogin={authService.socialLogin}
          />
        } />
        <Route path="/auth/forgot-password" element={
          <ForgotPasswordForm 
            onSubmit={authService.requestPasswordReset}
          />
        } />
        <Route path="/auth/reset-password" element={
          <ResetPasswordForm 
            onSubmit={authService.resetPassword}
          />
        } />
        <Route path="/auth/verify-email" element={
          <EmailVerificationForm 
            onSubmit={authService.verifyEmail}
            onResendCode={authService.resendVerificationCode}
          />
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

## Best Practices

1. **Always handle loading states** to prevent multiple submissions
2. **Provide clear error messages** to help users understand issues
3. **Use proper TypeScript types** for type safety
4. **Implement proper error boundaries** in your application
5. **Test all form validations** including edge cases
6. **Provide user feedback** for all actions and states
7. **Use consistent styling** and design patterns
8. **Implement proper accessibility** features
9. **Handle network errors** gracefully
10. **Use proper form reset** after successful submissions

## Contributing

When adding new authentication components:

1. Follow the existing code patterns and structure
2. Include comprehensive TypeScript types
3. Add proper Zod validation schemas
4. Include loading states and error handling
5. Add proper documentation
6. Test thoroughly with various edge cases
7. Ensure accessibility compliance
