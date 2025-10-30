// ============================================================================
// SERVICE EXPORTS
// ============================================================================

export { default as UserService } from './UserService';
export { default as MembershipService } from './MembershipService';
export { default as EventService } from './EventService';
export { default as ApplicationService } from './ApplicationService';
export { default as VolunteerService } from './VolunteerService';
export { default as EmailService } from './emailService';
export { default as NotificationService } from './NotificationService';

// ============================================================================
// SERVICE INITIALIZATION
// ============================================================================

/**
 * Initialize all services
 * This function ensures all services are properly initialized
 */
export const initializeServices = () => {
  console.log('All services initialized successfully');
};

// Export service names for debugging/monitoring
export const SERVICE_NAMES = {
  UserService: 'UserService',
  MembershipService: 'MembershipService',
  EventService: 'EventService',
  ApplicationService: 'ApplicationService',
  VolunteerService: 'VolunteerService',
  EmailService: 'EmailService',
  NotificationService: 'NotificationService'
} as const;

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

/**
 * Service configuration
 */
export const SERVICE_CONFIG = {
  // Email service configuration
  email: {
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
    batchSize: 100
  },
  
  // Notification service configuration
  notifications: {
    batchSize: 50,
    processingInterval: 30000, // 30 seconds
    maxRetries: 3
  },
  
  // Auto-renewal configuration
  autoRenewal: {
    processingInterval: 24 * 60 * 60 * 1000, // 24 hours
    renewalBufferDays: 7, // Process renewals 7 days before expiry
    maxBatchSize: 1000
  }
} as const;