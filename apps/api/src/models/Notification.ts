import mongoose, { Schema, Document } from 'mongoose';
import { Notification as INotification, NotificationType } from '@issb/types';

export interface NotificationDocument extends INotification, Document {
  emailSent?: boolean;
  emailSentAt?: Date;
  deliveryAttempts: number;
  lastAttemptAt?: Date;
  scheduledFor?: Date;
  processedAt?: Date;
  
  // Instance methods
  markAsRead(): Promise<NotificationDocument>;
  sendEmail(): Promise<boolean>;
}

// Notification Schema
const notificationSchema = new Schema<NotificationDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: [true, 'Notification type is required'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters'],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot be more than 1000 characters'],
  },
  data: {
    type: Schema.Types.Mixed,
    default: {},
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    index: true,
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAt: {
    type: Date,
  },
  deliveryAttempts: {
    type: Number,
    default: 0,
  },
  lastAttemptAt: {
    type: Date,
  },
  scheduledFor: {
    type: Date,
    index: true,
  },
  processedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, processedAt: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual for unread status
notificationSchema.virtual('isUnread').get(function() {
  return !this.read;
});

// Virtual for expired status
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for pending delivery
notificationSchema.virtual('isPending').get(function() {
  return this.scheduledFor && this.scheduledFor > new Date();
});

// Pre-save middleware to set readAt when read status changes
notificationSchema.pre<NotificationDocument>('save', function(next) {
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Instance method to mark notification as read
notificationSchema.methods.markAsRead = async function(): Promise<NotificationDocument> {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Instance method to send email notification
notificationSchema.methods.sendEmail = async function(): Promise<boolean> {
  try {
    // This will be implemented in the service
    // For now, just mark as attempted
    this.deliveryAttempts += 1;
    this.lastAttemptAt = new Date();
    await this.save();
    return true;
  } catch (error) {
    this.deliveryAttempts += 1;
    this.lastAttemptAt = new Date();
    await this.save();
    return false;
  }
};

// Static method to find unread notifications for user
notificationSchema.statics.findUnreadByUser = function(userId: string) {
  return this.find({ 
    userId, 
    read: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).sort({ createdAt: -1 });
};

// Static method to find notifications by type
notificationSchema.statics.findByType = function(type: NotificationType) {
  return this.find({ type }).sort({ createdAt: -1 });
};

// Static method to find scheduled notifications
notificationSchema.statics.findScheduled = function() {
  return this.find({
    scheduledFor: { $lte: new Date() },
    processedAt: { $exists: false }
  }).sort({ scheduledFor: 1 });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function(userId: string): Promise<number> {
  const result = await this.updateMany(
    { userId, read: false },
    { 
      read: true, 
      readAt: new Date() 
    }
  );
  return result.modifiedCount || 0;
};

// Static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = async function(): Promise<number> {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  return result.deletedCount || 0;
};

// Static method to get notification statistics
notificationSchema.statics.getStatistics = async function(userId?: string) {
  const matchStage = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
        },
        read: {
          $sum: { $cond: [{ $eq: ['$read', true] }, 1, 0] }
        },
        byType: {
          $push: '$type'
        },
        emailSent: {
          $sum: { $cond: [{ $eq: ['$emailSent', true] }, 1, 0] }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      unread: 0,
      read: 0,
      emailSent: 0,
      byType: {}
    };
  }

  const result = stats[0];
  
  // Count by type
  const byType: Record<string, number> = {};
  result.byType.forEach((type: string) => {
    byType[type] = (byType[type] || 0) + 1;
  });

  return {
    total: result.total,
    unread: result.unread,
    read: result.read,
    emailSent: result.emailSent,
    byType
  };
};

const Notification = mongoose.model<NotificationDocument>('Notification', notificationSchema);

export default Notification;