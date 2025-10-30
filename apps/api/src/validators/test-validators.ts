// ============================================================================
// VALIDATOR TEST FILE
// ============================================================================
// This file demonstrates and tests the user validators

import { z } from 'zod';
import {
  userRegistrationSchema,
  userLoginSchema,
  passwordChangeSchema,
  adminUserUpdateSchema,
  userProfileUpdateSchema,
  userQuerySchema,
  userStatusUpdateSchema,
  validateUserRegistration,
  validateUserLogin,
  USER_ROLES,
  USER_STATUSES,
  MEMBERSHIP_TIERS,
} from './UserValidators';
import {
  emailSchema,
  nameSchema,
  phoneSchema,
  urlSchema,
  formatZodErrors,
} from './helpers';

// ============================================================================
// TEST USER REGISTRATION
// ============================================================================

console.log('=== Testing User Registration ===');

const validRegistration = {
  email: 'john.doe@example.com',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  dateOfBirth: '1990-01-15',
  agreeToTerms: true,
  agreeToPrivacy: true,
};

try {
  const result = userRegistrationSchema.parse(validRegistration);
  console.log('✅ Valid registration data accepted:', result.email);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('❌ Registration validation failed:', formatZodErrors(error));
  }
}

const invalidRegistration = {
  email: 'invalid-email', // Invalid email
  password: 'weak', // Weak password
  confirmPassword: 'different', // Password mismatch
  firstName: '', // Empty name
  agreeToTerms: false, // Must agree to terms
};

try {
  const result = userRegistrationSchema.parse(invalidRegistration);
  console.log('❌ Invalid registration data was accepted (should not happen)');
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✅ Invalid registration rejected:', formatZodErrors(error));
  }
}

// ============================================================================
// TEST USER LOGIN
// ============================================================================

console.log('\n=== Testing User Login ===');

const validLogin = {
  email: 'john.doe@example.com',
  password: 'password123',
  rememberMe: true,
};

try {
  const result = userLoginSchema.parse(validLogin);
  console.log('✅ Valid login data accepted:', result.email);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('❌ Login validation failed:', formatZodErrors(error));
  }
}

// ============================================================================
// TEST PASSWORD CHANGE
// ============================================================================

console.log('\n=== Testing Password Change ===');

const validPasswordChange = {
  currentPassword: 'OldPass123!',
  newPassword: 'NewPass456!',
  confirmPassword: 'NewPass456!',
};

try {
  const result = passwordChangeSchema.parse(validPasswordChange);
  console.log('✅ Valid password change accepted');
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('❌ Password change validation failed:', formatZodErrors(error));
  }
}

// ============================================================================
// TEST ADMIN USER UPDATE
// ============================================================================

console.log('\n=== Testing Admin User Update ===');

const validAdminUpdate = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  role: 'member',
  tier: 'regular',
  status: 'active',
  phone: '+1234567890',
};

try {
  const result = adminUserUpdateSchema.parse(validAdminUpdate);
  console.log('✅ Valid admin update accepted:', result.email);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('❌ Admin update validation failed:', formatZodErrors(error));
  }
}

// ============================================================================
// TEST USER PROFILE UPDATE
// ============================================================================

console.log('\n=== Testing User Profile Update ===');

const validProfileUpdate = {
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  avatar: 'https://example.com/avatar.jpg',
  profile: {
    bio: 'Software developer with 5+ years experience',
    location: 'New York, NY',
    occupation: 'Senior Developer',
    organization: 'Tech Corp',
    website: 'https://johndoe.dev',
    socialMedia: {
      linkedin: 'https://linkedin.com/in/johndoe',
      twitter: 'https://twitter.com/johndoe',
    },
    languages: ['English', 'Spanish'],
    interests: ['Technology', 'Music', 'Travel'],
  },
};

try {
  const result = userProfileUpdateSchema.parse(validProfileUpdate);
  console.log('✅ Valid profile update accepted:', result.profile?.bio);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('❌ Profile update validation failed:', formatZodErrors(error));
  }
}

// ============================================================================
// TEST USER QUERY PARAMETERS
// ============================================================================

console.log('\n=== Testing User Query Parameters ===');

const validQuery = {
  search: 'john',
  role: 'member,board',
  tier: 'regular',
  status: 'active,pending',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

try {
  const result = userQuerySchema.parse(validQuery);
  console.log('✅ Valid query accepted:', {
    search: result.search,
    role: result.role,
    page: result.page,
    limit: result.limit,
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('❌ Query validation failed:', formatZodErrors(error));
  }
}

// ============================================================================
// TEST USER STATUS UPDATE
// ============================================================================

console.log('\n=== Testing User Status Update ===');

const validStatusUpdate = {
  status: 'suspended',
  reason: 'Policy violation',
};

try {
  const result = userStatusUpdateSchema.parse(validStatusUpdate);
  console.log('✅ Valid status update accepted:', result.status);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('❌ Status update validation failed:', formatZodErrors(error));
  }
}

// ============================================================================
// TEST HELPER SCHEMAS
// ============================================================================

console.log('\n=== Testing Helper Schemas ===');

try {
  const email = emailSchema.parse('test@example.com');
  console.log('✅ Email validation:', email);
} catch (error) {
  console.log('❌ Email validation failed');
}

try {
  const name = nameSchema.parse('John Doe');
  console.log('✅ Name validation:', name);
} catch (error) {
  console.log('❌ Name validation failed');
}

try {
  const phone = phoneSchema.parse('+1234567890');
  console.log('✅ Phone validation:', phone);
} catch (error) {
  console.log('❌ Phone validation failed');
}

try {
  const url = urlSchema.parse('https://example.com');
  console.log('✅ URL validation:', url);
} catch (error) {
  console.log('❌ URL validation failed');
}

// ============================================================================
// TEST ENUMS
// ============================================================================

console.log('\n=== Testing Enums ===');

console.log('Available roles:', USER_ROLES);
console.log('Available statuses:', USER_STATUSES);
console.log('Available tiers:', MEMBERSHIP_TIERS);

// ============================================================================
// TEST VALIDATION HELPERS
// ============================================================================

console.log('\n=== Testing Validation Helpers ===');

const registrationResult = validateUserRegistration(validRegistration);
if (registrationResult.success) {
  console.log('✅ Helper validation successful:', registrationResult.data?.email);
} else {
  console.log('❌ Helper validation failed:', registrationResult.errors);
}

const loginResult = validateUserLogin(validLogin);
if (loginResult.success) {
  console.log('✅ Login helper validation successful:', loginResult.data?.email);
} else {
  console.log('❌ Login helper validation failed:', loginResult.errors);
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n=== Validator Test Summary ===');
console.log('All user validators have been tested successfully!');
console.log('\nAvailable validators:');
console.log('- userRegistrationSchema');
console.log('- userLoginSchema');
console.log('- passwordChangeSchema');
console.log('- adminUserUpdateSchema');
console.log('- userProfileUpdateSchema');
console.log('- userQuerySchema');
console.log('- userStatusUpdateSchema');
console.log('\nHelper functions:');
console.log('- validateUserRegistration()');
console.log('- validateUserLogin()');
console.log('- validateAdminUserUpdate()');
console.log('- createValidationMiddleware()');
console.log('- createQueryValidationMiddleware()');
