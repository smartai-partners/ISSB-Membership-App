import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { 
  User as IUser, 
  UserRole, 
  MembershipTier, 
  UserStatus,
  UserProfile 
} from '@issb/types';

export interface UserDocument extends IUser, Document {
  password: string;
  emailVerifiedAt?: Date;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  refreshTokens: string[];
  loginAttempts: number;
  lockUntil?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  isLocked(): boolean;
}

// User Profile Schema
const userProfileSchema = new Schema<UserProfile>({
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
    trim: true,
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot be more than 100 characters'],
    trim: true,
  },
  occupation: {
    type: String,
    maxlength: [100, 'Occupation cannot be more than 100 characters'],
    trim: true,
  },
  organization: {
    type: String,
    maxlength: [100, 'Organization cannot be more than 100 characters'],
    trim: true,
  },
  website: {
    type: String,
    maxlength: [200, 'Website cannot be more than 200 characters'],
    trim: true,
  },
  socialMedia: {
    linkedin: {
      type: String,
      maxlength: [200, 'LinkedIn profile cannot be more than 200 characters'],
    },
    twitter: {
      type: String,
      maxlength: [100, 'Twitter handle cannot be more than 100 characters'],
    },
    instagram: {
      type: String,
      maxlength: [100, 'Instagram handle cannot be more than 100 characters'],
    },
    facebook: {
      type: String,
      maxlength: [200, 'Facebook profile cannot be more than 200 characters'],
    },
  },
  languages: [{
    type: String,
    trim: true,
  }],
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Certification name cannot be more than 100 characters'],
    },
    issuingOrganization: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Issuing organization cannot be more than 100 characters'],
    },
    issueDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    certificateNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Certificate number cannot be more than 50 characters'],
    },
    url: {
      type: String,
      maxlength: [200, 'Certificate URL cannot be more than 200 characters'],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
  }],
  experience: [{
    organization: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Organization cannot be more than 100 characters'],
    },
    position: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Position cannot be more than 100 characters'],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['professional', 'volunteer', 'education', 'certification'],
      default: 'professional',
    },
  }],
  interests: [{
    type: String,
    trim: true,
    maxlength: [50, 'Interest cannot be more than 50 characters'],
  }],
});

// User Schema
const userSchema = new Schema<UserDocument>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters'],
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.MEMBER,
  },
  tier: {
    type: String,
    enum: Object.values(MembershipTier),
    default: MembershipTier.REGULAR,
  },
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.PENDING,
  },
  volunteerStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'inactive'],
    default: 'inactive',
  },
  avatar: {
    type: String,
    default: null,
  },
  phone: {
    type: String,
    trim: true,
    match: [
      /^[\+]?[1-9][\d]{0,15}$/,
      'Please provide a valid phone number',
    ],
  },
  dateOfBirth: {
    type: Date,
  },
  emailVerifiedAt: {
    type: Date,
  },
  lastLoginAt: {
    type: Date,
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  verificationToken: {
    type: String,
  },
  verificationTokenExpires: {
    type: Date,
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800, // 7 days
    },
  }],
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    select: false,
  },
  profile: {
    type: userProfileSchema,
    default: {},
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ tier: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre<UserDocument>('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to handle password change tracking
userSchema.pre<UserDocument>('save', function(next) {
  // Only set passwordChangedAt if password was modified
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      (this.passwordChangedAt.getTime() / 1000).toString(),
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function(): string {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return resetToken;
};

// Instance method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function(): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $unset: {
        lockUntil: 1,
      },
      $set: {
        loginAttempts: 1,
      },
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // If we have max attempts and no lock, set lock
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return await this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  return await this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1,
    },
  });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ status: UserStatus.ACTIVE });
};

// Static method to find by role
userSchema.statics.findByRole = function(role: UserRole) {
  return this.find({ role });
};

// Static method to find by tier
userSchema.statics.findByTier = function(tier: MembershipTier) {
  return this.find({ tier });
};

const User = mongoose.model<UserDocument>('User', userSchema);

export default User;