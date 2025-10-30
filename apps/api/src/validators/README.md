# API Validators

Comprehensive Zod validators for the ISSB Membership Application API.

## Overview

This module provides robust validation schemas for all API operations, ensuring data integrity, security, and business rule compliance. It includes validators for user management, authentication, membership operations, and more.

## Features

### User Management
- ✅ User registration and authentication
- ✅ Profile management and updates
- ✅ Password change and reset
- ✅ Admin user management
- ✅ User status management
- ✅ User filtering and search
- ✅ Bulk operations

### Membership Management
- ✅ Create membership validation
- ✅ Update membership validation
- ✅ Membership renewal validation
- ✅ Tier upgrade validation
- ✅ Membership filtering and search
- ✅ Bulk operations validation
- ✅ Analytics and reporting validation
- ✅ Payment processing validation
- ✅ Business rule validation helpers

### Common Features
- ✅ TypeScript support with full type inference
- ✅ Common validation helpers and patterns
- ✅ Express middleware generators
- ✅ Error formatting utilities
- ✅ Reusable schemas
- ✅ Best practices implementation

## Core Validators

### User Validators

Comprehensive validation for all user-related operations.

#### 1. User Registration

Validates new user registration with strong password requirements:

```typescript
import { userRegistrationSchema } from './validators';

const registrationData = {
  email: 'user@example.com',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  dateOfBirth: '1990-01-01',
  agreeToTerms: true,
  agreeToPrivacy: true
};

const validated = userRegistrationSchema.parse(registrationData);
```

**Validates:**
- Valid email format
- Strong password (8+ chars, uppercase, lowercase, number, special character)
- Password confirmation match
- Name fields (letters, spaces, hyphens, apostrophes only)
- Phone number format
- Date format
- Terms and privacy agreement
- Date of birth is a valid date

#### 2. User Login

Validates user authentication:

```typescript
import { userLoginSchema } from './validators';

const loginData = {
  email: 'user@example.com',
  password: 'password123',
  rememberMe: true
};

const validated = userLoginSchema.parse(loginData);
```

#### 3. Password Management

**Change Password:**
```typescript
import { passwordChangeSchema } from './validators';

const changeData = {
  currentPassword: 'OldPass123!',
  newPassword: 'NewPass456!',
  confirmPassword: 'NewPass456!'
};

const validated = passwordChangeSchema.parse(changeData);
```

**Reset Password:**
```typescript
import { passwordResetSchema } from './validators';

const resetData = {
  token: 'reset-token-here',
  password: 'NewPass456!',
  confirmPassword: 'NewPass456!'
};

const validated = passwordResetSchema.parse(resetData);
```

#### 4. Profile Management

**User Profile Update:**
```typescript
import { userProfileUpdateSchema } from './validators';

const profileData = {
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
      twitter: 'https://twitter.com/johndoe'
    },
    languages: ['English', 'Spanish'],
    interests: ['Technology', 'Music', 'Travel']
  }
};

const validated = userProfileUpdateSchema.parse(profileData);
```

#### 5. Admin User Management

**Admin User Update:**
```typescript
import { adminUserUpdateSchema } from './validators';

const adminUpdateData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@newdomain.com',
  role: UserRole.MEMBER,
  tier: MembershipTier.REGULAR,
  status: UserStatus.ACTIVE,
  phone: '+1234567890'
};

const validated = adminUserUpdateSchema.parse(adminUpdateData);
```

**User Status Management:**
```typescript
import { 
  userStatusUpdateSchema,
  bulkUserStatusUpdateSchema 
} from './validators';

// Single user status update
const statusData = {
  status: UserStatus.SUSPENDED,
  reason: 'Policy violation'
};

const validated = userStatusUpdateSchema.parse(statusData);

// Bulk status update
const bulkData = {
  userIds: ['user-id-1', 'user-id-2', 'user-id-3'],
  status: UserStatus.ACTIVE,
  reason: 'Bulk activation campaign'
};

const validated = bulkUserStatusUpdateSchema.parse(bulkData);
```

#### 6. User Query and Filtering

**User Query Parameters:**
```typescript
import { userQuerySchema } from './validators';

const queryData = {
  search: 'john',
  role: ['member', 'board'],
  tier: ['regular'],
  status: ['active', 'pending'],
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const validated = userQuerySchema.parse(queryData);
```

**User Search:**
```typescript
import { userSearchSchema } from './validators';

const searchData = {
  query: 'john doe developer',
  fields: ['email', 'firstName', 'lastName', 'profile.occupation'],
  exactMatch: false
};

const validated = userSearchSchema.parse(searchData);
```

**User Export:**
```typescript
import { userExportSchema } from './validators';

const exportData = {
  format: 'csv',
  filters: {
    status: ['active'],
    tier: ['regular']
  },
  fields: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'createdAt']
};

const validated = userExportSchema.parse(exportData);
```

### Helper Functions

**Validation Helpers:**
```typescript
import { 
  validateUserRegistration,
  validateUserLogin,
  validateAdminUserUpdate,
  validateUserQuery 
} from './validators';

// Using helper functions (returns success/error structure)
const result = validateUserRegistration(request.body);
if (!result.success) {
  return res.status(400).json({ errors: result.errors });
}

const data = result.data; // Type-safe validated data
```

**Express Middleware:**
```typescript
import { 
  createValidationMiddleware,
  createQueryValidationMiddleware 
} from './validators';

// Body validation middleware
router.post('/register', 
  createValidationMiddleware(userRegistrationSchema),
  handler
);

// Query validation middleware
router.get('/users',
  createQueryValidationMiddleware(userQuerySchema),
  handler
);
```

### Common Validation Schemas

Reusable validation patterns:

```typescript
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  phoneSchema,
  urlSchema,
  dateSchema,
  paginationSchema,
  objectIdSchema,
  socialMediaUrlSchema,
  bioSchema,
  locationSchema,
  organizationSchema,
  occupationSchema,
  websiteSchema,
  stringArraySchema,
  languagesSchema,
  interestsSchema,
  certificationSchema,
  experienceSchema,
  referenceSchema
} from './validators/helpers';
```

### Error Formatting

```typescript
import { 
  formatZodErrors,
  formatValidationErrors,
  createValidationErrorResponse 
} from './validators/helpers';

// Format Zod errors
const errors = formatZodErrors(zodError);
// Returns: [{ field: 'email', message: 'Invalid email', code: 'invalid_string' }]

// Format for API response
const formatted = formatValidationErrors(errors);
// Returns: { email: 'Invalid email' }

// Create error response
const response = createValidationErrorResponse(errors);
// Returns: { success: false, message: 'Validation failed', errors: [...] }
```

### Enums for Frontend

```typescript
import { 
  USER_ROLES,
  USER_STATUSES, 
  MEMBERSHIP_TIERS 
} from './validators';

console.log(USER_ROLES);
// ['member', 'board', 'admin']

console.log(USER_STATUSES);
// ['active', 'inactive', 'suspended', 'pending', 'banned']

console.log(MEMBERSHIP_TIERS);
// ['regular', 'board', 'admin']
```

---

## Membership Validators

Comprehensive validation for membership-related operations.

### 1. Create Membership

Validates new membership creation with required fields and business rules.

```typescript
import { createMembershipSchema } from './validators';

const membershipData = {
  userId: 'uuid-here',
  tier: MembershipTier.REGULAR,
  renewalType: RenewalType.ANNUAL,
  autoRenew: false,
  amount: 99.99,
  currency: 'USD',
  benefits: ['access_to_events', 'newsletter']
};

const validated = createMembershipSchema.parse(membershipData);
```

**Validates:**
- Valid user ID (UUID format)
- Membership tier (regular, board, admin)
- Renewal type (monthly, quarterly, annual, lifetime)
- Payment information
- Date ranges
- Amount validation (positive numbers, max limits)

### 2. Update Membership

Partial validation for updating existing memberships.

```typescript
import { updateMembershipSchema } from './validators';

const updateData = {
  status: MembershipStatus.ACTIVE,
  autoRenew: true,
  amount: 149.99
};

const validated = updateMembershipSchema.partial().parse(updateData);
```

### 3. Renew Membership

Validates membership renewal operations.

```typescript
import { renewMembershipSchema } from './validators';

const renewalData = {
  membershipId: 'uuid-here',
  renewalType: RenewalType.ANNUAL,
  autoRenew: true,
  paymentMethod: {
    type: 'card',
    id: 'payment-method-id'
  }
};

const validated = renewMembershipSchema.parse(renewalData);
```

### 4. Upgrade Membership

Validates tier upgrades with proration support.

```typescript
import { upgradeMembershipSchema } from './validators';

const upgradeData = {
  membershipId: 'uuid-here',
  newTier: MembershipTier.BOARD,
  paymentMethod: {
    type: 'card',
    id: 'payment-method-id'
  },
  proration: true
};

const validated = upgradeMembershipSchema.parse(upgradeData);
```

### 5. Cancel Membership

Validates membership cancellation with reason codes.

```typescript
import { cancelMembershipSchema } from './validators';

const cancelData = {
  membershipId: 'uuid-here',
  reason: 'user_request',
  cancellationType: 'end_of_period',
  refundAmount: 50.00
};

const validated = cancelMembershipSchema.parse(cancelData);
```

## Filtering and Search

### Membership Filter

Comprehensive filtering for listing memberships:

```typescript
import { membershipFilterSchema } from './validators';

const filterData = {
  tier: [MembershipTier.REGULAR],
  status: [MembershipStatus.ACTIVE],
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  },
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const validated = membershipFilterSchema.parse(filterData);
```

### Advanced Search

Text-based search with filter combinations:

```typescript
import { membershipSearchSchema } from './validators';

const searchData = {
  query: 'john doe',
  filters: {
    tier: [MembershipTier.REGULAR],
    status: [MembershipStatus.ACTIVE]
  },
  page: 1,
  limit: 10
};

const validated = membershipSearchSchema.parse(searchData);
```

## Bulk Operations

### Bulk Update Memberships

```typescript
import { bulkUpdateMembershipsSchema } from './validators';

const bulkUpdateData = {
  membershipIds: ['uuid-1', 'uuid-2', 'uuid-3'],
  updates: {
    status: MembershipStatus.ACTIVE,
    autoRenew: true
  },
  reason: 'System-wide renewal campaign'
};

const validated = bulkUpdateMembershipsSchema.parse(bulkUpdateData);
```

### Bulk Renew Memberships

```typescript
import { bulkRenewMembershipsSchema } from './validators';

const bulkRenewData = {
  membershipIds: ['uuid-1', 'uuid-2'],
  renewalType: RenewalType.ANNUAL,
  autoRenew: true,
  applyDiscount: true,
  discountCode: 'WELCOME2024'
};

const validated = bulkRenewMembershipsSchema.parse(bulkRenewData);
```

## Analytics and Reports

### Membership Analytics

```typescript
import { membershipAnalyticsSchema } from './validators';

const analyticsData = {
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  },
  groupBy: 'tier',
  metrics: ['totalMembers', 'newMembers', 'revenue']
};

const validated = membershipAnalyticsSchema.parse(analyticsData);
```

### Membership Reports

```typescript
import { membershipReportSchema } from './validators';

const reportData = {
  type: 'membership_summary',
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31')
  },
  filters: {
    tier: [MembershipTier.REGULAR]
  },
  format: 'pdf',
  includeCharts: true
};

const validated = membershipReportSchema.parse(reportData);
```

## Payment Processing

### Process Payment

```typescript
import { processPaymentSchema } from './validators';

const paymentData = {
  membershipId: 'uuid-here',
  amount: 99.99,
  currency: 'USD',
  paymentMethod: {
    type: 'card',
    id: 'payment-method-id'
  },
  description: 'Annual membership renewal'
};

const validated = processPaymentSchema.parse(paymentData);
```

### Refund Processing

```typescript
import { refundSchema } from './validators';

const refundData = {
  membershipId: 'uuid-here',
  amount: 50.00,
  reason: 'user_request',
  notes: 'Customer requested cancellation within refund period'
};

const validated = refundSchema.parse(refundData);
```

## Business Rule Validation

### Check if Membership is Renewable

```typescript
import { canRenewMembership } from './validators';

const membership = {
  status: MembershipStatus.ACTIVE,
  endDate: new Date('2024-12-31'),
  autoRenew: false
};

const canRenew = canRenewMembership(membership);
```

### Calculate Proration for Upgrades

```typescript
import { calculateProration } from './validators';

const prorationAmount = calculateProration(
  MembershipTier.REGULAR,
  MembershipTier.BOARD,
  99.99,
  199.99,
  180, // days remaining
  365  // total days in period
);
```

### Validate Membership Dates

```typescript
import { validateMembershipDates } from './validators';

const startDate = new Date('2024-01-01');
const endDate = new Date('2024-12-31');

const isValid = validateMembershipDates(startDate, endDate);
```

## Error Handling

All validators throw `ZodError` instances on validation failure. You can catch these errors and handle them appropriately:

```typescript
import { createMembershipSchema } from './validators';

try {
  const validatedData = createMembershipSchema.parse(request.body);
  // Proceed with validated data
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation errors
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return res.status(400).json({ errors: formattedErrors });
  }
  // Handle other errors
  return res.status(500).json({ error: 'Internal server error' });
}
```

## Integration with Controllers

Here's an example of integrating validators with a membership controller:

```typescript
import { Request, Response } from 'express';
import { 
  createMembershipSchema,
  membershipFilterSchema,
  canRenewMembership
} from '../validators/MembershipValidators';

export class MembershipController {
  async createMembership(req: Request, res: Response) {
    try {
      // Validate request data
      const validatedData = createMembershipSchema.parse(req.body);
      
      // Business logic
      const membership = await membershipService.create(validatedData);
      
      return res.status(201).json({
        success: true,
        data: membership
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors
        });
      }
      
      // Handle other errors
      return res.status(500).json({
        success: false,
        message: 'Failed to create membership'
      });
    }
  }

  async listMemberships(req: Request, res: Response) {
    try {
      // Validate query parameters
      const validatedFilters = membershipFilterSchema.parse(req.query);
      
      const result = await membershipService.findAll(validatedFilters);
      
      return res.json({
        success: true,
        data: result.data,
        meta: result.meta
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch memberships'
      });
    }
  }

  async renewMembership(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Find existing membership
      const membership = await membershipService.findById(id);
      
      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'Membership not found'
        });
      }
      
      // Check if renewable
      if (!canRenewMembership(membership)) {
        return res.status(400).json({
          success: false,
          message: 'Membership cannot be renewed'
        });
      }
      
      // Validate renewal data
      const renewalData = renewMembershipSchema.parse({
        ...req.body,
        membershipId: id
      });
      
      const renewedMembership = await membershipService.renew(renewalData);
      
      return res.json({
        success: true,
        data: renewedMembership
      });
    } catch (error) {
      // Handle errors
      return res.status(500).json({
        success: false,
        message: 'Failed to renew membership'
      });
    }
  }
}
```

## Benefits

1. **Type Safety**: Full TypeScript support with runtime validation
2. **Business Rules**: Built-in validation for membership business logic
3. **Flexibility**: Partial validation support for updates
4. **Performance**: Optimized validation patterns
5. **Error Handling**: Comprehensive error reporting
6. **Extensibility**: Easy to extend with custom validators
7. **Documentation**: Self-documenting schemas with clear error messages

## Validation Features

- **Date Validation**: Future/past date checking, date range validation
- **Amount Validation**: Positive numbers with precision handling
- **UUID Validation**: Proper UUID format checking
- **Enum Validation**: Membership tiers, status, renewal types
- **Business Rules**: Membership date validation, renewal eligibility
- **Proration Calculation**: Automatic prorated pricing for upgrades
- **Search Validation**: Safe text search with length limits
- **Bulk Operations**: Mass update validation with limits

## Error Messages

All validators provide clear, user-friendly error messages:

```typescript
// Example error format
{
  errors: [
    {
      field: 'tier',
      message: 'Invalid membership tier'
    },
    {
      field: 'amount',
      message: 'Amount must be positive'
    },
    {
      field: 'userId',
      message: 'Invalid user ID'
    }
  ]
}
```

## Best Practices

1. **Always validate input** before processing
2. **Use partial validation** for PATCH operations
3. **Handle ZodError** appropriately in controllers
4. **Use business rule helpers** for complex validation logic
5. **Validate dates** to ensure logical consistency
6. **Sanitize user input** with length limits
7. **Check renewal eligibility** before processing renewals

## Dependencies

- `zod`: Core validation library
- `@types/node`: TypeScript node types
- `typescript`: TypeScript compiler