import mongoose, { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';
import { Notification as INotification, NotificationType } from '@issb/types';
import Notification, { NotificationDocument } from '../models/Notification';
import User, { UserDocument } from '../models/User';
import { sendEmail } from './emailService';
import { logger } from '../config/logger';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  sendEmail?: boolean;
  emailTemplate?: string;
  emailData?: Record<string, any>;
  expiresAt?: Date;
  scheduledFor?: Date;
}

export interface NotificationFilter {
  userId?: string;
  type?: NotificationType;
  read?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BulkNotificationData {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  sendEmail?: boolean;
  emailTemplate?: string;
  emailData?: Record<string, any>;
  expiresAt?: Date;
}

export interface ScheduleNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  sendEmail?: boolean;
  emailTemplate?: string;
  emailData?: Record<string, any>;
  scheduledFor: Date;
  expiresAt?: Date;
}

export interface NotificationStatistics {
  total: number;
  unread: number;
  read: number;
  emailSent: number;
  byType: Record<string, number>;
}

// ============================================================================
// NOTIFICATION SERVICE CLASS
// ============================================================================

class NotificationService {
  // ============================================================================
  // CORE NOTIFICATION METHODS
  // ============================================================================

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData): Promise<NotificationDocument> {
    try {
      const notification = new Notification({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data || {},
        expiresAt: data.expiresAt,
        scheduledFor: data.scheduledFor,
      });

      await notification.save();

      // Send email notification if requested
      if (data.sendEmail && !data.scheduledFor) {
        await this.sendEmailNotification(notification, data.emailTemplate, data.emailData);
      }

      logger.info('Notification created', {
        notificationId: notification._id,
        userId: data.userId,
        type: data.type,
      });

      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to user (handle immediate delivery)
   */
  async sendNotification(notificationId: string): Promise<boolean> {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.scheduledFor && notification.scheduledFor > new Date()) {
        throw new Error('Notification is scheduled for future delivery');
      }

      const user = await User.findById(notification.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Send email if enabled
      if (!notification.emailSent) {
        await this.sendEmailNotification(notification);
      }

      // Mark as processed
      notification.processedAt = new Date();
      await notification.save();

      logger.info('Notification sent successfully', {
        notificationId,
        userId: notification.userId,
        emailSent: notification.emailSent,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send notification:', {
        notificationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationDocument | null> {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();

      logger.info('Notification marked as read', {
        notificationId,
        userId: notification.userId,
      });

      return notification;
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Get user notifications with filtering and pagination
   */
  async getUserNotifications(
    userId: string,
    filter: NotificationFilter = {}
  ): Promise<{
    notifications: NotificationDocument[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const {
        type,
        read,
        dateRange,
        search,
        limit = 20,
        page = 1,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filter;

      // Build query
      const query: FilterQuery<NotificationDocument> = { userId };

      if (type) query.type = type;
      if (typeof read === 'boolean') query.read = read;
      
      if (dateRange) {
        query.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ];
      }

      // Add expiration filter
      query.$or = query.$or || [];
      query.$or.push(
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      );

      // Calculate pagination
      const skip = (page - 1) * limit;
      const total = await Notification.countDocuments(query);

      // Build options
      const options: QueryOptions = {
        limit,
        skip,
        sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
      };

      // Execute query
      const notifications = await Notification.find(query, null, options);

      const totalPages = Math.ceil(total / limit);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await Notification.countDocuments({
        userId,
        read: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      });

      return count;
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const result = await Notification.findByIdAndDelete(notificationId);
      if (!result) {
        throw new Error('Notification not found');
      }

      logger.info('Notification deleted', {
        notificationId,
        userId: result.userId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to delete notification:', error);
      throw error;
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotification(data: BulkNotificationData): Promise<{
    total: number;
    successful: number;
    failed: number;
    notifications: NotificationDocument[];
  }> {
    try {
      const { userIds, type, title, message, data: notificationData, sendEmail, emailTemplate, emailData, expiresAt } = data;
      
      const notifications: NotificationDocument[] = [];
      let successful = 0;
      let failed = 0;

      // Create notifications for all users
      for (const userId of userIds) {
        try {
          const notification = await this.createNotification({
            userId,
            type,
            title,
            message,
            data: notificationData,
            sendEmail: sendEmail && !data.scheduledFor,
            emailTemplate,
            emailData,
            expiresAt,
          });

          notifications.push(notification);
          successful++;
        } catch (error) {
          logger.error('Failed to create bulk notification for user', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failed++;
        }
      }

      logger.info('Bulk notification completed', {
        total: userIds.length,
        successful,
        failed,
        type,
      });

      return {
        total: userIds.length,
        successful,
        failed,
        notifications,
      };
    } catch (error) {
      logger.error('Failed to send bulk notification:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const count = await Notification.markAllAsRead(userId);

      logger.info('All notifications marked as read', {
        userId,
        count,
      });

      return count;
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string, type?: NotificationType): Promise<number> {
    try {
      const query: FilterQuery<NotificationDocument> = { userId };
      if (type) query.type = type;

      const result = await Notification.deleteMany(query);
      const count = result.deletedCount || 0;

      logger.info('All notifications deleted', {
        userId,
        type,
        count,
      });

      return count;
    } catch (error) {
      logger.error('Failed to delete all notifications:', error);
      throw error;
    }
  }

  // ============================================================================
  // SCHEDULED NOTIFICATIONS
  // ============================================================================

  /**
   * Schedule a notification for future delivery
   */
  async scheduleNotification(data: ScheduleNotificationData): Promise<NotificationDocument> {
    try {
      if (data.scheduledFor <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      const notification = await this.createNotification({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        sendEmail: data.sendEmail,
        emailTemplate: data.emailTemplate,
        emailData: data.emailData,
        scheduledFor: data.scheduledFor,
        expiresAt: data.expiresAt,
      });

      logger.info('Notification scheduled', {
        notificationId: notification._id,
        userId: data.userId,
        scheduledFor: data.scheduledFor,
      });

      return notification;
    } catch (error) {
      logger.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Process notification queue (send scheduled notifications)
   */
  async processNotificationQueue(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    try {
      const scheduledNotifications = await Notification.findScheduled();

      let processed = 0;
      let successful = 0;
      let failed = 0;

      for (const notification of scheduledNotifications) {
        try {
          processed++;
          const success = await this.sendNotification(notification._id.toString());
          
          if (success) {
            successful++;
          } else {
            failed++;
          }
        } catch (error) {
          logger.error('Failed to process scheduled notification', {
            notificationId: notification._id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          failed++;
        }
      }

      logger.info('Notification queue processing completed', {
        processed,
        successful,
        failed,
      });

      return { processed, successful, failed };
    } catch (error) {
      logger.error('Failed to process notification queue:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get notification statistics
   */
  async getNotificationStatistics(userId?: string): Promise<NotificationStatistics> {
    try {
      const stats = await Notification.getStatistics(userId);
      return stats;
    } catch (error) {
      logger.error('Failed to get notification statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const count = await Notification.cleanupExpired();
      
      if (count > 0) {
        logger.info('Expired notifications cleaned up', { count });
      }

      return count;
    } catch (error) {
      logger.error('Failed to cleanup expired notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string): Promise<NotificationDocument | null> {
    try {
      return await Notification.findById(notificationId);
    } catch (error) {
      logger.error('Failed to get notification by ID:', error);
      throw error;
    }
  }

  /**
   * Update notification
   */
  async updateNotification(
    notificationId: string,
    updateData: UpdateQuery<NotificationDocument>
  ): Promise<NotificationDocument | null> {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      logger.info('Notification updated', { notificationId });

      return notification;
    } catch (error) {
      logger.error('Failed to update notification:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    notification: NotificationDocument,
    emailTemplate?: string,
    emailData?: Record<string, any>
  ): Promise<boolean> {
    try {
      const user = await User.findById(notification.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Prepare email data
      const emailContent = {
        to: user.email,
        subject: `[ISSB] ${notification.title}`,
        template: emailTemplate,
        data: {
          name: `${user.firstName} ${user.lastName}`,
          title: notification.title,
          message: notification.message,
          ...emailData,
        },
      };

      const success = await sendEmail(emailContent);

      if (success) {
        notification.emailSent = true;
        notification.emailSentAt = new Date();
        await notification.save();
      }

      return success;
    } catch (error) {
      logger.error('Failed to send email notification', {
        notificationId: notification._id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Update delivery attempts
      notification.deliveryAttempts += 1;
      notification.lastAttemptAt = new Date();
      await notification.save();
      
      return false;
    }
  }

  /**
   * Generate email template based on notification type
   */
  private getEmailTemplateForType(type: NotificationType): string | null {
    const templateMap: Record<NotificationType, string | null> = {
      [NotificationType.MEMBERSHIP]: 'membershipNotification',
      [NotificationType.APPLICATION]: 'applicationNotification',
      [NotificationType.EVENT]: 'eventNotification',
      [NotificationType.VOLUNTEER]: 'volunteerNotification',
      [NotificationType.SYSTEM]: 'systemNotification',
      [NotificationType.MESSAGE]: 'messageNotification',
      [NotificationType.REMINDER]: 'reminderNotification',
    };

    return templateMap[type] || null;
  }

  /**
   * Validate notification data
   */
  private validateNotificationData(data: CreateNotificationData): void {
    if (!data.userId || !mongoose.Types.ObjectId.isValid(data.userId)) {
      throw new Error('Valid user ID is required');
    }

    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    if (!data.message || data.message.trim().length === 0) {
      throw new Error('Message is required');
    }

    if (data.expiresAt && data.expiresAt <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }

    if (data.scheduledFor && data.scheduledFor <= new Date()) {
      throw new Error('Scheduled date must be in the future');
    }
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const notificationService = new NotificationService();
export default notificationService;