import api from '../../services/api';
import {
  MembershipApplication,
  ApplicationStatus,
  ApplicationFilter,
  PaginatedResponse,
  ApiResponse,
  ApplicationReview,
  Document,
  Reference,
  ReviewDecision,
  MembershipTier,
  CreateInput,
  UpdateInput,
} from '@issb/types';
import { ApplicationValidators } from '@issb/types';

// ============================================================================
// APPLICATION API TYPES
// ============================================================================

export interface CreateApplicationRequest {
  applicationType: MembershipTier;
  personalInfo: {
    dateOfBirth?: Date;
    location: string;
    occupation: string;
    organization?: string;
    website?: string;
  };
  professionalInfo: {
    yearsOfExperience: number;
    certifications: any[];
    languages: string[];
    areasOfExpertise: string[];
    currentRole: string;
    reference1: Reference;
    reference2: Reference;
  };
  documents: Document[];
  additionalInfo?: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export interface UpdateApplicationRequest extends Partial<CreateApplicationRequest> {
  additionalInfo?: string;
}

export interface ApplicationReviewRequest {
  applicationId: string;
  reviewerId: string;
  decision: ReviewDecision;
  comments: string;
  documentsReviewed: boolean;
  credentialsVerified: boolean;
  referencesContacted: boolean;
  additionalDocumentsRequired?: string[];
  followUpRequired?: boolean;
  followUpDate?: Date;
  interviewRequired?: boolean;
  interviewDate?: Date;
  rating?: number;
}

export interface ApplicationWorkflowAction {
  applicationId: string;
  actorId: string;
  action: 'submit' | 'withdraw' | 'start_review' | 'approve' | 'reject' | 'request_documents' | 'schedule_interview';
  reason?: string;
  metadata?: Record<string, any>;
}

export interface DocumentUploadRequest {
  file: File;
  applicationId: string;
  documentType: 'certificate' | 'transcript' | 'identity' | 'reference' | 'other';
  description?: string;
}

export interface ReferenceVerificationRequest {
  applicationId: string;
  referenceIndex: 1 | 2;
  verified: boolean;
  verificationNotes?: string;
  verifiedBy: string;
}

export interface ApplicationStatistics {
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  averageProcessingTime: number;
  approvalRate: number;
  applicationsByType: Record<MembershipTier, number>;
  applicationsByStatus: Record<ApplicationStatus, number>;
  monthlyTrends: Array<{
    month: string;
    applications: number;
    approvals: number;
  }>;
}

export interface ApplicationQueryOptions {
  filters?: Partial<ApplicationFilter>;
  include?: string[];
  exclude?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// APPLICATION API SERVICE
// ============================================================================

class ApplicationApiService {
  private baseUrl = '/applications';

  // ============================================================================
  // APPLICATION CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new membership application
   */
  async createApplication(data: CreateApplicationRequest): Promise<ApiResponse<MembershipApplication>> {
    try {
      // Validate input data
      ApplicationValidators.createApplication.parse(data);
      
      const response = await api.post(`${this.baseUrl}`, data);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get application by ID
   */
  async getApplication(id: string, options?: { include?: string[] }): Promise<ApiResponse<MembershipApplication>> {
    try {
      const params = new URLSearchParams();
      if (options?.include) {
        params.append('include', options.include.join(','));
      }

      const response = await api.get(`${this.baseUrl}/${id}?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update application (draft or pending documents)
   */
  async updateApplication(id: string, data: UpdateApplicationRequest): Promise<ApiResponse<MembershipApplication>> {
    try {
      // Validate input data
      ApplicationValidators.updateApplication.parse(data);

      const response = await api.patch(`${this.baseUrl}/${id}`, data);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete application (only drafts)
   */
  async deleteApplication(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * List applications with filtering and pagination
   */
  async listApplications(options?: ApplicationQueryOptions): Promise<ApiResponse<PaginatedResponse<MembershipApplication>>> {
    try {
      const params = new URLSearchParams();

      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      if (options?.include) {
        params.append('include', options.include.join(','));
      }

      if (options?.exclude) {
        params.append('exclude', options.exclude.join(','));
      }

      if (options?.page) {
        params.append('page', String(options.page));
      }

      if (options?.limit) {
        params.append('limit', String(options.limit));
      }

      if (options?.sortBy) {
        params.append('sortBy', options.sortBy);
      }

      if (options?.sortOrder) {
        params.append('sortOrder', options.sortOrder);
      }

      const response = await api.get(`${this.baseUrl}?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // APPLICATION WORKFLOW OPERATIONS
  // ============================================================================

  /**
   * Submit application for review
   */
  async submitApplication(applicationId: string, submitterId: string): Promise<ApiResponse<MembershipApplication>> {
    try {
      ApplicationValidators.submitApplication.parse({ applicationId, submitterId });

      const response = await api.post(`${this.baseUrl}/${applicationId}/submit`, {
        submitterId,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Withdraw application
   */
  async withdrawApplication(applicationId: string, userId: string, reason?: string): Promise<ApiResponse<MembershipApplication>> {
    try {
      const response = await api.post(`${this.baseUrl}/${applicationId}/withdraw`, {
        userId,
        reason,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Perform workflow action
   */
  async performWorkflowAction(action: ApplicationWorkflowAction): Promise<ApiResponse<MembershipApplication>> {
    try {
      ApplicationValidators.workflowAction.parse(action);

      const response = await api.post(`${this.baseUrl}/${action.applicationId}/workflow`, action);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    updatedBy: string,
    reason?: string,
    forceUpdate = false
  ): Promise<ApiResponse<MembershipApplication>> {
    try {
      ApplicationValidators.statusUpdate.parse({
        applicationId,
        newStatus,
        updatedBy,
        reason,
        forceUpdate,
      });

      const response = await api.patch(`${this.baseUrl}/${applicationId}/status`, {
        newStatus,
        updatedBy,
        reason,
        forceUpdate,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // APPLICATION REVIEW OPERATIONS
  // ============================================================================

  /**
   * Submit application review
   */
  async submitReview(review: ApplicationReviewRequest): Promise<ApiResponse<ApplicationReview>> {
    try {
      ApplicationValidators.reviewApplication.parse(review);

      const response = await api.post(`${this.baseUrl}/${review.applicationId}/review`, review);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Submit bulk reviews
   */
  async submitBulkReviews(
    reviews: ApplicationReviewRequest[],
    notifyApplicants = true,
    includeDetailedFeedback = false
  ): Promise<ApiResponse<ApplicationReview[]>> {
    try {
      ApplicationValidators.bulkReviewApplication.parse({
        reviews,
        notifyApplicants,
        includeDetailedFeedback,
      });

      const response = await api.post(`${this.baseUrl}/bulk-review`, {
        reviews,
        notifyApplicants,
        includeDetailedFeedback,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Final approval of application
   */
  async approveApplication(
    applicationId: string,
    approverId: string,
    options: {
      approvalNotes?: string;
      membershipStartDate: Date;
      membershipTier: MembershipTier;
      benefits?: string[];
    }
  ): Promise<ApiResponse<MembershipApplication>> {
    try {
      ApplicationValidators.finalApproval.parse({
        applicationId,
        approverId,
        ...options,
      });

      const response = await api.post(`${this.baseUrl}/${applicationId}/approve`, {
        approverId,
        ...options,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Reject application
   */
  async rejectApplication(
    applicationId: string,
    reviewerId: string,
    reason: string,
    feedback?: string
  ): Promise<ApiResponse<MembershipApplication>> {
    try {
      const response = await api.post(`${this.baseUrl}/${applicationId}/reject`, {
        reviewerId,
        reason,
        feedback,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Request additional documents
   */
  async requestDocuments(
    applicationId: string,
    reviewerId: string,
    documentTypes: string[],
    deadlineDate?: Date
  ): Promise<ApiResponse<MembershipApplication>> {
    try {
      const response = await api.post(`${this.baseUrl}/${applicationId}/request-documents`, {
        reviewerId,
        documentTypes,
        deadlineDate,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Schedule interview
   */
  async scheduleInterview(
    applicationId: string,
    reviewerId: string,
    interviewDate: Date,
    interviewerId: string,
    location: string,
    notes?: string
  ): Promise<ApiResponse<MembershipApplication>> {
    try {
      const response = await api.post(`${this.baseUrl}/${applicationId}/schedule-interview`, {
        reviewerId,
        interviewDate,
        interviewerId,
        location,
        notes,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // DOCUMENT MANAGEMENT
  // ============================================================================

  /**
   * Upload document for application
   */
  async uploadDocument(uploadData: DocumentUploadRequest): Promise<ApiResponse<Document>> {
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('applicationId', uploadData.applicationId);
      formData.append('documentType', uploadData.documentType);
      if (uploadData.description) {
        formData.append('description', uploadData.description);
      }

      const response = await api.post(`${this.baseUrl}/${uploadData.applicationId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload multiple documents
   */
  async uploadMultipleDocuments(uploads: DocumentUploadRequest[]): Promise<ApiResponse<Document[]>> {
    try {
      const uploadPromises = uploads.map(upload => this.uploadDocument(upload));
      const results = await Promise.allSettled(uploadPromises);

      const successful = results
        .filter((result): result is PromiseFulfilledResult<ApiResponse<Document>> => result.status === 'fulfilled')
        .map(result => result.value.data!);

      const failed = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);

      return {
        success: true,
        data: successful,
        message: `${successful.length} documents uploaded successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get application documents
   */
  async getApplicationDocuments(applicationId: string): Promise<ApiResponse<Document[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/${applicationId}/documents`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(applicationId: string, documentId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const response = await api.delete(`${this.baseUrl}/${applicationId}/documents/${documentId}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify document
   */
  async verifyDocument(
    applicationId: string,
    documentId: string,
    verifierId: string,
    verified: boolean,
    verificationNotes?: string
  ): Promise<ApiResponse<Document>> {
    try {
      const response = await api.patch(`${this.baseUrl}/${applicationId}/documents/${documentId}/verify`, {
        verifierId,
        verified,
        verificationNotes,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // REFERENCE MANAGEMENT
  // ============================================================================

  /**
   * Get application references
   */
  async getApplicationReferences(applicationId: string): Promise<ApiResponse<Reference[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/${applicationId}/references`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update reference information
   */
  async updateReference(
    applicationId: string,
    referenceIndex: 1 | 2,
    referenceData: Reference
  ): Promise<ApiResponse<Reference>> {
    try {
      const response = await api.patch(`${this.baseUrl}/${applicationId}/references/${referenceIndex}`, referenceData);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify reference
   */
  async verifyReference(verification: ReferenceVerificationRequest): Promise<ApiResponse<Reference>> {
    try {
      const { applicationId, referenceIndex, verified, verificationNotes, verifiedBy } = verification;
      const response = await api.patch(`${this.baseUrl}/${applicationId}/references/${referenceIndex}/verify`, {
        verified,
        verificationNotes,
        verifiedBy,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Contact reference (send email notification)
   */
  async contactReference(
    applicationId: string,
    referenceIndex: 1 | 2,
    message: string,
    contactedBy: string
  ): Promise<ApiResponse<{ contacted: boolean }>> {
    try {
      const response = await api.post(`${this.baseUrl}/${applicationId}/references/${referenceIndex}/contact`, {
        message,
        contactedBy,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // APPLICATION ANALYTICS AND STATISTICS
  // ============================================================================

  /**
   * Get application statistics
   */
  async getApplicationStatistics(options?: {
    dateRange?: { start: Date; end: Date };
    applicationType?: MembershipTier[];
    status?: ApplicationStatus[];
  }): Promise<ApiResponse<ApplicationStatistics>> {
    try {
      const params = new URLSearchParams();

      if (options?.dateRange) {
        params.append('startDate', options.dateRange.start.toISOString());
        params.append('endDate', options.dateRange.end.toISOString());
      }

      if (options?.applicationType) {
        params.append('applicationType', options.applicationType.join(','));
      }

      if (options?.status) {
        params.append('status', options.status.join(','));
      }

      const response = await api.get(`${this.baseUrl}/statistics?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get application trends
   */
  async getApplicationTrends(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(`${this.baseUrl}/trends?period=${period}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Calculate application completeness
   */
  calculateApplicationCompleteness(application: MembershipApplication): number {
    return ApplicationValidators.utils.calculateCompleteness(application);
  }

  /**
   * Check if application can be updated
   */
  canUpdateApplication(application: MembershipApplication): boolean {
    return ApplicationValidators.utils.canUpdateApplication(application.status);
  }

  /**
   * Check if application can be submitted
   */
  canSubmitApplication(application: MembershipApplication): boolean {
    return ApplicationValidators.utils.canSubmitApplication(application.status);
  }

  /**
   * Check if application can be reviewed
   */
  canReviewApplication(application: MembershipApplication): boolean {
    return ApplicationValidators.utils.canReviewApplication(application.status);
  }

  /**
   * Check if application can be approved
   */
  canApproveApplication(application: MembershipApplication): boolean {
    return ApplicationValidators.utils.canApproveApplication(application.status);
  }

  /**
   * Check minimum requirements for submission
   */
  checkMinimumRequirements(application: MembershipApplication): { valid: boolean; missing: string[] } {
    return ApplicationValidators.utils.meetsMinimumRequirements(application);
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An unexpected error occurred');
  }
}

// ============================================================================
// EXPORT INSTANCE
// ============================================================================

export const applicationApi = new ApplicationApiService();
export default applicationApi;
