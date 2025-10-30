# Application Validators Documentation

## Overview
This document provides a comprehensive overview of the ApplicationValidators.ts file, which contains Zod validation schemas for membership applications in the application.

## File Location
`/workspace/packages/types/src/ApplicationValidators.ts`

## Key Features

### 1. Personal Information Validation
- **PersonalInfoSchema**: Validates complete personal information including:
  - Date of birth with age validation (18-100 years)
  - Location with character limits (2-100 characters)
  - Occupation with validation (2-100 characters)
  - Optional organization and website fields
  - Website URL format validation

### 2. Professional Information Validation
- **ProfessionalInfoSchema**: Comprehensive validation for professional details:
  - Years of experience (0-50 years)
  - Certifications array with detailed validation:
    - Name, issuing organization, issue/expiry dates
    - Optional certificate number and URL
    - Verification status tracking
  - Languages array (1-10 languages, 2-30 characters each)
  - Areas of expertise (1-10 areas, 2-50 characters each)
  - Current role validation (2-100 characters)
  - Two references with complete contact validation:
    - Name, email, phone, organization, relationship
    - Years known and verification status
    - Email uniqueness validation between references

### 3. Document Validation
- **DocumentSchema**: Validates uploaded documents including:
  - File name and type (DocumentType enum)
  - File size limits (1 byte to 10MB)
  - MIME type validation
  - File path validation
  - Upload verification tracking
  - Uploaded by user ID validation

### 4. Experience Validation
- **ExperienceSchema**: Validates work/volunteer experience:
  - Organization and position validation
  - Date range validation (end date after start date)
  - Description with character limits (10-500 characters)
  - Experience type enum validation

### 5. Application Creation and Updates

#### Create Application (`CreateApplicationSchema`)
- **Required Fields**:
  - Application type (MembershipTier enum)
  - Complete personal information
  - Complete professional information
  - At least one document (max 10)
  - Terms and privacy agreement validation
- **Validation Rules**:
  - Both references must be different people
  - All required fields must be completed
  - Character limits enforced for all text fields
  - Date validation for age and certification expiry dates

#### Update Application (`UpdateApplicationSchema`)
- **Features**:
  - Partial updates for draft and pending applications
  - All fields optional with at least one required
  - Maintains application workflow integrity
  - Supports incremental document updates

### 6. Application Submission
- **SubmitApplicationSchema**: Validates application submission:
  - Application ID validation (UUID format)
  - Submitter ID validation
  - Business logic validation (application must be in DRAFT status)

### 7. Application Review Validation

#### Single Application Review (`ApplicationReviewSchema`)
- **Decision Types**: APPROVED, REJECTED, PENDING, NEEDS_MORE_INFO
- **Required Reviews**:
  - Documents reviewed (boolean)
  - Credentials verified (boolean)
  - References contacted (boolean)
  - Review comments (10-2000 characters)
- **Optional Elements**:
  - Additional documents required (max 5)
  - Follow-up requirements with date
  - Interview scheduling with date
  - Rating (1-5 scale)
- **Business Rules**:
  - Follow-up date required if follow-up marked as required
  - Interview date required if interview marked as required
  - Credentials must be verified for approved applications

#### Bulk Review (`BulkReviewApplicationSchema`)
- **Features**:
  - Batch processing of up to 50 reviews
  - Notification options for applicants
  - Detailed feedback inclusion option
  - Maintains data consistency across multiple applications

#### Final Approval (`FinalApprovalSchema`)
- **Approval Process**:
  - Application ID and approver ID validation
  - Membership start date (cannot be in past)
  - Membership tier assignment
  - Benefits specification (max 20)
  - Optional approval notes

### 8. Application Filtering and Query Validation

#### Application Filter (`ApplicationFilterSchema`)
- **Filter Options**:
  - Status filtering (max 10 statuses)
  - Application type filtering (max 5 types)
  - Text search (100 character limit)
  - Date range filtering
  - Reviewer-based filtering
  - Document status filtering
  - Interview requirement filtering
- **Sorting Options**:
  - Sort by: createdAt, submittedAt, reviewedAt, status, applicationType
  - Sort order: asc, desc
- **Pagination**:
  - Page validation (minimum 1)
  - Limit validation (1-100 items per page)

#### Complex Query (`ApplicationQuerySchema`)
- **Include/Exclude Relationships**:
  - documents, references, reviews, applicant
  - Maximum 5 relationships per query
- **Flexible Query Building**:
  - Filter combinations
  - Relationship inclusion/exclusion
  - Pagination support

### 9. Workflow and State Management

#### Workflow Actions (`WorkflowActionSchema`)
- **Supported Actions**:
  - submit, withdraw, start_review
  - approve, reject, request_documents
  - schedule_interview
- **Validation**:
  - Application ID and actor ID validation
  - Optional reason and metadata support

#### Status Updates (`ApplicationStatusUpdateSchema`)
- **Status Transitions**:
  - DRAFT → SUBMITTED, WITHDRAWN
  - SUBMITTED → UNDER_REVIEW, PENDING_DOCUMENTS, WITHDRAWN
  - UNDER_REVIEW → APPROVED, REJECTED, PENDING_DOCUMENTS
  - PENDING_DOCUMENTS → UNDER_REVIEW, REJECTED
  - APPROVED, REJECTED, WITHDRAWN → (Final states)
- **Features**:
  - Business logic validation for transitions
  - Admin override option (forceUpdate)
  - Reason tracking for status changes

### 10. Document Upload Validation
- **DocumentUploadSchema**: Validates file upload requests:
  - File name and type validation
  - Size limits (10MB maximum)
  - MIME type validation
  - Application and uploader ID validation

### 11. Statistics and Analytics
- **ApplicationStatsSchema**: Validates application statistics:
  - Application counts by status and type
  - Approval rates and processing times
  - Monthly trend data
  - Performance metrics

### 12. Utility Functions

The `ApplicationValidationUtils` object provides helper functions:

#### `canUpdateApplication(status)`
- Determines if an application can be updated based on current status
- Returns true for DRAFT and PENDING_DOCUMENTS statuses

#### `canSubmitApplication(status)`
- Checks if an application can be submitted
- Returns true only for DRAFT status

#### `canReviewApplication(status)`
- Determines if an application can be reviewed
- Returns true for SUBMITTED, UNDER_REVIEW, and PENDING_DOCUMENTS statuses

#### `canApproveApplication(status)`
- Checks if an application can be approved
- Returns true for UNDER_REVIEW and PENDING_DOCUMENTS statuses

#### `calculateCompleteness(application)`
- Calculates application completeness percentage
- Checks personal info, professional info, and documents
- Returns 0-100 percentage

#### `isValidStatusTransition(currentStatus, newStatus)`
- Validates workflow status transitions
- Returns boolean indicating if transition is allowed
- Enforces business logic for application lifecycle

#### `meetsMinimumRequirements(application)`
- Checks if application meets minimum submission requirements
- Returns object with validity boolean and array of missing fields
- Validates all required fields for submission

## Validation Patterns Used

### 1. Character Limits
- Names and titles: 2-100 characters
- Descriptions: 10-2000 characters
- URLs: 200 characters
- File names: 100 characters
- Search queries: 100 characters

### 2. Array Validation
- Minimum/maximum array lengths
- Unique item validation where applicable
- Pattern matching for strings in arrays

### 3. Date Validation
- Age validation for applicants (18-100 years)
- Certification expiry date validation
- Date range validation for applications
- Future date requirements for membership start dates

### 4. Pattern Validation
- Email format validation using z.string().email()
- Phone number format validation with regex
- URL validation for websites and certificate links
- UUID validation for all ID fields
- MIME type validation for document uploads

### 5. Conditional Validation
- Reference email uniqueness validation
- Follow-up dates required when follow-up marked as required
- Interview dates required when interview marked as required
- Credentials verification required for approved applications
- Terms agreement validation for application submission

### 6. Business Logic Validation
- Status transition validation
- Minimum requirement checking
- Application completeness calculation
- Workflow action validation

## Usage Examples

### Creating a Membership Application
```typescript
import { ApplicationValidators, MembershipTier } from '@your-org/types';

const applicationData = {
  applicationType: MembershipTier.REGULAR,
  personalInfo: {
    dateOfBirth: new Date('1990-05-15'),
    location: 'New York, NY, USA',
    occupation: 'Software Engineer',
    organization: 'Tech Corp Inc',
    website: 'https://johndoe.dev'
  },
  professionalInfo: {
    yearsOfExperience: 5,
    certifications: [
      {
        name: 'AWS Certified Solutions Architect',
        issuingOrganization: 'Amazon Web Services',
        issueDate: new Date('2022-01-15'),
        certificateNumber: 'ABC123456',
        verified: false
      }
    ],
    languages: ['English', 'Spanish'],
    areasOfExpertise: ['Cloud Computing', 'DevOps'],
    currentRole: 'Senior Software Engineer',
    reference1: {
      name: 'Jane Smith',
      email: 'jane.smith@techcorp.com',
      phone: '+1-555-0123',
      organization: 'Tech Corp Inc',
      relationship: 'Direct Manager',
      yearsKnown: 3,
      verified: false
    },
    reference2: {
      name: 'Mike Johnson',
      email: 'mike.johnson@techcorp.com',
      phone: '+1-555-0124',
      organization: 'Tech Corp Inc',
      relationship: 'Colleague',
      yearsKnown: 2,
      verified: false
    }
  },
  documents: [
    {
      name: 'Resume.pdf',
      type: DocumentType.IDENTITY,
      size: 1024000,
      mimeType: 'application/pdf',
      path: '/uploads/resume.pdf',
      uploadedBy: 'user-uuid-here',
      verified: false
    }
  ],
  agreeToTerms: true,
  agreeToPrivacy: true
};

const validatedApplication = ApplicationValidators.createApplication.parse(applicationData);
```

### Filtering Applications
```typescript
import { ApplicationValidators } from '@your-org/types';

const filters = {
  status: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.PENDING_DOCUMENTS],
  applicationType: [MembershipTier.REGULAR],
  search: 'software engineer',
  sortBy: 'submittedAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20
};

const validatedFilters = ApplicationValidators.applicationFilter.parse(filters);
```

### Reviewing an Application
```typescript
import { ApplicationValidators, ReviewDecision } from '@your-org/types';

const review = {
  applicationId: 'application-uuid-here',
  reviewerId: 'reviewer-uuid-here',
  decision: ReviewDecision.APPROVED,
  comments: 'Excellent candidate with relevant experience and verified credentials.',
  documentsReviewed: true,
  credentialsVerified: true,
  referencesContacted: true,
  rating: 5,
  followUpRequired: false
};

const validatedReview = ApplicationValidators.reviewApplication.parse(review);
```

### Checking Application Completeness
```typescript
import { ApplicationValidators } from '@your-org/types';

const application = { /* application object */ };
const completeness = ApplicationValidators.utils.calculateCompleteness(application);
const requirements = ApplicationValidators.utils.meetsMinimumRequirements(application);

console.log(`Application is ${completeness}% complete`);
if (!requirements.valid) {
  console.log('Missing required fields:', requirements.missing);
}
```

## Integration Notes

### Import Path
The validators are available through:
```typescript
import { ApplicationValidators } from '@your-org/types';
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
        minimum: 2,
        received: 1,
        path: ['personalInfo', 'location'],
        message: 'Location must be at least 2 characters'
      }
    ]
  }
}
```

### Workflow Integration
The validators integrate with application workflow states:
- Draft applications can be updated
- Submitted applications enter review workflow
- Approved applications activate memberships
- Rejected applications are archived
- Withdrawn applications are removed from active processing

## Benefits

1. **Type Safety**: Full TypeScript integration with existing type definitions
2. **Runtime Validation**: Validates data at runtime, not just compile-time
3. **Comprehensive Coverage**: Covers all aspects of membership application management
4. **Reusable**: Validators can be used across frontend and backend
5. **Consistent**: Follows established patterns from VolunteerValidators and Membership types
6. **Extensible**: Easy to add new validation rules and schemas
7. **Utility Functions**: Built-in helper functions for common validation logic
8. **Business Logic**: Enforces workflow state transitions and application lifecycle rules
9. **Document Management**: Comprehensive validation for document uploads and verification
10. **Reference Validation**: Ensures reference integrity and verification tracking

## Next Steps

1. Integrate validators in API controllers for route validation
2. Use in frontend form validation for better user experience
3. Add integration tests for validator edge cases
4. Consider adding internationalization for error messages
5. Monitor validation performance for high-traffic endpoints
6. Add webhook validation for external system integrations
7. Implement audit trail validation for compliance requirements
8. Consider adding AI-assisted document validation
9. Add integration with external identity verification services
10. Implement automated reference checking workflows

## Related Files

- `packages/types/src/index.ts` - Core type definitions and exports
- `packages/types/src/VolunteerValidators.ts` - Related validator patterns
- API controllers for application endpoints
- Frontend form components for application creation
- Review dashboard components for application processing
- Document management system integration