import api from '../../services/api';
import {
  Notification,
  NotificationType,
  Message,
  MessageType,
  MessagePriority,
  ApiResponse,
  PaginatedResponse,
  CreateInput,
  UpdateInput,
} from '@issb/types';

// ============================================================================
// NOTIFICATION TYPES AND INTERFACES
// ============================================================================

export interface NotificationSubscription {
  id: string;
  userId: string;
  type: NotificationType;
  categories: string[];
  channels: NotificationChannel[];
  frequency: NotificationFrequency;
  enabled: boolean;
  quietHours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
  filters?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    types: NotificationType[];
    quietHours: {
      start: string;
      end: string;
      timezone: string;
    };
  };
  push: {
    enabled: boolean;
    types: NotificationType[];
  };
  sms: {
    enabled: boolean;
    types: NotificationType[];
    phoneNumber?: string;
  };
  inApp: {
    enabled: boolean;
    types: NotificationType[];
    showOnLockScreen: boolean;
    sound: boolean;
  };
  workingHours: {
    start: string;
    end: string;
    timezone: string;
    enabled: boolean;
  };
  lastUpdated: Date;
}

export type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app';
export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly';

// ============================================================================
// NOTIFICATION API
// ============================================================================

/**
 * Get all notifications for the current user with filtering and pagination
 */
export const getNotifications = async (params?: {
  page?: number;
  limit?: number;
  type?: NotificationType[];
  read?: boolean;
  dateRange?: { startDate: Date; endDate: Date };
}): Promise<PaginatedResponse<Notification>> => {
  const response = await api.get<PaginatedResponse<Notification>>(
    '/notifications',
    { params }
  );
  return response.data;
};

/**
 * Get a single notification by ID
 */
export const getNotification = async (
  id: string
): Promise<Notification> => {
  const response = await api.get<Notification>(`/notifications/${id}`);
  return response.data;
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  id: string
): Promise<Notification> => {
  const response = await api.patch<Notification>(
    `/notifications/${id}/read`
  );
  return response.data;
};

/**
 * Mark multiple notifications as read
 */
export const markMultipleNotificationsAsRead = async (
  notificationIds: string[]
): Promise<void> => {
  await api.patch('/notifications/read-multiple', { notificationIds });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.patch('/notifications/read-all');
};

/**
 * Delete a notification
 */
export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};

/**
 * Delete multiple notifications
 */
export const deleteMultipleNotifications = async (
  notificationIds: string[]
): Promise<void> => {
  await api.delete('/notifications/multiple', { data: { notificationIds } });
};

/**
 * Delete all notifications for the current user
 */
export const deleteAllNotifications = async (): Promise<void> => {
  await api.delete('/notifications/all');
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (): Promise<{
  total: number;
  byType: Record<NotificationType, number>;
}> => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

/**
 * Create a notification (for system/admin use)
 */
export const createNotification = async (
  notification: CreateInput<Notification>
): Promise<Notification> => {
  const response = await api.post<Notification>('/notifications', notification);
  return response.data;
};

/**
 * Send notification to specific user
 */
export const sendNotificationToUser = async (
  userId: string,
  notification: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    channels?: NotificationChannel[];
  }
): Promise<Notification> => {
  const response = await api.post<Notification>(
    `/notifications/send/${userId}`,
    notification
  );
  return response.data;
};

/**
 * Send broadcast notification to multiple users
 */
export const sendBroadcastNotification = async (
  notification: {
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    userIds?: string[];
    roles?: string[];
    filter?: Record<string, any>;
  }
): Promise<{ sent: number; failed: number }> => {
  const response = await api.post('/notifications/broadcast', notification);
  return response.data;
};

// ============================================================================
// NOTIFICATION PREFERENCES API
// ============================================================================

/**
 * Get notification preferences for current user
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get<NotificationPreferences>('/notifications/preferences');
  return response.data;
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const response = await api.patch<NotificationPreferences>(
    '/notifications/preferences',
    preferences
  );
  return response.data;
};

/**
 * Reset notification preferences to defaults
 */
export const resetNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.post<NotificationPreferences>(
    '/notifications/preferences/reset'
  );
  return response.data;
};

/**
 * Enable/disable notification channel for specific type
 */
export const toggleNotificationChannel = async (
  type: NotificationType,
  channel: NotificationChannel,
  enabled: boolean
): Promise<NotificationPreferences> => {
  const response = await api.patch<NotificationPreferences>(
    '/notifications/preferences/toggle',
    { type, channel, enabled }
  );
  return response.data;
};

// ============================================================================
// NOTIFICATION SUBSCRIPTION API
// ============================================================================

/**
 * Get all notification subscriptions for current user
 */
export const getNotificationSubscriptions = async (): Promise<NotificationSubscription[]> => {
  const response = await api.get<NotificationSubscription[]>('/notifications/subscriptions');
  return response.data;
};

/**
 * Get a specific notification subscription
 */
export const getNotificationSubscription = async (
  id: string
): Promise<NotificationSubscription> => {
  const response = await api.get<NotificationSubscription>(
    `/notifications/subscriptions/${id}`
  );
  return response.data;
};

/**
 * Create a new notification subscription
 */
export const createNotificationSubscription = async (
  subscription: CreateInput<NotificationSubscription>
): Promise<NotificationSubscription> => {
  const response = await api.post<NotificationSubscription>(
    '/notifications/subscriptions',
    subscription
  );
  return response.data;
};

/**
 * Update a notification subscription
 */
export const updateNotificationSubscription = async (
  id: string,
  updates: UpdateInput<NotificationSubscription>
): Promise<NotificationSubscription> => {
  const response = await api.patch<NotificationSubscription>(
    `/notifications/subscriptions/${id}`,
    updates
  );
  return response.data;
};

/**
 * Delete a notification subscription
 */
export const deleteNotificationSubscription = async (
  id: string
): Promise<void> => {
  await api.delete(`/notifications/subscriptions/${id}`);
};

/**
 * Enable/disable a notification subscription
 */
export const toggleNotificationSubscription = async (
  id: string,
  enabled: boolean
): Promise<NotificationSubscription> => {
  const response = await api.patch<NotificationSubscription>(
    `/notifications/subscriptions/${id}/toggle`,
    { enabled }
  );
  return response.data;
};

/**
 * Subscribe to event notifications
 */
export const subscribeToEventNotifications = async (
  eventId: string,
  channels: NotificationChannel[] = ['in_app']
): Promise<NotificationSubscription> => {
  const response = await api.post<NotificationSubscription>(
    '/notifications/subscriptions/events',
    { eventId, channels }
  );
  return response.data;
};

/**
 * Subscribe to volunteer opportunity notifications
 */
export const subscribeToVolunteerNotifications = async (
  opportunityId: string,
  channels: NotificationChannel[] = ['in_app']
): Promise<NotificationSubscription> => {
  const response = await api.post<NotificationSubscription>(
    '/notifications/subscriptions/volunteer',
    { opportunityId, channels }
  );
  return response.data;
};

/**
 * Subscribe to application status notifications
 */
export const subscribeToApplicationNotifications = async (
  applicationId: string,
  channels: NotificationChannel[] = ['in_app', 'email']
): Promise<NotificationSubscription> => {
  const response = await api.post<NotificationSubscription>(
    '/notifications/subscriptions/applications',
    { applicationId, channels }
  );
  return response.data;
};

/**
 * Unsubscribe from all notifications for a specific event/opportunity
 */
export const unsubscribeFromResource = async (
  resourceType: 'event' | 'opportunity' | 'application',
  resourceId: string
): Promise<void> => {
  await api.delete('/notifications/subscriptions/resource', {
    data: { resourceType, resourceId }
  });
};

// ============================================================================
// REAL-TIME NOTIFICATION API
// ============================================================================

/**
 * Register for push notifications
 */
export const registerPushNotifications = async (
  token: string,
  platform: 'web' | 'ios' | 'android'
): Promise<{ success: boolean; endpoint?: string }> => {
  const response = await api.post('/notifications/register-push', {
    token,
    platform,
  });
  return response.data;
};

/**
 * Unregister from push notifications
 */
export const unregisterPushNotifications = async (
  token?: string
): Promise<void> => {
  await api.post('/notifications/unregister-push', { token });
};

/**
 * Test push notification
 */
export const testPushNotification = async (): Promise<void> => {
  await api.post('/notifications/test-push');
};

/**
 * Get push notification subscription status
 */
export const getPushNotificationStatus = async (): Promise<{
  registered: boolean;
  platform?: string;
  lastUpdated?: Date;
}> => {
  const response = await api.get('/notifications/push-status');
  return response.data;
};

// ============================================================================
// NOTIFICATION TEMPLATES AND CONFIGURATION
// ============================================================================

/**
 * Get available notification templates
 */
export const getNotificationTemplates = async (): Promise<{
  email: Record<NotificationType, string>;
  sms: Record<NotificationType, string>;
  push: Record<NotificationType, string>;
}> => {
  const response = await api.get('/notifications/templates');
  return response.data;
};

/**
 * Update notification template
 */
export const updateNotificationTemplate = async (
  type: NotificationType,
  channel: NotificationChannel,
  template: string
): Promise<void> => {
  await api.patch('/notifications/templates', {
    type,
    channel,
    template,
  });
};

/**
 * Reset notification template to default
 */
export const resetNotificationTemplate = async (
  type: NotificationType,
  channel: NotificationChannel
): Promise<void> => {
  await api.delete('/notifications/templates', {
    data: { type, channel }
  });
};

/**
 * Get notification delivery status
 */
export const getNotificationDeliveryStatus = async (
  notificationId: string
): Promise<{
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  channels: Array<{
    channel: NotificationChannel;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    timestamp: Date;
    error?: string;
  }>;
}> => {
  const response = await api.get(`/notifications/${notificationId}/delivery-status`);
  return response.data;
};

// ============================================================================
// NOTIFICATION ANALYTICS AND STATISTICS
// ============================================================================

/**
 * Get notification statistics for user
 */
export const getNotificationStats = async (
  dateRange?: { startDate: Date; endDate: Date }
): Promise<{
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  engagementRate: number;
}> => {
  const params = dateRange ? { ...dateRange } : {};
  const response = await api.get('/notifications/stats', { params });
  return response.data;
};

/**
 * Get notification delivery analytics (admin only)
 */
export const getNotificationAnalytics = async (
  dateRange?: { startDate: Date; endDate: Date }
): Promise<{
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  byChannel: Record<NotificationChannel, {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }>;
  byType: Record<NotificationType, {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
  }>;
}> => {
  const params = dateRange ? { ...dateRange } : {};
  const response = await api.get('/notifications/analytics', { params });
  return response.data;
};

// ============================================================================
// MESSAGE API (For internal messaging between users)
// ============================================================================

/**
 * Get messages for current user
 */
export const getMessages = async (params?: {
  page?: number;
  limit?: number;
  type?: MessageType[];
  read?: boolean;
  priority?: MessagePriority;
}): Promise<PaginatedResponse<Message>> => {
  const response = await api.get<PaginatedResponse<Message>>(
    '/messages',
    { params }
  );
  return response.data;
};

/**
 * Get a single message by ID
 */
export const getMessage = async (id: string): Promise<Message> => {
  const response = await api.get<Message>(`/messages/${id}`);
  return response.data;
};

/**
 * Send a message to another user
 */
export const sendMessage = async (message: CreateInput<Message>): Promise<Message> => {
  const response = await api.post<Message>('/messages', message);
  return response.data;
};

/**
 * Mark a message as read
 */
export const markMessageAsRead = async (id: string): Promise<Message> => {
  const response = await api.patch<Message>(`/messages/${id}/read`);
  return response.data;
};

/**
 * Delete a message
 */
export const deleteMessage = async (id: string): Promise<void> => {
  await api.delete(`/messages/${id}`);
};

/**
 * Get conversation between two users
 */
export const getConversation = async (
  userId: string,
  params?: { page?: number; limit?: number }
): Promise<PaginatedResponse<Message>> => {
  const response = await api.get<PaginatedResponse<Message>>(
    `/messages/conversation/${userId}`,
    { params }
  );
  return response.data;
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

const notificationApi = {
  // Notifications
  getNotifications,
  getNotification,
  markAsRead: markNotificationAsRead,
  markMultipleAsRead: markMultipleNotificationsAsRead,
  markAllAsRead: markAllNotificationsAsRead,
  deleteNotification,
  deleteMultiple: deleteMultipleNotifications,
  deleteAll: deleteAllNotifications,
  getUnreadCount: getUnreadNotificationCount,
  create: createNotification,
  sendToUser: sendNotificationToUser,
  sendBroadcast: sendBroadcastNotification,

  // Preferences
  getPreferences: getNotificationPreferences,
  updatePreferences: updateNotificationPreferences,
  resetPreferences: resetNotificationPreferences,
  toggleChannel: toggleNotificationChannel,

  // Subscriptions
  getSubscriptions: getNotificationSubscriptions,
  getSubscription: getNotificationSubscription,
  createSubscription: createNotificationSubscription,
  updateSubscription: updateNotificationSubscription,
  deleteSubscription: deleteNotificationSubscription,
  toggleSubscription: toggleNotificationSubscription,
  subscribeToEvents: subscribeToEventNotifications,
  subscribeToVolunteer: subscribeToVolunteerNotifications,
  subscribeToApplications: subscribeToApplicationNotifications,
  unsubscribeFromResource,

  // Real-time
  registerPush: registerPushNotifications,
  unregisterPush: unregisterPushNotifications,
  testPush: testPushNotification,
  getPushStatus: getPushNotificationStatus,

  // Templates and Configuration
  getTemplates: getNotificationTemplates,
  updateTemplate: updateNotificationTemplate,
  resetTemplate: resetNotificationTemplate,
  getDeliveryStatus: getNotificationDeliveryStatus,

  // Analytics
  getStats: getNotificationStats,
  getAnalytics: getNotificationAnalytics,

  // Messages
  getMessages,
  getMessage,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  getConversation,
};

export default notificationApi;
