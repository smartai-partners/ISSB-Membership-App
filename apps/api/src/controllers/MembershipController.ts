import { Request, Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Membership from '../models/Membership';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import {
  MembershipTier,
  MembershipStatus,
  RenewalType,
  CreateInput,
  UpdateInput,
  ApiResponse,
} from '@issb/types';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createMembershipSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  tier: z.nativeEnum(MembershipTier),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  renewalType: z.nativeEnum(RenewalType),
  autoRenew: z.boolean().optional().default(false),
  paymentMethod: z.string().max(100).optional(),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').optional().default('USD'),
  benefits: z.array(z.string().max(200)).optional().default([]),
});

const updateMembershipSchema = z.object({
  tier: z.nativeEnum(MembershipTier).optional(),
  status: z.nativeEnum(MembershipStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  renewalType: z.nativeEnum(RenewalType).optional(),
  autoRenew: z.boolean().optional(),
  paymentMethod: z.string().max(100).optional(),
  amount: z.number().min(0, 'Amount must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  benefits: z.array(z.string().max(200)).optional(),
});

const renewMembershipSchema = z.object({
  renewalType: z.nativeEnum(RenewalType).optional(),
  autoRenew: z.boolean().optional(),
  paymentMethod: z.string().max(100).optional(),
  amount: z.number().min(0, 'Amount must be positive').optional(),
});

const membershipQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  tier: z.nativeEnum(MembershipTier).optional(),
  status: z.nativeEnum(MembershipStatus).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// CONTROLLER CLASS
// ============================================================================

class MembershipController {
  /**
   * GET /api/membership
   * @desc Get all memberships with pagination and filtering
   * @access Private (Admin/Board only)
   */
  static getAllMemberships = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const validatedQuery = membershipQuerySchema.parse(req.query);
      const { page, limit, tier, status, sortBy, sortOrder } = validatedQuery;

      // Build filter
      const filter: any = {};
      if (tier) filter.tier = tier;
      if (status) filter.status = status;

      // Build sort
      const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const [memberships, total] = await Promise.all([
        Membership.find(filter)
          .populate('userId', 'email firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Membership.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      const response: ApiResponse = {
        success: true,
        data: memberships,
        message: 'Memberships retrieved successfully',
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };

      res.status(200).json(response);
    }
  );

  /**
   * GET /api/membership/:id
   * @desc Get membership by ID
   * @access Private (Admin/Board or own membership)
   */
  static getMembershipById = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid membership ID format', 400);
      }

      const membership = await Membership.findById(id)
        .populate('userId', 'email firstName lastName avatar phone')
        .lean();

      if (!membership) {
        throw new AppError('Membership not found', 404);
      }

      // Check if user has permission (admin/board or owns the membership)
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'board';
      const isOwner = membership.userId._id.toString() === req.user?.id;

      if (!isAdmin && !isOwner) {
        throw new AppError('Access denied. You can only view your own membership.', 403);
      }

      const response: ApiResponse = {
        success: true,
        data: membership,
        message: 'Membership retrieved successfully',
      };

      res.status(200).json(response);
    }
  );

  /**
   * POST /api/membership
   * @desc Create a new membership
   * @access Private (Admin/Board only)
   */
  static createMembership = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const validatedData = createMembershipSchema.parse(req.body);

      // Check if user already has a membership
      const existingMembership = await Membership.findOne({
        userId: validatedData.userId,
      });

      if (existingMembership) {
        throw new AppError('User already has a membership', 409);
      }

      // Validate dates
      const startDate = new Date(validatedData.startDate);
      const endDate = new Date(validatedData.endDate);

      if (endDate <= startDate) {
        throw new AppError('End date must be after start date', 400);
      }

      // Calculate next payment date if auto-renew is enabled
      let nextPaymentDate: Date | null = null;
      if (validatedData.autoRenew && validatedData.renewalType !== RenewalType.LIFETIME) {
        const baseDate = startDate;
        nextPaymentDate = new Date(baseDate);
        
        switch (validatedData.renewalType) {
          case RenewalType.MONTHLY:
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
            break;
          case RenewalType.QUARTERLY:
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
            break;
          case RenewalType.ANNUAL:
            nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
            break;
        }
      }

      // Create membership
      const membership = await Membership.create({
        ...validatedData,
        status: MembershipStatus.PENDING,
        nextPaymentDate,
      });

      // Populate user information for response
      await membership.populate('userId', 'email firstName lastName');

      const response: ApiResponse = {
        success: true,
        data: membership,
        message: 'Membership created successfully',
      };

      res.status(201).json(response);
    }
  );

  /**
   * PUT /api/membership/:id
   * @desc Update membership
   * @access Private (Admin/Board only)
   */
  static updateMembership = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const validatedData = updateMembershipSchema.parse(req.body);

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid membership ID format', 400);
      }

      const membership = await Membership.findById(id);
      if (!membership) {
        throw new AppError('Membership not found', 404);
      }

      // Validate dates if provided
      if (validatedData.startDate && validatedData.endDate) {
        const startDate = new Date(validatedData.startDate);
        const endDate = new Date(validatedData.endDate);

        if (endDate <= startDate) {
          throw new AppError('End date must be after start date', 400);
        }
      }

      // Update next payment date if renewal settings changed
      if (validatedData.renewalType || validatedData.autoRenew) {
        const renewalType = validatedData.renewalType || membership.renewalType;
        const autoRenew = validatedData.autoRenew ?? membership.autoRenew;

        if (autoRenew && renewalType !== RenewalType.LIFETIME) {
          membership.nextPaymentDate = membership.calculateNextPaymentDate();
        } else {
          membership.nextPaymentDate = null;
        }
      }

      // Update membership
      Object.assign(membership, validatedData);
      await membership.save();

      // Populate user information for response
      await membership.populate('userId', 'email firstName lastName');

      const response: ApiResponse = {
        success: true,
        data: membership,
        message: 'Membership updated successfully',
      };

      res.status(200).json(response);
    }
  );

  /**
   * DELETE /api/membership/:id
   * @desc Cancel membership (soft delete by setting status to CANCELLED)
   * @access Private (Admin/Board only)
   */
  static cancelMembership = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid membership ID format', 400);
      }

      const membership = await Membership.findById(id);
      if (!membership) {
        throw new AppError('Membership not found', 404);
      }

      if (membership.status === MembershipStatus.CANCELLED) {
        throw new AppError('Membership is already cancelled', 400);
      }

      // Update membership status to cancelled
      membership.status = MembershipStatus.CANCELLED;
      membership.autoRenew = false;
      membership.nextPaymentDate = null;
      await membership.save();

      const response: ApiResponse = {
        success: true,
        data: membership,
        message: 'Membership cancelled successfully',
      };

      res.status(200).json(response);
    }
  );

  /**
   * GET /api/membership/user/:userId
   * @desc Get user's membership
   * @access Private (Admin/Board or the user themselves)
   */
  static getUserMembership = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { userId } = req.params;

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid user ID format', 400);
      }

      // Check permissions
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'board';
      const isOwner = userId === req.user?.id;

      if (!isAdmin && !isOwner) {
        throw new AppError('Access denied. You can only view your own membership.', 403);
      }

      const membership = await Membership.findOne({ userId })
        .populate('userId', 'email firstName lastName avatar phone')
        .lean();

      if (!membership) {
        throw new AppError('No membership found for this user', 404);
      }

      const response: ApiResponse = {
        success: true,
        data: membership,
        message: 'User membership retrieved successfully',
      };

      res.status(200).json(response);
    }
  );

  /**
   * POST /api/membership/:id/renew
   * @desc Renew membership
   * @access Private (Admin/Board or membership owner)
   */
  static renewMembership = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const validatedData = renewMembershipSchema.parse(req.body);

      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid membership ID format', 400);
      }

      const membership = await Membership.findById(id);
      if (!membership) {
        throw new AppError('Membership not found', 404);
      }

      // Check permissions
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'board';
      const isOwner = membership.userId.toString() === req.user?.id;

      if (!isAdmin && !isOwner) {
        throw new AppError('Access denied. You can only renew your own membership.', 403);
      }

      // Calculate new dates
      const currentEndDate = new Date(membership.endDate);
      const renewalType = validatedData.renewalType || membership.renewalType;
      
      let newEndDate: Date;
      switch (renewalType) {
        case RenewalType.MONTHLY:
          newEndDate = new Date(currentEndDate);
          newEndDate.setMonth(newEndDate.getMonth() + 1);
          break;
        case RenewalType.QUARTERLY:
          newEndDate = new Date(currentEndDate);
          newEndDate.setMonth(newEndDate.getMonth() + 3);
          break;
        case RenewalType.ANNUAL:
          newEndDate = new Date(currentEndDate);
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          break;
        case RenewalType.LIFETIME:
          newEndDate = new Date('9999-12-31'); // Far future date for lifetime
          break;
        default:
          newEndDate = new Date(currentEndDate);
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      }

      // Update membership
      membership.startDate = currentEndDate;
      membership.endDate = newEndDate;
      membership.renewalType = renewalType;
      membership.autoRenew = validatedData.autoRenew ?? membership.autoRenew;
      membership.paymentMethod = validatedData.paymentMethod || membership.paymentMethod;
      membership.amount = validatedData.amount || membership.amount;
      membership.status = MembershipStatus.ACTIVE;
      membership.lastPaymentDate = new Date();

      // Calculate next payment date
      if (membership.autoRenew && renewalType !== RenewalType.LIFETIME) {
        membership.nextPaymentDate = membership.calculateNextPaymentDate();
      } else {
        membership.nextPaymentDate = null;
      }

      await membership.save();

      // Populate user information for response
      await membership.populate('userId', 'email firstName lastName');

      const response: ApiResponse = {
        success: true,
        data: membership,
        message: 'Membership renewed successfully',
      };

      res.status(200).json(response);
    }
  );

  /**
   * GET /api/membership/expiring
   * @desc Get memberships expiring within specified days (default 30)
   * @access Private (Admin/Board only)
   */
  static getExpiringMemberships = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const days = parseInt(req.query.days as string) || 30;

      if (days < 1 || days > 365) {
        throw new AppError('Days must be between 1 and 365', 400);
      }

      const expiringMemberships = await Membership.findExpiring(days)
        .populate('userId', 'email firstName lastName phone')
        .sort({ endDate: 1 })
        .lean();

      const response: ApiResponse = {
        success: true,
        data: expiringMemberships,
        message: `${expiringMemberships.length} memberships expiring within ${days} days`,
        meta: {
          total: expiringMemberships.length,
          daysAhead: days,
        },
      };

      res.status(200).json(response);
    }
  );

  /**
   * GET /api/membership/stats
   * @desc Get membership statistics
   * @access Private (Admin/Board only)
   */
  static getMembershipStats = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const stats = await Promise.all([
        // Total memberships by status
        Membership.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        
        // Total memberships by tier
        Membership.aggregate([
          { $group: { _id: '$tier', count: { $sum: 1 } } },
        ]),
        
        // Active memberships
        Membership.countDocuments({ 
          status: MembershipStatus.ACTIVE,
          endDate: { $gt: new Date() }
        }),
        
        // Expired memberships
        Membership.countDocuments({ 
          status: { $in: [MembershipStatus.EXPIRED, MembershipStatus.CANCELLED] }
        }),
        
        // Auto-renewal statistics
        Membership.aggregate([
          { 
            $group: { 
              _id: '$autoRenew', 
              count: { $sum: 1 } 
            } 
          }
        ]),
        
        // Revenue by tier (for active memberships)
        Membership.aggregate([
          { 
            $match: { 
              status: MembershipStatus.ACTIVE,
              endDate: { $gt: new Date() }
            }
          },
          {
            $group: {
              _id: '$tier',
              totalRevenue: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      const [
        statusStats,
        tierStats,
        activeCount,
        expiredCount,
        autoRenewStats,
        revenueStats
      ] = stats;

      const response: ApiResponse = {
        success: true,
        data: {
          byStatus: statusStats,
          byTier: tierStats,
          summary: {
            total: statusStats.reduce((sum, stat) => sum + stat.count, 0),
            active: activeCount,
            expired: expiredCount,
          },
          autoRenew: autoRenewStats,
          revenueByTier: revenueStats,
        },
        message: 'Membership statistics retrieved successfully',
      };

      res.status(200).json(response);
    }
  );
}

export default MembershipController;
