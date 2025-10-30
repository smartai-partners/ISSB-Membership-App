# Application and Membership API Services

This directory contains the Application and Membership API services for the ISSB web application. These services provide comprehensive functionality for managing membership applications, membership lifecycle, document uploads, reference management, and workflow automation.

## Overview

### Application API (`applications/`)

The Application API service (`applicationApi`) handles the complete membership application workflow including:

- **Application Management**: Create, update, delete, and retrieve membership applications
- **Workflow Management**: Submit, withdraw, approve, reject applications
- **Document Management**: Upload, verify, and manage application documents
- **Reference Management**: Manage and verify applicant references
- **Review Process**: Submit reviews, schedule interviews, request additional documents
- **Analytics**: Application statistics, trends, and reporting

### Membership API (`membership/`)

The Membership API service (`membershipApi`) manages the complete membership lifecycle including:

- **Membership Lifecycle**: Create, update, cancel, suspend, reactivate memberships
- **Tier Management**: Handle different membership tiers (regular, board, admin)
- **Payment Processing**: Manage payment methods, process payments, handle renewals
- **Upgrades/Downgrades**: Handle membership tier changes with prorated billing
- **Analytics**: Revenue reports, churn analysis, membership statistics
- **Bulk Operations**: Bulk updates, renewals, and exports

## Key Features

### ✅ Application Workflow Management
- Complete application lifecycle from draft to approval
- Status tracking and workflow automation
- Review and approval processes
- Interview scheduling
- Document request workflows

### ✅ Document Upload Support
- Multi-file upload support
- File type validation and security
- Document verification workflow
- Progress tracking for uploads
- Error handling for failed uploads

### ✅ Reference Management
- Manage applicant references
- Reference verification process
- Contact references via email
- Track reference status and feedback

### ✅ Membership Management
- Complete membership lifecycle management
- Automatic renewal processing
- Tier-based benefits management
- Payment method management
- Prorated billing for upgrades

### ✅ Comprehensive TypeScript Support
- Full type safety with @issb/types
- Comprehensive interfaces and types
- Validation schemas from validators
- Error handling with proper typing

### ✅ Analytics and Reporting
- Application statistics and trends
- Membership analytics and reporting
- Revenue tracking and analysis
- Churn analysis and insights

## Usage Examples

### Application API

```typescript
import { applicationApi } from '@/api';

// Create a new application
const application = await applicationApi.createApplication({
  applicationType: 'regular',
  personalInfo: {
    location: 'New York, NY',
    occupation: 'Software Developer',
    dateOfBirth: new Date('1990-01-01'),
  },
  professionalInfo: {
    yearsOfExperience: 5,
    certifications: [],
    languages: ['English', 'Spanish'],
    areasOfExpertise: ['Web Development'],
    currentRole: 'Senior Developer',
    reference1: {
      name: 'John Manager',
      email: 'john@company.com',
      phone: '555-0123',
      organization: 'Tech Corp',
      relationship: 'Direct Supervisor',
      yearsKnown: 3,
      verified: false,
    },
    reference2: {
      name: 'Jane Colleague',
      email: 'jane@company.com',
      phone: '555-0124',
      organization: 'Tech Corp',
      relationship: 'Team Member',
      yearsKnown: 2,
      verified: false,
    },
  },
  documents: [],
  agreeToTerms: true,
  agreeToPrivacy: true,
});

// Update application (draft mode)
const updated = await applicationApi.updateApplication(applicationId, {
  additionalInfo: 'Additional context about my application',
});

// Submit for review
await applicationApi.submitApplication(applicationId, userId);

// Upload documents
await applicationApi.uploadDocument({
  file: documentFile,
  applicationId,
  documentType: 'certificate',
  description: 'University degree certificate',
});

// Submit review
await applicationApi.submitReview({
  applicationId,
  reviewerId: reviewerId,
  decision: 'approved',
  comments: 'Excellent application with all requirements met',
  documentsReviewed: true,
  credentialsVerified: true,
  referencesContacted: true,
});

// Get applications with filtering
const applications = await applicationApi.listApplications({
  filters: {
    status: ['submitted', 'under_review'],
    applicationType: ['regular'],
  },
  page: 1,
  limit: 20,
});

// Get application statistics
const stats = await applicationApi.getApplicationStatistics({
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
});
```

### Membership API

```typescript
import { membershipApi } from '@/api';

// Create membership
const membership = await membershipApi.createMembership({
  userId: 'user-id',
  tier: 'regular',
  startDate: new Date(),
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  renewalType: 'annual',
  autoRenew: true,
  amount: 99.99,
  currency: 'USD',
  benefits: ['Member access', 'Newsletter', 'Events'],
});

// Update membership
const updated = await membershipApi.updateMembership(membershipId, {
  status: 'active',
  benefits: ['Member access', 'Newsletter', 'Events', 'Priority support'],
});

// Renew membership
await membershipApi.renewMembership({
  membershipId,
  userId,
  paymentMethodId: 'pm_123456789',
  renewalType: 'annual',
  amount: 99.99,
  currency: 'USD',
});

// Upgrade membership
await membershipApi.upgradeMembership({
  membershipId,
  userId,
  newTier: 'board',
  upgradeReason: 'Promotion to board member',
  effectiveDate: new Date(),
  proRatedAmount: 50.00,
  paymentMethodId: 'pm_123456789',
});

// Cancel membership
await membershipApi.cancelMembership({
  membershipId,
  userId,
  reason: 'Personal reasons',
  immediateEffect: false,
});

// Get memberships with filtering
const memberships = await membershipApi.listMemberships({
  filters: {
    status: ['active', 'expired'],
    tier: ['regular', 'board'],
    expiringWithin: 30, // days
  },
  page: 1,
  limit: 50,
});

// Get membership statistics
const stats = await membershipApi.getMembershipStatistics({
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
});

// Get available tiers
const tiers = await membershipApi.getMembershipTiers();

// Calculate pricing
const pricing = await membershipApi.calculatePricing(
  'board',
  'annual',
  new Date(),
  'regular' // upgrade from regular
);

// Add payment method
await membershipApi.addPaymentMethod(userId, {
  type: 'card',
  cardNumber: '4242424242424242',
  expiryMonth: 12,
  expiryYear: 2025,
  cvv: '123',
  cardholderName: 'John Doe',
  billingAddress: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US',
  },
  isDefault: true,
});

// Process payment
await membershipApi.processPayment({
  membershipId,
  amount: 99.99,
  currency: 'USD',
  paymentMethodId: 'pm_123456789',
  description: 'Annual membership renewal',
});

// Bulk operations
await membershipApi.bulkRenew(
  ['membership-id-1', 'membership-id-2'],
  'pm_123456789',
  'admin-user-id'
);

// Export memberships
const exportResult = await membershipApi.exportMemberships({
  filters: {
    status: ['active'],
  },
  format: 'csv',
});
```

### Unified API Usage

```typescript
import { applicationApi, membershipApi, apis } from '@/api';

// Using individual services
const applications = await applicationApi.listApplications();
const memberships = await membershipApi.listMemberships();

// Using unified API access
const { applications: appService, memberships: membershipService } = apis;
const apps = await appService.listApplications();
const memberShips = await membershipService.listMemberships();
```

## File Structure

```
/api/
├── applications/
│   ├── applicationApi.ts      # Main application API service
│   └── index.ts              # Application API exports
├── membership/
│   ├── membershipApi.ts      # Main membership API service
│   └── index.ts              # Membership API exports
└── index.ts                  # Main API exports and documentation
```

## Types and Validation

Both API services use the comprehensive type system from `@issb/types`:

- **Core Types**: `MembershipApplication`, `Membership`, `Document`, `Reference`
- **API Request Types**: Specific request interfaces for each operation
- **API Response Types**: Properly typed API responses
- **Validation**: Using Zod schemas from ApplicationValidators

### Key Type Exports

```typescript
// Application API Types
export type {
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApplicationReviewRequest,
  ApplicationWorkflowAction,
  DocumentUploadRequest,
  ReferenceVerificationRequest,
  ApplicationStatistics,
  ApplicationQueryOptions,
} from './applications';

// Membership API Types
export type {
  CreateMembershipRequest,
  UpdateMembershipRequest,
  MembershipRenewalRequest,
  MembershipUpgradeRequest,
  MembershipCancellationRequest,
  PaymentMethodRequest,
  PaymentRequest,
  MembershipFilter,
  MembershipStatistics,
  MembershipQueryOptions,
  MembershipBenefits,
  TierConfiguration,
} from './membership';
```

## Error Handling

Both services implement comprehensive error handling:

```typescript
try {
  const result = await applicationApi.createApplication(applicationData);
} catch (error) {
  if (error instanceof Error) {
    console.error('Application creation failed:', error.message);
    // Handle specific error types
    if (error.message.includes('validation')) {
      // Handle validation errors
    } else if (error.message.includes('unauthorized')) {
      // Handle auth errors
    }
  }
}
```

## Best Practices

### Application API
1. **Check Application Status**: Use utility methods like `canUpdateApplication()` before updates
2. **Validate Completeness**: Use `calculateApplicationCompleteness()` to show progress
3. **Document Upload**: Always validate file types and sizes before upload
4. **Reference Verification**: Contact references before final approval

### Membership API
1. **Check Membership Status**: Use `isMembershipActive()` before operations
2. **Handle Expirations**: Check `isMembershipExpiringSoon()` for proactive renewal
3. **Payment Security**: Always use secure payment methods and validate amounts
4. **Tier Changes**: Calculate prorated amounts for upgrades/downgrades

## Integration with React Components

```typescript
// Example React hook for applications
import { useState, useEffect } from 'react';
import { applicationApi, ApplicationQueryOptions } from '@/api';

export const useApplications = (options?: ApplicationQueryOptions) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await applicationApi.listApplications(options);
        setApplications(response.data?.data || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [JSON.stringify(options)]);

  return { applications, loading, error };
};

// Example React hook for membership
import { useState, useEffect } from 'react';
import { membershipApi, MembershipFilter } from '@/api';

export const useMembership = (userId: string) => {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        setLoading(true);
        const response = await membershipApi.getMembershipByUserId(userId);
        setMembership(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchMembership();
    }
  }, [userId]);

  return { membership, loading, error };
};
```

## Performance Considerations

1. **Pagination**: Always use pagination for list operations
2. **Filtering**: Use server-side filtering to reduce data transfer
3. **Caching**: Implement proper caching for frequently accessed data
4. **File Uploads**: Use appropriate file size limits and compression
5. **Bulk Operations**: Use bulk endpoints for multiple operations

## Security Features

1. **Authentication**: All endpoints require valid authentication tokens
2. **Authorization**: Role-based access control for different operations
3. **Input Validation**: Server-side validation for all inputs
4. **File Security**: File type validation and virus scanning
5. **Payment Security**: PCI-compliant payment processing
6. **Audit Logging**: All sensitive operations are logged

## Testing

Both services support comprehensive testing:

```typescript
// Application API testing
import { applicationApi } from '@/api';

// Mock API responses
jest.spyOn(applicationApi, 'createApplication').mockResolvedValue({
  success: true,
  data: mockApplication,
});

// Test error handling
jest.spyOn(applicationApi, 'uploadDocument').mockRejectedValue(
  new Error('File size exceeds limit')
);
```

## Contributing

When adding new features to these API services:

1. **Add Types**: Define proper TypeScript interfaces
2. **Add Validation**: Include Zod schemas for new data
3. **Add Documentation**: Update README with examples
4. **Add Tests**: Include unit and integration tests
5. **Update Exports**: Add new exports to index files

## Support

For issues or questions about the Application and Membership APIs:

1. Check the existing type definitions in `@issb/types`
2. Review the validator schemas for data requirements
3. Examine the error handling patterns in existing code
4. Refer to the main API documentation in `/api/index.ts`

---

**Last Updated**: 2025-10-29
**Version**: 1.0.0
**Dependencies**: @issb/types, axios, zod
