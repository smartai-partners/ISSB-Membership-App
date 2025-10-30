import { Request, Response } from 'express';
import mongoose from 'mongoose';
import VolunteerOpportunity from '../models/VolunteerOpportunity';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  VolunteerOpportunity as IVolunteerOpportunity,
  VolunteerApplication as IVolunteerApplication,
  VolunteerType,
  OpportunityStatus,
  VolunteerApplicationStatus,
  MembershipTier,
  ApiResponse,
  PaginatedResponse
} from '@issb/types';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';

// ============================================================================
// VOLUNTEER OPPORTUNITY LISTING AND RETRIEVAL
// ============================================================================

/**
 * Get all volunteer opportunities with filtering and pagination
 * GET /api/volunteer/opportunities
 */
export const getOpportunities = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      tier,
      status,
      location,
      isRemote,
      startDate,
      endDate,
      organization,
      search,
      sortBy = 'startDate',
      sortOrder = 'asc'
    } = req.query;

    // Build filter query
    const filter: any = {};

    // Default to active opportunities for public access
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      filter.status = { $in: statuses as OpportunityStatus[] };
    } else {
      filter.status = { $in: [OpportunityStatus.ACTIVE, OpportunityStatus.FILLED] };
    }

    if (type) {
      const types = Array.isArray(type) ? type : [type];
      filter.type = { $in: types as VolunteerType[] };
    }

    if (tier) {
      const tiers = Array.isArray(tier) ? tier : [tier];
      filter.tier = { $in: tiers as MembershipTier[] };
    }

    if (location) {
      filter.location = new RegExp(location as string, 'i');
    }

    if (isRemote !== undefined) {
      filter.isRemote = isRemote === 'true';
    }

    if (startDate) {
      filter.startDate = { ...filter.startDate, $gte: new Date(startDate as string) };
    }

    if (endDate) {
      filter.endDate = { ...filter.endDate, $lte: new Date(endDate as string) };
    }

    if (organization) {
      filter.organization = new RegExp(organization as string, 'i');
    }

    if (search) {
      filter.$text = { $search: search as string };
    }

    // Build sort query
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);

    let query = VolunteerOpportunity.find(filter);

    // Apply text search if provided
    if (search) {
      query = VolunteerOpportunity.searchOpportunities(search as string, filter);
    } else {
      query = VolunteerOpportunity.find(filter);
    }

    const [opportunities, total] = await Promise.all([
      query
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      VolunteerOpportunity.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<PaginatedResponse<IVolunteerOpportunity>> = {
      success: true,
      data: {
        data: opportunities as IVolunteerOpportunity[],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching volunteer opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch volunteer opportunities',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Get single volunteer opportunity by ID
 * GET /api/volunteer/opportunities/:id
 */
export const getOpportunityById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format'
      });
      return;
    }

    const opportunity = await VolunteerOpportunity.findById(id)
      .populate('applications.applicantId', 'firstName lastName email')
      .lean();

    if (!opportunity) {
      res.status(404).json({
        success: false,
        message: 'Volunteer opportunity not found'
      });
      return;
    }

    // Log opportunity access
    logger.info('Volunteer opportunity accessed', {
      opportunityId: id,
      userId: (req as AuthenticatedRequest).user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<IVolunteerOpportunity> = {
      success: true,
      data: opportunity as IVolunteerOpportunity
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching volunteer opportunity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch volunteer opportunity',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Get active volunteer opportunities
 * GET /api/volunteer/opportunities/active
 */
export const getActiveOpportunities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tier, limit = 20 } = req.query;

    let query = VolunteerOpportunity.findActive(
      tier as MembershipTier
    );

    const opportunities = await query
      .limit(Number(limit))
      .sort({ startDate: 1 })
      .lean();

    const response: ApiResponse<IVolunteerOpportunity[]> = {
      success: true,
      data: opportunities as IVolunteerOpportunity[]
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching active opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active opportunities',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Get expiring volunteer opportunities
 * GET /api/volunteer/opportunities/expiring
 */
export const getExpiringOpportunities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 7, limit = 10 } = req.query;

    const opportunities = await VolunteerOpportunity.findExpiring(Number(days))
      .limit(Number(limit))
      .sort({ endDate: 1 })
      .lean();

    const response: ApiResponse<IVolunteerOpportunity[]> = {
      success: true,
      data: opportunities as IVolunteerOpportunity[]
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching expiring opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring opportunities',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

// ============================================================================
// VOLUNTEER OPPORTUNITY MANAGEMENT (ADMIN/BOARD)
// ============================================================================

/**
 * Create new volunteer opportunity
 * POST /api/volunteer/opportunities
 */
export const createOpportunity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Check if user has permission (admin or board)
    if (!['admin', 'board'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create volunteer opportunities'
      });
      return;
    }

    const opportunityData = req.body;

    // Validate dates
    const startDate = new Date(opportunityData.startDate);
    const endDate = new Date(opportunityData.endDate);
    const now = new Date();

    if (startDate <= now) {
      res.status(400).json({
        success: false,
        message: 'Start date must be in the future'
      });
      return;
    }

    if (endDate <= startDate) {
      res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
      return;
    }

    // Auto-set status to ACTIVE if start date is near
    if (startDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000)) { // Within 24 hours
      opportunityData.status = OpportunityStatus.ACTIVE;
    }

    const opportunity = new VolunteerOpportunity(opportunityData);
    await opportunity.save();

    // Log opportunity creation
    logger.info('Volunteer opportunity created', {
      opportunityId: opportunity._id.toString(),
      userId: req.user.id,
      opportunityTitle: opportunity.title,
      organization: opportunity.organization,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<IVolunteerOpportunity> = {
      success: true,
      data: opportunity.toObject() as IVolunteerOpportunity,
      message: 'Volunteer opportunity created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating volunteer opportunity:', error);

    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create volunteer opportunity',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Update volunteer opportunity
 * PUT /api/volunteer/opportunities/:id
 */
export const updateOpportunity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format'
      });
      return;
    }

    const opportunity = await VolunteerOpportunity.findById(id);

    if (!opportunity) {
      res.status(404).json({
        success: false,
        message: 'Volunteer opportunity not found'
      });
      return;
    }

    // Check permissions (admin/board can update any, others need permission)
    if (!['admin', 'board'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update volunteer opportunities'
      });
      return;
    }

    // Check if opportunity can be edited (not expired or filled)
    if ([OpportunityStatus.EXPIRED].includes(opportunity.status)) {
      res.status(400).json({
        success: false,
        message: 'Cannot update expired opportunities'
      });
      return;
    }

    // Validate dates if provided
    if (req.body.startDate || req.body.endDate) {
      const startDate = new Date(req.body.startDate || opportunity.startDate);
      const endDate = new Date(req.body.endDate || opportunity.endDate);
      const now = new Date();

      if (startDate <= now && req.body.startDate) {
        res.status(400).json({
          success: false,
          message: 'Start date must be in the future'
        });
        return;
      }

      if (endDate <= startDate) {
        res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
        return;
      }
    }

    // Update opportunity
    Object.assign(opportunity, req.body);
    await opportunity.save();

    // Log opportunity update
    logger.info('Volunteer opportunity updated', {
      opportunityId: opportunity._id.toString(),
      userId: req.user.id,
      opportunityTitle: opportunity.title,
      changes: Object.keys(req.body),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<IVolunteerOpportunity> = {
      success: true,
      data: opportunity.toObject() as IVolunteerOpportunity,
      message: 'Volunteer opportunity updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating volunteer opportunity:', error);

    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update volunteer opportunity',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Delete volunteer opportunity
 * DELETE /api/volunteer/opportunities/:id
 */
export const deleteOpportunity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format'
      });
      return;
    }

    const opportunity = await VolunteerOpportunity.findById(id);

    if (!opportunity) {
      res.status(404).json({
        success: false,
        message: 'Volunteer opportunity not found'
      });
      return;
    }

    // Check permissions
    if (!['admin', 'board'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete volunteer opportunities'
      });
      return;
    }

    // Check if opportunity has active applications
    const activeApplications = opportunity.applications?.filter(
      app => [VolunteerApplicationStatus.PENDING, VolunteerApplicationStatus.REVIEWING, VolunteerApplicationStatus.ACCEPTED].includes(app.status)
    ).length || 0;

    if (activeApplications > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete opportunity with active applications. Please review applications first.'
      });
      return;
    }

    // Delete opportunity
    await VolunteerOpportunity.findByIdAndDelete(id);

    // Log opportunity deletion
    logger.info('Volunteer opportunity deleted', {
      opportunityId: opportunity._id.toString(),
      userId: req.user.id,
      opportunityTitle: opportunity.title,
      organization: opportunity.organization,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Volunteer opportunity deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting volunteer opportunity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete volunteer opportunity',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Mark opportunity as filled
 * PUT /api/volunteer/opportunities/:id/fill
 */
export const markOpportunityAsFilled = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format'
      });
      return;
    }

    const opportunity = await VolunteerOpportunity.findById(id);

    if (!opportunity) {
      res.status(404).json({
        success: false,
        message: 'Volunteer opportunity not found'
      });
      return;
    }

    // Check permissions
    if (!['admin', 'board'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update volunteer opportunities'
      });
      return;
    }

    await opportunity.markAsFilled();

    // Log opportunity status change
    logger.info('Volunteer opportunity marked as filled', {
      opportunityId: opportunity._id.toString(),
      userId: req.user.id,
      opportunityTitle: opportunity.title,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<IVolunteerOpportunity> = {
      success: true,
      data: opportunity.toObject() as IVolunteerOpportunity,
      message: 'Volunteer opportunity marked as filled'
    };

    res.json(response);
  } catch (error) {
    console.error('Error marking opportunity as filled:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark opportunity as filled',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

// ============================================================================
// VOLUNTEER APPLICATION MANAGEMENT
// ============================================================================

/**
 * Apply for a volunteer opportunity
 * POST /api/volunteer/opportunities/:id/apply
 */
export const applyForOpportunity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format'
      });
      return;
    }

    const opportunity = await VolunteerOpportunity.findById(id);

    if (!opportunity) {
      res.status(404).json({
        success: false,
        message: 'Volunteer opportunity not found'
      });
      return;
    }

    // Check if application is possible
    if (!opportunity.canApply()) {
      if (opportunity.isExpired()) {
        res.status(400).json({
          success: false,
          message: 'This volunteer opportunity has expired'
        });
        return;
      }

      if (opportunity.status === OpportunityStatus.FILLED) {
        res.status(400).json({
          success: false,
          message: 'This volunteer opportunity has been filled'
        });
        return;
      }

      if (opportunity.status !== OpportunityStatus.ACTIVE) {
        res.status(400).json({
          success: false,
          message: 'Applications are not currently being accepted for this opportunity'
        });
        return;
      }
    }

    // Check if user has already applied
    const existingApplication = opportunity.applications?.find(
      app => app.applicantId.toString() === req.user!.id
    );

    if (existingApplication) {
      if ([VolunteerApplicationStatus.PENDING, VolunteerApplicationStatus.REVIEWING].includes(existingApplication.status)) {
        res.status(400).json({
          success: false,
          message: 'You have already applied for this opportunity and your application is being reviewed'
        });
        return;
      }

      if (existingApplication.status === VolunteerApplicationStatus.ACCEPTED) {
        res.status(400).json({
          success: false,
          message: 'Your application for this opportunity has already been accepted'
        });
        return;
      }

      if (existingApplication.status === VolunteerApplicationStatus.DECLINED) {
        res.status(400).json({
          success: false,
          message: 'Your application for this opportunity was declined'
        });
        return;
      }

      if (existingApplication.status === VolunteerApplicationStatus.WITHDRAWN) {
        // Allow re-application for withdrawn applications
        // Update existing application instead of creating new one
        existingApplication.status = VolunteerApplicationStatus.PENDING;
        existingApplication.motivation = req.body.motivation;
        existingApplication.relevantExperience = req.body.relevantExperience;
        existingApplication.availability = req.body.availability;
        existingApplication.skillsOffered = req.body.skillsOffered || [];
        existingApplication.submittedAt = new Date();
        existingApplication.reviewedAt = undefined;
        existingApplication.reviewedBy = undefined;
        existingApplication.reviewNotes = undefined;

        await opportunity.save();

        // Log application update
        logger.info('Volunteer application re-submitted', {
          opportunityId: id,
          applicationId: existingApplication._id?.toString(),
          userId: req.user.id,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        const response: ApiResponse<IVolunteerApplication> = {
          success: true,
          data: existingApplication as IVolunteerApplication,
          message: 'Application re-submitted successfully'
        };

        res.json(response);
        return;
      }
    }

    // Create new application
    const application = {
      opportunityId: id,
      applicantId: req.user.id,
      motivation: req.body.motivation,
      relevantExperience: req.body.relevantExperience,
      availability: req.body.availability,
      skillsOffered: req.body.skillsOffered || [],
      status: VolunteerApplicationStatus.PENDING
    };

    // Add application to opportunity
    if (!opportunity.applications) {
      opportunity.applications = [];
    }
    opportunity.applications.push(application);

    await opportunity.save();

    // Log application submission
    logger.info('Volunteer application submitted', {
      opportunityId: id,
      userId: req.user.id,
      organization: opportunity.organization,
      opportunityTitle: opportunity.title,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<IVolunteerApplication> = {
      success: true,
      data: application as IVolunteerApplication,
      message: 'Application submitted successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error applying for volunteer opportunity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Withdraw volunteer application
 * DELETE /api/volunteer/opportunities/:id/apply
 */
export const withdrawApplication = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format'
      });
      return;
    }

    const opportunity = await VolunteerOpportunity.findById(id);

    if (!opportunity) {
      res.status(404).json({
        success: false,
        message: 'Volunteer opportunity not found'
      });
      return;
    }

    // Find user's application
    const applicationIndex = opportunity.applications?.findIndex(
      app => app.applicantId.toString() === req.user!.id
    );

    if (applicationIndex === -1 || applicationIndex === undefined) {
      res.status(404).json({
        success: false,
        message: 'Application not found'
      });
      return;
    }

    const application = opportunity.applications![applicationIndex];

    if (application.status === VolunteerApplicationStatus.ACCEPTED) {
      res.status(400).json({
        success: false,
        message: 'Cannot withdraw an accepted application'
      });
      return;
    }

    if (application.status === VolunteerApplicationStatus.WITHDRAWN) {
      res.status(400).json({
        success: false,
        message: 'Application is already withdrawn'
      });
      return;
    }

    // Update application status
    application.status = VolunteerApplicationStatus.WITHDRAWN;
    await opportunity.save();

    // Log application withdrawal
    logger.info('Volunteer application withdrawn', {
      opportunityId: id,
      userId: req.user.id,
      previousStatus: application.status,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Application withdrawn successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error withdrawing application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw application',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Get user's volunteer applications
 * GET /api/volunteer/applications/my
 */
export const getMyApplications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { status, limit = 20, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Find opportunities where user has applications
    const filter: any = {
      'applications.applicantId': req.user.id
    };

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      filter['applications.status'] = { $in: statuses as VolunteerApplicationStatus[] };
    }

    const opportunities = await VolunteerOpportunity.find(filter)
      .select('title organization type tier status startDate endDate location isRemote skillsRequired commitment applications.$')
      .sort({ 'applications.submittedAt': -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Extract applications for this user
    const applications = opportunities
      .map(opp => {
        const userApp = opp.applications?.find(app => app.applicantId.toString() === req.user!.id);
        return userApp ? {
          ...userApp,
          opportunity: {
            id: opp._id,
            title: opp.title,
            organization: opp.organization,
            type: opp.type,
            tier: opp.tier,
            status: opp.status,
            startDate: opp.startDate,
            endDate: opp.endDate,
            location: opp.location,
            isRemote: opp.isRemote,
            skillsRequired: opp.skillsRequired,
            commitment: opp.commitment
          }
        } : null;
      })
      .filter(app => app !== null);

    const total = await VolunteerOpportunity.countDocuments(filter);
    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: applications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your applications',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

// ============================================================================
// APPLICATION REVIEW AND MANAGEMENT (ADMIN/BOARD)
// ============================================================================

/**
 * Get all volunteer applications with filtering
 * GET /api/volunteer/applications
 */
export const getApplications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Check permissions
    if (!['admin', 'board'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view applications'
      });
      return;
    }

    const {
      page = 1,
      limit = 20,
      status,
      opportunityId,
      organization,
      search,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build filter
    const filter: any = {};

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      filter['applications.status'] = { $in: statuses as VolunteerApplicationStatus[] };
    }

    if (opportunityId) {
      filter._id = opportunityId;
    }

    if (organization) {
      filter.organization = new RegExp(organization as string, 'i');
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search as string, 'i') },
        { 'applications.motivation': new RegExp(search as string, 'i') },
        { 'applications.relevantExperience': new RegExp(search as string, 'i') }
      ];
    }

    // Build sort query
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const opportunities = await VolunteerOpportunity.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('applications.applicantId', 'firstName lastName email')
      .lean();

    // Extract and flatten applications
    const applications = opportunities
      .flatMap(opp => {
        return (opp.applications || [])
          .filter(app => !status || (status as string[]).includes(app.status))
          .map(app => ({
            ...app,
            opportunity: {
              id: opp._id,
              title: opp.title,
              organization: opp.organization,
              type: opp.type,
              tier: opp.tier,
              startDate: opp.startDate,
              endDate: opp.endDate,
              location: opp.location,
              isRemote: opp.isRemote
            }
          }));
      });

    const total = await VolunteerOpportunity.countDocuments(filter);

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: applications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
          hasNext: Number(page) < Math.ceil(total / Number(limit)),
          hasPrev: Number(page) > 1
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Review volunteer application
 * PUT /api/volunteer/applications/:id/review
 */
export const reviewApplication = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Check permissions
    if (!['admin', 'board'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to review applications'
      });
      return;
    }

    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid application ID format'
      });
      return;
    }

    if (![VolunteerApplicationStatus.ACCEPTED, VolunteerApplicationStatus.DECLINED, VolunteerApplicationStatus.REVIEWING].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid review status'
      });
      return;
    }

    // Find the opportunity containing this application
    const opportunity = await VolunteerOpportunity.findOne({
      'applications._id': id
    });

    if (!opportunity) {
      res.status(404).json({
        success: false,
        message: 'Application not found'
      });
      return;
    }

    // Find the specific application
    const application = opportunity.applications?.find(app => app._id?.toString() === id);

    if (!application) {
      res.status(404).json({
        success: false,
        message: 'Application not found'
      });
      return;
    }

    // Update application
    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;
    application.reviewNotes = reviewNotes;

    await opportunity.save();

    // If application is accepted and opportunity is not filled, mark as filled
    if (status === VolunteerApplicationStatus.ACCEPTED && opportunity.status !== OpportunityStatus.FILLED) {
      await opportunity.markAsFilled();
    }

    // Log application review
    logger.info('Volunteer application reviewed', {
      opportunityId: opportunity._id.toString(),
      applicationId: id,
      reviewerId: req.user.id,
      applicantId: application.applicantId,
      status: status,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<IVolunteerApplication> = {
      success: true,
      data: application as IVolunteerApplication,
      message: 'Application reviewed successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error reviewing application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review application',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Get applications for a specific opportunity
 * GET /api/volunteer/opportunities/:id/applications
 */
export const getOpportunityApplications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;
    const { status, limit = 20, page = 1 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format'
      });
      return;
    }

    const opportunity = await VolunteerOpportunity.findById(id)
      .populate('applications.applicantId', 'firstName lastName email');

    if (!opportunity) {
      res.status(404).json({
        success: false,
        message: 'Volunteer opportunity not found'
      });
      return;
    }

    // Check permissions
    if (!['admin', 'board'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view applications'
      });
      return;
    }

    let applications = opportunity.applications || [];

    // Filter by status if provided
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      applications = applications.filter(app => statuses.includes(app.status));
    }

    const skip = (Number(page) - 1) * Number(limit);
    const paginatedApplications = applications
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(skip, skip + Number(limit));

    const response: ApiResponse<PaginatedResponse<IVolunteerApplication>> = {
      success: true,
      data: {
        data: paginatedApplications as IVolunteerApplication[],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: applications.length,
          totalPages: Math.ceil(applications.length / Number(limit)),
          hasNext: Number(page) < Math.ceil(applications.length / Number(limit)),
          hasPrev: Number(page) > 1
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching opportunity applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch opportunity applications',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get volunteer opportunity statistics
 * GET /api/volunteer/opportunities/stats
 */
export const getOpportunityStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await VolunteerOpportunity.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalApplications: { $sum: { $size: { $ifNull: ['$applications', []] } } }
        }
      }
    ]);

    const response: ApiResponse<any> = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching opportunity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch opportunity statistics',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Get application statistics
 * GET /api/volunteer/applications/stats
 */
export const getApplicationStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Check permissions
    if (!['admin', 'board'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view application statistics'
      });
      return;
    }

    const stats = await VolunteerOpportunity.aggregate([
      { $unwind: '$applications' },
      {
        $group: {
          _id: '$applications.status',
          count: { $sum: 1 }
        }
      }
    ]);

    const response: ApiResponse<any> = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application statistics',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};
