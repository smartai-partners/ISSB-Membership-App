import mongoose, { Schema, Document } from 'mongoose';
import { 
  MembershipApplication as IMembershipApplication, 
  ApplicationStatus,
  MembershipTier,
  Certification,
  Reference,
  Document as IDocument
} from '@issb/types';

export interface MembershipApplicationDocument extends IMembershipApplication, Document {
  // Instance methods
  canBeReviewed(): boolean;
  isSubmitted(): boolean;
  isUnderReview(): boolean;
  isApproved(): boolean;
  isRejected(): boolean;
  getDaysInReview(): number;
  markAsSubmitted(): Promise<void>;
  markAsUnderReview(reviewerId: string): Promise<void>;
  approve(reviewerId: string, comments?: string): Promise<void>;
  reject(reviewerId: string, comments: string): Promise<void>;
}

// Reference Schema
const referenceSchema = new Schema<Reference>({
  name: {
    type: String,
    required: [true, 'Reference name is required'],
    trim: true,
    maxlength: [100, 'Reference name cannot be more than 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Reference email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid reference email',
    ],
  },
  phone: {
    type: String,
    required: [true, 'Reference phone is required'],
    trim: true,
    match: [
      /^[\+]?[1-9][\d]{0,15}$/,
      'Please provide a valid phone number',
    ],
  },
  organization: {
    type: String,
    required: [true, 'Reference organization is required'],
    trim: true,
    maxlength: [100, 'Organization cannot be more than 100 characters'],
  },
  relationship: {
    type: String,
    required: [true, 'Reference relationship is required'],
    trim: true,
    maxlength: [100, 'Relationship cannot be more than 100 characters'],
  },
  yearsKnown: {
    type: Number,
    required: [true, 'Years known is required'],
    min: [0, 'Years known cannot be negative'],
    max: [100, 'Years known cannot exceed 100'],
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
});

// Certification Schema
const certificationSchema = new Schema<Certification>({
  name: {
    type: String,
    required: [true, 'Certification name is required'],
    trim: true,
    maxlength: [100, 'Certification name cannot be more than 100 characters'],
  },
  issuingOrganization: {
    type: String,
    required: [true, 'Issuing organization is required'],
    trim: true,
    maxlength: [100, 'Issuing organization cannot be more than 100 characters'],
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required'],
    validate: {
      validator: function(value: Date) {
        return value <= new Date();
      },
      message: 'Issue date cannot be in the future',
    },
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: function(this: Certification, value: Date) {
        if (!value) return true;
        return value > this.issueDate;
      },
      message: 'Expiry date must be after issue date',
    },
  },
  certificateNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Certificate number cannot be more than 50 characters'],
  },
  url: {
    type: String,
    trim: true,
    maxlength: [200, 'Certificate URL cannot be more than 200 characters'],
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
});

// Document Schema
const documentSchema = new Schema<IDocument>({
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true,
    maxlength: [200, 'Document name cannot be more than 200 characters'],
  },
  type: {
    type: String,
    required: [true, 'Document type is required'],
    enum: ['certificate', 'transcript', 'identity', 'reference', 'other'],
  },
  size: {
    type: Number,
    required: [true, 'Document size is required'],
    min: [1, 'Document size must be positive'],
    max: [50 * 1024 * 1024, 'Document size cannot exceed 50MB'],
  },
  mimeType: {
    type: String,
    required: [true, 'Document MIME type is required'],
    trim: true,
  },
  path: {
    type: String,
    required: [true, 'Document path is required'],
    trim: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploaded by user is required'],
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

// Membership Application Schema
const membershipApplicationSchema = new Schema<MembershipApplicationDocument>({
  applicantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant ID is required'],
    unique: true,
    index: true,
  },
  applicationType: {
    type: String,
    enum: Object.values(MembershipTier),
    required: [true, 'Application type is required'],
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(ApplicationStatus),
    default: ApplicationStatus.DRAFT,
    index: true,
  },
  personalInfo: {
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(value: Date) {
          if (!value) return true;
          const minAge = new Date();
          minAge.setFullYear(minAge.getFullYear() - 16);
          return value <= minAge;
        },
        message: 'Applicant must be at least 16 years old',
      },
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [100, 'Location cannot be more than 100 characters'],
    },
    occupation: {
      type: String,
      required: [true, 'Occupation is required'],
      trim: true,
      maxlength: [100, 'Occupation cannot be more than 100 characters'],
    },
    organization: {
      type: String,
      trim: true,
      maxlength: [100, 'Organization cannot be more than 100 characters'],
    },
    website: {
      type: String,
      trim: true,
      maxlength: [200, 'Website cannot be more than 200 characters'],
    },
  },
  professionalInfo: {
    yearsOfExperience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Years of experience cannot be negative'],
      max: [100, 'Years of experience cannot exceed 100'],
    },
    certifications: [certificationSchema],
    languages: [{
      type: String,
      trim: true,
      maxlength: [50, 'Language cannot be more than 50 characters'],
    }],
    areasOfExpertise: [{
      type: String,
      trim: true,
      maxlength: [100, 'Area of expertise cannot be more than 100 characters'],
    }],
    currentRole: {
      type: String,
      required: [true, 'Current role is required'],
      trim: true,
      maxlength: [100, 'Current role cannot be more than 100 characters'],
    },
    reference1: {
      type: referenceSchema,
      required: [true, 'First reference is required'],
    },
    reference2: {
      type: referenceSchema,
      required: [true, 'Second reference is required'],
    },
  },
  documents: [documentSchema],
  submittedAt: {
    type: Date,
  },
  reviewedAt: {
    type: Date,
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewComments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Review comments cannot be more than 1000 characters'],
  },
  approvedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
membershipApplicationSchema.index({ applicantId: 1 });
membershipApplicationSchema.index({ status: 1, submittedAt: 1 });
membershipApplicationSchema.index({ applicationType: 1, status: 1 });
membershipApplicationSchema.index({ reviewedBy: 1, reviewedAt: -1 });
membershipApplicationSchema.index({ createdAt: -1 });

// Virtual for days in review
membershipApplicationSchema.virtual('daysInReview').get(function() {
  if (!this.submittedAt) return 0;
  const now = new Date();
  const reviewStart = this.reviewedAt || this.submittedAt;
  const diffTime = now.getTime() - reviewStart.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for completion percentage
membershipApplicationSchema.virtual('completionPercentage').get(function() {
  let completed = 0;
  let total = 8; // Base required fields
  
  // Personal info (4 fields)
  if (this.personalInfo?.location) completed++;
  if (this.personalInfo?.occupation) completed++;
  if (this.personalInfo?.dateOfBirth) completed++;
  
  // Professional info (4 fields)
  if (this.professionalInfo?.yearsOfExperience !== undefined) completed++;
  if (this.professionalInfo?.currentRole) completed++;
  if (this.professionalInfo?.reference1) completed++;
  if (this.professionalInfo?.reference2) completed++;
  
  // Documents
  if (this.documents && this.documents.length > 0) completed++;
  
  return Math.round((completed / total) * 100);
});

// Pre-save middleware to validate submission requirements
membershipApplicationSchema.pre<MembershipApplicationDocument>('save', function(next) {
  if (this.status === ApplicationStatus.SUBMITTED && this.isModified('status')) {
    this.submittedAt = new Date();
  }
  next();
});

// Instance method to check if can be reviewed
membershipApplicationSchema.methods.canBeReviewed = function(): boolean {
  return this.status === ApplicationStatus.SUBMITTED;
};

// Instance method to check if submitted
membershipApplicationSchema.methods.isSubmitted = function(): boolean {
  return this.status === ApplicationStatus.SUBMITTED;
};

// Instance method to check if under review
membershipApplicationSchema.methods.isUnderReview = function(): boolean {
  return this.status === ApplicationStatus.UNDER_REVIEW;
};

// Instance method to check if approved
membershipApplicationSchema.methods.isApproved = function(): boolean {
  return this.status === ApplicationStatus.APPROVED;
};

// Instance method to check if rejected
membershipApplicationSchema.methods.isRejected = function(): boolean {
  return this.status === ApplicationStatus.REJECTED;
};

// Instance method to get days in review
membershipApplicationSchema.methods.getDaysInReview = function(): number {
  if (!this.submittedAt) return 0;
  const now = new Date();
  const reviewStart = this.reviewedAt || this.submittedAt;
  const diffTime = now.getTime() - reviewStart.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// Instance method to mark as submitted
membershipApplicationSchema.methods.markAsSubmitted = async function(): Promise<void> {
  this.status = ApplicationStatus.SUBMITTED;
  this.submittedAt = new Date();
  await this.save();
};

// Instance method to mark as under review
membershipApplicationSchema.methods.markAsUnderReview = async function(reviewerId: string): Promise<void> {
  this.status = ApplicationStatus.UNDER_REVIEW;
  this.reviewedAt = new Date();
  this.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
  await this.save();
};

// Instance method to approve application
membershipApplicationSchema.methods.approve = async function(reviewerId: string, comments?: string): Promise<void> {
  this.status = ApplicationStatus.APPROVED;
  this.approvedAt = new Date();
  this.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
  if (comments) {
    this.reviewComments = comments;
  }
  await this.save();
};

// Instance method to reject application
membershipApplicationSchema.methods.reject = async function(reviewerId: string, comments: string): Promise<void> {
  this.status = ApplicationStatus.REJECTED;
  this.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
  this.reviewComments = comments;
  await this.save();
};

// Static method to find pending applications
membershipApplicationSchema.statics.findPending = function() {
  return this.find({ 
    status: { $in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW] }
  }).sort({ submittedAt: 1 });
};

// Static method to find by status
membershipApplicationSchema.statics.findByStatus = function(status: ApplicationStatus) {
  return this.find({ status }).sort({ submittedAt: -1 });
};

// Static method to find by application type
membershipApplicationSchema.statics.findByType = function(applicationType: MembershipTier) {
  return this.find({ applicationType }).sort({ submittedAt: -1 });
};

// Static method to find by reviewer
membershipApplicationSchema.statics.findByReviewer = function(reviewerId: string) {
  return this.find({ reviewedBy: reviewerId }).sort({ reviewedAt: -1 });
};

const MembershipApplication = mongoose.model<MembershipApplicationDocument>('MembershipApplication', membershipApplicationSchema);

export default MembershipApplication;