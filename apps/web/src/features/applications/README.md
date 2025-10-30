# Application Components

This directory contains React components for managing membership applications, including multi-step forms, document uploads, reference management, and review workflows.

## Components

### ApplicationForm

A comprehensive multi-step form for creating and editing membership applications.

**Features:**
- Multi-step wizard with progress indicator
- Validation using Zod schemas
- Auto-save functionality
- Dynamic form fields with real-time validation
- Document upload integration
- Reference collection

**Usage:**
```tsx
import { ApplicationForm } from '@/features/applications';

const MyApplicationPage = () => {
  const handleSubmit = async (data) => {
    await submitApplication(data);
  };

  const handleSave = async (data) => {
    await saveDraft(data);
  };

  return (
    <ApplicationForm
      application={existingApplication}
      onSubmit={handleSubmit}
      onSave={handleSave}
    />
  );
};
```

**Steps:**
1. Application Type Selection
2. Personal Information
3. Professional Information
4. References
5. Documents
6. Review & Submit

### ApplicationReview

A comprehensive review interface for processing membership applications.

**Features:**
- Tabbed interface for different review sections
- Document review and verification
- Reference tracking
- Review decision workflow
- Comments and feedback system
- Interview scheduling
- Additional document requests

**Usage:**
```tsx
import { ApplicationReview } from '@/features/applications';

const ReviewPage = () => {
  const handleSubmitReview = async (reviewData) => {
    await submitReview(application.id, reviewData);
  };

  return (
    <ApplicationReview
      application={application}
      reviewer={currentUser}
      onSubmitReview={handleSubmitReview}
      onRequestDocuments={handleRequestDocuments}
      onScheduleInterview={handleScheduleInterview}
    />
  );
};
```

### ApplicationStatus

Status tracking component with timeline and action buttons.

**Features:**
- Visual status timeline
- Status badges and indicators
- Action buttons based on user role
- Application summary
- Quick actions menu
- Progress tracking

**Usage:**
```tsx
import { ApplicationStatus } from '@/features/applications';

const ApplicationDetail = () => {
  return (
    <ApplicationStatus
      application={application}
      applicant={applicant}
      isApplicant={true}
      onViewDetails={handleViewDetails}
      onWithdraw={handleWithdraw}
    />
  );
};
```

**Status Types:**
- DRAFT
- SUBMITTED
- UNDER_REVIEW
- PENDING_DOCUMENTS
- APPROVED
- REJECTED
- WITHDRAWN

### DocumentUpload

File upload component with drag-and-drop support and progress tracking.

**Features:**
- Drag-and-drop file upload
- File type validation
- Upload progress tracking
- Document verification status
- File preview
- Batch upload support
- Document categorization

**Usage:**
```tsx
import { DocumentUpload } from '@/features/applications';

const DocumentManager = () => {
  const handleUpload = async (files, documentType) => {
    await uploadDocuments(files, documentType);
  };

  return (
    <DocumentUpload
      documents={applicationDocuments}
      applicationId={application.id}
      userId={currentUser.id}
      onUpload={handleUpload}
      onDelete={handleDeleteDocument}
      onVerify={handleVerifyDocument}
    />
  );
};
```

**Features:**
- Multi-file upload
- File size validation
- Type restrictions
- Upload queue management
- Error handling and retry
- Document verification

### ReferenceForm

Reference management component for collecting and verifying professional references.

**Features:**
- Reference collection form
- Reference verification status
- Email request sending
- Reference provider form
- Validation and error handling
- Edit/remove functionality

**Usage:**
```tsx
import { ReferenceForm, ReferenceProviderForm } from '@/features/applications';

// For collecting references
const ReferencesCollector = () => {
  const [references, setReferences] = useState([]);

  return (
    <ReferenceForm
      references={references}
      onReferencesChange={setReferences}
      onSendReferenceRequest={handleSendRequest}
    />
  );
};

// For reference providers to submit feedback
const ReferenceProvider = () => {
  const handleSubmit = async (feedback) => {
    await submitReferenceFeedback(feedback);
  };

  return (
    <ReferenceProviderForm
      reference={reference}
      applicantName={applicantName}
      onSubmit={handleSubmit}
    />
  );
};
```

## Data Types

The components use TypeScript interfaces defined in the shared types package:

```typescript
import { 
  MembershipApplication,
  Document,
  Reference,
  ReviewDecision,
  ApplicationStatus,
  DocumentType
} from '@shared/types';
```

## Validation

Components use Zod schemas from the ApplicationValidators for data validation:

```typescript
import { 
  CreateApplicationSchema,
  PersonalInfoSchema,
  ProfessionalInfoSchema
} from '@shared/types/ApplicationValidators';
```

## Workflow Management

### Application States

1. **Draft** - Application being prepared
2. **Submitted** - Application submitted, awaiting review
3. **Under Review** - Being reviewed by staff
4. **Pending Documents** - Additional documents requested
5. **Approved** - Application approved
6. **Rejected** - Application rejected
7. **Withdrawn** - Application withdrawn by applicant

### Status Transitions

```typescript
const validTransitions = {
  [ApplicationStatus.DRAFT]: [ApplicationStatus.SUBMITTED, ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.SUBMITTED]: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.PENDING_DOCUMENTS, ApplicationStatus.WITHDRAWN],
  [ApplicationStatus.UNDER_REVIEW]: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED, ApplicationStatus.PENDING_DOCUMENTS],
  [ApplicationStatus.PENDING_DOCUMENTS]: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED],
  [ApplicationStatus.APPROVED]: [],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.WITHDRAWN]: [],
};
```

## Integration Guidelines

### State Management

Components are designed to work with external state management:

```tsx
// Use with Zustand stores
const useApplicationStore = create((set) => ({
  applications: [],
  currentApplication: null,
  updateApplication: (id, updates) => set(state => ({
    applications: state.applications.map(app => 
      app.id === id ? { ...app, ...updates } : app
    )
  })),
}));

// Use with React Query
const { data: applications } = useQuery({
  queryKey: ['applications'],
  queryFn: fetchApplications,
});
```

### API Integration

Each component is designed to work with REST API endpoints:

```typescript
// Example API calls
const applicationAPI = {
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
  review: (id, review) => api.post(`/applications/${id}/review`, review),
  uploadDocument: (id, file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post(`/applications/${id}/documents`, formData);
  },
};
```

### Error Handling

Components include comprehensive error handling:

```tsx
try {
  await onSubmit(formData);
  // Success handling
} catch (error) {
  console.error('Application submission failed:', error);
  // Error handling (show toast, set error state, etc.)
}
```

## Accessibility

All components include:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## Styling

Components use Tailwind CSS with:
- Responsive design patterns
- Consistent spacing and typography
- Interactive state styling
- Dark mode support (when implemented)
- Custom component library integration

## Testing

Components can be tested with:
- React Testing Library
- Jest
- Cypress for E2E testing

Example test:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ApplicationForm } from './ApplicationForm';

test('submits application form', async () => {
  const handleSubmit = jest.fn();
  
  render(<ApplicationForm onSubmit={handleSubmit} />);
  
  // Fill form steps...
  
  const submitButton = screen.getByText('Submit Application');
  fireEvent.click(submitButton);
  
  expect(handleSubmit).toHaveBeenCalled();
});
```

## Performance

Optimization considerations:
- Lazy loading for large forms
- Memoized components to prevent unnecessary re-renders
- File upload with progress tracking
- Virtual scrolling for large document lists
- Debounced form validation

## Security

- File upload validation and sanitization
- XSS prevention in form inputs
- CSRF protection
- Input validation on both client and server
- Secure file storage recommendations

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement approach
