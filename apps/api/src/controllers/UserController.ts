import express from 'express';
import { z } from 'zod';
import User from '../models/User';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import { UserRole, UserStatus, MembershipTier, UserFilter, PaginatedResponse } from '@issb/types';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Query validation schema for listing users with filters
const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.string().optional(),
  tier: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// User update validation schema (admin)
const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  tier: z.nativeEnum(MembershipTier).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  avatar: z.string().url().optional(),
});

// User profile update validation schema (current user)
const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  avatar: z.string().url().optional(),
  profile: z.object({
    bio: z.string().max(500).optional(),
    location: z.string().max(100).optional(),
    occupation: z.string().max(100).optional(),
    organization: z.string().max(100).optional(),
    website: z.string().max(200).optional(),
    socialMedia: z.object({
      linkedin: z.string().max(200).optional(),
      twitter: z.string().max(100).optional(),
      instagram: z.string().max(100).optional(),
      facebook: z.string().max(200).optional(),
    }).optional(),
    languages: z.array(z.string()).optional(),
    interests: z.array(z.string().max(50)).optional(),
  }).optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format user data for response (excluding sensitive fields)
 */
const formatUserResponse = (user: any) => {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    role: user.role,
    tier: user.tier,
    status: user.status,
    avatar: user.avatar,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Build filter query from request parameters
 */
const buildUserFilter = (query: any): any => {
  const filter: any = {};

  // Search filter (email, firstName, lastName)
  if (query.search) {
    filter.$or = [
      { email: { $regex: query.search, $options: 'i' } },
      { firstName: { $regex: query.search, $options: 'i' } },
      { lastName: { $regex: query.search, $options: 'i' } },
    ];
  }

  // Role filter
  if (query.role) {
    filter.role = { $in: query.role.split(',') };
  }

  // Tier filter
  if (query.tier) {
    filter.tier = { $in: query.tier.split(',') };
  }

  // Status filter
  if (query.status) {
    filter.status = { $in: query.status.split(',') };
  }

  // Date range filter
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) {
      filter.createdAt.$gte = new Date(query.dateFrom);
    }
    if (query.dateTo) {
      filter.createdAt.$lte = new Date(query.dateTo);
    }
  }

  return filter;
};

// ============================================================================
// CONTROLLER CLASS
// ============================================================================

class UserController {
  private router: express.Router;

  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Admin routes
    this.router.get('/', authenticate, authorize([UserRole.ADMIN]), this.listUsers);
    this.router.get('/:id', authenticate, this.getUser);
    this.router.put('/:id', authenticate, authorize([UserRole.ADMIN]), this.updateUser);
    this.router.delete('/:id', authenticate, authorize([UserRole.ADMIN]), this.deleteUser);
    this.router.get('/stats/overview', authenticate, authorize([UserRole.ADMIN]), this.getUserStats);

    // Profile routes (current user)
    this.router.get('/profile/me', authenticate, this.getCurrentProfile);
    this.router.put('/profile/me', authenticate, this.updateCurrentProfile);
  }

  /**
   * GET /api/users
   * List users with filters and pagination
   * Access: Admin only
   */
  private listUsers = asyncHandler(async (req: express.Request, res: express.Response) => {
    // Validate query parameters
    const validatedQuery = listUsersQuerySchema.parse(req.query);

    // Build filter
    const filter = buildUserFilter(validatedQuery);

    // Build sort
    const sortBy = validatedQuery.sortBy || 'createdAt';
    const sortOrder = validatedQuery.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Calculate pagination
    const page = validatedQuery.page;
    const limit = validatedQuery.limit;
    const skip = (page - 1) * limit;

    // Execute query
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Format response
    const formattedUsers = users.map(formatUserResponse);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    logger.info(`Admin listed ${users.length} users`, {
      adminId: req.user!.id,
      filters: validatedQuery,
      totalFound: total,
    });

    res.json({
      success: true,
      data: formattedUsers,
      meta: pagination,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/users/:id
   * Get user by ID
   * Access: Admin or the user themselves
   */
  private getUser = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;

    // Check if user is trying to access their own data or is admin
    if (req.user!.id !== id && !req.user!.roles?.includes(UserRole.ADMIN)) {
      throw new AppError('Not authorized to access this user data', 403);
    }

    const user = await User.findById(id).lean();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Log access
    logger.info(`User profile accessed`, {
      accessedBy: req.user!.id,
      targetUser: id,
      isOwnProfile: req.user!.id === id,
    });

    res.json({
      success: true,
      data: {
        user: formatUserResponse(user),
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * PUT /api/users/:id
   * Update user (admin only)
   * Access: Admin only
   */
  private updateUser = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;

    // Validate request body
    const validatedData = updateUserSchema.parse(req.body);

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check for email uniqueness if email is being updated
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await User.findByEmail(validatedData.email);
      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }
    }

    // Update user
    Object.assign(user, validatedData);
    await user.save();

    logger.info(`User updated by admin`, {
      adminId: req.user!.id,
      updatedUserId: id,
      updatedFields: Object.keys(validatedData),
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: formatUserResponse(user),
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * DELETE /api/users/:id
   * Delete user (admin only)
   * Access: Admin only
   */
  private deleteUser = asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user!.id === id) {
      throw new AppError('You cannot delete your own account', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // TODO: Add checks for related data (memberships, registrations, etc.)
    // For now, we'll allow deletion but log a warning
    logger.warn(`User deletion requested`, {
      adminId: req.user!.id,
      targetUserId: id,
      warning: 'No related data checks performed',
    });

    await User.findByIdAndDelete(id);

    logger.info(`User deleted by admin`, {
      adminId: req.user!.id,
      deletedUserId: id,
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/users/profile
   * Get current user profile
   * Access: Private (current user)
   */
  private getCurrentProfile = asyncHandler(async (req: express.Request, res: express.Response) => {
    const user = await User.findById(req.user!.id).lean();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        user: formatUserResponse(user),
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * PUT /api/users/profile
   * Update current user profile
   * Access: Private (current user)
   */
  private updateCurrentProfile = asyncHandler(async (req: express.Request, res: express.Response) => {
    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body);

    const user = await User.findById(req.user!.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check for email uniqueness if email is being updated
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await User.findByEmail(validatedData.email);
      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }
    }

    // Update user profile
    Object.assign(user, validatedData);
    await user.save();

    logger.info(`User profile updated`, {
      userId: req.user!.id,
      updatedFields: Object.keys(validatedData),
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: formatUserResponse(user),
      },
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * GET /api/users/stats
   * Get user statistics for admin dashboard
   * Access: Admin only
   */
  private getUserStats = asyncHandler(async (req: express.Request, res: express.Response) => {
    // Get various statistics
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      usersByRole,
      usersByTier,
      recentRegistrations,
      loginStats,
    ] = await Promise.all([
      // Total users
      User.countDocuments(),
      
      // Active users
      User.countDocuments({ status: UserStatus.ACTIVE }),
      
      // Pending users
      User.countDocuments({ status: UserStatus.PENDING }),
      
      // Suspended users
      User.countDocuments({ status: UserStatus.SUSPENDED }),
      
      // Users by role
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $project: { role: '$_id', count: 1, _id: 0 } },
      ]),
      
      // Users by tier
      User.aggregate([
        { $group: { _id: '$tier', count: { $sum: 1 } } },
        { $project: { tier: '$_id', count: 1, _id: 0 } },
      ]),
      
      // Recent registrations (last 30 days)
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      
      // Login statistics (users who logged in last 7 days)
      User.countDocuments({
        lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    // Monthly registration trend (last 12 months)
    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { year: 1, month: 1 },
      },
    ]);

    const stats = {
      overview: {
        total: totalUsers,
        active: activeUsers,
        pending: pendingUsers,
        suspended: suspendedUsers,
        recentRegistrations,
        activeLogins: loginStats,
      },
      distribution: {
        byRole: usersByRole,
        byTier: usersByTier,
      },
      trends: {
        monthlyRegistrations,
      },
      generatedAt: new Date().toISOString(),
    };

    logger.info(`User statistics retrieved by admin`, {
      adminId: req.user!.id,
      statsRequested: true,
    });

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get router for mounting in express app
   */
  public getRouter(): express.Router {
    return this.router;
  }
}

// Export controller instance
export default new UserController().getRouter();
