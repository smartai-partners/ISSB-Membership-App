import mongoose from 'mongoose';
import Event, { EventDocument } from '../models/Event';
import EventRegistration, { EventRegistrationDocument } from '../models/EventRegistration';
import User, { UserDocument } from '../models/User';
import { 
  Event as IEvent,
  EventType,
  EventStatus,
  RegistrationStatus,
  MembershipTier,
  EventFilter,
  CreateInput,
  UpdateInput
} from '@issb/types';
import { logger } from '../config/logger';
import { sendEmail } from './emailService';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface CreateEventInput extends CreateInput<IEvent> {
  organizerId: string;
}

export interface UpdateEventInput extends UpdateInput<IEvent> {
  organizerId?: string;
}

export interface EventSearchFilters extends EventFilter {
  organizerId?: string;
  tags?: string[];
  isVirtual?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface EventRegistrationInput {
  eventId: string;
  userId: string;
}

export interface EventStatistics {
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalCapacity: number;
  totalRegistered: number;
  averageAttendance: number;
  totalAttendees: number;
  totalNoShows: number;
  waitlistCount: number;
  eventTypeBreakdown: Record<string, number>;
  tierBreakdown: Record<string, number>;
  monthlyStats: Array<{
    month: string;
    count: number;
    attendees: number;
  }>;
}

export interface EventAttendanceData {
  registrationId: string;
  action: 'check_in' | 'check_out';
  timestamp: Date;
}

// ============================================================================
// EVENT SERVICE CLASS
// ============================================================================

export class EventService {
  // ============================================================================
  // EVENT CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new event
   */
  async createEvent(eventData: CreateEventInput): Promise<EventDocument> {
    try {
      // Validate organizer exists
      const organizer = await User.findById(eventData.organizerId);
      if (!organizer) {
        throw new Error('Organizer not found');
      }

      // Create event with proper defaults
      const event = new Event({
        ...eventData,
        status: eventData.status || EventStatus.DRAFT,
        registeredCount: 0,
      });

      // Save event
      const savedEvent = await event.save();

      logger.info('Event created successfully', {
        eventId: savedEvent._id,
        title: savedEvent.title,
        organizerId: eventData.organizerId,
      });

      return savedEvent;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create event');
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(
    eventId: string,
    updates: UpdateEventInput,
    organizerId: string
  ): Promise<EventDocument> {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Verify organizer permission
      if (event.organizerId.toString() !== organizerId) {
        throw new Error('Unauthorized: You can only update your own events');
      }

      // Validate status changes
      if (updates.status) {
        this.validateStatusTransition(event.status, updates.status);
      }

      // Don't allow capacity changes if already exceeded
      if (updates.capacity && updates.capacity < event.registeredCount) {
        throw new Error('Cannot reduce capacity below current registered count');
      }

      // Update event
      Object.assign(event, updates);
      const updatedEvent = await event.save();

      logger.info('Event updated successfully', {
        eventId: updatedEvent._id,
        title: updatedEvent.title,
        organizerId,
      });

      return updatedEvent;
    } catch (error) {
      logger.error('Error updating event:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update event');
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string, organizerId: string): Promise<void> {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Verify organizer permission
      if (event.organizerId.toString() !== organizerId) {
        throw new Error('Unauthorized: You can only delete your own events');
      }

      // Check if event has registrations
      const registrationCount = await EventRegistration.countDocuments({
        eventId,
        status: { $in: [RegistrationStatus.REGISTERED, RegistrationStatus.WAITLIST] }
      });

      if (registrationCount > 0) {
        throw new Error('Cannot delete event with existing registrations. Cancel the event instead.');
      }

      // Delete all registrations associated with the event
      await EventRegistration.deleteMany({ eventId });

      // Delete event
      await Event.findByIdAndDelete(eventId);

      logger.info('Event deleted successfully', {
        eventId,
        organizerId,
      });
    } catch (error) {
      logger.error('Error deleting event:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete event');
    }
  }

  /**
   * Get event by ID with populated data
   */
  async getEventById(eventId: string): Promise<EventDocument | null> {
    try {
      const event = await Event.findById(eventId)
        .populate('organizerId', 'firstName lastName email avatar');

      if (!event) {
        return null;
      }

      return event;
    } catch (error) {
      logger.error('Error getting event by ID:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get event');
    }
  }

  // ============================================================================
  // EVENT SEARCH AND RETRIEVAL
  // ============================================================================

  /**
   * Search events with filters and pagination
   */
  async searchEvents(
    filters: EventSearchFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ events: EventDocument[]; total: number; totalPages: number }> {
    try {
      const query: any = {
        status: { 
          $in: [EventStatus.PUBLISHED, EventStatus.ONGOING] 
        }
      };

      // Apply filters
      if (filters.type && filters.type.length > 0) {
        query.type = { $in: filters.type };
      }

      if (filters.tier && filters.tier.length > 0) {
        query.tier = { $in: filters.tier };
      }

      if (filters.status && filters.status.length > 0) {
        query.status = { $in: filters.status };
      }

      if (filters.organizerId) {
        query.organizerId = new mongoose.Types.ObjectId(filters.organizerId);
      }

      if (filters.isVirtual !== undefined) {
        query.isVirtual = filters.isVirtual;
      }

      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }

      if (filters.location) {
        query.location = new RegExp(filters.location, 'i');
      }

      // Date range filter
      if (filters.dateRange) {
        query.startDate = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end
        };
      } else {
        // Default to upcoming events if no date range specified
        if (!filters.status || !filters.status.includes(EventStatus.ONGOING)) {
          query.startDate = { $gte: new Date() };
        }
      }

      // Text search
      let sortOptions: any = { startDate: 1 };
      if (filters.search) {
        query.$text = { $search: filters.search };
        sortOptions = { score: { $meta: 'textScore' }, startDate: 1 };
      }

      // Pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [events, total] = await Promise.all([
        Event.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('organizerId', 'firstName lastName email'),
        Event.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        events,
        total,
        totalPages
      };
    } catch (error) {
      logger.error('Error searching events:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to search events');
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(
    tier?: MembershipTier,
    limit: number = 10
  ): Promise<EventDocument[]> {
    try {
      const query = Event.findUpcoming(tier);
      
      if (limit > 0) {
        query.limit(limit);
      }

      const events = await query.populate('organizerId', 'firstName lastName email');
      return events;
    } catch (error) {
      logger.error('Error getting upcoming events:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get upcoming events');
    }
  }

  /**
   * Get events by organizer
   */
  async getEventsByOrganizer(
    organizerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ events: EventDocument[]; total: number; totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      
      const [events, total] = await Promise.all([
        Event.findByOrganizer(organizerId)
          .skip(skip)
          .limit(limit),
        Event.countDocuments({ organizerId })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        events,
        total,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting events by organizer:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get organizer events');
    }
  }

  /**
   * Get user's registered events
   */
  async getUserEvents(
    userId: string,
    status?: RegistrationStatus[],
    page: number = 1,
    limit: number = 10
  ): Promise<{ events: EventDocument[]; total: number; totalPages: number }> {
    try {
      const query: any = { userId };
      
      if (status && status.length > 0) {
        query.status = { $in: status };
      }

      const skip = (page - 1) * limit;
      
      const registrations = await EventRegistration.find(query)
        .sort({ registeredAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'eventId',
          match: query.status ? undefined : { status: { $ne: EventStatus.CANCELLED } }
        });

      // Filter out null eventId (from populate match) and get unique events
      const eventIds = [...new Set(
        registrations
          .filter(r => r.eventId)
          .map(r => r.eventId)
      )];

      const [events, total] = await Promise.all([
        Event.find({ _id: { $in: eventIds } }),
        EventRegistration.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        events,
        total,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting user events:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get user events');
    }
  }

  // ============================================================================
  // REGISTRATION MANAGEMENT
  // ============================================================================

  /**
   * Register a user for an event
   */
  async registerForEvent(eventId: string, userId: string): Promise<EventRegistrationDocument> {
    try {
      const [event, existingRegistration] = await Promise.all([
        Event.findById(eventId),
        EventRegistration.findUserRegistration(userId, eventId)
      ]);

      if (!event) {
        throw new Error('Event not found');
      }

      if (existingRegistration) {
        if (existingRegistration.status === RegistrationStatus.CANCELLED) {
          // Re-activate cancelled registration
          existingRegistration.status = RegistrationStatus.REGISTERED;
          existingRegistration.registeredAt = new Date();
          await existingRegistration.save();
          await event.incrementRegisteredCount();
          
          logger.info('Registration re-activated', {
            eventId,
            userId,
            registrationId: existingRegistration._id
          });

          return existingRegistration;
        } else {
          throw new Error('User is already registered for this event');
        }
      }

      // Check if registration is open
      if (!event.isRegistrationOpen()) {
        throw new Error('Registration is not open for this event');
      }

      // Check capacity
      let registrationStatus = RegistrationStatus.REGISTERED;
      if (event.capacity && event.registeredCount >= event.capacity) {
        registrationStatus = RegistrationStatus.WAITLIST;
      }

      // Create registration
      const registration = new EventRegistration({
        eventId,
        userId,
        status: registrationStatus,
        registeredAt: new Date()
      });

      const savedRegistration = await registration.save();

      // Increment registered count if directly registered
      if (registrationStatus === RegistrationStatus.REGISTERED) {
        await event.incrementRegisteredCount();
      }

      // Send confirmation email
      await this.sendRegistrationConfirmationEmail(savedRegistration, event);

      logger.info('User registered for event', {
        eventId,
        userId,
        registrationId: savedRegistration._id,
        status: registrationStatus
      });

      return savedRegistration;
    } catch (error) {
      logger.error('Error registering for event:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to register for event');
    }
  }

  /**
   * Cancel a registration
   */
  async cancelRegistration(registrationId: string, userId: string): Promise<void> {
    try {
      const [registration, event] = await Promise.all([
        EventRegistration.findById(registrationId).populate('eventId'),
        Event.findById((registrationId as any).eventId)
      ]);

      if (!registration) {
        throw new Error('Registration not found');
      }

      if (registration.userId.toString() !== userId) {
        throw new Error('Unauthorized: You can only cancel your own registrations');
      }

      if (registration.status === RegistrationStatus.CANCELLED) {
        throw new Error('Registration is already cancelled');
      }

      if (registration.status === RegistrationStatus.ATTENDED) {
        throw new Error('Cannot cancel registration after attending the event');
      }

      // Update registration status
      registration.status = RegistrationStatus.CANCELLED;
      await registration.save();

      // Decrement registered count if was registered (not waitlist)
      if (registration.status === RegistrationStatus.REGISTERED) {
        await event.decrementRegisteredCount();

        // Promote waitlist if there's one
        await this.promoteWaitlist(event._id.toString());
      }

      // Send cancellation confirmation email
      await this.sendRegistrationCancellationEmail(registration, event);

      logger.info('Registration cancelled', {
        registrationId,
        userId,
        eventId: event._id
      });
    } catch (error) {
      logger.error('Error cancelling registration:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to cancel registration');
    }
  }

  /**
   * Check event capacity
   */
  async checkEventCapacity(eventId: string): Promise<{
    capacity: number | null;
    registeredCount: number;
    remainingCapacity: number;
    hasCapacity: boolean;
    waitlistCount: number;
  }> {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const waitlistCount = await EventRegistration.countDocuments({
        eventId,
        status: RegistrationStatus.WAITLIST
      });

      return {
        capacity: event.capacity || null,
        registeredCount: event.registeredCount,
        remainingCapacity: event.getRemainingCapacity(),
        hasCapacity: event.hasCapacity(),
        waitlistCount
      };
    } catch (error) {
      logger.error('Error checking event capacity:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to check event capacity');
    }
  }

  /**
   * Promote waitlist registrations
   */
  async promoteWaitlist(eventId: string): Promise<EventRegistrationDocument[]> {
    try {
      const event = await Event.findById(eventId);
      if (!event || !event.capacity) {
        return [];
      }

      if (event.registeredCount >= event.capacity) {
        return [];
      }

      // Find waitlisted registrations to promote
      const availableSlots = event.capacity - event.registeredCount;
      const waitlistedRegistrations = await EventRegistration.find({
        eventId,
        status: RegistrationStatus.WAITLIST
      })
        .sort({ registeredAt: 1 })
        .limit(availableSlots);

      if (waitlistedRegistrations.length === 0) {
        return [];
      }

      // Promote registrations
      for (const registration of waitlistedRegistrations) {
        registration.status = RegistrationStatus.REGISTERED;
        await registration.save();
        await event.incrementRegisteredCount();

        // Send promotion email
        await this.sendWaitlistPromotionEmail(registration, event);
      }

      logger.info('Waitlist promoted', {
        eventId,
        promotedCount: waitlistedRegistrations.length
      });

      return waitlistedRegistrations;
    } catch (error) {
      logger.error('Error promoting waitlist:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to promote waitlist');
    }
  }

  // ============================================================================
  // ATTENDANCE TRACKING
  // ============================================================================

  /**
   * Process event attendance
   */
  async processEventAttendance(
    registrationId: string,
    action: 'check_in' | 'check_out',
    timestamp?: Date
  ): Promise<EventRegistrationDocument> {
    try {
      const registration = await EventRegistration.findById(registrationId)
        .populate('eventId')
        .populate('userId', 'firstName lastName email');

      if (!registration) {
        throw new Error('Registration not found');
      }

      const event = registration.eventId as EventDocument;
      const user = registration.userId as UserDocument;

      // Verify event is happening now or recently
      const now = new Date();
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const checkInWindow = 2 * 60 * 60 * 1000; // 2 hours before start
      const checkOutWindow = 2 * 60 * 60 * 1000; // 2 hours after end

      if (action === 'check_in') {
        if (!registration.canCheckIn()) {
          throw new Error('Cannot check in at this time');
        }

        if (now < new Date(eventStart.getTime() - checkInWindow) || 
            now > new Date(eventEnd.getTime() + checkOutWindow)) {
          throw new Error('Check-in not allowed at this time');
        }

        await registration.checkIn();

        logger.info('User checked in to event', {
          registrationId,
          userId: user._id,
          eventId: event._id,
          timestamp: timestamp || new Date()
        });

      } else if (action === 'check_out') {
        if (!registration.canCheckOut()) {
          throw new Error('Cannot check out at this time');
        }

        if (now > new Date(eventEnd.getTime() + checkOutWindow)) {
          throw new Error('Check-out not allowed at this time');
        }

        await registration.checkOut();

        logger.info('User checked out from event', {
          registrationId,
          userId: user._id,
          eventId: event._id,
          timestamp: timestamp || new Date()
        });
      }

      return registration;
    } catch (error) {
      logger.error('Error processing event attendance:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to process attendance');
    }
  }

  /**
   * Bulk process attendance for multiple users
   */
  async bulkProcessAttendance(
    eventId: string,
    attendanceData: EventAttendanceData[]
  ): Promise<{ successful: number; failed: number; errors: any[] }> {
    let successful = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const data of attendanceData) {
      try {
        await this.processEventAttendance(
          data.registrationId,
          data.action,
          data.timestamp
        );
        successful++;
      } catch (error) {
        failed++;
        errors.push({
          registrationId: data.registrationId,
          action: data.action,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('Bulk attendance processing completed', {
      eventId,
      successful,
      failed,
      total: attendanceData.length
    });

    return { successful, failed, errors };
  }

  // ============================================================================
  // STATISTICS AND ANALYTICS
  // ============================================================================

  /**
   * Get comprehensive event statistics
   */
  async getEventStatistics(
    eventId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<EventStatistics> {
    try {
      let matchQuery: any = {};
      
      if (eventId) {
        matchQuery._id = new mongoose.Types.ObjectId(eventId);
      }
      
      if (dateRange) {
        matchQuery.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      // Get event statistics
      const eventStats = await Event.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            upcomingEvents: {
              $sum: {
                $cond: [
                  { $and: [
                    { $eq: ['$status', EventStatus.PUBLISHED] },
                    { $gt: ['$startDate', new Date()] }
                  ]},
                  1,
                  0
                ]
              }
            },
            ongoingEvents: {
              $sum: {
                $cond: [
                  { $eq: ['$status', EventStatus.ONGOING] },
                  1,
                  0
                ]
              }
            },
            completedEvents: {
              $sum: {
                $cond: [
                  { $eq: ['$status', EventStatus.COMPLETED] },
                  1,
                  0
                ]
              }
            },
            cancelledEvents: {
              $sum: {
                $cond: [
                  { $eq: ['$status', EventStatus.CANCELLED] },
                  1,
                  0
                ]
              }
            },
            totalCapacity: { $sum: { $ifNull: ['$capacity', 0] } },
            totalRegistered: { $sum: '$registeredCount' },
            eventTypeBreakdown: {
              $push: '$type'
            },
            tierBreakdown: {
              $push: '$tier'
            }
          }
        }
      ]);

      // Get registration statistics
      let registrationMatchQuery: any = {};
      if (eventId) {
        registrationMatchQuery.eventId = new mongoose.Types.ObjectId(eventId);
      }
      if (dateRange) {
        registrationMatchQuery.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const registrationStats = await EventRegistration.aggregate([
        { $match: registrationMatchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get monthly statistics
      const monthlyStats = await Event.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      // Process results
      const stats = eventStats[0] || {
        totalEvents: 0,
        upcomingEvents: 0,
        ongoingEvents: 0,
        completedEvents: 0,
        cancelledEvents: 0,
        totalCapacity: 0,
        totalRegistered: 0,
        eventTypeBreakdown: [],
        tierBreakdown: []
      };

      const registeredCount = registrationStats.find(r => r._id === RegistrationStatus.REGISTERED)?.count || 0;
      const attendedCount = registrationStats.find(r => r._id === RegistrationStatus.ATTENDED)?.count || 0;
      const noShowCount = registrationStats.find(r => r._id === RegistrationStatus.NO_SHOW)?.count || 0;
      const waitlistCount = registrationStats.find(r => r._id === RegistrationStatus.WAITLIST)?.count || 0;

      const averageAttendance = registeredCount > 0 ? 
        Math.round((attendedCount / registeredCount) * 100) : 0;

      // Count event types
      const eventTypeBreakdown: Record<string, number> = {};
      stats.eventTypeBreakdown?.forEach((type: EventType) => {
        eventTypeBreakdown[type] = (eventTypeBreakdown[type] || 0) + 1;
      });

      // Count tiers
      const tierBreakdown: Record<string, number> = {};
      stats.tierBreakdown?.forEach((tier: MembershipTier) => {
        tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
      });

      // Format monthly stats
      const formattedMonthlyStats = monthlyStats.map(stat => ({
        month: `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}`,
        count: stat.count,
        attendees: 0 // Would need additional aggregation for actual attendee counts
      }));

      return {
        totalEvents: stats.totalEvents || 0,
        upcomingEvents: stats.upcomingEvents || 0,
        ongoingEvents: stats.ongoingEvents || 0,
        completedEvents: stats.completedEvents || 0,
        cancelledEvents: stats.cancelledEvents || 0,
        totalCapacity: stats.totalCapacity || 0,
        totalRegistered: stats.totalRegistered || 0,
        averageAttendance,
        totalAttendees: attendedCount,
        totalNoShows: noShowCount,
        waitlistCount,
        eventTypeBreakdown,
        tierBreakdown,
        monthlyStats: formattedMonthlyStats
      };
    } catch (error) {
      logger.error('Error getting event statistics:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get event statistics');
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Validate event status transition
   */
  private validateStatusTransition(currentStatus: EventStatus, newStatus: EventStatus): void {
    const validTransitions: Record<EventStatus, EventStatus[]> = {
      [EventStatus.DRAFT]: [EventStatus.PUBLISHED, EventStatus.CANCELLED],
      [EventStatus.PUBLISHED]: [EventStatus.ONGOING, EventStatus.CANCELLED, EventStatus.COMPLETED],
      [EventStatus.ONGOING]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
      [EventStatus.COMPLETED]: [], // Cannot transition from completed
      [EventStatus.CANCELLED]: [] // Cannot transition from cancelled
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  /**
   * Send registration confirmation email
   */
  private async sendRegistrationConfirmationEmail(
    registration: EventRegistrationDocument,
    event: EventDocument
  ): Promise<void> {
    try {
      const user = await User.findById(registration.userId);
      if (!user) return;

      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);

      await sendEmail({
        to: user.email,
        template: 'eventRegistration',
        data: {
          name: `${user.firstName} ${user.lastName}`,
          eventTitle: event.title,
          eventDate: eventStartDate.toLocaleDateString(),
          eventTime: eventStartDate.toLocaleTimeString(),
          eventLocation: event.location,
          eventDescription: event.description,
          virtualLink: event.isVirtual ? event.virtualLink : null,
          notes: `Your registration is ${registration.status === RegistrationStatus.REGISTERED ? 'confirmed' : 'on the waitlist'}`
        }
      });
    } catch (error) {
      logger.error('Failed to send registration confirmation email:', error);
      // Don't throw error as email failure shouldn't break registration
    }
  }

  /**
   * Send registration cancellation email
   */
  private async sendRegistrationCancellationEmail(
    registration: EventRegistrationDocument,
    event: EventDocument
  ): Promise<void> {
    try {
      const user = await User.findById(registration.userId);
      if (!user) return;

      await sendEmail({
        to: user.email,
        subject: `Registration Cancelled - ${event.title}`,
        text: `Your registration for ${event.title} has been cancelled.`,
        html: `
          <h2>Registration Cancelled</h2>
          <p>Dear ${user.firstName},</p>
          <p>Your registration for <strong>${event.title}</strong> has been cancelled.</p>
          <p>If you have any questions, please contact us.</p>
        `
      });
    } catch (error) {
      logger.error('Failed to send cancellation email:', error);
    }
  }

  /**
   * Send waitlist promotion email
   */
  private async sendWaitlistPromotionEmail(
    registration: EventRegistrationDocument,
    event: EventDocument
  ): Promise<void> {
    try {
      const user = await User.findById(registration.userId);
      if (!user) return;

      const eventStartDate = new Date(event.startDate);

      await sendEmail({
        to: user.email,
        subject: `Waitlist Promotion - ${event.title}`,
        text: `Good news! You've been moved from waitlist to registered for ${event.title}.`,
        html: `
          <h2>Good News! You've Been Promoted from Waitlist</h2>
          <p>Dear ${user.firstName},</p>
          <p>Great news! A spot has opened up and you've been moved from the waitlist to registered for <strong>${event.title}</strong>.</p>
          <p><strong>Event Details:</strong></p>
          <ul>
            <li>Date: ${eventStartDate.toLocaleDateString()}</li>
            <li>Time: ${eventStartDate.toLocaleTimeString()}</li>
            <li>Location: ${event.location}</li>
          </ul>
          <p>We look forward to seeing you at the event!</p>
        `
      });
    } catch (error) {
      logger.error('Failed to send waitlist promotion email:', error);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default new EventService();
