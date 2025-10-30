# Membership API Service

The Membership API service (`membershipApi`) provides comprehensive functionality for managing membership lifecycle, payments, tiers, and analytics in the ISSB web application.

## Overview

The Membership API handles everything related to member management including:

- **Membership Lifecycle Management**: Create, update, cancel, suspend, reactivate memberships
- **Tier and Benefits Management**: Handle different membership tiers and their benefits
- **Payment Processing**: Manage payment methods, process payments, handle renewals
- **Upgrade/Downgrade Operations**: Handle membership tier changes with prorated billing
- **Analytics and Reporting**: Revenue reports, churn analysis, membership statistics
- **Bulk Operations**: Bulk updates, renewals, and data exports

## Core Features

### ✅ Membership Management
- Complete CRUD operations for memberships
- Status management (active, expired, suspended, cancelled)
- Membership lifecycle automation
- Automatic renewal processing

### ✅ Tier Configuration
- Support for multiple membership tiers (regular, board, admin)
- Configurable benefits and pricing
- Requirements and restrictions management
- Dynamic tier availability

### ✅ Payment System Integration
- Multiple payment method support (card, bank, PayPal)
- Secure payment processing
- Automatic billing and renewal
- Payment history tracking
- Failed payment handling

### ✅ Upgrade/Downgrade Operations
- Seamless tier transitions
- Prorated billing calculations
- Proactive upgrade recommendations
- Grace period management

### ✅ Analytics and Business Intelligence
- Comprehensive membership statistics
- Revenue tracking and reporting
- Churn analysis and retention metrics
- Trend analysis and forecasting

### ✅ Bulk Operations
- Bulk membership updates
- Mass renewal processing
- Data export capabilities
- Batch payment processing

## API Reference

### Core Operations

#### Create Membership
```typescript
const membership = await membershipApi.createMembership({
  userId: 'user-id',
  tier: 'regular',
  startDate: new Date(),
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  renewalType: 'annual',
  autoRenew: true,
  amount: 99.99,
  currency: 'USD',
  benefits: ['Member access', 'Newsletter'],
});
```

#### Update Membership
```typescript
const updated = await membershipApi.updateMembership(membershipId, {
  status: 'active',
  benefits: ['Enhanced benefits'],
  autoRenew: false,
});
```

#### Get Membership
```typescript
const membership = await membershipApi.getMembership(membershipId, {
  include: ['user', 'payments', 'tier'],
});
```

#### Get Membership by User
```typescript
const membership = await membershipApi.getMembershipByUserId(userId);
```

### Membership Lifecycle

#### Cancel Membership
```typescript
await membershipApi.cancelMembership({
  membershipId,
  userId,
  reason: 'Personal reasons',
  immediateEffect: false,
  refundAmount: 50.00,
});
```

#### Suspend Membership
```typescript
await membershipApi.suspendMembership(
  membershipId,
  'Payment failure',
  adminUserId
);
```

#### Reactivate Membership
```typescript
await membershipApi.reactivateMembership(
  membershipId,
  adminUserId
);
```

### Renewal Operations

#### Manual Renewal
```typescript
await membershipApi.renewMembership({
  membershipId,
  userId,
  paymentMethodId: 'pm_123',
  renewalType: 'annual',
  benefits: ['Updated benefits list'],
});
```

#### Enable/Disable Auto-Renewal
```typescript
await membershipApi.autoRenewMembership(membershipId, true);
```

#### Process Scheduled Renewals
```typescript
const result = await membershipApi.processScheduledRenewals();
// Returns: { processed: 50, successful: 48, failed: 2 }
```

#### Get Upcoming Renewals
```typescript
const upcoming = await membershipApi.getUpcomingRenewals(30); // Next 30 days
```

#### Send Renewal Reminders
```typescript
const result = await membershipApi.sendRenewalReminders(30); // 30 days before
// Returns: { sent: 25 }
```

### Tier Management

#### Get Available Tiers
```typescript
const tiers = await membershipApi.getMembershipTiers();
/*
Returns:
[
  {
    tier: 'regular',
    name: 'Regular Member',
    description: 'Basic membership',
    price: 99.99,
    currency: 'USD',
    renewalTypes: ['monthly', 'annual'],
    benefits: ['Member access'],
    features: ['Events'],
    requirements: ['Application'],
    isActive: true
  }
]
*/
```

#### Get Tier Configuration
```typescript
const config = await membershipApi.getTierConfiguration('board');
```

#### Update Tier Configuration
```typescript
await membershipApi.updateTierConfiguration('board', {
  price: 199.99,
  benefits: ['Enhanced benefits'],
  isActive: true,
});
```

#### Get Tier Benefits
```typescript
const benefits = await membershipApi.getTierBenefits('regular');
/*
Returns:
{
  tier: 'regular',
  benefits: ['Member access', 'Newsletter'],
  description: 'Basic membership benefits',
  price: 99.99,
  renewalOptions: ['monthly', 'annual'],
  features: ['Events', 'Community']
}
*/
```

### Upgrade/Downgrade Operations

#### Upgrade Membership
```typescript
await membershipApi.upgradeMembership({
  membershipId,
  userId,
  newTier: 'board',
  upgradeReason: 'Promotion',
  effectiveDate: new Date(),
  proRatedAmount: 50.00,
  paymentMethodId: 'pm_123',
});
```

#### Downgrade Membership
```typescript
await membershipApi.downgradeMembership(
  membershipId,
  userId,
  'regular',
  'Cost reduction',
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days notice
);
```

#### Get Upgrade Options
```typescript
const options = await membershipApi.getMembershipUpgradeOptions(membershipId);
/*
Returns:
{
  currentTier: 'regular',
  availableTiers: ['board', 'admin'],
  pricing: {
    board: 199.99,
    admin: 299.99
  }
}
*/
```

#### Calculate Pricing
```typescript
const pricing = await membershipApi.calculatePricing(
  'board',
  'annual',
  new Date(),
  'regular' // upgrade from
);
// Returns: { amount: 150.00, currency: 'USD', breakdown: {...} }
```

### Payment Management

#### Get Payment History
```typescript
const payments = await membershipApi.getPaymentHistory(membershipId);
```

#### Process Payment
```typescript
await membershipApi.processPayment({
  membershipId,
  amount: 99.99,
  currency: 'USD',
  paymentMethodId: 'pm_123',
  description: 'Annual membership renewal',
});
```

#### Payment Methods

**Add Payment Method**
```typescript
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
```

**Update Payment Method**
```typescript
await membershipApi.updatePaymentMethod(userId, paymentMethodId, {
  cardholderName: 'Jane Doe',
  isDefault: false,
});
```

**Delete Payment Method**
```typescript
await membershipApi.deletePaymentMethod(userId, paymentMethodId);
```

**Set Default Payment Method**
```typescript
await membershipApi.setDefaultPaymentMethod(userId, paymentMethodId);
```

**Get Payment Methods**
```typescript
const methods = await membershipApi.getPaymentMethods(userId);
```

### Analytics and Reporting

#### Get Membership Statistics
```typescript
const stats = await membershipApi.getMembershipStatistics({
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  tier: ['regular', 'board'],
});
/*
Returns:
{
  totalMembers: 1000,
  activeMembers: 850,
  expiredMembers: 50,
  suspendedMembers: 10,
  cancelledMembers: 90,
  pendingMembers: 20,
  membersByTier: {
    regular: 800,
    board: 150,
    admin: 50
  },
  membersByStatus: {
    active: 850,
    expired: 50,
    suspended: 10,
    cancelled: 90
  },
  renewalRate: 0.85,
  churnRate: 0.15,
  averageMembershipDuration: 18.5,
  revenueByTier: {
    regular: 79900,
    board: 29985,
    admin: 14995
  },
  monthlyRecurringRevenue: 10456.50,
  upcomingRenewals: 25,
  expiringThisMonth: 12,
  membershipTrends: [...]
}
*/
```

#### Get Membership Trends
```typescript
const trends = await membershipApi.getMembershipTrends('month');
```

#### Get Revenue Report
```typescript
const revenue = await membershipApi.getRevenueReport({
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  tier: ['regular', 'board'],
  groupBy: 'month',
});
```

#### Get Churn Analysis
```typescript
const churn = await membershipApi.getChurnAnalysis({
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  tier: ['regular'],
});
```

### Bulk Operations

#### Bulk Update Memberships
```typescript
const result = await membershipApi.bulkUpdateMemberships(
  ['membership-id-1', 'membership-id-2'],
  { status: 'active', autoRenew: true },
  'admin-user-id'
);
// Returns: { updated: 2, failed: 0, errors: [] }
```

#### Bulk Renewal
```typescript
const result = await membershipApi.bulkRenew(
  ['membership-id-1', 'membership-id-2'],
  'pm_123',
  'admin-user-id'
);
// Returns: { processed: 2, successful: 2, failed: 0 }
```

#### Export Memberships
```typescript
const exportResult = await membershipApi.exportMemberships({
  filters: {
    status: ['active'],
    tier: ['regular'],
  },
  format: 'csv', // or 'xlsx', 'pdf'
});
// Returns: { downloadUrl: 'https://...', expiresAt: Date }
```

### Filtering and Query Options

#### List Memberships with Filters
```typescript
const memberships = await membershipApi.listMemberships({
  filters: {
    status: ['active', 'expired'],
    tier: ['regular', 'board'],
    renewalType: ['annual'],
    autoRenew: true,
    search: 'john doe',
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31'),
    },
    expiringWithin: 30, // days
  },
  include: ['user', 'payments', 'tier'],
  exclude: ['documents'],
  page: 1,
  limit: 50,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});
```

## Utility Methods

### Status Checking
```typescript
// Check if membership is active
if (membershipApi.isMembershipActive(membership)) {
  // Proceed with membership operations
}

// Check if membership is expiring soon
if (membershipApi.isMembershipExpiringSoon(membership, 30)) {
  // Send renewal reminder
}
```

### Duration Calculations
```typescript
// Get membership duration in days
const durationDays = membershipApi.getMembershipDurationDays(membership);

// Calculate prorated amount for upgrade
const proratedAmount = membershipApi.calculateProratedAmount(
  'regular',
  'board',
  currentMembership,
  effectiveDate
);
```

## Error Handling

```typescript
try {
  const membership = await membershipApi.createMembership(data);
} catch (error) {
  if (error.message.includes('payment')) {
    // Handle payment-related errors
  } else if (error.message.includes('validation')) {
    // Handle validation errors
  } else if (error.message.includes('unauthorized')) {
    // Handle authorization errors
  }
}
```

## Integration Examples

### React Hook for Membership Management
```typescript
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

  const renewMembership = async (paymentMethodId: string) => {
    try {
      const response = await membershipApi.renewMembership({
        membershipId: membership.id,
        userId,
        paymentMethodId,
        renewalType: membership.renewalType,
      });
      setMembership(response.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return { membership, loading, error, renewMembership };
};
```

### Admin Dashboard Integration
```typescript
// Bulk membership operations for admin panel
const handleBulkRenewal = async (selectedMemberships: string[]) => {
  try {
    const result = await membershipApi.bulkRenew(
      selectedMemberships,
      defaultPaymentMethodId,
      adminUserId
    );
    
    console.log(`Processed: ${result.processed}, Success: ${result.successful}`);
    // Update UI with results
  } catch (error) {
    console.error('Bulk renewal failed:', error);
  }
};

// Export membership data
const handleExport = async (filters: MembershipFilter) => {
  try {
    const exportResult = await membershipApi.exportMemberships({
      filters,
      format: 'csv',
    });
    
    // Trigger download
    window.open(exportResult.data.downloadUrl);
  } catch (error) {
    console.error('Export failed:', error);
  }
};
```

## Performance Tips

1. **Use Pagination**: Always paginate list results for large datasets
2. **Selective Includes**: Only include related data when needed
3. **Date Range Filtering**: Use date ranges for time-sensitive queries
4. **Bulk Operations**: Use bulk endpoints for multiple operations
5. **Caching**: Cache tier configurations and pricing data
6. **Background Processing**: Use scheduled renewals for automated processing

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Role-based access control (admin, board, member)
3. **Payment Security**: PCI DSS compliant payment processing
4. **Data Encryption**: Sensitive data encrypted at rest and in transit
5. **Audit Logging**: All payment and membership changes logged
6. **Rate Limiting**: API endpoints rate limited to prevent abuse

---

**Last Updated**: 2025-10-29  
**Version**: 1.0.0  
**Dependencies**: @issb/types, axios, zod  
**Related**: Application API, Payment Services, User Management
