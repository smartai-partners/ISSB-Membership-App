import { Request, Response } from 'express';
import { z } from 'zod';
import {
  // Import all validators
  createMembershipSchema,
  updateMembershipSchema,
  renewMembershipSchema,
  upgradeMembershipSchema,
  cancelMembershipSchema,
  membershipFilterSchema,
  membershipSearchSchema,
  bulkUpdateMembershipsSchema,
  bulkRenewMembershipsSchema,
  membershipAnalyticsSchema,
  processPaymentSchema,
  refundSchema,
  // Import utility functions
  canRenewMembership,
  calculateProration,
  validateMembershipDates
} from './index';

// ============================================================================
// EXAMPLE CONTROLLER IMPLEMENTATION
// ============================================================================

export class MembershipValidatorExampleController {
  
  // -------------------------------------------------------------------------
  // CREATE MEMBERSHIP EXAMPLE
  // -------------------------------------------------------------------------
  async createMembership(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = createMembershipSchema.parse(req.body);
      
      // Business logic would go here
      console.log('Validated membership data:', validatedData);
      
      // Example: Check if user already has an active membership
      // const existingMembership = await membershipService.findActiveByUserId(validatedData.userId);
      // if (existingMembership) {
      //   return res.status(400).json({
      //     success: false,
      //     message: 'User already has an active membership'
      //   });
      // }
      
      return res.status(201).json({
        success: true,
        data: {
          id: 'new-membership-id',
          ...validatedData,
          status: 'active',
          createdAt: new Date()
        },
        message: 'Membership created successfully'
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create membership'
      });
    }
  }

  // -------------------------------------------------------------------------
  // UPDATE MEMBERSHIP EXAMPLE
  // -------------------------------------------------------------------------
  async updateMembership(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validate request body (partial validation for updates)
      const validatedData = updateMembershipSchema.parse(req.body);
      
      // Example: Validate date logic
      if (validatedData.startDate && validatedData.endDate) {
        if (!validateMembershipDates(validatedData.startDate, validatedData.endDate)) {
          return res.status(400).json({
            success: false,
            message: 'Start date must be before end date'
          });
        }
      }
      
      return res.json({
        success: true,
        data: {
          id,
          ...validatedData,
          updatedAt: new Date()
        },
        message: 'Membership updated successfully'
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to update membership'
      });
    }
  }

  // -------------------------------------------------------------------------
  // RENEW MEMBERSHIP EXAMPLE
  // -------------------------------------------------------------------------
  async renewMembership(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validate request body with membership ID
      const renewalData = {
        membershipId: id,
        ...req.body
      };
      
      const validatedData = renewMembershipSchema.parse(renewalData);
      
      // Example: Check if membership can be renewed
      const mockMembership = {
        status: 'active' as const,
        endDate: new Date('2024-12-31'),
        autoRenew: false
      };
      
      if (!canRenewMembership(mockMembership)) {
        return res.status(400).json({
          success: false,
          message: 'Membership cannot be renewed'
        });
      }
      
      return res.json({
        success: true,
        data: {
          id,
          ...validatedData,
          renewedUntil: new Date('2025-12-31'),
          status: 'active'
        },
        message: 'Membership renewed successfully'
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to renew membership'
      });
    }
  }

  // -------------------------------------------------------------------------
  // UPGRADE MEMBERSHIP EXAMPLE
  // -------------------------------------------------------------------------
  async upgradeMembership(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validate request body with membership ID
      const upgradeData = {
        membershipId: id,
        ...req.body
      };
      
      const validatedData = upgradeMembershipSchema.parse(upgradeData);
      
      // Example: Calculate proration if requested
      let prorationAmount = 0;
      if (validatedData.proration) {
        prorationAmount = calculateProration(
          MembershipTier.REGULAR,
          validatedData.newTier,
          99.99,
          199.99,
          180, // days remaining
          365  // total days in period
        );
      }
      
      return res.json({
        success: true,
        data: {
          id,
          ...validatedData,
          prorationAmount,
          status: 'active',
          upgradedAt: new Date()
        },
        message: `Membership upgraded to ${validatedData.newTier} successfully`
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to upgrade membership'
      });
    }
  }

  // -------------------------------------------------------------------------
  // LIST MEMBERSHIPS WITH FILTERING EXAMPLE
  // -------------------------------------------------------------------------
  async listMemberships(req: Request, res: Response) {
    try {
      // Validate query parameters for filtering
      const validatedFilters = membershipFilterSchema.parse(req.query);
      
      // Example: Build query based on filters
      const query = {
        where: {
          ...(validatedFilters.tier && { tier: { in: validatedFilters.tier } }),
          ...(validatedFilters.status && { status: { in: validatedFilters.status } }),
          ...(validatedFilters.renewalType && { renewalType: { in: validatedFilters.renewalType } }),
          ...(validatedFilters.autoRenew !== undefined && { autoRenew: validatedFilters.autoRenew }),
          ...(validatedFilters.dateRange && {
            createdAt: {
              gte: validatedFilters.dateRange.start,
              lte: validatedFilters.dateRange.end
            }
          })
        },
        skip: (validatedFilters.page - 1) * validatedFilters.limit,
        take: validatedFilters.limit,
        orderBy: {
          [validatedFilters.sortBy]: validatedFilters.sortOrder
        }
      };
      
      // Mock result for demonstration
      const mockResult = {
        data: [
          {
            id: 'membership-1',
            tier: MembershipTier.REGULAR,
            status: MembershipStatus.ACTIVE,
            createdAt: new Date()
          }
        ],
        meta: {
          total: 1,
          page: validatedFilters.page,
          limit: validatedFilters.limit,
          totalPages: 1
        }
      };
      
      return res.json({
        success: true,
        data: mockResult.data,
        meta: mockResult.meta
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch memberships'
      });
    }
  }

  // -------------------------------------------------------------------------
  // SEARCH MEMBERSHIPS EXAMPLE
  // -------------------------------------------------------------------------
  async searchMemberships(req: Request, res: Response) {
    try {
      // Validate search parameters
      const searchData = membershipSearchSchema.parse(req.body);
      
      // Example: Build search query
      const searchQuery = {
        where: {
          OR: [
            { user: { firstName: { contains: searchData.query } } },
            { user: { lastName: { contains: searchData.query } } },
            { user: { email: { contains: searchData.query } } }
          ],
          ...(searchData.filters && {
            AND: [
              ...(searchData.filters.tier ? [{ tier: { in: searchData.filters.tier } }] : []),
              ...(searchData.filters.status ? [{ status: { in: searchData.filters.status } }] : []),
              ...(searchData.filters.dateRange ? [{
                createdAt: {
                  gte: searchData.filters.dateRange.start,
                  lte: searchData.filters.dateRange.end
                }
              }] : [])
            ]
          })
        },
        skip: (searchData.page - 1) * searchData.limit,
        take: searchData.limit
      };
      
      return res.json({
        success: true,
        data: {
          results: [],
          total: 0,
          page: searchData.page,
          limit: searchData.limit
        },
        message: 'Search completed successfully'
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Search failed'
      });
    }
  }

  // -------------------------------------------------------------------------
  // BULK UPDATE MEMBERSHIPS EXAMPLE
  // -------------------------------------------------------------------------
  async bulkUpdateMemberships(req: Request, res: Response) {
    try {
      // Validate bulk update data
      const bulkData = bulkUpdateMembershipsSchema.parse(req.body);
      
      // Example: Process bulk update
      console.log(`Updating ${bulkData.membershipIds.length} memberships`);
      
      // Validate that all membership IDs exist and are valid
      // const existingMemberships = await membershipService.findMany({
      //   where: { id: { in: bulkData.membershipIds } }
      // });
      
      // if (existingMemberships.length !== bulkData.membershipIds.length) {
      //   return res.status(400).json({
      //     success: false,
      //     message: 'Some membership IDs are invalid'
      //   });
      // }
      
      return res.json({
        success: true,
        data: {
          updatedCount: bulkData.membershipIds.length,
          memberships: bulkData.membershipIds.map(id => ({
            id,
            ...bulkData.updates,
            updatedAt: new Date()
          }))
        },
        message: `${bulkData.membershipIds.length} memberships updated successfully`
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Bulk update failed'
      });
    }
  }

  // -------------------------------------------------------------------------
  // MEMBERSHIP ANALYTICS EXAMPLE
  // -------------------------------------------------------------------------
  async getMembershipAnalytics(req: Request, res: Response) {
    try {
      // Validate analytics parameters
      const analyticsData = membershipAnalyticsSchema.parse(req.query);
      
      // Example: Generate analytics based on filters
      const analytics = {
        totalMembers: 1250,
        newMembers: 45,
        renewals: 89,
        cancellations: 12,
        revenue: 125000.00,
        retentionRate: 0.92,
        period: analyticsData.dateRange || 'all-time',
        groupBy: analyticsData.groupBy
      };
      
      return res.json({
        success: true,
        data: analytics,
        meta: {
          generatedAt: new Date(),
          filters: analyticsData
        }
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to generate analytics'
      });
    }
  }

  // -------------------------------------------------------------------------
  // PROCESS PAYMENT EXAMPLE
  // -------------------------------------------------------------------------
  async processPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validate payment data
      const paymentData = {
        membershipId: id,
        ...req.body
      };
      
      const validatedData = processPaymentSchema.parse(paymentData);
      
      // Example: Process payment through payment gateway
      console.log('Processing payment:', {
        membershipId: validatedData.membershipId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        paymentMethod: validatedData.paymentMethod.type
      });
      
      // Mock payment processing
      const paymentResult = {
        id: 'payment-123',
        status: 'succeeded',
        amount: validatedData.amount,
        currency: validatedData.currency,
        processedAt: new Date()
      };
      
      return res.json({
        success: true,
        data: paymentResult,
        message: 'Payment processed successfully'
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Payment processing failed'
      });
    }
  }

  // -------------------------------------------------------------------------
  // REFUND PROCESSING EXAMPLE
  // -------------------------------------------------------------------------
  async processRefund(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validate refund data
      const refundData = {
        membershipId: id,
        ...req.body
      };
      
      const validatedData = refundSchema.parse(refundData);
      
      // Example: Process refund through payment gateway
      console.log('Processing refund:', {
        membershipId: validatedData.membershipId,
        amount: validatedData.amount,
        reason: validatedData.reason
      });
      
      const refundResult = {
        id: 'refund-123',
        status: 'succeeded',
        amount: validatedData.amount || 'full',
        reason: validatedData.reason,
        processedAt: new Date()
      };
      
      return res.json({
        success: true,
        data: refundResult,
        message: 'Refund processed successfully'
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Refund processing failed'
      });
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MembershipValidatorExampleController;