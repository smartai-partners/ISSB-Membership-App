// ============================================================================
// NOTIFICATION API EXPORTS
// ============================================================================

// Main API exports
export { default as notificationApi } from './notificationApi';
export * from './notificationApi';

// Re-export types for convenience
export type {
  Notification,
  NotificationType,
  Message,
  MessageType,
  MessagePriority,
  NotificationSubscription,
  NotificationPreferences,
  NotificationChannel,
  NotificationFrequency,
} from './notificationApi';
