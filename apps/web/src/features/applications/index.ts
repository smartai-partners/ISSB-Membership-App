// Application Components Export
export { ApplicationForm } from './ApplicationForm';
export { ApplicationReview } from './ApplicationReview';
export { ApplicationStatus, ApplicationStatusIndicator, ApplicationStatusSummary } from './ApplicationStatus';
export { DocumentUpload, SimpleDocumentUpload } from './DocumentUpload';
export { ReferenceForm, ReferenceRequest, ReferenceProviderForm } from './ReferenceForm';

// Type exports for convenience
export type {
  FormData as ApplicationFormData,
  StepProps as ApplicationStepProps,
} from './ApplicationForm';

export type {
  ApplicationReviewProps,
  ReviewFormData,
} from './ApplicationReview';

export type {
  ApplicationStatusProps,
} from './ApplicationStatus';

export type {
  DocumentUploadProps,
  UploadProgress,
  FileWithPreview,
} from './DocumentUpload';

export type {
  ReferenceFormProps,
  ReferenceFormData,
} from './ReferenceForm';

// Constants and utilities
export { statusSteps } from './ApplicationStatus';
export { getStatusBadgeVariant } from './ApplicationStatus';
