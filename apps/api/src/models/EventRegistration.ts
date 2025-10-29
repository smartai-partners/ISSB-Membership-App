import mongoose, { Schema, Document } from 'mongoose';
import { 
  EventRegistration as IEventRegistration,
  RegistrationStatus 
} from '@issb/types';

export interface EventRegistrationDocument extends IEventRegistration, Document {
  // Instance methods
  isRegistered(): boolean;
  isOnWaitlist(): boolean;
  isCancelled(): boolean;
  hasAttended(): boolean;
  isNoShow(): boolean;
  canCheckIn(): boolean;
  canCheckOut(): boolean;
  checkIn(): Promise<void>;
  checkOut(): Promise<void>;
  cancel(): Promise<void>;
  markAsNoShow(): Promise<void>;
  getRegistrationDuration(): number;
  getAttendanceDuration(): number | null;
}

// Attendance Schema (embedded)
const attendanceSchema = new Schema({
  attended: {
    type: Boolean,
    required: true,
    default: false,
  },
  checkInTime: {
    type: Date,
  },
  checkOutTime: {
    type: Date,
    validate: {
      validator: function(this: any, value: Date) {
        if (!value || !this.checkInTime) return true;
        return value > this.checkInTime;
      },
      message: 'Check-out time must be after check-in time',
    },
  },
}, {
  _id: false,
});

// Event Registration Schema
const eventRegistrationSchema = new Schema<EventRegistrationDocument>({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required'],
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  status: {
    type: String,
    enum: Object.values(RegistrationStatus),
    default: RegistrationStatus.REGISTERED,
    index: true,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
    required: [true, 'Registration date is required'],
  },
  attendance: {
    type: attendanceSchema,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes
eventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
eventRegistrationSchema.index({ userId: 1, registeredAt: -1 });
eventRegistrationSchema.index({ eventId: 1, status: 1 });
eventRegistrationSchema.index({ status: 1, registeredAt: 1 });

// Virtual for registration duration in days
eventRegistrationSchema.virtual('registrationDurationDays').get(function() {
  const now = new Date();
  const diffTime = now.getTime() - this.registeredAt.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for attendance duration in minutes
eventRegistrationSchema.virtual('attendanceDurationMinutes').get(function() {
  if (!this.attendance?.checkInTime || !this.attendance?.checkOutTime) {
    return null;
  }
  
  const diffTime = this.attendance.checkOutTime.getTime() - this.attendance.checkInTime.getTime();
  return Math.floor(diffTime / (1000 * 60));
});

// Virtual for attendance status
eventRegistrationSchema.virtual('attendanceStatus').get(function() {
  if (!this.attendance) return 'not_recorded';
  if (this.attendance.attended) {
    if (this.attendance.checkInTime && this.attendance.checkOutTime) {
      return 'attended_full';
    } else if (this.attendance.checkInTime) {
      return 'checked_in';
    }
    return 'attended';
  }
  return 'did_not_attend';
});

// Pre-save middleware to validate attendance data
eventRegistrationSchema.pre<EventRegistrationDocument>('save', function(next) {
  if (this.attendance?.checkOutTime && !this.attendance?.checkInTime) {
    return next(new Error('Cannot check out without checking in first'));
  }
  
  if (this.attendance?.attended && !this.attendance?.checkInTime) {
    return next(new Error('Cannot mark as attended without check-in time'));
  }
  
  next();
});

// Instance method to check if registered
eventRegistrationSchema.methods.isRegistered = function(): boolean {
  return this.status === RegistrationStatus.REGISTERED;
};

// Instance method to check if on waitlist
eventRegistrationSchema.methods.isOnWaitlist = function(): boolean {
  return this.status === RegistrationStatus.WAITLIST;
};

// Instance method to check if cancelled
eventRegistrationSchema.methods.isCancelled = function(): boolean {
  return this.status === RegistrationStatus.CANCELLED;
};

// Instance method to check if attended
eventRegistrationSchema.methods.hasAttended = function(): boolean {
  return this.status === RegistrationStatus.ATTENDED || 
         (this.attendance?.attended === true);
};

// Instance method to check if no-show
eventRegistrationSchema.methods.isNoShow = function(): boolean {
  return this.status === RegistrationStatus.NO_SHOW;
};

// Instance method to check if can check in
eventRegistrationSchema.methods.canCheckIn = function(): boolean {
  return this.status === RegistrationStatus.REGISTERED && 
         (!this.attendance || !this.attendance.checkInTime);
};

// Instance method to check if can check out
eventRegistrationSchema.methods.canCheckOut = function(): boolean {
  return this.attendance?.checkInTime && !this.attendance?.checkOutTime;
};

// Instance method to check in
eventRegistrationSchema.methods.checkIn = async function(): Promise<void> {
  if (!this.canCheckIn()) {
    throw new Error('Cannot check in at this time');
  }
  
  if (!this.attendance) {
    this.attendance = {
      attended: true,
      checkInTime: new Date(),
    };
  } else {
    this.attendance.attended = true;
    this.attendance.checkInTime = new Date();
  }
  
  await this.save();
};

// Instance method to check out
eventRegistrationSchema.methods.checkOut = async function(): Promise<void> {
  if (!this.canCheckOut()) {
    throw new Error('Cannot check out at this time');
  }
  
  this.attendance!.checkOutTime = new Date();
  this.status = RegistrationStatus.ATTENDED;
  
  await this.save();
};

// Instance method to cancel registration
eventRegistrationSchema.methods.cancel = async function(): Promise<void> {
  if (this.status === RegistrationStatus.ATTENDED) {
    throw new Error('Cannot cancel registration after attendance');
  }
  
  this.status = RegistrationStatus.CANCELLED;
  await this.save();
};

// Instance method to mark as no-show
eventRegistrationSchema.methods.markAsNoShow = async function(): Promise<void> {
  this.status = RegistrationStatus.NO_SHOW;
  if (this.attendance) {
    this.attendance.attended = false;
  }
  await this.save();
};

// Instance method to get registration duration in days
eventRegistrationSchema.methods.getRegistrationDuration = function(): number {
  const now = new Date();
  const diffTime = now.getTime() - this.registeredAt.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// Instance method to get attendance duration in minutes
eventRegistrationSchema.methods.getAttendanceDuration = function(): number | null {
  if (!this.attendance?.checkInTime || !this.attendance?.checkOutTime) {
    return null;
  }
  
  const diffTime = this.attendance.checkOutTime.getTime() - this.attendance.checkInTime.getTime();
  return Math.floor(diffTime / (1000 * 60));
};

// Static method to find by event
eventRegistrationSchema.statics.findByEvent = function(eventId: string) {
  return this.find({ eventId }).populate('userId', 'firstName lastName email');
};

// Static method to find by user
eventRegistrationSchema.statics.findByUser = function(userId: string) {
  return this.find({ userId }).populate('eventId', 'title startDate endDate location');
};

// Static method to find active registrations
eventRegistrationSchema.statics.findActiveRegistrations = function(eventId?: string) {
  const query: any = {
    status: { $in: [RegistrationStatus.REGISTERED, RegistrationStatus.WAITLIST] }
  };
  
  if (eventId) {
    query.eventId = eventId;
  }
  
  return this.find(query).populate('userId eventId');
};

// Static method to find attendees
eventRegistrationSchema.statics.findAttendees = function(eventId: string) {
  return this.find({
    eventId,
    $or: [
      { status: RegistrationStatus.ATTENDED },
      { 'attendance.attended': true }
    ]
  }).populate('userId', 'firstName lastName email');
};

// Static method to find no-shows
eventRegistrationSchema.statics.findNoShows = function(eventId: string) {
  return this.find({
    eventId,
    status: RegistrationStatus.NO_SHOW
  }).populate('userId', 'firstName lastName email');
};

// Static method to find by status
eventRegistrationSchema.statics.findByStatus = function(status: RegistrationStatus, eventId?: string) {
  const query: any = { status };
  
  if (eventId) {
    query.eventId = eventId;
  }
  
  return this.find(query).populate('userId eventId');
};

// Static method to get registration statistics
eventRegistrationSchema.statics.getRegistrationStats = function(eventId: string) {
  return this.aggregate([
    { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        statusCounts: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        }
      }
    }
  ]);
};

// Static method to find user's registration for event
eventRegistrationSchema.statics.findUserRegistration = function(userId: string, eventId: string) {
  return this.findOne({ userId, eventId });
};

const EventRegistration = mongoose.model<EventRegistrationDocument>('EventRegistration', eventRegistrationSchema);

export default EventRegistration;