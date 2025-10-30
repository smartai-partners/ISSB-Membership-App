import api from '../../services/api';
import {
  VolunteerOpportunity,
  VolunteerApplication,
  VolunteerOpportunityFilterSchema,
  VolunteerApplicationFilterSchema,
  VolunteerApplicationQuerySchema,
  VolunteerOpportunityQuerySchema,
  CreateVolunteerOpportunitySchema,
  UpdateVolunteerOpportunitySchema,
  ApplyForOpportunitySchema,
  UpdateApplicationSchema,
  ReviewApplicationSchema,
  ApiResponse,
  PaginatedResponse,
  DeepPartial,
  CreateInput,
  UpdateInput,
} from '@issb/types';

// ============================================================================
// VOLUNTEER OPPORTUNITY API
// ============================================================================

/**
 * Get all volunteer opportunities with filtering and pagination
 */
export const getVolunteerOpportunities = async (
  query: typeof VolunteerOpportunityQuerySchema._type
): Promise<PaginatedResponse<VolunteerOpportunity>> => {
  const validatedQuery = VolunteerOpportunityQuerySchema.parse(query);
  const response = await api.get<PaginatedResponse<VolunteerOpportunity>>(
    '/volunteer/opportunities',
    { params: validatedQuery }
  );
  return response.data;
};

/**
 * Get a single volunteer opportunity by ID
 */
export const getVolunteerOpportunity = async (
  id: string
): Promise<VolunteerOpportunity> => {
  const response = await api.get<VolunteerOpportunity>(
    `/volunteer/opportunities/${id}`
  );
  return response.data;
};

/**
 * Create a new volunteer opportunity
 */
export const createVolunteerOpportunity = async (
  opportunity: CreateInput<VolunteerOpportunity>
): Promise<VolunteerOpportunity> => {
  const validatedData = CreateVolunteerOpportunitySchema.parse(opportunity);
  const response = await api.post<VolunteerOpportunity>(
    '/volunteer/opportunities',
    validatedData
  );
  return response.data;
};

/**
 * Update a volunteer opportunity
 */
export const updateVolunteerOpportunity = async (
  id: string,
  updates: UpdateInput<VolunteerOpportunity>
): Promise<VolunteerOpportunity> => {
  const validatedData = UpdateVolunteerOpportunitySchema.parse(updates);
  const response = await api.patch<VolunteerOpportunity>(
    `/volunteer/opportunities/${id}`,
    validatedData
  );
  return response.data;
};

/**
 * Delete a volunteer opportunity
 */
export const deleteVolunteerOpportunity = async (
  id: string
): Promise<void> => {
  await api.delete(`/volunteer/opportunities/${id}`);
};

/**
 * Publish a volunteer opportunity (change status to ACTIVE)
 */
export const publishVolunteerOpportunity = async (
  id: string
): Promise<VolunteerOpportunity> => {
  const response = await api.post<VolunteerOpportunity>(
    `/volunteer/opportunities/${id}/publish`
  );
  return response.data;
};

/**
 * Archive a volunteer opportunity (change status to CANCELLED or EXPIRED)
 */
export const archiveVolunteerOpportunity = async (
  id: string,
  reason?: string
): Promise<VolunteerOpportunity> => {
  const response = await api.post<VolunteerOpportunity>(
    `/volunteer/opportunities/${id}/archive`,
    { reason }
  );
  return response.data;
};

/**
 * Get volunteer opportunities by user
 */
export const getUserVolunteerOpportunities = async (
  userId: string,
  query?: Partial<typeof VolunteerOpportunityQuerySchema._type>
): Promise<PaginatedResponse<VolunteerOpportunity>> => {
  const params = {
    ...query,
    createdBy: userId,
  };
  const response = await api.get<PaginatedResponse<VolunteerOpportunity>>(
    '/volunteer/opportunities',
    { params }
  );
  return response.data;
};

/**
 * Get recommended volunteer opportunities for a user
 */
export const getRecommendedOpportunities = async (
  userId: string,
  limit: number = 10
): Promise<VolunteerOpportunity[]> => {
  const response = await api.get<VolunteerOpportunity[]>(
    `/volunteer/opportunities/recommended/${userId}`,
    { params: { limit } }
  );
  return response.data;
};

// ============================================================================
// VOLUNTEER APPLICATION API
// ============================================================================

/**
 * Get volunteer applications with filtering and pagination
 */
export const getVolunteerApplications = async (
  query: typeof VolunteerApplicationQuerySchema._type
): Promise<PaginatedResponse<VolunteerApplication>> => {
  const validatedQuery = VolunteerApplicationQuerySchema.parse(query);
  const response = await api.get<PaginatedResponse<VolunteerApplication>>(
    '/volunteer/applications',
    { params: validatedQuery }
  );
  return response.data;
};

/**
 * Get a single volunteer application by ID
 */
export const getVolunteerApplication = async (
  id: string
): Promise<VolunteerApplication> => {
  const response = await api.get<VolunteerApplication>(
    `/volunteer/applications/${id}`
  );
  return response.data;
};

/**
 * Apply for a volunteer opportunity
 */
export const applyForVolunteerOpportunity = async (
  applicationData: CreateInput<VolunteerApplication>
): Promise<VolunteerApplication> => {
  const validatedData = ApplyForOpportunitySchema.parse(applicationData);
  const response = await api.post<VolunteerApplication>(
    '/volunteer/applications',
    validatedData
  );
  return response.data;
};

/**
 * Update a volunteer application
 */
export const updateVolunteerApplication = async (
  id: string,
  updates: UpdateInput<VolunteerApplication>
): Promise<VolunteerApplication> => {
  const validatedData = UpdateApplicationSchema.parse(updates);
  const response = await api.patch<VolunteerApplication>(
    `/volunteer/applications/${id}`,
    validatedData
  );
  return response.data;
};

/**
 * Withdraw a volunteer application
 */
export const withdrawVolunteerApplication = async (
  id: string,
  reason?: string
): Promise<VolunteerApplication> => {
  const response = await api.post<VolunteerApplication>(
    `/volunteer/applications/${id}/withdraw`,
    { reason }
  );
  return response.data;
};

/**
 * Review a volunteer application (for reviewers/admins)
 */
export const reviewVolunteerApplication = async (
  id: string,
  review: {
    decision: string;
    reviewNotes?: string;
    rating?: number;
    interviewRequired?: boolean;
    followUpRequired?: boolean;
  }
): Promise<VolunteerApplication> => {
  const validatedReview = ReviewApplicationSchema.parse({
    applicationId: id,
    ...review,
  });
  const response = await api.post<VolunteerApplication>(
    `/volunteer/applications/${id}/review`,
    validatedReview
  );
  return response.data;
};

/**
 * Bulk review multiple volunteer applications
 */
export const bulkReviewVolunteerApplications = async (
  reviews: Array<{
    applicationId: string;
    decision: string;
    reviewNotes?: string;
    rating?: number;
  }>
): Promise<VolunteerApplication[]> => {
  const validatedReviews = {
    reviews: reviews.map(review => ReviewApplicationSchema.parse(review)),
    notifyApplicants: true,
    sendFeedback: true,
  };
  const response = await api.post<VolunteerApplication[]>(
    '/volunteer/applications/bulk-review',
    validatedReviews
  );
  return response.data;
};

/**
 * Get user's volunteer applications
 */
export const getUserVolunteerApplications = async (
  userId: string
): Promise<VolunteerApplication[]> => {
  const response = await api.get<VolunteerApplication[]>(
    `/volunteer/applications/user/${userId}`
  );
  return response.data;
};

/**
 * Get applications for a specific opportunity
 */
export const getOpportunityApplications = async (
  opportunityId: string
): Promise<VolunteerApplication[]> => {
  const response = await api.get<VolunteerApplication[]>(
    `/volunteer/applications/opportunity/${opportunityId}`
  );
  return response.data;
};

// ============================================================================
// VOLUNTEER STATISTICS AND ANALYTICS
// ============================================================================

/**
 * Get volunteer opportunity statistics
 */
export const getVolunteerOpportunityStats = async (
  opportunityId: string
): Promise<{
  totalApplications: number;
  statusBreakdown: Record<string, number>;
  averageRating?: number;
  completionRate?: number;
}> => {
  const response = await api.get(
    `/volunteer/opportunities/${opportunityId}/stats`
  );
  return response.data;
};

/**
 * Get volunteer program statistics
 */
export const getVolunteerProgramStats = async (): Promise<{
  totalOpportunities: number;
  activeOpportunities: number;
  totalApplications: number;
  pendingApplications: number;
  monthlyStats: Array<{
    month: string;
    applications: number;
    opportunities: number;
  }>;
}> => {
  const response = await api.get('/volunteer/stats');
  return response.data;
};

/**
 * Get volunteer engagement analytics
 */
export const getVolunteerEngagementAnalytics = async (
  dateRange?: { startDate: Date; endDate: Date }
): Promise<{
  totalHours: number;
  totalVolunteers: number;
  opportunitiesCompleted: number;
  averageRating: number;
  monthlyData: Array<{
    month: string;
    hours: number;
    volunteers: number;
  }>;
}> => {
  const params = dateRange ? { ...dateRange } : {};
  const response = await api.get('/volunteer/analytics', { params });
  return response.data;
};

// ============================================================================
// VOLUNTEER PROFILE AND PREFERENCES
// ============================================================================

/**
 * Get volunteer profile
 */
export const getVolunteerProfile = async (
  userId: string
): Promise<{
  userId: string;
  skills: string[];
  interests: string[];
  availability: Array<{
    day: string;
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
  willingToTravel: boolean;
  maxTravelDistance?: number;
  backgroundCheckStatus: string;
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: Date;
    expiryDate?: Date;
    certificateNumber?: string;
    url?: string;
  }>;
}> => {
  const response = await api.get(`/volunteer/profile/${userId}`);
  return response.data;
};

/**
 * Update volunteer profile
 */
export const updateVolunteerProfile = async (
  userId: string,
  updates: DeepPartial<{
    skills: string[];
    interests: string[];
    availability: Array<{
      day: string;
      startTime: string;
      endTime: string;
      available: boolean;
    }>;
    willingToTravel: boolean;
    maxTravelDistance?: number;
    backgroundCheckStatus: string;
    certifications: Array<{
      name: string;
      issuingOrganization: string;
      issueDate: Date;
      expiryDate?: Date;
      certificateNumber?: string;
      url?: string;
    }>;
  }>
): Promise<void> => {
  await api.patch(`/volunteer/profile/${userId}`, updates);
};

/**
 * Get volunteer skill suggestions
 */
export const getSkillSuggestions = async (
  query: string
): Promise<string[]> => {
  const response = await api.get<string[]>(
    '/volunteer/skills/suggestions',
    { params: { query, limit: 10 } }
  );
  return response.data;
};

/**
 * Search volunteer opportunities by skills
 */
export const searchOpportunitiesBySkills = async (
  skills: string[],
  limit: number = 20
): Promise<VolunteerOpportunity[]> => {
  const response = await api.get<VolunteerOpportunity[]>(
    '/volunteer/opportunities/by-skills',
    { params: { skills: skills.join(','), limit } }
  );
  return response.data;
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const volunteerApi = {
  // Opportunities
  getOpportunities: getVolunteerOpportunities,
  getOpportunity: getVolunteerOpportunity,
  createOpportunity: createVolunteerOpportunity,
  updateOpportunity: updateVolunteerOpportunity,
  deleteOpportunity: deleteVolunteerOpportunity,
  publishOpportunity: publishVolunteerOpportunity,
  archiveOpportunity: archiveVolunteerOpportunity,
  getUserOpportunities: getUserVolunteerOpportunities,
  getRecommended: getRecommendedOpportunities,

  // Applications
  getApplications: getVolunteerApplications,
  getApplication: getVolunteerApplication,
  apply: applyForVolunteerOpportunity,
  updateApplication: updateVolunteerApplication,
  withdrawApplication: withdrawVolunteerApplication,
  reviewApplication: reviewVolunteerApplication,
  bulkReviewApplications: bulkReviewVolunteerApplications,
  getUserApplications: getUserVolunteerApplications,
  getOpportunityApplications: getOpportunityApplications,

  // Statistics and Analytics
  getOpportunityStats: getVolunteerOpportunityStats,
  getProgramStats: getVolunteerProgramStats,
  getEngagementAnalytics: getVolunteerEngagementAnalytics,

  // Profile and Preferences
  getProfile: getVolunteerProfile,
  updateProfile: updateVolunteerProfile,
  getSkillSuggestions: getSkillSuggestions,
  searchBySkills: searchOpportunitiesBySkills,
};

export default volunteerApi;
