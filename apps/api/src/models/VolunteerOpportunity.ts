import mongoose, { Schema, Document } from 'mongoose';
import { 
  VolunteerOpportunity as IVolunteerOpportunity,
  VolunteerApplication as IVolunteerApplication,
  VolunteerType,
  MembershipTier,
  OpportunityStatus,
  VolunteerApplicationStatus 
} from '@issb/types';

export interface VolunteerOpportunityDocument extends IVolunteerOpportunity, Document {
  // Instance methods
  isActive(): boolean;
  isExpired(): boolean;
  canApply(): boolean;
  hasApplications(): boolean;
  getApplicationCount(): number;
  getAcceptedApplicationCount(): number;
  getDaysUntilStart(): number;
  getDaysUntilEnd(): number;
  markAsFilled(): Promise<void>;
  markAsActive(): Promise<void>;
  addApplication(applicationId: string): Promise<void>;
  removeApplication(applicationId: string): Promise<void>;
}

// Volunteer Application Schema (embedded)
const volunteerApplicationSchema = new Schema<IVolunteerApplication>({
  opportunityId: {
    type: Schema.Types.ObjectId,
    ref: 'VolunteerOpportunity',
    required: [true, 'Opportunity ID is required'],
  },
  applicantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant ID is required'],
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(VolunteerApplicationStatus),
    default: VolunteerApplicationStatus.PENDING,
    index: true,
  },
  motivation: {
    type: String,
    required: [true, 'Motivation is required'],
    trim: true,
    maxlength: [1000, 'Motivation cannot be more than 1000 characters'],
  },
  relevantExperience: {
    type: String,
    required: [true, 'Relevant experience is required'],
    trim: true,
    maxlength: [1000, 'Relevant experience cannot be more than 1000 characters'],
  },
  availability: {
    type: String,
    required: [true, 'Availability is required'],
    trim: true,
    maxlength: [500, 'Availability cannot be more than 500 characters'],
  },
  skillsOffered: [{
    type: String,
    trim: true,
    maxlength: [100, 'Skill cannot be more than 100 characters'],
  }],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: {
    type: Date,
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Review notes cannot be more than 1000 characters'],
  },
}, {
  timestamps: true,
});

// Volunteer Opportunity Schema
const volunteerOpportunitySchema = new Schema<VolunteerOpportunityDocument>({
  title: {
    type: String,
    required: [true, 'Opportunity title is required'],
    trim: true,
    maxlength: [200, 'Opportunity title cannot be more than 200 characters'],
    index: true,
  },
  description: {
    type: String,
    required: [true, 'Opportunity description is required'],
    trim: true,
    maxlength: [2000, 'Opportunity description cannot be more than 2000 characters'],
  },
  organization: {
    type: String,
    required: [true, 'Organization is required'],
    trim: true,
    maxlength: [100, 'Organization cannot be more than 100 characters'],
    index: true,
  },
  type: {
    type: String,
    enum: Object.values(VolunteerType),
    required: [true, 'Volunteer type is required'],
    index: true,
  },
  tier: {
    type: String,
    enum: Object.values(MembershipTier),
    required: [true, 'Volunteer tier is required'],
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(OpportunityStatus),
    default: OpportunityStatus.DRAFT,
    index: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    index: true,
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(this: VolunteerOpportunityDocument, value: Date) {
        return value >= this.startDate;
      },
      message: 'End date must be after start date',
    },
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot be more than 200 characters'],
    index: true,
  },
  isRemote: {
    type: Boolean,
    default: false,
    index: true,
  },
  skillsRequired: [{
    type: String,
    trim: true,
    maxlength: [100, 'Required skill cannot be more than 100 characters'],
  }],
  commitment: {
    type: String,
    required: [true, 'Commitment is required'],
    trim: true,
    maxlength: [200, 'Commitment cannot be more than 200 characters'],
  },
  contactPerson: {
    type: String,
    required: [true, 'Contact person is required'],
    trim: true,
    maxlength: [100, 'Contact person cannot be more than 100 characters'],
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid contact email',
    ],
  },
  applications: [volunteerApplicationSchema],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
volunteerOpportunitySchema.index({ title: 'text', description: 'text' });
volunteerOpportunitySchema.index({ type: 1, tier: 1 });
volunteerOpportunitySchema.index({ status: 1, startDate: 1 });
volunteerOpportunitySchema.index({ location: 1, isRemote: 1 });
volunteerOpportunitySchema.index({ organization: 1, createdAt: -1 });
volunteerOpportunitySchema.index({ startDate: 1, endDate: 1 });

// Virtual for application count
volunteerOpportunitySchema.virtual('applicationCount').get(function() {
  return this.applications ? this.applications.length : 0;
});

// Virtual for accepted application count
volunteerOpportunitySchema.virtual('acceptedApplicationCount').get(function() {
  if (!this.applications) return 0;
  return this.applications.filter(app => app.status === VolunteerApplicationStatus.ACCEPTED).length;
});

// Virtual for pending application count
volunteerOpportunitySchema.virtual('pendingApplicationCount').get(function() {
  if (!this.applications) return 0;
  return this.applications.filter(app => app.status === VolunteerApplicationStatus.PENDING).length;
});

// Virtual for days until start
volunteerOpportunitySchema.virtual('daysUntilStart').get(function() {
  const now = new Date();
  const diffTime = this.startDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for duration in days
volunteerOpportunitySchema.virtual('durationDays').get(function() {
  const diffTime = this.endDate.getTime() - this.startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update status based on dates
volunteerOpportunitySchema.pre<VolunteerOpportunityDocument>('save', function(next) {
  const now = new Date();
  
  // Auto-update status based on dates
  if (this.status === OpportunityStatus.ACTIVE) {
    if (now > this.endDate) {
      this.status = OpportunityStatus.EXPIRED;
    }
  }
  
  next();
});

// Instance method to check if opportunity is active
volunteerOpportunitySchema.methods.isActive = function(): boolean {
  const now = new Date();
  return this.status === OpportunityStatus.ACTIVE && 
         now >= this.startDate && 
         now <= this.endDate;
};

// Instance method to check if opportunity is expired
volunteerOpportunitySchema.methods.isExpired = function(): boolean {
  const now = new Date();
  return now > this.endDate || this.status === OpportunityStatus.EXPIRED;
};

// Instance method to check if can apply
volunteerOpportunitySchema.methods.canApply = function(): boolean {
  const now = new Date();
  return this.status === OpportunityStatus.ACTIVE && 
         now < this.startDate &&
         this.status !== OpportunityStatus.FILLED;
};

// Instance method to check if has applications
volunteerOpportunitySchema.methods.hasApplications = function(): boolean {
  return this.applications && this.applications.length > 0;
};

// Instance method to get application count
volunteerOpportunitySchema.methods.getApplicationCount = function(): number {
  return this.applications ? this.applications.length : 0;
};

// Instance method to get accepted application count
volunteerOpportunitySchema.methods.getAcceptedApplicationCount = function(): number {
  if (!this.applications) return 0;
  return this.applications.filter(app => app.status === VolunteerApplicationStatus.ACCEPTED).length;
};

// Instance method to get days until start
volunteerOpportunitySchema.methods.getDaysUntilStart = function(): number {
  const now = new Date();
  const diffTime = this.startDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Instance method to get days until end
volunteerOpportunitySchema.methods.getDaysUntilEnd = function(): number {
  const now = new Date();
  const diffTime = this.endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Instance method to mark as filled
volunteerOpportunitySchema.methods.markAsFilled = async function(): Promise<void> {
  this.status = OpportunityStatus.FILLED;
  await this.save();
};

// Instance method to mark as active
volunteerOpportunitySchema.methods.markAsActive = async function(): Promise<void> {
  this.status = OpportunityStatus.ACTIVE;
  await this.save();
};

// Instance method to add application
volunteerOpportunitySchema.methods.addApplication = async function(applicationId: string): Promise<void> {
  if (!this.applications) {
    this.applications = [];
  }
  // Note: In practice, you might want to populate the full application object
  // This is a simplified version for the schema
  await this.save();
};

// Instance method to remove application
volunteerOpportunitySchema.methods.removeApplication = async function(applicationId: string): Promise<void> {
  if (this.applications) {
    this.applications = this.applications.filter(app => app.id !== applicationId);
    await this.save();
  }
};

// Static method to find active opportunities
volunteerOpportunitySchema.statics.findActive = function(tier?: MembershipTier) {
  const now = new Date();
  const query: any = {
    status: OpportunityStatus.ACTIVE,
    startDate: { $gte: now }
  };
  
  if (tier) {
    query.tier = tier;
  }
  
  return this.find(query).sort({ startDate: 1 });
};

// Static method to find by type
volunteerOpportunitySchema.statics.findByType = function(type: VolunteerType, tier?: MembershipTier) {
  const query: any = { 
    type,
    status: { $in: [OpportunityStatus.ACTIVE, OpportunityStatus.FILLED] }
  };
  
  if (tier) {
    query.tier = tier;
  }
  
  return this.find(query).sort({ startDate: 1 });
};

// Static method to find by organization
volunteerOpportunitySchema.statics.findByOrganization = function(organization: string) {
  return this.find({ organization }).sort({ createdAt: -1 });
};

// Static method to find expiring opportunities
volunteerOpportunitySchema.statics.findExpiring = function(days: number = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: OpportunityStatus.ACTIVE,
    endDate: { 
      $gt: now,
      $lte: futureDate 
    }
  }).sort({ endDate: 1 });
};

// Static method to search opportunities
volunteerOpportunitySchema.statics.searchOpportunities = function(searchTerm: string, filters?: any) {
  const query: any = {
    $text: { $search: searchTerm },
    status: { $in: [OpportunityStatus.ACTIVE, OpportunityStatus.FILLED] }
  };
  
  if (filters) {
    Object.assign(query, filters);
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, startDate: 1 });
};

const VolunteerOpportunity = mongoose.model<VolunteerOpportunityDocument>('VolunteerOpportunity', volunteerOpportunitySchema);

export default VolunteerOpportunity;