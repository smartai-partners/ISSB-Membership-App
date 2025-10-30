import mongoose, { FilterQuery, Query } from 'mongoose';
import { 
  User as IUser, 
  UserRole, 
  MembershipTier, 
  UserStatus, 
  UserProfile,
  UserFilter,
  CreateInput,
  UpdateInput,
  ValidationError,
  PaginatedResponse
} from '@issb/types';
import User, { UserDocument } from '../models/User';
import { sendEmail } from './emailService';
import { logger } from '../config/logger';

// User Statistics Interface
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  bannedUsers: number;
  usersByRole: Record<UserRole, number>;
  usersByTier: Record<MembershipTier, number>;
  usersByStatus: Record<UserStatus, number>;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  growthRate: number;
  averageUsersPerMonth: number;
  emailVerifiedCount: number;
  emailVerificationRate: number;
  recentLogins: number;
  usersWithProfiles: number;
  usersWithCompleteness: number;
}

// User Creation Interface
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  role?: UserRole;
  tier?: MembershipTier;
  status?: UserStatus;
  profile?: Partial<UserProfile>;
  sendWelcomeEmail?: boolean;
  verifyEmail?: boolean;
}

// User Search Parameters
export interface UserSearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: UserRole[];
  tier?: MembershipTier[];
  status?: UserStatus[];
  emailVerified?: boolean;
  hasProfile?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: string;
}

// Profile Update Interface
export interface UpdateProfileInput {
  bio?: string;
  location?: string;
  occupation?: string;
  organization?: string;
  website?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  languages?: string[];
  certifications?: any[];
  experience?: any[];
  interests?: string[];
}

// Password Reset Interface
export interface PasswordResetToken {
  token: string;
  expiresAt: Date;
  userId: string;
  createdAt: Date;
}

class UserService {
  // ============================================================================
  // USER CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserInput): Promise<UserDocument> {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Validate required fields
      if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
        throw new Error('Missing required fields: email, password, firstName, lastName');
      }

      // Create user object
      const user = new User({
        email: userData.email.toLowerCase(),
        password: userData.password,
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        phone: userData.phone?.trim(),
        dateOfBirth: userData.dateOfBirth,
        role: userData.role || UserRole.MEMBER,
        tier: userData.tier || MembershipTier.REGULAR,
        status: userData.status || UserStatus.PENDING,
        profile: userData.profile || {},
        emailVerifiedAt: userData.verifyEmail ? new Date() : undefined,
      });

      // Save user
      const savedUser = await user.save();

      logger.info('User created successfully', {
        userId: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
      });

      // Send welcome email if requested
      if (userData.sendWelcomeEmail && !userData.verifyEmail) {
        await this.sendWelcomeEmail(savedUser);
      }

      // Send verification email if requested
      if (userData.verifyEmail) {
        await this.sendVerificationEmail(savedUser);
      }

      return savedUser;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string, includePassword = false): Promise<UserDocument | null> {
    try {
      let query = User.findById(id);
      
      // Include password if explicitly requested (e.g., for authentication)
      if (includePassword) {
        query = query.select('+password');
      }

      const user = await query.exec();
      
      if (!user) {
        return null;
      }

      logger.debug('User retrieved by ID', { userId: id });
      return user;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string, includePassword = false): Promise<UserDocument | null> {
    try {
      let query = User.findByEmail(email);
      
      if (includePassword) {
        query = query.select('+password');
      }

      const user = await query.exec();
      
      if (!user) {
        return null;
      }

      logger.debug('User retrieved by email', { email });
      return user;
    } catch (error) {
      logger.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, updateData: UpdateInput<IUser>): Promise<UserDocument | null> {
    try {
      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return null;
      }

      // If email is being updated, check for uniqueness
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findByEmail(updateData.email);
        if (existingUser) {
          throw new Error('User with this email already exists');
        }
        updateData.email = updateData.email.toLowerCase();
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return null;
      }

      logger.info('User updated successfully', {
        userId: id,
        updatedFields: Object.keys(updateData),
      });

      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete by setting status to banned)
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      const user = await User.findById(id);
      if (!user) {
        return false;
      }

      // Soft delete by setting status to banned
      await User.findByIdAndUpdate(id, { status: UserStatus.BANNED });

      logger.info('User deleted (banned)', { userId: id, email: user.email });
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Permanently delete user (admin only - use with caution)
   */
  async permanentlyDeleteUser(id: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(id);
      
      if (!result) {
        return false;
      }

      logger.warn('User permanently deleted', { userId: id });
      return true;
    } catch (error) {
      logger.error('Error permanently deleting user:', error);
      throw error;
    }
  }

  // ============================================================================
  // USER SEARCH AND LISTING
  // ============================================================================

  /**
   * Search users with pagination and filtering
   */
  async searchUsers(searchParams: UserSearchParams): Promise<PaginatedResponse<UserDocument>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        role,
        tier,
        status,
        emailVerified,
        hasProfile,
        dateRange,
      } = searchParams;

      // Build filter query
      const filter: FilterQuery<UserDocument> = {};

      // Text search
      if (search) {
        filter.$or = [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { 'profile.bio': { $regex: search, $options: 'i' } },
          { 'profile.occupation': { $regex: search, $options: 'i' } },
          { 'profile.organization': { $regex: search, $options: 'i' } },
        ];
      }

      // Role filter
      if (role && role.length > 0) {
        filter.role = { $in: role };
      }

      // Tier filter
      if (tier && tier.length > 0) {
        filter.tier = { $in: tier };
      }

      // Status filter
      if (status && status.length > 0) {
        filter.status = { $in: status };
      }

      // Email verification filter
      if (emailVerified !== undefined) {
        filter.emailVerifiedAt = emailVerified ? { $exists: true } : { $exists: false };
      }

      // Profile completeness filter
      if (hasProfile !== undefined) {
        if (hasProfile) {
          filter['profile.bio'] = { $exists: true, $ne: '' };
        } else {
          filter.$or = [
            { profile: { $exists: false } },
            { 'profile.bio': { $exists: false } },
            { 'profile.bio': '' },
          ];
        }
      }

      // Date range filter
      if (dateRange) {
        filter.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end,
        };
      }

      // Execute query
      const skip = (page - 1) * limit;
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      const [users, total] = await Promise.all([
        User.find(filter)
          .sort({ [sortBy]: sortDirection })
          .skip(skip)
          .limit(limit)
          .exec(),
        User.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      logger.debug('Users searched', {
        filters: searchParams,
        resultCount: users.length,
        total,
      });

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      logger.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Get all users with basic filtering
   */
  async getAllUsers(filter: UserFilter = {}): Promise<UserDocument[]> {
    try {
      const query: FilterQuery<UserDocument> = {};

      if (filter.role && filter.role.length > 0) {
        query.role = { $in: filter.role };
      }

      if (filter.tier && filter.tier.length > 0) {
        query.tier = { $in: filter.tier };
      }

      if (filter.status && filter.status.length > 0) {
        query.status = { $in: filter.status };
      }

      if (filter.search) {
        query.$or = [
          { email: { $regex: filter.search, $options: 'i' } },
          { firstName: { $regex: filter.search, $options: 'i' } },
          { lastName: { $regex: filter.search, $options: 'i' } },
        ];
      }

      if (filter.dateRange) {
        query.createdAt = {
          $gte: filter.dateRange.start,
          $lte: filter.dateRange.end,
        };
      }

      const sortField = filter.sortBy || 'createdAt';
      const sortDirection = filter.sortOrder === 'asc' ? 1 : -1;

      const users = await User.find(query)
        .sort({ [sortField]: sortDirection })
        .exec();

      return users;
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }

  // ============================================================================
  // USER PROFILE OPERATIONS
  // ============================================================================

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserDocument | null> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return null;
      }

      logger.debug('User profile retrieved', { userId });
      return user;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profileData: UpdateProfileInput): Promise<UserDocument | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      // Update profile fields
      const updateData: any = {};
      
      Object.keys(profileData).forEach(key => {
        if (profileData[key as keyof UpdateProfileInput] !== undefined) {
          updateData[`profile.${key}`] = profileData[key as keyof UpdateProfileInput];
        }
      });

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );

      logger.info('User profile updated', { userId, updatedFields: Object.keys(profileData) });
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Calculate profile completeness percentage
   */
  calculateProfileCompleteness(user: UserDocument): number {
    const profile = user.profile || {};
    let completed = 0;
    let total = 11; // Total number of profile fields

    // Check each profile field
    if (profile.bio?.trim()) completed++;
    if (profile.location?.trim()) completed++;
    if (profile.occupation?.trim()) completed++;
    if (profile.organization?.trim()) completed++;
    if (profile.website?.trim()) completed++;
    if (profile.languages && profile.languages.length > 0) completed++;
    if (profile.certifications && profile.certifications.length > 0) completed++;
    if (profile.experience && profile.experience.length > 0) completed++;
    if (profile.interests && profile.interests.length > 0) completed++;
    if (profile.socialMedia?.linkedin?.trim()) completed++;
    if (user.phone?.trim()) completed++;

    return Math.round((completed / total) * 100);
  }

  // ============================================================================
  // USER STATUS MANAGEMENT
  // ============================================================================

  /**
   * Activate user
   */
  async activateUser(userId: string): Promise<UserDocument | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      if (user.status === UserStatus.ACTIVE) {
        throw new Error('User is already active');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          status: UserStatus.ACTIVE,
          emailVerifiedAt: user.emailVerifiedAt || new Date(),
        },
        { new: true }
      );

      logger.info('User activated', { userId, previousStatus: user.status });
      return updatedUser;
    } catch (error) {
      logger.error('Error activating user:', error);
      throw error;
    }
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string, reason?: string): Promise<UserDocument | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      if (user.status === UserStatus.SUSPENDED) {
        throw new Error('User is already suspended');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          status: UserStatus.SUSPENDED,
          // Could add suspension reason to profile or separate collection
        },
        { new: true }
      );

      logger.info('User suspended', { 
        userId, 
        previousStatus: user.status,
        reason: reason || 'No reason provided'
      });
      return updatedUser;
    } catch (error) {
      logger.error('Error suspending user:', error);
      throw error;
    }
  }

  /**
   * Deactivate user (set to inactive)
   */
  async deactivateUser(userId: string, reason?: string): Promise<UserDocument | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      if (user.status === UserStatus.INACTIVE) {
        throw new Error('User is already inactive');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          status: UserStatus.INACTIVE,
        },
        { new: true }
      );

      logger.info('User deactivated', { 
        userId, 
        previousStatus: user.status,
        reason: reason || 'No reason provided'
      });
      return updatedUser;
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  // ============================================================================
  // PASSWORD MANAGEMENT
  // ============================================================================

  /**
   * Reset user password
   */
  async resetUserPassword(email: string): Promise<{ success: boolean; token?: string; message: string }> {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal that user doesn't exist
        return { success: false, message: 'If an account with that email exists, a password reset link has been sent.' };
      }

      // Generate reset token
      const resetToken = user.createPasswordResetToken();
      await user.save();

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      await sendEmail({
        to: user.email,
        template: 'passwordReset',
        data: {
          name: user.fullName || user.firstName,
          resetUrl,
          expiresIn: '10 minutes',
        },
      });

      logger.info('Password reset requested', { userId: user._id, email: user.email });
      
      return { 
        success: true, 
        token: resetToken, // Only return in development
        message: 'If an account with that email exists, a password reset link has been sent.'
      };
    } catch (error) {
      logger.error('Error resetting password:', error);
      return { 
        success: false, 
        message: 'An error occurred while processing your request.' 
      };
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Hash the token to match stored hash
      const hashedToken = require('crypto')
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        return { success: false, message: 'Invalid or expired reset token.' };
      }

      // Update password and clear reset token
      user.password = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordChangedAt = new Date();

      await user.save();

      logger.info('Password reset confirmed', { userId: user._id, email: user.email });
      
      return { success: true, message: 'Password has been reset successfully.' };
    } catch (error) {
      logger.error('Error confirming password reset:', error);
      return { success: false, message: 'An error occurred while resetting your password.' };
    }
  }

  /**
   * Change user password (authenticated user)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return { success: false, message: 'User not found.' };
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return { success: false, message: 'Current password is incorrect.' };
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info('Password changed', { userId, email: user.email });
      
      return { success: true, message: 'Password has been changed successfully.' };
    } catch (error) {
      logger.error('Error changing password:', error);
      return { success: false, message: 'An error occurred while changing your password.' };
    }
  }

  // ============================================================================
  // EMAIL VERIFICATION
  // ============================================================================

  /**
   * Verify user email
   */
  async verifyUserEmail(userId: string): Promise<UserDocument | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      if (user.emailVerifiedAt) {
        throw new Error('Email is already verified');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
          emailVerifiedAt: new Date(),
          status: UserStatus.ACTIVE, // Auto-activate on email verification
        },
        { new: true }
      );

      logger.info('User email verified', { userId, email: user.email });
      
      // Send welcome email after verification
      if (updatedUser) {
        await this.sendWelcomeEmail(updatedUser);
      }

      return updatedUser;
    } catch (error) {
      logger.error('Error verifying user email:', error);
      throw error;
    }
  }

  /**
   * Send email verification link
   */
  async sendEmailVerification(userId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.emailVerifiedAt) {
        throw new Error('Email is already verified');
      }

      await this.sendVerificationEmail(user);
      return true;
    } catch (error) {
      logger.error('Error sending email verification:', error);
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal that user doesn't exist
        return { success: false, message: 'If an account with that email exists, a verification link has been sent.' };
      }

      if (user.emailVerifiedAt) {
        return { success: false, message: 'This email is already verified.' };
      }

      await this.sendVerificationEmail(user);
      
      return { success: true, message: 'Verification email has been sent.' };
    } catch (error) {
      logger.error('Error resending verification email:', error);
      return { success: false, message: 'An error occurred while sending verification email.' };
    }
  }

  // ============================================================================
  // USER STATISTICS
  // ============================================================================

  /**
   * Get user statistics
   */
  async getUserStatistics(dateRange?: { start: Date; end: Date }): Promise<UserStatistics> {
    try {
      const baseFilter = dateRange ? { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } : {};
      
      // Get current month and last month dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Basic counts
      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        suspendedUsers,
        pendingUsers,
        bannedUsers,
        newUsersThisMonth,
        newUsersLastMonth,
        emailVerifiedCount,
        usersWithProfiles,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: UserStatus.ACTIVE }),
        User.countDocuments({ status: UserStatus.INACTIVE }),
        User.countDocuments({ status: UserStatus.SUSPENDED }),
        User.countDocuments({ status: UserStatus.PENDING }),
        User.countDocuments({ status: UserStatus.BANNED }),
        User.countDocuments({ createdAt: { $gte: startOfMonth } }),
        User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
        User.countDocuments({ emailVerifiedAt: { $exists: true } }),
        User.countDocuments({ 'profile.bio': { $exists: true, $ne: '' } }),
      ]);

      // Users by role
      const usersByRole = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]);

      // Users by tier
      const usersByTier = await User.aggregate([
        { $group: { _id: '$tier', count: { $sum: 1 } } },
      ]);

      // Users by status
      const usersByStatus = await User.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      // Recent logins (last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentLogins = await User.countDocuments({ lastLoginAt: { $gte: thirtyDaysAgo } });

      // Calculate growth rate
      const growthRate = newUsersLastMonth > 0 
        ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
        : 0;

      // Calculate average users per month (approximate)
      const averageUsersPerMonth = totalUsers / Math.max(1, Math.ceil((now.getTime() - new Date('2024-01-01').getTime()) / (30 * 24 * 60 * 60 * 1000)));

      // Calculate email verification rate
      const emailVerificationRate = totalUsers > 0 ? (emailVerifiedCount / totalUsers) * 100 : 0;

      // Calculate users with profile completeness > 50%
      const usersWithCompleteness = await User.countDocuments({
        $expr: {
          $gte: [
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: [
                            { $ifNull: ['$profile.bio', ''] },
                            { $ifNull: ['$profile.location', ''] },
                            { $ifNull: ['$profile.occupation', ''] },
                            { $ifNull: ['$profile.organization', ''] },
                            { $ifNull: ['$profile.website', ''] },
                          ],
                          cond: { $ne: ['$$this', ''] }
                        }
                      }
                    },
                    5
                  ]
                },
                100
              ]
            },
            50
          ]
        }
      });

      // Transform arrays to objects
      const usersByRoleObj = usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<UserRole, number>);

      const usersByTierObj = usersByTier.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<MembershipTier, number>);

      const usersByStatusObj = usersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<UserStatus, number>);

      // Ensure all enum values are represented
      Object.values(UserRole).forEach(role => {
        if (!(role in usersByRoleObj)) {
          usersByRoleObj[role] = 0;
        }
      });

      Object.values(MembershipTier).forEach(tier => {
        if (!(tier in usersByTierObj)) {
          usersByTierObj[tier] = 0;
        }
      });

      Object.values(UserStatus).forEach(status => {
        if (!(status in usersByStatusObj)) {
          usersByStatusObj[status] = 0;
        }
      });

      logger.debug('User statistics calculated', { 
        totalUsers, 
        activeUsers, 
        newUsersThisMonth,
        growthRate: growthRate.toFixed(2)
      });

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        suspendedUsers,
        pendingUsers,
        bannedUsers,
        usersByRole: usersByRoleObj,
        usersByTier: usersByTierObj,
        usersByStatus: usersByStatusObj,
        newUsersThisMonth,
        newUsersLastMonth,
        growthRate: Number(growthRate.toFixed(2)),
        averageUsersPerMonth: Number(averageUsersPerMonth.toFixed(2)),
        emailVerifiedCount,
        emailVerificationRate: Number(emailVerificationRate.toFixed(2)),
        recentLogins,
        usersWithProfiles,
        usersWithCompleteness,
      };
    } catch (error) {
      logger.error('Error calculating user statistics:', error);
      throw error;
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk update user status
   */
  async bulkUpdateUserStatus(userIds: string[], status: UserStatus): Promise<{ success: number; failed: number }> {
    try {
      let success = 0;
      let failed = 0;

      for (const userId of userIds) {
        try {
          const result = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true }
          );

          if (result) {
            success++;
            logger.debug('User status updated in bulk', { userId, status });
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          logger.error('Error updating user status in bulk', { userId, error });
        }
      }

      logger.info('Bulk user status update completed', { total: userIds.length, success, failed });
      return { success, failed };
    } catch (error) {
      logger.error('Error in bulk user status update:', error);
      throw error;
    }
  }

  /**
   * Bulk send verification emails
   */
  async bulkSendVerificationEmails(userIds: string[]): Promise<{ sent: number; failed: number }> {
    try {
      let sent = 0;
      let failed = 0;

      for (const userId of userIds) {
        try {
          const user = await User.findById(userId);
          if (user && !user.emailVerifiedAt) {
            await this.sendVerificationEmail(user);
            sent++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          logger.error('Error sending verification email in bulk', { userId, error });
        }
      }

      logger.info('Bulk verification emails sent', { total: userIds.length, sent, failed });
      return { sent, failed };
    } catch (error) {
      logger.error('Error in bulk verification email sending:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Send welcome email to user
   */
  private async sendWelcomeEmail(user: UserDocument): Promise<void> {
    try {
      const loginUrl = `${process.env.FRONTEND_URL}/login`;
      
      await sendEmail({
        to: user.email,
        template: 'welcomeEmail',
        data: {
          name: user.fullName || user.firstName,
          loginUrl,
        },
      });

      logger.debug('Welcome email sent', { userId: user._id });
    } catch (error) {
      logger.error('Error sending welcome email:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Send verification email to user
   */
  private async sendVerificationEmail(user: UserDocument): Promise<void> {
    try {
      // Generate verification token (simple approach for now)
      const verificationToken = require('crypto').randomBytes(32).toString('hex');
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&userId=${user._id}`;
      
      await sendEmail({
        to: user.email,
        template: 'emailVerification',
        data: {
          name: user.fullName || user.firstName,
          verificationUrl,
        },
      });

      logger.debug('Verification email sent', { userId: user._id });
    } catch (error) {
      logger.error('Error sending verification email:', error);
      // Don't throw error as this is not critical
    }
  }

  /**
   * Validate user data
   */
  private validateUserData(userData: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Email validation
    if (!userData.email) {
      errors.push({ field: 'email', message: 'Email is required', code: 'REQUIRED' });
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(userData.email)) {
      errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' });
    }

    // Password validation
    if (!userData.password) {
      errors.push({ field: 'password', message: 'Password is required', code: 'REQUIRED' });
    } else if (userData.password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters', code: 'MIN_LENGTH' });
    }

    // Name validation
    if (!userData.firstName) {
      errors.push({ field: 'firstName', message: 'First name is required', code: 'REQUIRED' });
    }

    if (!userData.lastName) {
      errors.push({ field: 'lastName', message: 'Last name is required', code: 'REQUIRED' });
    }

    return errors;
  }
}

export default new UserService();
