// ============================================================================
// AUTH API USAGE EXAMPLES
// This file demonstrates how to use the authentication API service
// ============================================================================

import { authApi, AuthApiError } from './authApi';
import type { 
  LoginRequest, 
  RegisterRequest, 
  UserSession,
  TwoFactorSetupResult 
} from './types';

/**
 * Example 1: Basic User Login
 */
async function exampleLogin() {
  try {
    console.log('🔐 Logging in...');
    
    const loginData: LoginRequest = {
      email: 'user@example.com',
      password: 'SecurePassword123!',
      rememberMe: true,
    };

    const response = await authApi.login(loginData);
    
    if (response.success) {
      console.log('✅ Login successful!');
      console.log('User:', response.user);
      console.log('Token expires in:', response.expiresIn, 'seconds');
      
      // Store tokens securely
      authApi.storeTokens(response.token, response.refreshToken);
      
      return true;
    } else {
      console.log('❌ Login failed:', response.message);
      return false;
    }
  } catch (error) {
    if (error instanceof AuthApiError) {
      console.error('🚫 Login error:', error.message);
      console.error('Error code:', error.code);
      
      // Handle specific error cases
      switch (error.code) {
        case 'invalid_credentials':
          console.log('Invalid email or password');
          break;
        case 'account_locked':
          console.log('Account is temporarily locked');
          break;
        case 'email_not_verified':
          console.log('Please verify your email before logging in');
          break;
        default:
          console.log('Login failed, please try again');
      }
    }
    return false;
  }
}

/**
 * Example 2: User Registration
 */
async function exampleRegistration() {
  try {
    console.log('📝 Registering new user...');
    
    const registerData: RegisterRequest = {
      email: 'newuser@example.com',
      password: 'NewSecurePass123!',
      confirmPassword: 'NewSecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      agreeToTerms: true,
      agreeToPrivacy: true,
    };

    const response = await authApi.register(registerData);
    
    if (response.success) {
      console.log('✅ Registration successful!');
      console.log('User:', response.user);
      console.log('Please check your email to verify your account');
      
      return true;
    } else {
      console.log('❌ Registration failed:', response.message);
      return false;
    }
  } catch (error) {
    console.error('🚫 Registration error:', error.message);
    return false;
  }
}

/**
 * Example 3: Password Reset Flow
 */
async function examplePasswordReset() {
  try {
    console.log('🔄 Starting password reset flow...');
    
    // Step 1: Request password reset email
    console.log('📧 Requesting password reset email...');
    await authApi.forgotPassword({ email: 'user@example.com' });
    console.log('✅ Password reset email sent');
    
    // Step 2: Reset password with token (would come from email)
    console.log('🔑 Resetting password...');
    const resetToken = 'reset-token-from-email'; // This would be extracted from email link
    
    await authApi.resetPassword({
      password: 'NewSecurePassword456!',
      confirmPassword: 'NewSecurePassword456!',
      token: resetToken,
    });
    
    console.log('✅ Password reset successful! Please login with your new password');
    return true;
  } catch (error) {
    console.error('🚫 Password reset error:', error.message);
    return false;
  }
}

/**
 * Example 4: Email Verification
 */
async function exampleEmailVerification() {
  try {
    console.log('📧 Verifying email...');
    
    const verificationCode = '123456'; // This would come from user's email
    
    await authApi.verifyEmail({
      email: 'user@example.com',
      verificationCode,
    });
    
    console.log('✅ Email verified successfully!');
    return true;
  } catch (error) {
    console.error('🚫 Email verification error:', error.message);
    return false;
  }
}

/**
 * Example 5: Change Password (Authenticated User)
 */
async function exampleChangePassword() {
  try {
    console.log('🔄 Changing password...');
    
    await authApi.changePassword({
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword456!',
      confirmPassword: 'NewPassword456!',
    });
    
    console.log('✅ Password changed successfully!');
    return true;
  } catch (error) {
    console.error('🚫 Password change error:', error.message);
    return false;
  }
}

/**
 * Example 6: Get and Update User Profile
 */
async function exampleProfileManagement() {
  try {
    console.log('👤 Getting current user profile...');
    
    // Get current user
    const user = await authApi.getCurrentUser();
    console.log('Current user:', user);
    
    console.log('🔄 Updating profile...');
    
    // Update profile
    const updatedUser = await authApi.updateProfile({
      firstName: 'John',
      lastName: 'Smith',
      phone: '+9876543210',
      profile: {
        bio: 'Software developer passionate about accessibility',
        location: 'San Francisco, CA',
        occupation: 'Senior Developer',
        organization: 'Tech Corp',
        website: 'https://johnsmith.dev',
        socialMedia: {
          linkedin: 'https://linkedin.com/in/johnsmith',
          github: 'https://github.com/johnsmith',
        },
        languages: ['English', 'Spanish', 'French'],
        interests: ['Web Development', 'Accessibility', 'Open Source'],
      },
    });
    
    console.log('✅ Profile updated successfully!');
    console.log('Updated user:', updatedUser);
    return true;
  } catch (error) {
    console.error('🚫 Profile management error:', error.message);
    return false;
  }
}

/**
 * Example 7: Avatar Upload
 */
async function exampleAvatarUpload() {
  try {
    console.log('📸 Uploading avatar...');
    
    // Get file from file input (example)
    const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      console.log('No file selected');
      return false;
    }
    
    const file = fileInput.files[0];
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('File too large. Maximum size is 5MB');
      return false;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('File must be an image');
      return false;
    }
    
    const result = await authApi.uploadAvatar(file);
    console.log('✅ Avatar uploaded successfully!');
    console.log('Avatar URL:', result.avatarUrl);
    return true;
  } catch (error) {
    console.error('🚫 Avatar upload error:', error.message);
    return false;
  }
}

/**
 * Example 8: Session Management
 */
async function exampleSessionManagement() {
  try {
    console.log('📱 Getting active sessions...');
    
    const sessions = await authApi.getActiveSessions();
    
    console.log('Active sessions:');
    sessions.forEach((session: UserSession) => {
      console.log(`- ${session.id}: ${session.device} (${session.browser}) - ${session.location}`);
      console.log(`  Last active: ${session.lastActive.toISOString()}`);
      console.log(`  Current: ${session.current ? 'Yes' : 'No'}`);
    });
    
    // Revoke a specific session (not current)
    const otherSession = sessions.find(s => !s.current);
    if (otherSession) {
      console.log(`🔄 Revoking session ${otherSession.id}...`);
      await authApi.revokeSession(otherSession.id);
      console.log('✅ Session revoked');
    }
    
    // Or revoke all other sessions
    console.log('🔄 Revoking all other sessions...');
    await authApi.revokeAllSessions();
    console.log('✅ All other sessions revoked');
    
    return true;
  } catch (error) {
    console.error('🚫 Session management error:', error.message);
    return false;
  }
}

/**
 * Example 9: Two-Factor Authentication Setup
 */
async function exampleTwoFactorAuth() {
  try {
    console.log('🔐 Setting up two-factor authentication...');
    
    // Step 1: Enable 2FA (this will generate QR code and backup codes)
    const setupResult: TwoFactorSetupResult = await authApi.toggleTwoFactor(true);
    
    console.log('✅ Two-factor authentication enabled!');
    console.log('📱 Scan this QR code with your authenticator app:');
    console.log(setupResult.qrCode);
    
    console.log('🔢 Backup codes (save these in a secure location):');
    setupResult.backupCodes.forEach((code, index) => {
      console.log(`${index + 1}. ${code}`);
    });
    
    // Step 2: Verify with a code from authenticator app
    const authCode = '123456'; // This would come from user's authenticator app
    const verificationResult = await authApi.verifyTwoFactor(authCode);
    
    if (verificationResult.valid) {
      console.log('✅ Two-factor authentication verified successfully!');
    } else {
      console.log('❌ Invalid verification code');
    }
    
    return true;
  } catch (error) {
    console.error('🚫 Two-factor authentication error:', error.message);
    return false;
  }
}

/**
 * Example 10: Email and Password Validation
 */
async function exampleValidation() {
  try {
    console.log('🔍 Checking email availability...');
    
    // Check if email is available
    const emailCheck = await authApi.checkEmailAvailability('newuser@example.com');
    console.log('Email available:', emailCheck.available);
    
    if (!emailCheck.available && emailCheck.suggestions) {
      console.log('Suggestions:', emailCheck.suggestions);
    }
    
    console.log('🔍 Validating password strength...');
    
    // Validate password
    const passwordValidation = await authApi.validatePassword('weak');
    console.log('Password valid:', passwordValidation.valid);
    console.log('Password errors:', passwordValidation.errors);
    console.log('Password score:', passwordValidation.score, '/4');
    
    if (passwordValidation.feedback.warning) {
      console.log('Warning:', passwordValidation.feedback.warning);
    }
    
    if (passwordValidation.feedback.suggestions) {
      console.log('Suggestions:', passwordValidation.feedback.suggestions);
    }
    
    return true;
  } catch (error) {
    console.error('🚫 Validation error:', error.message);
    return false;
  }
}

/**
 * Example 11: Complete Authentication Flow
 */
async function exampleCompleteAuthFlow() {
  try {
    console.log('🚀 Starting complete authentication flow...');
    
    // Step 1: Check if already authenticated
    if (authApi.isAuthenticated()) {
      console.log('✅ Already authenticated');
      const user = await authApi.getCurrentUser();
      console.log('Current user:', user);
      return true;
    }
    
    // Step 2: Try to refresh token if available
    const { refreshToken } = authApi.getStoredTokens();
    if (refreshToken) {
      console.log('🔄 Attempting to refresh token...');
      try {
        const tokenResponse = await authApi.refreshToken(refreshToken);
        console.log('✅ Token refreshed successfully');
        console.log('New token expires in:', tokenResponse.expiresIn, 'seconds');
        return true;
      } catch (error) {
        console.log('⚠️ Token refresh failed, proceeding with login');
        authApi.clearStoredTokens();
      }
    }
    
    // Step 3: Perform login
    const loginSuccess = await exampleLogin();
    if (!loginSuccess) {
      console.log('❌ Login failed, cannot proceed');
      return false;
    }
    
    // Step 4: Verify email if not verified
    const user = await authApi.getCurrentUser();
    if (!user.emailVerifiedAt) {
      console.log('📧 Email not verified, please verify your email');
      // You might want to redirect to verification page here
      return false;
    }
    
    // Step 5: Check for suspicious activity or security events
    // This would typically be handled by the security system
    
    console.log('✅ Complete authentication flow successful!');
    return true;
    
  } catch (error) {
    console.error('🚫 Authentication flow error:', error.message);
    return false;
  }
}

/**
 * Example 12: Error Handling and Retry Logic
 */
async function exampleErrorHandling() {
  try {
    console.log('🔄 Demonstrating error handling...');
    
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1} of ${maxRetries}`);
        
        // Simulate a potentially failing operation
        const response = await authApi.login({
          email: 'user@example.com',
          password: 'password',
        });
        
        if (response.success) {
          console.log('✅ Operation successful!');
          return true;
        }
        
        throw new Error('Simulated failure');
        
      } catch (error) {
        retryCount++;
        
        if (error instanceof AuthApiError) {
          console.error(`Error (attempt ${retryCount}):`, error.message);
          console.error('Error code:', error.code);
          console.error('Status:', error.status);
          
          // Check if error is retryable
          const isRetryable = [
            'network_error',
            'timeout',
            'rate_limit_exceeded',
            'server_error',
          ].includes(error.code);
          
          if (!isRetryable || retryCount >= maxRetries) {
            console.log('❌ Non-retryable error or max retries reached');
            throw error;
          }
          
          console.log(`⏳ Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 2; // Exponential backoff
          
        } else {
          throw error;
        }
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('🚫 Final error:', error.message);
    return false;
  }
}

/**
 * Example 13: Logout with Cleanup
 */
async function exampleSecureLogout() {
  try {
    console.log('🚪 Starting secure logout...');
    
    // Step 1: Get current refresh token
    const { refreshToken } = authApi.getStoredTokens();
    
    // Step 2: Call logout endpoint
    await authApi.logout(refreshToken);
    
    // Step 3: Clear stored tokens
    authApi.clearStoredTokens();
    
    // Step 4: Clear any cached user data
    // This would typically involve clearing the auth store
    
    console.log('✅ Secure logout completed');
    
    // Step 5: Redirect to login page or home page
    // window.location.href = '/login';
    
    return true;
    
  } catch (error) {
    console.error('🚫 Logout error:', error.message);
    
    // Even if logout fails, clear local data
    authApi.clearStoredTokens();
    console.log('🧹 Local data cleared despite API error');
    
    return true;
  }
}

// ============================================================================
// EXPORT EXAMPLES FOR TESTING
// ============================================================================

export const authApiExamples = {
  login: exampleLogin,
  registration: exampleRegistration,
  passwordReset: examplePasswordReset,
  emailVerification: exampleEmailVerification,
  changePassword: exampleChangePassword,
  profileManagement: exampleProfileManagement,
  avatarUpload: exampleAvatarUpload,
  sessionManagement: exampleSessionManagement,
  twoFactorAuth: exampleTwoFactorAuth,
  validation: exampleValidation,
  completeAuthFlow: exampleCompleteAuthFlow,
  errorHandling: exampleErrorHandling,
  secureLogout: exampleSecureLogout,
};

// ============================================================================
// USAGE IN TESTS OR DEVELOPMENT
// ============================================================================

/*
// Example test usage:
async function runAuthApiExamples() {
  console.log('🧪 Running Authentication API Examples...\n');
  
  try {
    // Run examples in sequence
    await exampleLogin();
    console.log('');
    
    await exampleRegistration();
    console.log('');
    
    await examplePasswordReset();
    console.log('');
    
    // Add more examples as needed
    
    console.log('✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  }
}

// Run examples (uncomment to test)
// runAuthApiExamples();
*/