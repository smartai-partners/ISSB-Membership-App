import Membership from '../models/Membership';
import User from '../models/User';
import { 
  MembershipDocument, 
  MembershipTier, 
  MembershipStatus, 
  RenewalType,
  UserRole 
} from '@issb/types';
import logger from '../config/logger';
import emailService from './emailService';

class MembershipService {
  /**
   * Create a new membership
   */
  async createMembership(data: {
    userId: string;
    tier: MembershipTier;
    renewalType: RenewalType;
    startDate: Date;
    endDate: Date;
    autoRenew?: boolean;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    benefits?: string[];
  }): Promise<MembershipDocument> {
    try {
      // Check if user already has a membership
      const existingMembership = await Membership.findByUserId(data.userId);
      if (existingMembership) {
        throw new Error('User already has a membership');
      }

      const membership = new Membership({
        userId: data.userId,
        tier: data.tier,
        renewalType: data.renewalType,
        startDate: data.startDate,
        endDate: data.endDate,
        autoRenew: data.autoRenew || false,
        amount: data.amount,
        currency: data.currency || 'USD',
        paymentMethod: data.paymentMethod,
        benefits: data.benefits || [],
        status: MembershipStatus.PENDING
      });

      await membership.save();

      // Update user's tier
      await User.findByIdAndUpdate(data.userId, {
        tier: data.tier,
        status: 'active'
      });

      logger.info(`Created membership for user ${data.userId}: ${data.tier}`);

      return membership;
    } catch (error) {
      logger.error('Error creating membership:', error);
      throw error;
    }
  }

  /**
   * Update membership
   */
  async updateMembership(
    membershipId: string, 
    updates: Partial<MembershipDocument>
  ): Promise<MembershipDocument> {
    try {
      const membership = await Membership.findById(membershipId);
      if (!membership) {
        throw new Error('Membership not found');
      }

      // Validate tier changes
      if (updates.tier && updates.tier !== membership.tier) {
        await User.findByIdAndUpdate(membership.userId, { tier: updates.tier });
      }

      Object.assign(membership, updates);
      await membership.save();

      logger.info(`Updated membership ${membershipId}: ${updates}`);

      return membership;
    } catch (error) {
      logger.error('Error updating membership:', error);
      throw error;
    }
  }

  /**
   * Cancel membership
   */
  async cancelMembership(
    membershipId: string, 
    reason?: string
  ): Promise<MembershipDocument> {
    try {
      const membership = await Membership.findById(membershipId);
      if (!membership) {
        throw new Error('Membership not found');
      }

      membership.status = MembershipStatus.CANCELLED;
      membership.autoRenew = false;
      await membership.save();

      // Update user's status if this was their active membership
      const user = await User.findById(membership.userId);
      if (user && user.tier === membership.tier) {
        await User.findByIdAndUpdate(membership.userId, {
          status: 'inactive'
        });
      }

      logger.info(`Cancelled membership ${membershipId}: ${reason}`);

      // Send cancellation email
      try {
        await emailService.sendMembershipCancelled(
          user!.email,
          user!.firstName,
          membership.tier,
          reason
        );
      } catch (emailError) {
        logger.warn('Failed to send cancellation email:', emailError);
      }

      return membership;
    } catch (error) {
      logger.error('Error cancelling membership:', error);
      throw error;
    }
  }

  /**
   * Renew membership
   */
  async renewMembership(
    membershipId: string,
    paymentInfo?: {
      amount: number;
      currency: string;
      paymentMethod: string;
      transactionId?: string;
    }
  ): Promise<MembershipDocument> {
    try {
      const membership = await Membership.findById(membershipId);
      if (!membership) {
        throw new Error('Membership not found');
      }

      if (membership.status === MembershipStatus.CANCELLED) {
        throw new Error('Cannot renew a cancelled membership');
      }

      // Calculate new dates
      const newStartDate = new Date();
      let newEndDate = new Date();

      switch (membership.renewalType) {
        case RenewalType.MONTHLY:
          newEndDate.setMonth(newEndDate.getMonth() + 1);
          break;
        case RenewalType.QUARTERLY:
          newEndDate.setMonth(newEndDate.getMonth() + 3);
          break;
        case RenewalType.ANNUAL:
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          break;
        case RenewalType.LIFETIME:
          newEndDate.setFullYear(newEndDate.getFullYear() + 1000);
          break;
      }

      // Update membership
      membership.startDate = newStartDate;
      membership.endDate = newEndDate;
      membership.status = MembershipStatus.ACTIVE;
      membership.lastPaymentDate = new Date();
      
      if (paymentInfo) {
        membership.amount = paymentInfo.amount;
        membership.currency = paymentInfo.currency;
        membership.paymentMethod = paymentInfo.paymentMethod;
      }

      membership.nextPaymentDate = membership.calculateNextPaymentDate();
      await membership.save();

      // Update user's status
      await User.findByIdAndUpdate(membership.userId, {
        status: 'active'
      });

      logger.info(`Renewed membership ${membershipId} until ${newEndDate}`);

      // Send renewal confirmation email
      try {
        const user = await User.findById(membership.userId);
        if (user) {
          await emailService.sendMembershipRenewed(
            user.email,
            user.firstName,
            membership.tier,
            newEndDate,
            membership.amount
          );
        }
      } catch (emailError) {
        logger.warn('Failed to send renewal email:', emailError);
      }

      return membership;
    } catch (error) {
      logger.error('Error renewing membership:', error);
      throw error;
    }
  }

  /**
   * Get membership by ID
   */
  async getMembershipById(membershipId: string): Promise<MembershipDocument | null> {
    try {
      return await Membership.findById(membershipId).populate('userId', 'firstName lastName email');
    } catch (error) {
      logger.error('Error getting membership by ID:', error);
      throw error;
    }
  }

  /**
   * Get user's current membership
   */
  async getUserMembership(userId: string): Promise<MembershipDocument | null> {
    try {
      return await Membership.findByUserId(userId);
    } catch (error) {
      logger.error('Error getting user membership:', error);
      throw error;
    }
  }

  /**
   * Get memberships expiring within specified days
   */
  async getExpiringMemberships(days: number = 30): Promise<MembershipDocument[]> {
    try {
      return await Membership.findExpiring(days);
    } catch (error) {
      logger.error('Error getting expiring memberships:', error);
      throw error;
    }
  }

  /**
   * Calculate next payment date
   */
  calculateNextPaymentDate(
    lastPaymentDate: Date,
    renewalType: RenewalType,
    amount: number
  ): Date | null {
    if (renewalType === RenewalType.LIFETIME) return null;

    const nextDate = new Date(lastPaymentDate);

    switch (renewalType) {
      case RenewalType.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RenewalType.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case RenewalType.ANNUAL:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  /**
   * Process auto-renewal for memberships
   */
  async processAutoRenewal(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    try {
      const membershipsToRenew = await Membership.findDueForRenewal();
      let processed = 0;
      let successful = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const membership of membershipsToRenew) {
        try {
          await this.renewMembership(membership.id);
          successful++;
        } catch (error) {
          failed++;
          errors.push(`Failed to renew membership ${membership.id}: ${error}`);
          logger.error(`Auto-renewal failed for membership ${membership.id}:`, error);
        }
        processed++;
      }

      logger.info(`Auto-renewal processed: ${processed} processed, ${successful} successful, ${failed} failed`);

      return { processed, successful, failed, errors };
    } catch (error) {
      logger.error('Error processing auto-renewal:', error);
      throw error;
    }
  }

  /**
   * Get membership statistics
   */
  async getMembershipStatistics(): Promise<{
    total: number;
    byTier: Record<MembershipTier, number>;
    byStatus: Record<MembershipStatus, number>;
    revenue: {
      total: number;
      monthly: number;
      quarterly: number;
      annual: number;
    };
    expiring: {
      thisWeek: number;
      thisMonth: number;
    };
    renewals: {
      autoRenew: number;
      manualRenew: number;
    };
  }> {
    try {
      const total = await Membership.countDocuments();

      // Group by tier
      const byTier: Record<MembershipTier, number> = {
        [MembershipTier.REGULAR]: 0,
        [MembershipTier.BOARD]: 0,
        [MembershipTier.ADMIN]: 0
      };
      
      const tierStats = await Membership.aggregate([
        { $group: { _id: '$tier', count: { $sum: 1 } } }
      ]);
      tierStats.forEach(stat => {
        byTier[stat._id] = stat.count;
      });

      // Group by status
      const byStatus: Record<MembershipStatus, number> = {
        [MembershipStatus.ACTIVE]: 0,
        [MembershipStatus.EXPIRED]: 0,
        [MembershipStatus.SUSPENDED]: 0,
        [MembershipStatus.CANCELLED]: 0,
        [MembershipStatus.PENDING]: 0
      };
      
      const statusStats = await Membership.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      statusStats.forEach(stat => {
        byStatus[stat._id] = stat.count;
      });

      // Revenue calculations
      const revenueStats = await Membership.aggregate([
        { $match: { status: MembershipStatus.ACTIVE } },
        {
          $group: {
            _id: '$renewalType',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const revenue = {
        total: 0,
        monthly: 0,
        quarterly: 0,
        annual: 0
      };

      revenueStats.forEach(stat => {
        revenue.total += stat.totalAmount;
        switch (stat._id) {
          case RenewalType.MONTHLY:
            revenue.monthly = stat.totalAmount;
            break;
          case RenewalType.QUARTERLY:
            revenue.quarterly = stat.totalAmount;
            break;
          case RenewalType.ANNUAL:
            revenue.annual = stat.totalAmount;
            break;
        }
      });

      // Expiring memberships
      const now = new Date();
      const thisWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expiring = {
        thisWeek: await Membership.countDocuments({
          status: MembershipStatus.ACTIVE,
          endDate: { $gte: now, $lte: thisWeek }
        }),
        thisMonth: await Membership.countDocuments({
          status: MembershipStatus.ACTIVE,
          endDate: { $gte: now, $lte: thisMonth }
        })
      };

      // Renewals
      const renewals = {
        autoRenew: await Membership.countDocuments({
          status: MembershipStatus.ACTIVE,
          autoRenew: true
        }),
        manualRenew: await Membership.countDocuments({
          status: MembershipStatus.ACTIVE,
          autoRenew: false
        })
      };

      return {
        total,
        byTier,
        byStatus,
        revenue,
        expiring,
        renewals
      };
    } catch (error) {
      logger.error('Error getting membership statistics:', error);
      throw error;
    }
  }

  /**
   * Upgrade membership tier
   */
  async upgradeMembership(
    membershipId: string,
    newTier: MembershipTier,
    effectiveDate?: Date
  ): Promise<MembershipDocument> {
    try {
      const membership = await Membership.findById(membershipId);
      if (!membership) {
        throw new Error('Membership not found');
      }

      const oldTier = membership.tier;
      membership.tier = newTier;
      
      if (effectiveDate) {
        membership.startDate = effectiveDate;
      }

      await membership.save();

      // Update user's tier
      await User.findByIdAndUpdate(membership.userId, {
        tier: newTier
      });

      logger.info(`Upgraded membership ${membershipId} from ${oldTier} to ${newTier}`);

      // Send upgrade email
      try {
        const user = await User.findById(membership.userId);
        if (user) {
          await emailService.sendMembershipUpgraded(
            user.email,
            user.firstName,
            oldTier,
            newTier
          );
        }
      } catch (emailError) {
        logger.warn('Failed to send upgrade email:', emailError);
      }

      return membership;
    } catch (error) {
      logger.error('Error upgrading membership:', error);
      throw error;
    }
  }

  /**
   * Get available membership tiers with descriptions and pricing
   */
  async getMembershipTiers(): Promise<{
    tiers: Array<{
      name: MembershipTier;
      displayName: string;
      description: string;
      benefits: string[];
      pricing: {
        monthly?: number;
        quarterly?: number;
        annual?: number;
      };
    }>;
  }> {
    const tiers = [
      {
        name: MembershipTier.REGULAR,
        displayName: 'Regular Member',
        description: 'Full access to basic membership features and benefits',
        benefits: [
          'Access to member directory',
          'Event registrations',
          'Newsletter subscription',
          'Community forum access',
          'Basic volunteering opportunities'
        ],
        pricing: {
          monthly: 29.99,
          quarterly: 79.99,
          annual: 299.99
        }
      },
      {
        name: MembershipTier.BOARD,
        displayName: 'Board Member',
        description: 'Enhanced access with leadership opportunities and premium benefits',
        benefits: [
          'All Regular Member benefits',
          'Priority event registration',
          'Board meeting participation',
          'Leadership opportunities',
          'Premium volunteering roles',
          'Mentorship programs',
          'Exclusive networking events'
        ],
        pricing: {
          monthly: 59.99,
          quarterly: 159.99,
          annual: 599.99
        }
      },
      {
        name: MembershipTier.ADMIN,
        displayName: 'Administrator',
        description: 'Full administrative access with all features and responsibilities',
        benefits: [
          'All Board Member benefits',
          'Administrative dashboard access',
          'User management capabilities',
          'Event creation and management',
          'Financial oversight',
          'Strategic planning involvement',
          'Full platform customization'
        ],
        pricing: {
          monthly: 99.99,
          quarterly: 269.99,
          annual: 999.99
        }
      }
    ];

    return { tiers };
  }
}

export default new MembershipService();