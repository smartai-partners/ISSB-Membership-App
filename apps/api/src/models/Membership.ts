import mongoose, { Schema, Document } from 'mongoose';
import { 
  Membership as IMembership, 
  MembershipTier, 
  MembershipStatus,
  RenewalType 
} from '@issb/types';

export interface MembershipDocument extends IMembership, Document {
  // Instance methods
  isActive(): boolean;
  isExpired(): boolean;
  getDaysUntilExpiry(): number;
  calculateNextPaymentDate(): Date | null;
  canAutoRenew(): boolean;
}

// Membership Schema
const membershipSchema = new Schema<MembershipDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
    index: true,
  },
  tier: {
    type: String,
    enum: Object.values(MembershipTier),
    required: [true, 'Membership tier is required'],
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(MembershipStatus),
    default: MembershipStatus.PENDING,
    index: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    index: true,
  },
  renewalType: {
    type: String,
    enum: Object.values(RenewalType),
    required: [true, 'Renewal type is required'],
  },
  autoRenew: {
    type: Boolean,
    default: false,
  },
  paymentMethod: {
    type: String,
    trim: true,
    maxlength: [100, 'Payment method cannot be more than 100 characters'],
  },
  lastPaymentDate: {
    type: Date,
  },
  nextPaymentDate: {
    type: Date,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    trim: true,
    minlength: [3, 'Currency must be exactly 3 characters'],
    maxlength: [3, 'Currency must be exactly 3 characters'],
    default: 'USD',
  },
  benefits: [{
    type: String,
    trim: true,
    maxlength: [200, 'Benefit description cannot be more than 200 characters'],
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
membershipSchema.index({ userId: 1 });
membershipSchema.index({ tier: 1, status: 1 });
membershipSchema.index({ status: 1, endDate: 1 });
membershipSchema.index({ autoRenew: 1, nextPaymentDate: 1 });
membershipSchema.index({ createdAt: -1 });

// Virtual for full membership info
membershipSchema.virtual('isActiveStatus').get(function() {
  return this.status === MembershipStatus.ACTIVE;
});

// Virtual for days until expiry
membershipSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const diffTime = this.endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to calculate next payment date
membershipSchema.pre<MembershipDocument>('save', function(next) {
  if (this.autoRenew && this.renewalType && (this.isNew || this.isModified('renewalType') || this.isModified('startDate'))) {
    this.nextPaymentDate = this.calculateNextPaymentDate();
  }
  next();
});

// Pre-save middleware to update status based on dates
membershipSchema.pre<MembershipDocument>('save', function(next) {
  const now = new Date();
  
  if (this.endDate < now && this.status === MembershipStatus.ACTIVE) {
    this.status = MembershipStatus.EXPIRED;
  }
  
  next();
});

// Instance method to check if membership is active
membershipSchema.methods.isActive = function(): boolean {
  return this.status === MembershipStatus.ACTIVE && this.endDate > new Date();
};

// Instance method to check if membership is expired
membershipSchema.methods.isExpired = function(): boolean {
  return this.endDate < new Date();
};

// Instance method to get days until expiry
membershipSchema.methods.getDaysUntilExpiry = function(): number {
  if (!this.endDate) return 0;
  const now = new Date();
  const diffTime = this.endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Instance method to calculate next payment date
membershipSchema.methods.calculateNextPaymentDate = function(): Date | null {
  if (!this.autoRenew || !this.renewalType) return null;
  
  const baseDate = this.lastPaymentDate || this.startDate || new Date();
  const nextDate = new Date(baseDate);
  
  switch (this.renewalType) {
    case RenewalType.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case RenewalType.QUARTERLY:
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case RenewalType.ANNUAL:
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case RenewalType.LIFETIME:
      return null;
    default:
      return null;
  }
  
  return nextDate;
};

// Instance method to check if can auto renew
membershipSchema.methods.canAutoRenew = function(): boolean {
  return this.autoRenew && 
         this.renewalType !== RenewalType.LIFETIME && 
         this.status === MembershipStatus.ACTIVE &&
         !!this.paymentMethod;
};

// Static method to find active memberships
membershipSchema.statics.findActive = function() {
  return this.find({ 
    status: MembershipStatus.ACTIVE,
    endDate: { $gt: new Date() }
  });
};

// Static method to find expiring memberships
membershipSchema.statics.findExpiring = function(days: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: MembershipStatus.ACTIVE,
    endDate: { 
      $gt: new Date(),
      $lte: futureDate 
    }
  });
};

// Static method to find by user ID
membershipSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId });
};

// Static method to find by tier
membershipSchema.statics.findByTier = function(tier: MembershipTier) {
  return this.find({ tier, status: MembershipStatus.ACTIVE });
};

// Static method to find memberships due for renewal
membershipSchema.statics.findDueForRenewal = function() {
  const today = new Date();
  return this.find({
    autoRenew: true,
    nextPaymentDate: { $lte: today },
    status: MembershipStatus.ACTIVE
  });
};

const Membership = mongoose.model<MembershipDocument>('Membership', membershipSchema);

export default Membership;