// ============================================================================
// MODEL EXPORTS
// ============================================================================

export { default as User } from './User';
export { default as Membership } from './Membership';
export { default as Event } from './Event';
export { default as EventRegistration } from './EventRegistration';
export { default as MembershipApplication } from './MembershipApplication';
export { default as VolunteerOpportunity } from './VolunteerOpportunity';
export { default as Notification } from './Notification';

// Export all document interfaces for typing
export type { UserDocument } from './User';
export type { MembershipDocument } from './Membership';
export type { EventDocument } from './Event';
export type { EventRegistrationDocument } from './EventRegistration';
export type { MembershipApplicationDocument } from './MembershipApplication';
export type { VolunteerOpportunityDocument } from './VolunteerOpportunity';
export type { NotificationDocument } from './Notification';

// ============================================================================
// MODEL INITIALIZATION
// ============================================================================

/**
 * Initialize all models
 * This function ensures all models are properly registered with Mongoose
 */
export const initializeModels = () => {
  // Models are automatically registered when imported
  // This function can be used to ensure all models are loaded
  console.log('All models initialized successfully');
};