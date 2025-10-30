import mongoose, { FilterQuery, QueryOptions } from 'mongoose';
import MembershipApplication from '../models/MembershipApplication';
import User from '../models/User';
import { sendEmail } from './emailService';
import { logger } from '../config/logger';
import {
  ApplicationStatus,
  MembershipTier,
  ApplicationFilter,
  PaginatedResponse,
  ApplicationReview,
  Reference,
  Document
} from '@issb/types';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface CreateApplicationData {
  applicantId: string;
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
  documents?: Document[];
}

export interface UpdateApplicationData {
  personalInfo?: CreateApplicationData['personalInfo'];
  professionalInfo?: CreateApplicationData['professionalInfo'];
  documents?: Document[];
}

export interface ReviewApplicationData {
  reviewerId: string;
  decision: 'approve' | 'reject' | 'request_more_info';
  comments?: string;
}

export interface ApplicationStatistics {
  totalApplications: number;
  statusCounts: Record<ApplicationStatus, number>;
  tierCounts: Record<MembershipTier, number>;
  averageReviewTime: number;
  monthlyApplications: Array<{
    month: string;
    count: number;
    approved: number;
    rejected: number;
  }>;
  commonIssues: Array<{
    issue: string;
    count: number;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  errors: string[];
  completenessPercentage: number;
}

// ============================================================================
// APPLICATION SERVICE CLASS
// ============================================================================

class ApplicationService {
  /**
   * Create a new membership application
   */
  async createApplication(data: CreateApplicationData): Promise<any> {
    try {
      // Check if user already has an application
      const existingApplication = await MembershipApplication.findOne({
        applicantId: data.applicantId
      });

      if (existingApplication) {
        const error = new Error('User already has an application in progress');
        error.name = 'DuplicateApplicationError';
        throw error;
      }

      // Verify user exists
      const user = await User.findById(data.applicantId);
      if (!user) {
        const error = new Error('Applicant user not found');
        error.name = 'UserNotFoundError';
        throw error;
      }

      // Create application
      const application = new MembershipApplication({
        applicantId: data.applicantId,
        applicationType: data.applicationType,
        personalInfo: data.personalInfo,
        professionalInfo: data.professionalInfo,
        documents: data.documents || [],
        status: ApplicationStatus.DRAFT
      });

      await application.save();

      logger.info('Application created successfully', {
        applicationId: application._id,
        applicantId: data.applicantId,
        applicationType: data.applicationType
      });

      return application;
    } catch (error) {
      logger.error('Failed to create application:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        applicantId: data.applicantId
      });
      throw error;
    }
  }

  /**
   * Update an existing application
   */
  async updateApplication(
    applicationId: string,
    userId: string,
    updates: UpdateApplicationData
  ): Promise<any> {
    try {
      const application = await MembershipApplication.findById(applicationId);
      
      if (!application) {
        const error = new Error('Application not found');
        error.name = 'ApplicationNotFoundError';
        throw error;
      }

      // Check if user owns the application
      if (application.applicantId.toString() !== userId) {
        const error = new Error('Unauthorized to update this application');
        error.name = 'UnauthorizedError';
        throw error;
      }

      // Check if application can be edited
      if (application.status !== ApplicationStatus.DRAFT && 
          application.status !== ApplicationStatus.PENDING_DOCUMENTS) {
        const error = new Error('Application cannot be edited in current status');
        error.name = 'InvalidStatusError';
        throw error;
      }

      // Apply updates
      if (updates.personalInfo) {
        application.personalInfo = { ...application.personalInfo, ...updates.personalInfo };
      }

      if (updates.professionalInfo) {
        application.professionalInfo = { ...application.professionalInfo, ...updates.professionalInfo };
      }

      if (updates.documents) {
        application.documents = updates.documents;
      }

      await application.save();

      logger.info('Application updated successfully', {
        applicationId,
        userId,
        updatedFields: Object.keys(updates)
      });

      return application;
    } catch (error) {
      logger.error('Failed to update application:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        applicationId,
        userId
      });
      throw error;
    }
  }

  /**
   * Submit an application for review
   */
  async submitApplication(applicationId: string, userId: string): Promise<any> {
    try {
      const application = await MembershipApplication.findById(applicationId);
      
      if (!application) {
        const error = new Error('Application not found');
        error.name = 'ApplicationNotFoundError';
        throw error;
      }

      // Check ownership
      if (application.applicantId.toString() !== userId) {
        const error = new Error('Unauthorized to submit this application');
        error.name = 'UnauthorizedError';
        throw error;
      }

      // Validate application completeness
      const validation = await this.validateApplicationCompleteness(applicationId);
      if (!validation.isValid) {
        const error = new Error(`Application incomplete: ${validation.errors.join(', ')}`);
        error.name = 'IncompleteApplicationError';
        error.details = validation;
        throw error;
      }

      // Update status
      await application.markAsSubmitted();

      // Send confirmation email
      const user = await User.findById(userId);
      if (user) {
        await sendEmail({
          to: user.email,
          subject: 'Application Submitted - ISSB Membership Portal',
          html: `
            <h1>Application Submitted Successfully</h1>
            <p>Dear ${user.firstName} ${user.lastName},</p>
            <p>Your membership application has been submitted successfully and is now under review.</p>
            <p><strong>Application Type:</strong> ${application.applicationType}</p>
            <p><strong>Submitted Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p>You will be notified once the review process is complete.</p>
            <p>Thank you for your interest in ISSB membership!</p>
          `
        });
      }

      logger.info('Application submitted successfully', {
        applicationId,
        userId,
        validationScore: validation.completenessPercentage
      });

      return application;
    } catch (error) {
      logger.error('Failed to submit application:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        applicationId,
        userId
      });
      throw error;
    }
  }

  /**
   * Start review process for an application
   */
  async reviewApplication(applicationId: string, reviewerId: string): Promise<any> {
    try {
      const application = await MembershipApplication.findById(applicationId);
      
      if (!application) {
        const error = new Error('Application not found');
        error.name = 'ApplicationNotFoundError';
        throw error;
      }

      if (!application.canBeReviewed()) {
        const error = new Error('Application cannot be reviewed in current status');
        error.name = 'InvalidStatusError';
        throw error;
      }

      await application.markAsUnderReview(reviewerId);

      // Send notification to applicant
      const user = await User.findById(application.applicantId);
      if (user) {
        await sendEmail({
          to: user.email,
          subject: 'Application Under Review - ISSB',
          html: `
            <h1>Your Application is Under Review</h1>
            <p>Dear ${user.firstName} ${user.lastName},</p>
            <p>Your membership application has been assigned to a reviewer and is now under active review.</p>
            <p>This process typically takes 5-7 business days. We will notify you of the decision once the review is complete.</p>
          `
        });
      }

      logger.info('Application review started', {
        applicationId,
        reviewerId
      });

      return application;
    } catch (error) {
      logger.error('Failed to start application review:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        applicationId,
        reviewerId
      });
      throw error;
    }
  }

  /**
   * Approve an application
   */
  async approveApplication(
    applicationId: string,
    reviewerId: string,
    comments?: string
  ): Promise<any> {
    try {
      const session = await mongoose.startSession();
      let result;

      await session.withTransaction(async () => {
        const application = await MembershipApplication.findById(applicationId)
          .populate('applicantId')
          .session(session);

        if (!application) {
          throw new Error('Application not found');
        }

        if (!application.isUnderReview() && !application.isSubmitted()) {
          throw new Error('Application is not in reviewable status');
        }

        // Approve the application
        await application.approve(reviewerId, comments);

        // Create membership record for approved user
        const user = application.applicantId as any;
        const membershipData = {
          userId: user._id,
          tier: application.applicationType,
          status: 'active' as any,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          renewalType: 'annual' as any,
          autoRenew: false,
          amount: this.calculateMembershipFee(application.applicationType),
          currency: 'USD',
          benefits: this.getMembershipBenefits(application.applicationType),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Create membership (assuming Membership model exists)
        // await Membership.create([membershipData], { session });

        // Update user tier
        await User.findByIdAndUpdate(
          user._id,
          { 
            tier: application.applicationType,
            membership: { id: 'temp-id', ...membershipData } // This would be the actual membership ID
          },
          { session }
        );

        result = application;
      });

      session.endSession();

      // Send approval email
      const user = await User.findById(result.applicantId);
      if (user) {
        await sendEmail({
          to: user.email,
          template: 'membershipApproved',
          data: {
            name: `${user.firstName} ${user.lastName}`,
            tier: result.applicationType,
            membershipNumber: `ISSB-${result._id.toString().slice(-6).toUpperCase()}`,
            effectiveDate: new Date().toLocaleDateString(),
            loginUrl: `${process.env.FRONTEND_URL}/login`
          }
        });
      }

      logger.info('Application approved successfully', {
        applicationId,
        reviewerId,
        applicantId: result.applicantId
      });

      return result;
    } catch (error) {
      logger.error('Failed to approve application:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        applicationId,
        reviewerId
      });
      throw error;
    }
  }

  /**
   * Reject an application
   */
  async rejectApplication(
    applicationId: string,
    reviewerId: string,
    comments: string
  ): Promise<any> {
    try {
      const application = await MembershipApplication.findById(applicationId);
      
      if (!application) {
        const error = new Error('Application not found');
        error.name = 'ApplicationNotFoundError';
        throw error;
      }

      if (!application.isUnderReview() && !application.isSubmitted()) {
        const error = new Error('Application is not in reviewable status');
        error.name = 'InvalidStatusError';
        throw error;
      }

      await application.reject(reviewerId, comments);

      // Send rejection email
      const user = await User.findById(application.applicantId);
      if (user) {
        await sendEmail({
          to: user.email,
          subject: 'Application Decision - ISSB Membership Portal',
          html: `
            <h1>Application Decision Notification</h1>
            <p>Dear ${user.firstName} ${user.lastName},</p>
            <p>Thank you for your interest in ISSB membership. After careful review, we regret to inform you that your application was not approved at this time.</p>
            ${comments ? `<p><strong>Review Comments:</strong></p><p>${comments}</p>` : ''}
            <p>If you would like to apply again in the future or have questions about this decision, please contact our membership team.</p>
            <p>Thank you for your understanding.</p>
          `
        });
      }

      logger.info('Application rejected', {
        applicationId,
        reviewerId,
        applicantId: application.applicantId,
        hasComments: !!comments
      });

      return application;
    } catch (error) {
      logger.error('Failed to reject application:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        applicationId,
        reviewerId
      });
      throw error;
    }
  }

  /**
   * Get application by ID
   */
  async getApplicationById(applicationId: string, userId?: string): Promise<any> {
    try {
      const query = MembershipApplication.findById(applicationId)
        .populate('applicantId', 'firstName lastName email')
        .populate('reviewedBy', 'firstName lastName');

      // If userId provided, check ownership for draft applications
      if (userId) {
        const application = await query.clone();
        
        if (application && 
            application.status === ApplicationStatus.DRAFT && 
            application.applicantId.toString() !== userId) {
          const error = new Error('Access denied to this application');
          error.name = 'UnauthorizedError';
          throw error;
        }
        
        return application;
      }

      return await query;
    } catch (error) {
      logger.error('Failed to get application by ID:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        applicationId,
        userId
      });
      throw error;
    }
  }

  /**
   * Search applications with filters
   */
  async searchApplications(
    filters: ApplicationFilter = {},
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<PaginatedResponse<any>> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'submittedAt',
        sortOrder = 'desc'
      } = options;

      // Build query
      const query: FilterQuery<any> = {};

      if (filters.status && filters.status.length > 0) {
        query.status = { $in: filters.status };
      }

      if (filters.applicationType && filters.applicationType.length > 0) {
        query.applicationType = { $in: filters.applicationType };
      }

      if (filters.search) {
        query.$or = [
          { 'personalInfo.occupation': { $regex: filters.search, $options: 'i' } },
          { 'personalInfo.location': { $regex: filters.search, $options: 'i' } },
          { 'personalInfo.organization': { $regex: filters.search, $options: 'i' } },
          { 'professionalInfo.currentRole': { $regex: filters.search, $options: 'i' } }
        ];
      }

      if (filters.dateRange) {
        query.createdAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        };
      }

      // Execute query
      const skip = (page - 1) * limit;
      const sortOptions: QueryOptions['sort'] = {
        [sortBy]: sortOrder === 'desc' ? -1 : 1
      };

      const [applications, total] = await Promise.all([
        MembershipApplication.find(query)
          .populate('applicantId', 'firstName lastName email')
          .populate('reviewedBy', 'firstName lastName')
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        MembershipApplication.countDocuments(query)
      ]);

      return {
        data: applications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to search applications:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      });
      throw error;
    }
  }

  /**
   * Get applications for a specific user
   */
  async getUserApplications(
    userId: string,
    includeHistory: boolean = false
  ): Promise<any[]> {
    try {
      const query: FilterQuery<any> = { applicantId: userId };
      
      if (!includeHistory) {
        // Only get the latest active application
        return await MembershipApplication.findOne(query)
          .populate('reviewedBy', 'firstName lastName')
          .sort({ createdAt: -1 });
      }

      return await MembershipApplication.find(query)
        .populate('reviewedBy', 'firstName lastName')
        .sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Failed to get user applications:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        includeHistory
      });
      throw error;
    }
  }

  /**
   * Get application statistics
   */
  async getApplicationStatistics(
    dateRange?: { start: Date; end: Date }
  ): Promise<ApplicationStatistics> {
    try {
      const matchStage: any = {};
      
      if (dateRange) {
        matchStage.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const stats = await MembershipApplication.aggregate([
        { $match: matchStage },
        {
          $facet: {
            totalApplications: [{ $count: 'count' }],
            statusCounts: [
              { $group: { _id: '$status', count: { $sum: 1 } } }
            ],
            tierCounts: [
              { $group: { _id: '$applicationType', count: { $sum: 1 } } }
            ],
            monthlyApplications: [
              {
                $group: {
                  _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                  },
                  count: { $sum: 1 },
                  approved: {
                    $sum: {
                      $cond: [{ $eq: ['$status', ApplicationStatus.APPROVED] }, 1, 0]
                    }
                  },
                  rejected: {
                    $sum: {
                      $cond: [{ $eq: ['$status', ApplicationStatus.REJECTED] }, 1, 0]
                    }
                  }
                }
              },
              { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]
          }
        }
      ]);

      const result = stats[0];

      // Process status counts
      const statusCounts: Record<ApplicationStatus, number> = {
        [ApplicationStatus.DRAFT]: 0,
        [ApplicationStatus.SUBMITTED]: 0,
        [ApplicationStatus.UNDER_REVIEW]: 0,
        [ApplicationStatus.PENDING_DOCUMENTS]: 0,
        [ApplicationStatus.APPROVED]: 0,
        [ApplicationStatus.REJECTED]: 0,
        [ApplicationStatus.WITHDRAWN]: 0
      };

      result.statusCounts.forEach((item: any) => {
        statusCounts[item._id] = item.count;
      });

      // Process tier counts
      const tierCounts: Record<MembershipTier, number> = {
        [MembershipTier.REGULAR]: 0,
        [MembershipTier.BOARD]: 0,
        [MembershipTier.ADMIN]: 0
      };

      result.tierCounts.forEach((item: any) => {
        tierCounts[item._id] = item.count;
      });

      // Process monthly data
      const monthlyApplications = result.monthlyApplications.map((item: any) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count,
        approved: item.approved,
        rejected: item.rejected
      }));

      // Calculate average review time
      const reviewTimeStats = await this.calculateAverageReviewTime();

      return {
        totalApplications: result.totalApplications[0]?.count || 0,
        statusCounts,
        tierCounts,
        averageReviewTime: reviewTimeStats.average,
        monthlyApplications,
        commonIssues: [] // This would be populated based on actual review comments analysis
      };
    } catch (error) {
      logger.error('Failed to get application statistics:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dateRange
      });
      throw error;
    }
  }

  /**
   * Validate application completeness
   */
  async validateApplicationCompleteness(applicationId: string): Promise<ValidationResult> {
    try {
      const application = await MembershipApplication.findById(applicationId);
      
      if (!application) {
        throw new Error('Application not found');
      }

      const missingFields: string[] = [];
      const errors: string[] = [];
      let completedFields = 0;
      let totalFields = 0;

      // Validate personal info
      totalFields++;
      if (!application.personalInfo.location?.trim()) {
        missingFields.push('Location');
        errors.push('Location is required');
      } else {
        completedFields++;
      }

      totalFields++;
      if (!application.personalInfo.occupation?.trim()) {
        missingFields.push('Occupation');
        errors.push('Occupation is required');
      } else {
        completedFields++;
      }

      // Validate professional info
      totalFields++;
      if (application.professionalInfo.yearsOfExperience === undefined || 
          application.professionalInfo.yearsOfExperience < 0) {
        missingFields.push('Years of Experience');
        errors.push('Valid years of experience is required');
      } else {
        completedFields++;
      }

      totalFields++;
      if (!application.professionalInfo.currentRole?.trim()) {
        missingFields.push('Current Role');
        errors.push('Current role is required');
      } else {
        completedFields++;
      }

      // Validate references
      totalFields++;
      if (!application.professionalInfo.reference1?.name?.trim()) {
        missingFields.push('First Reference');
        errors.push('First reference is required');
      } else {
        completedFields++;
      }

      totalFields++;
      if (!application.professionalInfo.reference2?.name?.trim()) {
        missingFields.push('Second Reference');
        errors.push('Second reference is required');
      } else {
        completedFields++;
      }

      // Validate documents
      totalFields++;
      if (!application.documents || application.documents.length === 0) {
        missingFields.push('Documents');
        errors.push('At least one document must be uploaded');
      } else {
        completedFields++;
      }

      const completenessPercentage = Math.round((completedFields / totalFields) * 100);

      return {
        isValid: missingFields.length === 0,
        missingFields,
        errors,
        completenessPercentage
      };
    } catch (error) {
      logger.error('Failed to validate application completeness:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        applicationId
      });
      throw error;
    }
  }

  /**
   * Process reference verification
   */
  async processReferenceVerification(
    applicationId: string,
    referenceType: 'reference1' | 'reference2'
  ): Promise<any> {
    try {
      const application = await MembershipApplication.findById(applicationId);
      
      if (!application) {
        throw new Error('Application not found');
      }

      const reference = application.professionalInfo[referenceType];
      
      if (!reference) {
        throw new Error(`Reference ${referenceType} not found`);
      }

      // Send verification email to reference
      const user = await User.findById(application.applicantId);
      if (user) {
        await sendEmail({
          to: reference.email,
          subject: 'Reference Verification Request - ISSB Membership Application',
          html: `
            <h1>Reference Verification Request</h1>
            <p>Dear ${reference.name},</p>
            <p>${user.firstName} ${user.lastName} has listed you as a reference for their ISSB membership application.</p>
            <p>Please verify the following information about your professional relationship:</p>
            <ul>
              <li><strong>Applicant:</strong> ${user.firstName} ${user.lastName}</li>
              <li><strong>Your Name:</strong> ${reference.name}</li>
              <li><strong>Organization:</strong> ${reference.organization}</li>
              <li><strong>Relationship:</strong> ${reference.relationship}</li>
              <li><strong>Years Known:</strong> ${reference.yearsKnown}</li>
            </ul>
            <p>This reference verification is part of our membership review process.</p>
            <p>If you have any questions, please contact our membership team.</p>
          `
        });

        // Update verification status
        application.professionalInfo[referenceType].verified = true;
        application.professionalInfo[referenceType].verifiedAt = new Date();
        await application.save();
      }

      logger.info('Reference verification processed', {
        applicationId,
        referenceType,
        referenceEmail: reference.email
      });

      return application;
    } catch (error) {
      logger.error('Failed to process reference verification:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        applicationId,
        referenceType
      });
      throw error;
    }
  }

  /**
   * Calculate membership fee based on tier
   */
  private calculateMembershipFee(tier: MembershipTier): number {
    const fees: Record<MembershipTier, number> = {
      [MembershipTier.REGULAR]: 100,
      [MembershipTier.BOARD]: 200,
      [MembershipTier.ADMIN]: 0
    };
    return fees[tier] || 100;
  }

  /**
   * Get membership benefits based on tier
   */
  private getMembershipBenefits(tier: MembershipTier): string[] {
    const benefits: Record<MembershipTier, string[]> = {
      [MembershipTier.REGULAR]: [
        'Access to member directory',
        'Event registrations',
        'Professional development resources',
        'Newsletter subscription'
      ],
      [MembershipTier.BOARD]: [
        'All regular member benefits',
        'Board voting rights',
        'Committee participation',
        'Leadership opportunities',
        'Special recognition'
      ],
      [MembershipTier.ADMIN]: [
        'All member benefits',
        'Administrative access',
        'System management',
        'Full voting rights'
      ]
    };
    return benefits[tier] || benefits[MembershipTier.REGULAR];
  }

  /**
   * Calculate average review time
   */
  private async calculateAverageReviewTime(): Promise<{ average: number; total: number }> {
    try {
      const result = await MembershipApplication.aggregate([
        {
          $match: {
            status: { $in: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED] },
            submittedAt: { $exists: true },
            reviewedAt: { $exists: true }
          }
        },
        {
          $project: {
            reviewTime: {
              $divide: [
                { $subtract: ['$reviewedAt', '$submittedAt'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalReviewTime: { $sum: '$reviewTime' },
            count: { $sum: 1 }
          }
        }
      ]);

      if (result.length === 0) {
        return { average: 0, total: 0 };
      }

      const average = result[0].totalReviewTime / result[0].count;
      return { average: Math.round(average * 10) / 10, total: result[0].count };
    } catch (error) {
      logger.error('Failed to calculate average review time:', error);
      return { average: 0, total: 0 };
    }
  }
}

export default new ApplicationService();