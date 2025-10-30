import { Request, Response, NextFunction } from 'express';
import mongoose, { Document } from 'mongoose';
import MembershipApplication from '../models/MembershipApplication';
import User from '../models/User';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, authenticate, authorize } from '../middleware/auth';
import {
  ApplicationStatus,
  MembershipTier,
  UserRole,
  ApiResponse,
  PaginatedResponse,
  ApplicationFilter,
  CreateInput,
  UpdateInput,
  MembershipApplication as IMembershipApplication
} from '@issb/types';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface ApplicationListQuery extends ApplicationFilter {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ApplicationReviewRequest {
  comments?: string;
  documentsReviewed?: boolean;
  credentialsVerified?: boolean;
  referencesContacted?: boolean;
}

interface ApplicationDecisionRequest {
  comments: string;
}

// ============================================================================
// CONTROLLER CLASS
// ============================================================================

class ApplicationController {
  // ============================================================================
  // PUBLIC ENDPOINTS - NO AUTHENTICATION REQUIRED
  // ============================================================================

  /**
   * Create a new membership application
   * POST /api/applications
   * Access: Public
   */
  public createApplication = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Generate application ID if not provided
    const applicationData: CreateInput<IMembershipApplication> = {
      ...req.body,
      applicantId: req.user?.id || 'anonymous', // Will be updated after auth
    };

    // Check if user already has a draft application
    if (req.user?.id) {
      const existingDraft = await MembershipApplication.findOne({
        applicantId: req.user.id,
        status: ApplicationStatus.DRAFT,
      });

      if (existingDraft) {
        throw new AppError('You already have a draft application. Please complete it first.', 409);
      }
    }

    const application = new MembershipApplication(applicationData);
    await application.save();

    const response: ApiResponse<IMembershipApplication> = {
      success: true,
      data: application.toObject(),
      message: 'Application created successfully. Please complete all required fields and submit.',
    };

    res.status(201).json(response);
  });

  // ============================================================================
  // AUTHENTICATED USER ENDPOINTS
  // ============================================================================

  /**
   * Get user's applications
   * GET /api/applications/my-applications
   * Access: Private (Authenticated users)
   */
  public getMyApplications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Access denied. User not authenticated.', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {
      applicantId: req.user.id,
    };

    // Add status filter if provided
    if (req.query.status) {
      filter.status = { $in: (req.query.status as string).split(',') };
    }

    // Add search functionality
    if (req.query.search) {
      filter.$or = [
        { 'personalInfo.occupation': { $regex: req.query.search, $options: 'i' } },
        { 'personalInfo.location': { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Sort configuration
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [applications, total] = await Promise.all([
      MembershipApplication.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('applicantId', 'firstName lastName email')
        .lean(),
      MembershipApplication.countDocuments(filter),
    ]);

    const response: PaginatedResponse<IMembershipApplication> = {
      data: applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };

    res.status(200).json({
      success: true,
      data: response.data,
      meta: response.pagination,
    });
  });

  /**
   * Get application by ID
   * GET /api/applications/:id
   * Access: Private (Owner or Admin/Board)
   */
  public getApplicationById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Access denied. User not authenticated.', 401);
    }

    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid application ID format.', 400);
    }

    const application = await MembershipApplication.findById(id)
      .populate('applicantId', 'firstName lastName email phone')
      .populate('reviewedBy', 'firstName lastName email');

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    // Check access permissions
    const isOwner = application.applicantId.toString() === req.user.id;
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isBoard = req.user.role === UserRole.BOARD;

    if (!isOwner && !isAdmin && !isBoard) {
      throw new AppError('Access denied. You can only view your own applications.', 403);
    }

    // Get user details for response
    const user = await User.findById(req.user.id).select('firstName lastName email role tier');

    const response: ApiResponse<IMembershipApplication & { canEdit: boolean; canSubmit: boolean }> = {
      success: true,
      data: {
        ...application.toObject(),
        canEdit: application.status === ApplicationStatus.DRAFT && isOwner,
        canSubmit: application.status === ApplicationStatus.DRAFT && isOwner,
      },
    };

    res.status(200).json(response);
  });

  /**
   * Update application
   * PUT /api/applications/:id
   * Access: Private (Owner or Admin/Board)
   */
  public updateApplication = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Access denied. User not authenticated.', 401);
    }

    const { id } = req.params;
    const updateData: UpdateInput<IMembershipApplication> = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid application ID format.', 400);
    }

    const application = await MembershipApplication.findById(id);

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    // Check access permissions
    const isOwner = application.applicantId.toString() === req.user.id;
    const isAdmin = req.user.role === UserRole.ADMIN;
    const isBoard = req.user.role === UserRole.BOARD;

    if (!isOwner && !isAdmin && !isBoard) {
      throw new AppError('Access denied. You can only edit your own applications.', 403);
    }

    // Only allow editing if application is in DRAFT status
    if (application.status !== ApplicationStatus.DRAFT && !isAdmin && !isBoard) {
      throw new AppError('Application cannot be edited after submission. Contact an administrator.', 400);
    }

    // Update the application
    Object.assign(application, updateData);
    await application.save();

    const response: ApiResponse<IMembershipApplication> = {
      success: true,
      data: application.toObject(),
      message: 'Application updated successfully.',
    };

    res.status(200).json(response);
  });

  /**
   * Submit application
   * POST /api/applications/:id/submit
   * Access: Private (Owner only)
   */
  public submitApplication = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Access denied. User not authenticated.', 401);
    }

    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid application ID format.', 400);
    }

    const application = await MembershipApplication.findById(id);

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    // Check ownership
    if (application.applicantId.toString() !== req.user.id) {
      throw new AppError('Access denied. You can only submit your own application.', 403);
    }

    // Validate application completeness before submission
    this.validateApplicationForSubmission(application);

    // Mark as submitted
    await application.markAsSubmitted();

    const response: ApiResponse<IMembershipApplication> = {
      success: true,
      data: application.toObject(),
      message: 'Application submitted successfully. You will be notified of the review decision.',
    };

    res.status(200).json(response);
  });

  // ============================================================================
  // ADMIN/BOARD ENDPOINTS
  // ============================================================================

  /**
   * List all applications with filters
   * GET /api/applications
   * Access: Private (Admin/Board only)
   */
  public listApplications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Authorization check is done in route middleware
    const query = req.query as ApplicationListQuery;

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    if (query.status && query.status.length > 0) {
      filter.status = Array.isArray(query.status) 
        ? { $in: query.status } 
        : { $in: (query.status as string).split(',') };
    }

    if (query.applicationType && query.applicationType.length > 0) {
      filter.applicationType = Array.isArray(query.applicationType)
        ? { $in: query.applicationType }
        : { $in: (query.applicationType as string).split(',') };
    }

    // Add date range filter
    if (query.dateRange?.start && query.dateRange?.end) {
      filter.createdAt = {
        $gte: new Date(query.dateRange.start),
        $lte: new Date(query.dateRange.end),
      };
    }

    // Add search functionality
    if (query.search) {
      filter.$or = [
        { 'personalInfo.occupation': { $regex: query.search, $options: 'i' } },
        { 'personalInfo.location': { $regex: query.search, $options: 'i' } },
        { 'personalInfo.organization': { $regex: query.search, $options: 'i' } },
      ];
    }

    // Sort configuration
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    const [applications, total] = await Promise.all([
      MembershipApplication.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('applicantId', 'firstName lastName email phone')
        .populate('reviewedBy', 'firstName lastName email')
        .lean(),
      MembershipApplication.countDocuments(filter),
    ]);

    const response: PaginatedResponse<IMembershipApplication> = {
      data: applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };

    res.status(200).json({
      success: true,
      data: response.data,
      meta: response.pagination,
    });
  });

  /**
   * Start application review
   * POST /api/applications/:id/review
   * Access: Private (Admin/Board only)
   */
  public startReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Access denied. User not authenticated.', 401);
    }

    const { id } = req.params;
    const reviewData: ApplicationReviewRequest = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid application ID format.', 400);
    }

    const application = await MembershipApplication.findById(id);

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    if (!application.canBeReviewed()) {
      throw new AppError('Application cannot be reviewed in its current status.', 400);
    }

    // Start the review process
    await application.markAsUnderReview(req.user.id);

    // Update review comments if provided
    if (reviewData.comments) {
      application.reviewComments = reviewData.comments;
      await application.save();
    }

    const response: ApiResponse<IMembershipApplication> = {
      success: true,
      data: application.toObject(),
      message: 'Application review started successfully.',
    };

    res.status(200).json(response);
  });

  /**
   * Approve application
   * PUT /api/applications/:id/approve
   * Access: Private (Admin/Board only)
   */
  public approveApplication = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Access denied. User not authenticated.', 401);
    }

    const { id } = req.params;
    const { comments }: ApplicationDecisionRequest = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid application ID format.', 400);
    }

    const application = await MembershipApplication.findById(id);

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    if (application.status === ApplicationStatus.APPROVED) {
      throw new AppError('Application is already approved.', 400);
    }

    // Approve the application
    await application.approve(req.user.id, comments);

    // TODO: Trigger membership creation and welcome email
    // await this.createMembershipForApprovedApplication(application);

    const response: ApiResponse<IMembershipApplication> = {
      success: true,
      data: application.toObject(),
      message: 'Application approved successfully. The applicant will be notified.',
    };

    res.status(200).json(response);
  });

  /**
   * Reject application
   * PUT /api/applications/:id/reject
   * Access: Private (Admin/Board only)
   */
  public rejectApplication = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Access denied. User not authenticated.', 401);
    }

    const { id } = req.params;
    const { comments }: ApplicationDecisionRequest = req.body;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid application ID format.', 400);
    }

    if (!comments || comments.trim().length === 0) {
      throw new AppError('Comments are required when rejecting an application.', 400);
    }

    const application = await MembershipApplication.findById(id);

    if (!application) {
      throw new AppError('Application not found.', 404);
    }

    if (application.status === ApplicationStatus.REJECTED) {
      throw new AppError('Application is already rejected.', 400);
    }

    // Reject the application
    await application.reject(req.user.id, comments);

    const response: ApiResponse<IMembershipApplication> = {
      success: true,
      data: application.toObject(),
      message: 'Application rejected. The applicant will be notified with feedback.',
    };

    res.status(200).json(response);
  });

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Validate application completeness before submission
   */
  private validateApplicationForSubmission(application: any): void {
    const errors: string[] = [];

    // Check required personal information
    if (!application.personalInfo?.location) {
      errors.push('Location is required');
    }
    if (!application.personalInfo?.occupation) {
      errors.push('Occupation is required');
    }

    // Check required professional information
    if (application.professionalInfo?.yearsOfExperience === undefined) {
      errors.push('Years of experience is required');
    }
    if (!application.professionalInfo?.currentRole) {
      errors.push('Current role is required');
    }
    if (!application.professionalInfo?.reference1) {
      errors.push('First reference is required');
    }
    if (!application.professionalInfo?.reference2) {
      errors.push('Second reference is required');
    }

    // Check for at least one document
    if (!application.documents || application.documents.length === 0) {
      errors.push('At least one document must be uploaded');
    }

    // Check application type
    if (!application.applicationType) {
      errors.push('Application type must be selected');
    }

    if (errors.length > 0) {
      throw new AppError(`Application incomplete: ${errors.join(', ')}`, 400);
    }
  }

  /**
   * Get application statistics (for admin dashboard)
   * GET /api/applications/stats
   * Access: Private (Admin/Board only)
   */
  public getApplicationStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await MembershipApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    // Get applications by type
    const typeStats = await MembershipApplication.aggregate([
      {
        $group: {
          _id: '$applicationType',
          count: { $sum: 1 },
        },
      },
    ]);

    const typeStatsMap = typeStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    // Get recent applications
    const recentApplications = await MembershipApplication.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('applicantId', 'firstName lastName email')
      .select('applicationType status createdAt')
      .lean();

    const response: ApiResponse<{
      statusBreakdown: Record<string, number>;
      typeBreakdown: Record<string, number>;
      recentApplications: any[];
      totalApplications: number;
    }> = {
      success: true,
      data: {
        statusBreakdown: statsMap,
        typeBreakdown: typeStatsMap,
        recentApplications,
        totalApplications: Object.values(statsMap).reduce((sum, count) => sum + count, 0),
      },
    };

    res.status(200).json(response);
  });
}

// Export singleton instance
export default new ApplicationController();

// Export class for testing
export { ApplicationController };
