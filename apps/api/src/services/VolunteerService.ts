import mongoose, { FilterQuery, QueryOptions } from 'mongoose';
import VolunteerOpportunity from '../models/VolunteerOpportunity';
import User from '../models/User';
import { 
  VolunteerOpportunity as IVolunteerOpportunity,
  VolunteerApplication,
  VolunteerType,
  MembershipTier,
  OpportunityStatus,
  VolunteerApplicationStatus,
  UserRole,
  NotificationType,
  CreateInput,
  UpdateInput
} from '@issb/types';
import { logger } from '../config/logger';
import { sendEmail } from './emailService';

// Interface for creating volunteer opportunity
interface CreateOpportunityInput extends CreateInput<IVolunteerOpportunity> {
  createdBy: string;
}

// Interface for updating volunteer opportunity
interface UpdateOpportunityInput extends UpdateInput<IVolunteerOpportunity> {
  updatedBy: string;
}

// Interface for searching opportunities
interface SearchOpportunitiesOptions {
  searchTerm?: string;
  type?: VolunteerType;
  tier?: MembershipTier;
  status?: OpportunityStatus[];
  organization?: string;
  location?: string;
  isRemote?: boolean;
  skillsRequired?: string[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface for application data
interface ApplicationData {
  applicantId: string;
  motivation: string;
  relevantExperience: string;
  availability: string;
  skillsOffered: string[];
}

// Interface for review data
interface ReviewData {
  reviewerId: string;
  decision: 'accept' | 'decline';
  reviewNotes?: string;
}

// Interface for opportunity statistics
interface OpportunityStatistics {
  totalOpportunities: number;
  activeOpportunities: number;
  filledOpportunities: number;
  expiredOpportunities: number;
  draftOpportunities: number;
  cancelledOpportunities: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  declinedApplications: number;
  averageApplicationsPerOpportunity: number;
  mostPopularOpportunityType: VolunteerType;
  opportunitiesByTier: Record<MembershipTier, number>;
  applicationsByStatus: Record<VolunteerApplicationStatus, number>;
}

class VolunteerService {
  
  // Create a new volunteer opportunity
  async createOpportunity(data: CreateOpportunityInput): Promise<IVolunteerOpportunity> {
    try {
      // Validate user permissions
      const creator = await User.findById(data.createdBy);
      if (!creator) {
        throw new Error('Creator not found');
      }

      if (creator.role !== UserRole.ADMIN && creator.role !== UserRole.BOARD) {
        throw new Error('Insufficient permissions to create volunteer opportunities');
      }

      // Check date validity
      if (new Date(data.startDate) >= new Date(data.endDate)) {
        throw new Error('End date must be after start date');
      }

      // Check if start date is in the future
      const now = new Date();
      if (new Date(data.startDate) <= now) {
        throw new Error('Start date must be in the future');
      }

      // Validate skills array
      if (data.skillsRequired && data.skillsRequired.length > 20) {
        throw new Error('Maximum 20 skills can be required');
      }

      const opportunity = new VolunteerOpportunity({
        ...data,
        status: OpportunityStatus.DRAFT,
        applications: []
      });

      await opportunity.save();

      logger.info('Volunteer opportunity created', {
        opportunityId: opportunity.id,
        title: opportunity.title,
        createdBy: data.createdBy,
        organization: opportunity.organization
      });

      return opportunity.toObject() as IVolunteerOpportunity;
    } catch (error) {
      logger.error('Failed to create volunteer opportunity:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data
      });
      throw error;
    }
  }

  // Update an existing volunteer opportunity
  async updateOpportunity(id: string, data: UpdateOpportunityInput): Promise<IVolunteerOpportunity> {
    try {
      const opportunity = await VolunteerOpportunity.findById(id);
      if (!opportunity) {
        throw new Error('Volunteer opportunity not found');
      }

      // Check if user has permission to update
      const updater = await User.findById(data.updatedBy);
      if (!updater) {
        throw new Error('Updater not found');
      }

      if (updater.role !== UserRole.ADMIN && updater.role !== UserRole.BOARD) {
        throw new Error('Insufficient permissions to update volunteer opportunities');
      }

      // Prevent certain updates if opportunity has been published
      if (opportunity.status !== OpportunityStatus.DRAFT) {
        const allowedFields = ['status', 'contactPerson', 'contactEmail'];
        const requestedFields = Object.keys(data).filter(key => key !== 'updatedBy');
        const restrictedFields = requestedFields.filter(field => !allowedFields.includes(field));
        
        if (restrictedFields.length > 0) {
          throw new Error(`Cannot modify fields after publication: ${restrictedFields.join(', ')}`);
        }
      }

      // Validate date changes
      if (data.startDate || data.endDate) {
        const newStartDate = new Date(data.startDate || opportunity.startDate);
        const newEndDate = new Date(data.endDate || opportunity.endDate);
        
        if (newStartDate >= newEndDate) {
          throw new Error('End date must be after start date');
        }

        if (newStartDate <= new Date()) {
          throw new Error('Start date must be in the future');
        }
      }

      // Update the opportunity
      Object.assign(opportunity, {
        ...data,
        updatedAt: new Date()
      });

      await opportunity.save();

      logger.info('Volunteer opportunity updated', {
        opportunityId: opportunity.id,
        updatedBy: data.updatedBy,
        changes: Object.keys(data)
      });

      return opportunity.toObject() as IVolunteerOpportunity;
    } catch (error) {
      logger.error('Failed to update volunteer opportunity:', {
        opportunityId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        data
      });
      throw error;
    }
  }

  // Delete a volunteer opportunity
  async deleteOpportunity(id: string, deletedBy: string): Promise<void> {
    try {
      const opportunity = await VolunteerOpportunity.findById(id);
      if (!opportunity) {
        throw new Error('Volunteer opportunity not found');
      }

      // Check permissions
      const deleter = await User.findById(deletedBy);
      if (!deleter) {
        throw new Error('User not found');
      }

      if (deleter.role !== UserRole.ADMIN) {
        throw new Error('Only administrators can delete volunteer opportunities');
      }

      // Prevent deletion if opportunity has active applications
      if (opportunity.applications && opportunity.applications.length > 0) {
        const hasActiveApplications = opportunity.applications.some(app => 
          app.status === VolunteerApplicationStatus.PENDING || 
          app.status === VolunteerApplicationStatus.REVIEWING
        );
        
        if (hasActiveApplications) {
          throw new Error('Cannot delete opportunity with active applications');
        }
      }

      await VolunteerOpportunity.findByIdAndDelete(id);

      logger.info('Volunteer opportunity deleted', {
        opportunityId: id,
        deletedBy,
        title: opportunity.title
      });
    } catch (error) {
      logger.error('Failed to delete volunteer opportunity:', {
        opportunityId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Get opportunity by ID with populated data
  async getOpportunityById(id: string): Promise<IVolunteerOpportunity | null> {
    try {
      const opportunity = await VolunteerOpportunity.findById(id)
        .populate('applications.applicantId', 'firstName lastName email avatar')
        .populate('applications.reviewedBy', 'firstName lastName');

      if (!opportunity) {
        return null;
      }

      return opportunity.toObject() as IVolunteerOpportunity;
    } catch (error) {
      logger.error('Failed to get volunteer opportunity by ID:', {
        opportunityId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Search and filter opportunities
  async searchOpportunities(options: SearchOpportunitiesOptions = {}): Promise<{
    opportunities: IVolunteerOpportunity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const {
        searchTerm,
        type,
        tier,
        status = [OpportunityStatus.ACTIVE],
        organization,
        location,
        isRemote,
        skillsRequired,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'startDate',
        sortOrder = 'asc'
      } = options;

      // Build query
      const query: FilterQuery<IVolunteerOpportunity> = {};

      // Text search
      if (searchTerm) {
        query.$text = { $search: searchTerm };
      }

      // Filters
      if (type) query.type = type;
      if (tier) query.tier = tier;
      if (status && status.length > 0) query.status = { $in: status };
      if (organization) query.organization = new RegExp(organization, 'i');
      if (location) query.location = new RegExp(location, 'i');
      if (isRemote !== undefined) query.isRemote = isRemote;
      if (skillsRequired && skillsRequired.length > 0) {
        query.skillsRequired = { $in: skillsRequired };
      }

      // Date filters
      if (startDate || endDate) {
        query.startDate = {};
        if (startDate) query.startDate.$gte = startDate;
        if (endDate) query.startDate.$lte = endDate;
      }

      // Build options
      const queryOptions: QueryOptions = {
        page,
        limit,
        sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
      };

      // Add text score for search results
      if (searchTerm) {
        queryOptions.select = { score: { $meta: 'textScore' } };
        queryOptions.sort = { score: { $meta: 'textScore' }, ...queryOptions.sort };
      }

      const result = await VolunteerOpportunity.find(query, queryOptions.select)
        .sort(queryOptions.sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await VolunteerOpportunity.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      logger.info('Volunteer opportunities searched', {
        searchTerm,
        filters: options,
        resultsCount: result.length,
        total
      });

      return {
        opportunities: result as IVolunteerOpportunity[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to search volunteer opportunities:', {
        options,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Apply for a volunteer opportunity
  async applyForOpportunity(opportunityId: string, applicationData: ApplicationData): Promise<VolunteerApplication> {
    try {
      const opportunity = await VolunteerOpportunity.findById(opportunityId);
      if (!opportunity) {
        throw new Error('Volunteer opportunity not found');
      }

      // Check if user can apply
      if (!opportunity.canApply()) {
        throw new Error('Cannot apply to this opportunity');
      }

      // Check if user already applied
      const existingApplication = opportunity.applications?.find(app => 
        app.applicantId.toString() === applicationData.applicantId
      );

      if (existingApplication) {
        throw new Error('You have already applied to this opportunity');
      }

      // Validate applicant
      const applicant = await User.findById(applicationData.applicantId);
      if (!applicant) {
        throw new Error('Applicant not found');
      }

      if (applicant.status !== 'active') {
        throw new Error('Account must be active to apply');
      }

      // Validate tier requirements
      const tierHierarchy = {
        [MembershipTier.REGULAR]: 1,
        [MembershipTier.BOARD]: 2,
        [MembershipTier.ADMIN]: 3
      };

      if (tierHierarchy[applicant.tier] < tierHierarchy[opportunity.tier]) {
        throw new Error(`This opportunity requires ${opportunity.tier} membership or higher`);
      }

      // Create application
      const application: VolunteerApplication = {
        id: new mongoose.Types.ObjectId().toString(),
        opportunityId,
        applicantId: applicationData.applicantId,
        status: VolunteerApplicationStatus.PENDING,
        motivation: applicationData.motivation,
        relevantExperience: applicationData.relevantExperience,
        availability: applicationData.availability,
        skillsOffered: applicationData.skillsOffered || [],
        submittedAt: new Date(),
        reviewedAt: undefined,
        reviewedBy: undefined,
        reviewNotes: undefined
      };

      // Add application to opportunity
      if (!opportunity.applications) {
        opportunity.applications = [];
      }
      opportunity.applications.push(application);

      await opportunity.save();

      logger.info('Volunteer application submitted', {
        opportunityId,
        applicantId: applicationData.applicantId,
        applicationId: application.id
      });

      // Send confirmation email to applicant
      await this.sendApplicationConfirmationEmail(opportunity, applicant, application);

      return application;
    } catch (error) {
      logger.error('Failed to apply for volunteer opportunity:', {
        opportunityId,
        applicantId: applicationData.applicantId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Review a volunteer application
  async reviewApplication(
    opportunityId: string, 
    applicationId: string, 
    reviewData: ReviewData
  ): Promise<VolunteerApplication> {
    try {
      const opportunity = await VolunteerOpportunity.findById(opportunityId);
      if (!opportunity) {
        throw new Error('Volunteer opportunity not found');
      }

      // Check permissions
      const reviewer = await User.findById(reviewData.reviewerId);
      if (!reviewer) {
        throw new Error('Reviewer not found');
      }

      if (reviewer.role !== UserRole.ADMIN && reviewer.role !== UserRole.BOARD) {
        throw new Error('Insufficient permissions to review applications');
      }

      // Find application
      const applicationIndex = opportunity.applications?.findIndex(app => 
        app.id === applicationId
      );

      if (applicationIndex === -1 || applicationIndex === undefined) {
        throw new Error('Application not found');
      }

      const application = opportunity.applications![applicationIndex];

      // Validate application status
      if (application.status !== VolunteerApplicationStatus.PENDING && 
          application.status !== VolunteerApplicationStatus.REVIEWING) {
        throw new Error('Application has already been reviewed');
      }

      // Update application
      application.status = reviewData.decision === 'accept' 
        ? VolunteerApplicationStatus.ACCEPTED 
        : VolunteerApplicationStatus.DECLINED;
      application.reviewedAt = new Date();
      application.reviewedBy = reviewData.reviewerId;
      application.reviewNotes = reviewData.reviewNotes;

      // Update opportunity status if accepted
      if (reviewData.decision === 'accept') {
        const acceptedCount = opportunity.applications?.filter(app => 
          app.status === VolunteerApplicationStatus.ACCEPTED
        ).length || 0;

        // Mark as filled if this is the first acceptance or opportunity is small
        if (acceptedCount >= 1) {
          opportunity.status = OpportunityStatus.FILLED;
        }
      }

      await opportunity.save();

      const applicant = await User.findById(application.applicantId);
      if (applicant) {
        await this.sendApplicationReviewEmail(opportunity, applicant, application, reviewData.decision);
      }

      logger.info('Volunteer application reviewed', {
        opportunityId,
        applicationId,
        reviewerId: reviewData.reviewerId,
        decision: reviewData.decision
      });

      return application;
    } catch (error) {
      logger.error('Failed to review volunteer application:', {
        opportunityId,
        applicationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Get applications for a specific user
  async getUserApplications(userId: string, status?: VolunteerApplicationStatus[]): Promise<{
    applications: Array<VolunteerApplication & { opportunity: IVolunteerOpportunity }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const query: FilterQuery<IVolunteerOpportunity> = {
        'applications.applicantId': userId
      };

      if (status && status.length > 0) {
        query['applications.status'] = { $in: status };
      }

      const opportunities = await VolunteerOpportunity.find(query)
        .populate('applications.applicantId', 'firstName lastName email')
        .select('title organization type tier status startDate endDate location isRemote applications')
        .lean();

      // Flatten and filter applications for this user
      const userApplications = opportunities.flatMap(opportunity => 
        opportunity.applications
          .filter(app => app.applicantId.toString() === userId)
          .filter(app => !status || status.includes(app.status))
          .map(app => ({
            ...app,
            opportunity: opportunity as IVolunteerOpportunity
          }))
      );

      logger.info('User applications retrieved', {
        userId,
        status,
        count: userApplications.length
      });

      return {
        applications: userApplications,
        pagination: {
          page: 1,
          limit: userApplications.length,
          total: userApplications.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
    } catch (error) {
      logger.error('Failed to get user applications:', {
        userId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Get opportunity statistics
  async getOpportunityStatistics(): Promise<OpportunityStatistics> {
    try {
      // Aggregate opportunity statistics
      const opportunityStats = await VolunteerOpportunity.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Aggregate application statistics
      const applicationStats = await VolunteerOpportunity.aggregate([
        { $unwind: '$applications' },
        {
          $group: {
            _id: '$applications.status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Aggregate by type
      const typeStats = await VolunteerOpportunity.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);

      // Aggregate by tier
      const tierStats = await VolunteerOpportunity.aggregate([
        {
          $group: {
            _id: '$tier',
            count: { $sum: 1 }
          }
        }
      ]);

      // Calculate statistics
      const stats: OpportunityStatistics = {
        totalOpportunities: opportunityStats.reduce((sum, stat) => sum + stat.count, 0),
        activeOpportunities: opportunityStats.find(s => s._id === OpportunityStatus.ACTIVE)?.count || 0,
        filledOpportunities: opportunityStats.find(s => s._id === OpportunityStatus.FILLED)?.count || 0,
        expiredOpportunities: opportunityStats.find(s => s._id === OpportunityStatus.EXPIRED)?.count || 0,
        draftOpportunities: opportunityStats.find(s => s._id === OpportunityStatus.DRAFT)?.count || 0,
        cancelledOpportunities: opportunityStats.find(s => s._id === OpportunityStatus.CANCELLED)?.count || 0,
        totalApplications: applicationStats.reduce((sum, stat) => sum + stat.count, 0),
        pendingApplications: applicationStats.find(s => s._id === VolunteerApplicationStatus.PENDING)?.count || 0,
        acceptedApplications: applicationStats.find(s => s._id === VolunteerApplicationStatus.ACCEPTED)?.count || 0,
        declinedApplications: applicationStats.find(s => s._id === VolunteerApplicationStatus.DECLINED)?.count || 0,
        averageApplicationsPerOpportunity: 0,
        mostPopularOpportunityType: typeStats.sort((a, b) => b.count - a.count)[0]?._id || VolunteerType.ADMINISTRATIVE,
        opportunitiesByTier: {
          [MembershipTier.REGULAR]: tierStats.find(s => s._id === MembershipTier.REGULAR)?.count || 0,
          [MembershipTier.BOARD]: tierStats.find(s => s._id === MembershipTier.BOARD)?.count || 0,
          [MembershipTier.ADMIN]: tierStats.find(s => s._id === MembershipTier.ADMIN)?.count || 0
        },
        applicationsByStatus: {
          [VolunteerApplicationStatus.PENDING]: applicationStats.find(s => s._id === VolunteerApplicationStatus.PENDING)?.count || 0,
          [VolunteerApplicationStatus.REVIEWING]: applicationStats.find(s => s._id === VolunteerApplicationStatus.REVIEWING)?.count || 0,
          [VolunteerApplicationStatus.ACCEPTED]: applicationStats.find(s => s._id === VolunteerApplicationStatus.ACCEPTED)?.count || 0,
          [VolunteerApplicationStatus.DECLINED]: applicationStats.find(s => s._id === VolunteerApplicationStatus.DECLINED)?.count || 0,
          [VolunteerApplicationStatus.WITHDRAWN]: applicationStats.find(s => s._id === VolunteerApplicationStatus.WITHDRAWN)?.count || 0
        }
      };

      // Calculate average applications per opportunity
      stats.averageApplicationsPerOpportunity = stats.totalOpportunities > 0 
        ? Math.round((stats.totalApplications / stats.totalOpportunities) * 100) / 100 
        : 0;

      logger.info('Opportunity statistics calculated', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to get opportunity statistics:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Get expiring opportunities
  async getExpiringOpportunities(days: number = 7): Promise<IVolunteerOpportunity[]> {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const expiringOpportunities = await VolunteerOpportunity.find({
        status: OpportunityStatus.ACTIVE,
        endDate: {
          $gt: now,
          $lte: futureDate
        }
      })
      .sort({ endDate: 1 })
      .populate('applications.applicantId', 'firstName lastName email')
      .lean();

      logger.info('Expiring opportunities retrieved', {
        days,
        count: expiringOpportunities.length
      });

      return expiringOpportunities as IVolunteerOpportunity[];
    } catch (error) {
      logger.error('Failed to get expiring opportunities:', {
        days,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Mark opportunity as filled
  async markOpportunityFilled(id: string, markedBy: string): Promise<IVolunteerOpportunity> {
    try {
      const opportunity = await VolunteerOpportunity.findById(id);
      if (!opportunity) {
        throw new Error('Volunteer opportunity not found');
      }

      // Check permissions
      const marker = await User.findById(markedBy);
      if (!marker) {
        throw new Error('User not found');
      }

      if (marker.role !== UserRole.ADMIN && marker.role !== UserRole.BOARD) {
        throw new Error('Insufficient permissions to mark opportunities as filled');
      }

      opportunity.status = OpportunityStatus.FILLED;
      await opportunity.save();

      logger.info('Opportunity marked as filled', {
        opportunityId: id,
        markedBy
      });

      return opportunity.toObject() as IVolunteerOpportunity;
    } catch (error) {
      logger.error('Failed to mark opportunity as filled:', {
        opportunityId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Process application workflow (automatic status updates)
  async processApplicationWorkflow(): Promise<void> {
    try {
      const now = new Date();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

      // Find applications that have been in PENDING status for more than 30 days
      const opportunities = await VolunteerOpportunity.find({
        'applications.status': VolunteerApplicationStatus.PENDING,
        'applications.submittedAt': { $lte: cutoffDate }
      });

      let processedCount = 0;

      for (const opportunity of opportunities) {
        const pendingApps = opportunity.applications?.filter(app => 
          app.status === VolunteerApplicationStatus.PENDING && 
          app.submittedAt <= cutoffDate
        );

        if (pendingApps && pendingApps.length > 0) {
          // Auto-decline applications that have been pending too long
          for (const app of pendingApps) {
            app.status = VolunteerApplicationStatus.DECLINED;
            app.reviewNotes = 'Application automatically declined due to extended review time';
            app.reviewedAt = now;
          }

          await opportunity.save();
          processedCount += pendingApps.length;
        }
      }

      // Auto-expire opportunities that have passed their end date
      const expiredOpportunities = await VolunteerOpportunity.updateMany(
        {
          status: OpportunityStatus.ACTIVE,
          endDate: { $lte: now }
        },
        {
          $set: { status: OpportunityStatus.EXPIRED }
        }
      );

      logger.info('Application workflow processed', {
        processedApplications: processedCount,
        expiredOpportunities: expiredOpportunities.modifiedCount
      });
    } catch (error) {
      logger.error('Failed to process application workflow:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Helper method to send application confirmation email
  private async sendApplicationConfirmationEmail(
    opportunity: any,
    applicant: any,
    application: VolunteerApplication
  ): Promise<void> {
    try {
      await sendEmail({
        to: applicant.email,
        subject: `Application Received - ${opportunity.title}`,
        template: 'volunteerApplicationConfirmation',
        data: {
          name: `${applicant.firstName} ${applicant.lastName}`,
          opportunityTitle: opportunity.title,
          organization: opportunity.organization,
          applicationDate: application.submittedAt.toLocaleDateString(),
          reviewTimeline: 'Applications are typically reviewed within 5-7 business days.',
          contactEmail: opportunity.contactEmail
        }
      });
    } catch (error) {
      logger.warn('Failed to send application confirmation email:', {
        applicantId: applicant.id,
        opportunityId: opportunity.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper method to send application review email
  private async sendApplicationReviewEmail(
    opportunity: any,
    applicant: any,
    application: VolunteerApplication,
    decision: 'accept' | 'decline'
  ): Promise<void> {
    try {
      const subject = decision === 'accept' 
        ? `Application Accepted - ${opportunity.title}`
        : `Application Update - ${opportunity.title}`;

      await sendEmail({
        to: applicant.email,
        subject,
        template: 'volunteerApplicationReview',
        data: {
          name: `${applicant.firstName} ${applicant.lastName}`,
          opportunityTitle: opportunity.title,
          organization: opportunity.organization,
          decision: decision === 'accept' ? 'accepted' : 'declined',
          reviewNotes: application.reviewNotes || '',
          reviewDate: application.reviewedAt?.toLocaleDateString(),
          contactEmail: opportunity.contactEmail
        }
      });
    } catch (error) {
      logger.warn('Failed to send application review email:', {
        applicantId: applicant.id,
        opportunityId: opportunity.id,
        decision,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Skill matching for applicants
  async findBestMatches(userId: string, limit: number = 10): Promise<IVolunteerOpportunity[]> {
    try {
      const user = await User.findById(userId).populate('profile');
      if (!user || !user.profile) {
        throw new Error('User profile not found');
      }

      // Get user's skills (from profile certifications, experience, etc.)
      const userSkills = [
        ...(user.profile.languages || []),
        ...(user.profile.certifications?.map(cert => cert.name) || []),
        ...(user.profile.experience?.map(exp => exp.position) || []),
        ...(user.profile.interests || [])
      ];

      // Find opportunities that match user's skills
      const opportunities = await VolunteerOpportunity.find({
        status: OpportunityStatus.ACTIVE,
        startDate: { $gte: new Date() }
      }).sort({ startDate: 1 }).limit(limit * 2); // Get more to filter

      // Score opportunities based on skill matches
      const scoredOpportunities = opportunities.map(opportunity => {
        const skillMatches = opportunity.skillsRequired?.filter(skill =>
          userSkills.some(userSkill => 
            userSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill.toLowerCase())
          )
        ) || [];

        const score = skillMatches.length / (opportunity.skillsRequired?.length || 1);

        return {
          opportunity,
          score,
          skillMatches
        };
      });

      // Sort by score and return top matches
      const bestMatches = scoredOpportunities
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.opportunity.toObject() as IVolunteerOpportunity);

      logger.info('Skill matching completed', {
        userId,
        opportunitiesConsidered: opportunities.length,
        matchesReturned: bestMatches.length
      });

      return bestMatches;
    } catch (error) {
      logger.error('Failed to find skill matches:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Bulk operations
  async bulkUpdateStatus(opportunityIds: string[], status: OpportunityStatus, updatedBy: string): Promise<number> {
    try {
      const updater = await User.findById(updatedBy);
      if (!updater || (updater.role !== UserRole.ADMIN && updater.role !== UserRole.BOARD)) {
        throw new Error('Insufficient permissions for bulk update');
      }

      const result = await VolunteerOpportunity.updateMany(
        { _id: { $in: opportunityIds } },
        { 
          $set: { 
            status,
            updatedAt: new Date()
          }
        }
      );

      logger.info('Bulk status update completed', {
        opportunityIds,
        status,
        updatedBy,
        modifiedCount: result.modifiedCount
      });

      return result.modifiedCount;
    } catch (error) {
      logger.error('Failed to bulk update opportunity status:', {
        opportunityIds,
        status,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

export default new VolunteerService();