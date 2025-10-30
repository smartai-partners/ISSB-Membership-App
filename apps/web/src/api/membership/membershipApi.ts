import api from '../../services/api';
import {
  Membership,
  MembershipTier,
  MembershipStatus,
  RenewalType,
  User,
  UserRole,
  PaginatedResponse,
  ApiResponse,
  CreateInput,
  UpdateInput,
} from '@issb/types';

// ============================================================================
// MEMBERSHIP API TYPES
// ============================================================================

export interface CreateMembershipRequest {
  userId: string;
  tier: MembershipTier;
  startDate: Date;
  endDate: Date;
  renewalType: RenewalType;
  autoRenew: boolean;
  paymentMethod?: string;
  amount: number;
  currency: string;
  benefits: string[];
}

export interface UpdateMembershipRequest extends Partial<CreateMembershipRequest> {
  status?: MembershipStatus;
}

export interface MembershipRenewalRequest {
  membershipId: string;
  userId: string;
  paymentMethodId: string;
  renewalType?: RenewalType;
  benefits?: string[];
  amount?: number;
  currency?: string;
}

export interface MembershipUpgradeRequest {
  membershipId: string;
  userId: string;
  newTier: MembershipTier;
  upgradeReason?: string;
  effectiveDate: Date;
  proRatedAmount: number;
  paymentMethodId: string;
}

export interface MembershipCancellationRequest {
  membershipId: string;
  userId: string;
  reason: string;
  cancellationDate?: Date;
  refundAmount?: number;
  immediateEffect?: boolean;
}

export interface PaymentMethodRequest {
  type: 'card' | 'bank' | 'paypal' | 'other';
  cardNumber?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
  cardholderName?: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isDefault: boolean;
}

export interface PaymentRequest {
  membershipId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface MembershipFilter {
  status?: MembershipStatus[];
  tier?: MembershipTier[];
  renewalType?: RenewalType[];
  autoRenew?: boolean;
  userId?: string;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  expiringWithin?: number; // days
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MembershipStatistics {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  suspendedMembers: number;
  cancelledMembers: number;
  pendingMembers: number;
  membersByTier: Record<MembershipTier, number>;
  membersByStatus: Record<MembershipStatus, number>;
  renewalRate: number;
  churnRate: number;
  averageMembershipDuration: number; // in months
  revenueByTier: Record<MembershipTier, number>;
  monthlyRecurringRevenue: number;
  upcomingRenewals: number;
  expiringThisMonth: number;
  membershipTrends: Array<{
    month: string;
    newMembers: number;
    renewals: number;
    cancellations: number;
    revenue: number;
  }>;
}

export interface MembershipQueryOptions {
  filters?: Partial<MembershipFilter>;
  include?: string[];
  exclude?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MembershipBenefits {
  tier: MembershipTier;
  benefits: string[];
  description: string;
  price: number;
  renewalOptions: RenewalType[];
  features: string[];
}

export interface TierConfiguration {
  tier: MembershipTier;
  name: string;
  description: string;
  price: number;
  currency: string;
  renewalTypes: RenewalType[];
  benefits: string[];
  features: string[];
  requirements: string[];
  maxMembers?: number;
  isActive: boolean;
}

// ============================================================================
// MEMBERSHIP API SERVICE
// ============================================================================

class MembershipApiService {
  private baseUrl = '/memberships';

  // ============================================================================
  // MEMBERSHIP CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new membership
   */
  async createMembership(data: CreateMembershipRequest): Promise<ApiResponse<Membership>> {
    try {
      const response = await api.post(`${this.baseUrl}`, data);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get membership by ID
   */
  async getMembership(id: string, options?: { include?: string[] }): Promise<ApiResponse<Membership>> {
    try {
      const params = new URLSearchParams();
      if (options?.include) {
        params.append('include', options.include.join(','));
      }

      const response = await api.get(`${this.baseUrl}/${id}?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get membership by user ID
   */
  async getMembershipByUserId(userId: string): Promise<ApiResponse<Membership>> {
    try {
      const response = await api.get(`${this.baseUrl}/user/${userId}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update membership
   */
  async updateMembership(id: string, data: UpdateMembershipRequest): Promise<ApiResponse<Membership>> {
    try {
      const response = await api.patch(`${this.baseUrl}/${id}`, data);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel membership
   */
  async cancelMembership(data: MembershipCancellationRequest): Promise<ApiResponse<Membership>> {
    try {
      const response = await api.post(`${this.baseUrl}/${data.membershipId}/cancel`, data);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Suspend membership
   */
  async suspendMembership(membershipId: string, reason: string, suspendedBy: string): Promise<ApiResponse<Membership>> {
    try {
      const response = await api.post(`${this.baseUrl}/${membershipId}/suspend`, {
        reason,
        suspendedBy,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Reactivate membership
   */
  async reactivateMembership(membershipId: string, reactivatedBy: string): Promise<ApiResponse<Membership>> {
    try {
      const response = await api.post(`${this.baseUrl}/${membershipId}/reactivate`, {
        reactivatedBy,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * List memberships with filtering and pagination
   */
  async listMemberships(options?: MembershipQueryOptions): Promise<ApiResponse<PaginatedResponse<Membership>>> {
    try {
      const params = new URLSearchParams();

      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined) {
            if (Array.isArray(value)) {
              params.append(key, value.join(','));
            } else {
              params.append(key, String(value));
            }
          }
        });
      }

      if (options?.include) {
        params.append('include', options.include.join(','));
      }

      if (options?.exclude) {
        params.append('exclude', options.exclude.join(','));
      }

      if (options?.page) {
        params.append('page', String(options.page));
      }

      if (options?.limit) {
        params.append('limit', String(options.limit));
      }

      if (options?.sortBy) {
        params.append('sortBy', options.sortBy);
      }

      if (options?.sortOrder) {
        params.append('sortOrder', options.sortOrder);
      }

      const response = await api.get(`${this.baseUrl}?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // MEMBERSHIP RENEWAL OPERATIONS
  // ============================================================================

  /**
   * Renew membership
   */
  async renewMembership(data: MembershipRenewalRequest): Promise<ApiResponse<Membership>> {
    try {
      const response = await api.post(`${this.baseUrl}/${data.membershipId}/renew`, data);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Auto-renew membership
   */
  async autoRenewMembership(membershipId: string, enabled: boolean): Promise<ApiResponse<Membership>> {
    try {
      const response = await api.patch(`${this.baseUrl}/${membershipId}/auto-renew`, {
        enabled,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Process scheduled renewals
   */
  async processScheduledRenewals(): Promise<ApiResponse<{ processed: number; successful: number; failed: number }>> {
    try {
      const response = await api.post(`${this.baseUrl}/process-renewals`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get upcoming renewals
   */
  async getUpcomingRenewals(days: number = 30): Promise<ApiResponse<Membership[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/upcoming-renewals?days=${days}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Send renewal reminders
   */
  async sendRenewalReminders(daysBeforeRenewal: number = 30): Promise<ApiResponse<{ sent: number }>> {
    try {
      const response = await api.post(`${this.baseUrl}/send-renewal-reminders`, {
        daysBeforeRenewal,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // MEMBERSHIP UPGRADE/DOWNGRADE
  // ============================================================================

  /**
   * Upgrade membership tier
   */
  async upgradeMembership(data: MembershipUpgradeRequest): Promise<ApiResponse<Membership>> {
    try {
      const response = await api.post(`${this.baseUrl}/${data.membershipId}/upgrade`, data);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Downgrade membership tier
   */
  async downgradeMembership(
    membershipId: string,
    userId: string,
    newTier: MembershipTier,
    downgradeReason?: string,
    effectiveDate?: Date
  ): Promise<ApiResponse<Membership>> {
    try {
      const response = await api.post(`${this.baseUrl}/${membershipId}/downgrade`, {
        userId,
        newTier,
        downgradeReason,
        effectiveDate,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get membership upgrade options
   */
  async getMembershipUpgradeOptions(membershipId: string): Promise<ApiResponse<{ currentTier: MembershipTier; availableTiers: MembershipTier[]; pricing: Record<MembershipTier, number> }>> {
    try {
      const response = await api.get(`${this.baseUrl}/${membershipId}/upgrade-options`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // PAYMENT MANAGEMENT
  // ============================================================================

  /**
   * Get membership payment history
   */
  async getPaymentHistory(membershipId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/${membershipId}/payments`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Process payment
   */
  async processPayment(data: PaymentRequest): Promise<ApiResponse<any>> {
    try {
      const response = await api.post(`${this.baseUrl}/${data.membershipId}/payments`, data);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get payment methods for user
   */
  async getPaymentMethods(userId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/payment-methods/${userId}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(userId: string, data: PaymentMethodRequest): Promise<ApiResponse<any>> {
    try {
      const response = await api.post(`${this.baseUrl}/payment-methods/${userId}`, data);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(userId: string, paymentMethodId: string, data: Partial<PaymentMethodRequest>): Promise<ApiResponse<any>> {
    try {
      const response = await api.patch(`${this.baseUrl}/payment-methods/${userId}/${paymentMethodId}`, data);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(userId: string, paymentMethodId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const response = await api.delete(`${this.baseUrl}/payment-methods/${userId}/${paymentMethodId}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<ApiResponse<any>> {
    try {
      const response = await api.patch(`${this.baseUrl}/payment-methods/${userId}/${paymentMethodId}/default`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // MEMBERSHIP TIERS AND BENEFITS
  // ============================================================================

  /**
   * Get available membership tiers
   */
  async getMembershipTiers(): Promise<ApiResponse<TierConfiguration[]>> {
    try {
      const response = await api.get(`${this.baseUrl}/tiers`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get tier configuration
   */
  async getTierConfiguration(tier: MembershipTier): Promise<ApiResponse<TierConfiguration>> {
    try {
      const response = await api.get(`${this.baseUrl}/tiers/${tier}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update tier configuration
   */
  async updateTierConfiguration(tier: MembershipTier, config: Partial<TierConfiguration>): Promise<ApiResponse<TierConfiguration>> {
    try {
      const response = await api.patch(`${this.baseUrl}/tiers/${tier}`, config);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get tier benefits
   */
  async getTierBenefits(tier: MembershipTier): Promise<ApiResponse<MembershipBenefits>> {
    try {
      const response = await api.get(`${this.baseUrl}/tiers/${tier}/benefits`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update tier benefits
   */
  async updateTierBenefits(tier: MembershipTier, benefits: Partial<MembershipBenefits>): Promise<ApiResponse<MembershipBenefits>> {
    try {
      const response = await api.patch(`${this.baseUrl}/tiers/${tier}/benefits`, benefits);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Calculate membership pricing
   */
  async calculatePricing(
    tier: MembershipTier,
    renewalType: RenewalType,
    startDate: Date,
    upgradeFrom?: MembershipTier
  ): Promise<ApiResponse<{ amount: number; currency: string; breakdown: any }>> {
    try {
      const response = await api.post(`${this.baseUrl}/calculate-pricing`, {
        tier,
        renewalType,
        startDate: startDate.toISOString(),
        upgradeFrom,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // MEMBERSHIP ANALYTICS AND REPORTS
  // ============================================================================

  /**
   * Get membership statistics
   */
  async getMembershipStatistics(options?: {
    dateRange?: { start: Date; end: Date };
    tier?: MembershipTier[];
    status?: MembershipStatus[];
  }): Promise<ApiResponse<MembershipStatistics>> {
    try {
      const params = new URLSearchParams();

      if (options?.dateRange) {
        params.append('startDate', options.dateRange.start.toISOString());
        params.append('endDate', options.dateRange.end.toISOString());
      }

      if (options?.tier) {
        params.append('tier', options.tier.join(','));
      }

      if (options?.status) {
        params.append('status', options.status.join(','));
      }

      const response = await api.get(`${this.baseUrl}/statistics?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get membership trends
   */
  async getMembershipTrends(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(`${this.baseUrl}/trends?period=${period}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(options?: {
    dateRange?: { start: Date; end: Date };
    tier?: MembershipTier[];
    groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  }): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();

      if (options?.dateRange) {
        params.append('startDate', options.dateRange.start.toISOString());
        params.append('endDate', options.dateRange.end.toISOString());
      }

      if (options?.tier) {
        params.append('tier', options.tier.join(','));
      }

      if (options?.groupBy) {
        params.append('groupBy', options.groupBy);
      }

      const response = await api.get(`${this.baseUrl}/revenue-report?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get churn analysis
   */
  async getChurnAnalysis(options?: {
    dateRange?: { start: Date; end: Date };
    tier?: MembershipTier[];
  }): Promise<ApiResponse<any>> {
    try {
      const params = new URLSearchParams();

      if (options?.dateRange) {
        params.append('startDate', options.dateRange.start.toISOString());
        params.append('endDate', options.dateRange.end.toISOString());
      }

      if (options?.tier) {
        params.append('tier', options.tier.join(','));
      }

      const response = await api.get(`${this.baseUrl}/churn-analysis?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk update memberships
   */
  async bulkUpdateMemberships(
    membershipIds: string[],
    updates: Partial<UpdateMembershipRequest>,
    updatedBy: string
  ): Promise<ApiResponse<{ updated: number; failed: number; errors: any[] }>> {
    try {
      const response = await api.post(`${this.baseUrl}/bulk-update`, {
        membershipIds,
        updates,
        updatedBy,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Bulk renewal
   */
  async bulkRenew(
    membershipIds: string[],
    paymentMethodId: string,
    renewedBy: string
  ): Promise<ApiResponse<{ processed: number; successful: number; failed: number }>> {
    try {
      const response = await api.post(`${this.baseUrl}/bulk-renew`, {
        membershipIds,
        paymentMethodId,
        renewedBy,
      });
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Export memberships
   */
  async exportMemberships(
    options?: MembershipQueryOptions & { format?: 'csv' | 'xlsx' | 'pdf' }
  ): Promise<ApiResponse<{ downloadUrl: string; expiresAt: Date }>> {
    try {
      const params = new URLSearchParams();

      if (options) {
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined) {
              if (Array.isArray(value)) {
                params.append(key, value.join(','));
              } else {
                params.append(key, String(value));
              }
            }
          });
        }

        if (options.format) {
          params.append('format', options.format);
        }
      }

      const response = await api.get(`${this.baseUrl}/export?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if membership is active
   */
  isMembershipActive(membership: Membership): boolean {
    const now = new Date();
    return (
      membership.status === MembershipStatus.ACTIVE &&
      now >= membership.startDate &&
      now <= membership.endDate
    );
  }

  /**
   * Check if membership is expiring soon
   */
  isMembershipExpiringSoon(membership: Membership, days: number = 30): boolean {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return membership.endDate <= thresholdDate && membership.endDate > now;
  }

  /**
   * Get membership duration in days
   */
  getMembershipDurationDays(membership: Membership): number {
    const timeDiff = membership.endDate.getTime() - membership.startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Calculate prorated amount for upgrades
   */
  calculateProratedAmount(
    currentTier: MembershipTier,
    newTier: MembershipTier,
    currentMembership: Membership,
    effectiveDate: Date
  ): number {
    // This would typically be calculated by the backend
    // Placeholder implementation
    const dailyRate = currentMembership.amount / this.getMembershipDurationDays(currentMembership);
    const remainingDays = this.getMembershipDurationDays({
      ...currentMembership,
      endDate: effectiveDate,
    });
    const currentValue = dailyRate * remainingDays;
    const newValue = currentValue * (this.getTierMultiplier(newTier) / this.getTierMultiplier(currentTier));
    return Math.max(0, newValue - currentValue);
  }

  private getTierMultiplier(tier: MembershipTier): number {
    const multipliers = {
      [MembershipTier.REGULAR]: 1,
      [MembershipTier.BOARD]: 2,
      [MembershipTier.ADMIN]: 3,
    };
    return multipliers[tier] || 1;
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An unexpected error occurred');
  }
}

// ============================================================================
// EXPORT INSTANCE
// ============================================================================

export const membershipApi = new MembershipApiService();
export default membershipApi;
