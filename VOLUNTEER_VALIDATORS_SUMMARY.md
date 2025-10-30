# Volunteer Validators Documentation

## Overview
This document provides a comprehensive overview of the VolunteerValidators.ts file, which contains Zod validation schemas for volunteer opportunities and applications in the application.

## File Location
`/workspace/packages/types/src/VolunteerValidators.ts`

## Key Features

### 1. Location & Geographic Validation
- **LocationSchema**: Validates complete address information including coordinates
- **RemoteWorkSchema**: Handles remote work options and hybrid schedules
- Geographic coordinate validation (latitude/longitude bounds)
- Address component validation (city, state, country, postal code)

### 2. Skills & Requirements Validation
- **SkillSchema**: Validates individual skills with character limits and pattern matching
- **SkillsRequirementSchema**: Handles required vs preferred skills, experience levels
- Experience level validation (beginner to expert)
- Years of experience validation (0-50 years)

### 3. Date & Time Validation
- **DateRangeSchema**: Ensures start dates are in future and end dates are after start dates
- **ApplicationDeadlineSchema**: Validates application deadlines with buffer days
- Flexible deadline handling with validation for past dates

### 4. Volunteer Opportunity Validation

#### Create Opportunity (`CreateVolunteerOpportunitySchema`)
- Title: 5-100 characters with valid character patterns
- Description: 50-2000 characters
- Organization: 2-100 characters
- Type: Enum validation (INTERPRETING, TRANSLATION, TRAINING, EVENT, ADMINISTRATIVE, RESEARCH)
- Location: Complete address validation
- Skills: Required skills with experience requirements
- Commitment: Hours per week (1-168), duration, flexible scheduling
- Contact information: Email validation, phone format validation
- Additional features: Capacity limits, urgent flag, background check requirements

#### Update Opportunity (`UpdateVolunteerOpportunitySchema`)
- Partial updates with all fields optional
- Status management (DRAFT, ACTIVE, FILLED, CANCELLED, EXPIRED)
- Maintains referential integrity
- Validates at least one field is provided

### 5. Volunteer Application Validation

#### Apply for Opportunity (`ApplyForOpportunitySchema`)
- Opportunity ID validation (UUID format)
- Motivation: 100-1000 characters
- Relevant experience: 50-1000 characters
- Availability: 20-500 characters
- Skills offered: Array validation with minimum 1 skill
- Optional portfolio and LinkedIn URLs
- References: Up to 3 references with contact validation
- Custom questions: Key-value pairs for organization-specific questions

#### Update Application (`UpdateApplicationSchema`)
- Partial updates for pending/reviewing applications
- Maintains application workflow integrity
- Validates at least one field is provided

### 6. Application Review Validation

#### Review Application (`ReviewApplicationSchema`)
- Decision validation (ACCEPTED, DECLINED, PENDING, etc.)
- Review notes: 10-1000 characters (required for accept/decline decisions)
- Skills assessment with boolean validation
- Rating: 1-5 scale with proper bounds
- Follow-up requirements with date validation
- Interview scheduling validation
- Additional documents validation (max 5)

#### Bulk Review (`BulkReviewApplicationSchema`)
- Batch processing of up to 50 reviews
- Notification and feedback options
- Maintains data consistency across multiple applications

### 7. Filtering & Query Validation

#### Opportunity Filtering (`VolunteerOpportunityFilterSchema`)
- Search: Text query with 100 character limit
- Type filtering: Multiple volunteer types (max 6)
- Status filtering: Multiple statuses (max 6)
- Tier filtering: Membership tiers (max 3)
- Location-based filtering with radius support
- Skills filtering (max 10 skills)
- Remote work filtering
- Urgent opportunities filtering
- Commitment hours range filtering
- Date range filtering
- Sorting options

#### Application Filtering (`VolunteerApplicationFilterSchema`)
- Search functionality
- Status-based filtering
- Opportunity type filtering
- Date range filtering
- Reviewer-based filtering
- Interview status filtering
- Rating-based filtering
- Sorting options

### 8. Pagination Validation
- **PaginationSchema**: Standardized pagination (1-1000 pages, 1-100 items per page)
- **Query Schemas**: Combine pagination with filters for comprehensive queries

### 9. Workflow & State Validation
- **WorkflowActionSchema**: Validates workflow actions (submit, withdraw, accept, decline, etc.)
- **VolunteerProfileUpdateSchema**: Updates volunteer profiles including:
  - Skills (max 50)
  - Interests (max 20)
  - Weekly availability schedules
  - Travel preferences
  - Background check status
  - Certifications (max 20)

### 10. Utility Functions
The `VolunteerValidationUtils` object provides helper functions:

#### `canAcceptApplications(opportunity)`
- Validates if an opportunity can still accept applications
- Checks status, dates, and deadlines

#### `canUpdateApplication(status)`
- Determines if an application can be updated based on current status

#### `canReviewApplication(status)`
- Determines if an application can be reviewed based on current status

#### `calculateDuration(startDate, endDate)`
- Calculates opportunity duration in days

#### `isUrgent(startDate, urgentFlag)`
- Determines if an opportunity is urgent (starts within 7 days or flagged)

## Validation Patterns Used

### 1. Character Limits
- Titles: 5-100 characters
- Descriptions: 50-2000 characters
- Skills: 2-50 characters
- Reasons/Notes: 10-1000 characters

### 2. Array Validation
- Minimum/maximum array lengths
- Unique item validation where applicable
- Pattern matching for strings in arrays

### 3. Date Validation
- Future date requirements for start dates
- Range validation for date ranges
- Deadline validation with buffer periods

### 4. Pattern Validation
- Email format validation
- Phone number format validation
- URL validation for portfolios and social media
- Time format validation (HH:MM)
- UUID validation for IDs

### 5. Conditional Validation
- Remote work details required when remote work mentioned
- Follow-up dates required when follow-up marked as required
- Interview dates required when interview marked as required
- Review notes required for accept/decline decisions

## Usage Examples

### Basic Opportunity Creation
```typescript
import { VolunteerValidators } from '@your-org/types';

const opportunityData = {
  title: 'Spanish Interpreter Needed',
  description: 'We need a Spanish interpreter for community events...',
  organization: 'Community Center',
  type: VolunteerType.INTERPRETING,
  tier: MembershipTier.REGULAR,
  // ... other fields
};

const validated = VolunteerValidators.createOpportunity.parse(opportunityData);
```

### Filtering Opportunities
```typescript
import { VolunteerValidators } from '@your-org/types';

const filters = {
  type: [VolunteerType.INTERPRETING, VolunteerType.TRANSLATION],
  isRemote: true,
  urgent: false,
  sortBy: 'startDate',
  sortOrder: 'asc',
};

const validatedFilters = VolunteerValidators.opportunityFilter.parse(filters);
```

### Reviewing Applications
```typescript
import { VolunteerValidators, VolunteerApplicationStatus } from '@your-org/types';

const review = {
  applicationId: 'uuid-here',
  decision: VolunteerApplicationStatus.ACCEPTED,
  reviewNotes: 'Great candidate with relevant experience...',
  rating: 5,
  followUpRequired: false,
};

const validatedReview = VolunteerValidators.reviewApplication.parse(review);
```

## Integration Notes

### Import Path
The validators are available through:
```typescript
import { VolunteerValidators } from '@your-org/types';
```

### Zod Integration
All validators are built using Zod and follow Zod's error handling patterns:
- `parse()`: Throws on validation errors
- `safeParse()`: Returns success/failure without throwing
- `parseAsync()`: For async validation

### Error Handling
Validation errors follow Zod's standard format:
```typescript
{
  success: false,
  error: {
    issues: [
      {
        code: 'too_small',
        minimum: 5,
        received: 3,
        path: ['title'],
        message: 'Title must be at least 5 characters'
      }
    ]
  }
}
```

## Benefits

1. **Type Safety**: Full TypeScript integration with existing type definitions
2. **Runtime Validation**: Validates data at runtime, not just compile-time
3. **Comprehensive Coverage**: Covers all aspects of volunteer opportunity management
4. **Reusable**: Validators can be used across frontend and backend
5. **Consistent**: Follows established patterns from MembershipValidators
6. **Extensible**: Easy to add new validation rules and schemas
7. **Utility Functions**: Built-in helper functions for common validation logic

## Next Steps

1. Integrate validators in API controllers for route validation
2. Use in frontend form validation for better user experience
3. Add integration tests for validator edge cases
4. Consider adding internationalization for error messages
5. Monitor validation performance for high-traffic endpoints