import mongoose, { Schema, Document } from 'mongoose';
import { 
  Event as IEvent, 
  EventType, 
  EventStatus,
  MembershipTier 
} from '@issb/types';

export interface EventDocument extends IEvent, Document {
  // Instance methods
  isUpcoming(): boolean;
  isOngoing(): boolean;
  isCompleted(): boolean;
  canRegister(): boolean;
  hasCapacity(): boolean;
  getRemainingCapacity(): number;
  isRegistrationOpen(): boolean;
  incrementRegisteredCount(): Promise<void>;
  decrementRegisteredCount(): Promise<void>;
}

// Event Schema
const eventSchema = new Schema<EventDocument>({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Event title cannot be more than 200 characters'],
    index: true,
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [2000, 'Event description cannot be more than 2000 characters'],
  },
  type: {
    type: String,
    enum: Object.values(EventType),
    required: [true, 'Event type is required'],
    index: true,
  },
  tier: {
    type: String,
    enum: Object.values(MembershipTier),
    required: [true, 'Event tier is required'],
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(EventStatus),
    default: EventStatus.DRAFT,
    index: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Event start date is required'],
    index: true,
  },
  endDate: {
    type: Date,
    required: [true, 'Event end date is required'],
    validate: {
      validator: function(this: EventDocument, value: Date) {
        return value >= this.startDate;
      },
      message: 'End date must be after start date',
    },
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    maxlength: [200, 'Event location cannot be more than 200 characters'],
    index: true,
  },
  isVirtual: {
    type: Boolean,
    default: false,
    index: true,
  },
  virtualLink: {
    type: String,
    trim: true,
    maxlength: [500, 'Virtual link cannot be more than 500 characters'],
    validate: {
      validator: function(this: EventDocument, value: string) {
        if (!this.isVirtual) return true;
        return !!value;
      },
      message: 'Virtual link is required for virtual events',
    },
  },
  capacity: {
    type: Number,
    min: [1, 'Event capacity must be at least 1'],
    validate: {
      validator: function(this: EventDocument, value: number) {
        if (value === undefined || value === null) return true;
        return this.registeredCount <= value;
      },
      message: 'Registered count cannot exceed capacity',
    },
  },
  registeredCount: {
    type: Number,
    default: 0,
    min: [0, 'Registered count cannot be negative'],
  },
  registrationDeadline: {
    type: Date,
    validate: {
      validator: function(this: EventDocument, value: Date) {
        if (!value) return true;
        return value <= this.startDate;
      },
      message: 'Registration deadline must be before event start date',
    },
  },
  organizerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer ID is required'],
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot be more than 50 characters'],
  }],
  attachments: [{
    type: String,
    trim: true,
    maxlength: [500, 'Attachment path cannot be more than 500 characters'],
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ type: 1, tier: 1 });
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ location: 1, isVirtual: 1 });
eventSchema.index({ organizerId: 1, createdAt: -1 });

// Virtual for remaining capacity
eventSchema.virtual('remainingCapacity').get(function() {
  if (!this.capacity) return null;
  return Math.max(0, this.capacity - this.registeredCount);
});

// Virtual for duration in hours
eventSchema.virtual('durationHours').get(function() {
  if (!this.startDate || !this.endDate) return null;
  const diffMs = this.endDate.getTime() - this.startDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60));
});

// Virtual for is registration open
eventSchema.virtual('isRegistrationOpenStatus').get(function() {
  const now = new Date();
  const registrationDeadline = this.registrationDeadline || this.startDate;
  
  return this.status === EventStatus.PUBLISHED &&
         now < registrationDeadline &&
         this.hasCapacity();
});

// Pre-save middleware to update status based on dates
eventSchema.pre<EventDocument>('save', function(next) {
  const now = new Date();
  
  // Auto-update status based on dates
  if (this.status === EventStatus.PUBLISHED) {
    if (now >= this.startDate && now <= this.endDate) {
      this.status = EventStatus.ONGOING;
    } else if (now > this.endDate) {
      this.status = EventStatus.COMPLETED;
    }
  }
  
  next();
});

// Pre-save middleware to validate virtual event requirements
eventSchema.pre<EventDocument>('save', function(next) {
  if (this.isVirtual && !this.virtualLink && this.status !== EventStatus.DRAFT) {
    return next(new Error('Virtual link is required for virtual events'));
  }
  next();
});

// Instance method to check if event is upcoming
eventSchema.methods.isUpcoming = function(): boolean {
  const now = new Date();
  return this.startDate > now && this.status === EventStatus.PUBLISHED;
};

// Instance method to check if event is ongoing
eventSchema.methods.isOngoing = function(): boolean {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate && this.status === EventStatus.ONGOING;
};

// Instance method to check if event is completed
eventSchema.methods.isCompleted = function(): boolean {
  const now = new Date();
  return now > this.endDate || this.status === EventStatus.COMPLETED;
};

// Instance method to check if registration is possible
eventSchema.methods.canRegister = function(): boolean {
  return this.isRegistrationOpen() && this.hasCapacity();
};

// Instance method to check if event has capacity
eventSchema.methods.hasCapacity = function(): boolean {
  if (!this.capacity) return true;
  return this.registeredCount < this.capacity;
};

// Instance method to get remaining capacity
eventSchema.methods.getRemainingCapacity = function(): number {
  if (!this.capacity) return Infinity;
  return Math.max(0, this.capacity - this.registeredCount);
};

// Instance method to check if registration is open
eventSchema.methods.isRegistrationOpen = function(): boolean {
  const now = new Date();
  const registrationDeadline = this.registrationDeadline || this.startDate;
  
  return this.status === EventStatus.PUBLISHED &&
         now < registrationDeadline &&
         now < this.startDate;
};

// Instance method to increment registered count
eventSchema.methods.incrementRegisteredCount = async function(): Promise<void> {
  await this.updateOne({ $inc: { registeredCount: 1 } });
  this.registeredCount += 1;
};

// Instance method to decrement registered count
eventSchema.methods.decrementRegisteredCount = async function(): Promise<void> {
  await this.updateOne({ 
    $inc: { registeredCount: -1 },
    $max: { registeredCount: 0 }
  });
  this.registeredCount = Math.max(0, this.registeredCount - 1);
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function(tier?: MembershipTier) {
  const query: any = {
    status: EventStatus.PUBLISHED,
    startDate: { $gt: new Date() }
  };
  
  if (tier) {
    query.tier = tier;
  }
  
  return this.find(query).sort({ startDate: 1 });
};

// Static method to find ongoing events
eventSchema.statics.findOngoing = function() {
  const now = new Date();
  return this.find({
    status: EventStatus.ONGOING,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

// Static method to find by organizer
eventSchema.statics.findByOrganizer = function(organizerId: string) {
  return this.find({ organizerId }).sort({ createdAt: -1 });
};

// Static method to find by type and tier
eventSchema.statics.findByTypeAndTier = function(type: EventType, tier: MembershipTier) {
  return this.find({ 
    type, 
    tier,
    status: { $in: [EventStatus.PUBLISHED, EventStatus.ONGOING] }
  }).sort({ startDate: 1 });
};

// Static method to search events
eventSchema.statics.searchEvents = function(searchTerm: string, filters?: any) {
  const query: any = {
    $text: { $search: searchTerm },
    status: { $in: [EventStatus.PUBLISHED, EventStatus.ONGOING] }
  };
  
  if (filters) {
    Object.assign(query, filters);
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, startDate: 1 });
};

const Event = mongoose.model<EventDocument>('Event', eventSchema);

export default Event;