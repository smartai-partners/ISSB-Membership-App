import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Event from '../models/Event';
import EventRegistration from '../models/EventRegistration';
import { AuthenticatedRequest } from '../middleware/auth';
import { 
  Event as IEvent,
  EventFilter,
  EventType,
  EventStatus,
  MembershipTier,
  RegistrationStatus,
  ApiResponse,
  PaginatedResponse
} from '@issb/types';
import { AppError } from '../middleware/errorHandler';
import { logEvent, logRegistration } from '../config/logger';

// ============================================================================
// EVENT LISTING AND RETRIEVAL
// ============================================================================

/**
 * Get all events with filtering and pagination
 * GET /api/events
 */
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      tier,
      status,
      location,
      startDate,
      endDate,
      search,
      sortBy = 'startDate',
      sortOrder = 'asc'
    } = req.query;

    // Build filter query
    const filter: EventFilter = {};
    
    if (type) {
      const types = Array.isArray(type) ? type : [type];
      filter.type = types as EventType[];
    }
    
    if (tier) {
      const tiers = Array.isArray(tier) ? tier : [tier];
      filter.tier = tiers as MembershipTier[];
    }
    
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      filter.status = statuses as EventStatus[];
    } else {
      // Default to published and ongoing events for public access
      filter.status = [EventStatus.PUBLISHED, EventStatus.ONGOING];
    }
    
    if (location) {
      filter.location = location as string;
    }
    
    if (startDate) {
      filter.startDate = new Date(startDate as string);
    }
    
    if (endDate) {
      filter.endDate = new Date(endDate as string);
    }
    
    if (search) {
      filter.search = search as string;
    }

    // Build sort query
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    let query = Event.find(filter);
    
    // Apply search if provided
    if (filter.search) {
      query = Event.searchEvents(filter.search, filter);
    } else {
      query = Event.find(filter);
    }
    
    const [events, total] = await Promise.all([
      query
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('organizerId', 'firstName lastName email')
        .lean(),
      Event.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    const response: ApiResponse<PaginatedResponse<IEvent>> = {
      success: true,
      data: {
        data: events as IEvent[],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Get single event by ID
 * GET /api/events/:id
 */
export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
      return;
    }

    const event = await Event.findById(id)
      .populate('organizerId', 'firstName lastName email');

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Log event access
    logEvent('event_accessed', {
      eventId: id,
      userId: (req as AuthenticatedRequest).user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<IEvent> = {
      success: true,
      data: event.toObject() as IEvent
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Get upcoming events
 * GET /api/events/upcoming
 */
export const getUpcomingEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tier, limit = 10 } = req.query;

    let query = Event.findUpcoming(
      tier as MembershipTier
    );

    const events = await query
      .limit(Number(limit))
      .populate('organizerId', 'firstName lastName email')
      .lean();

    const response: ApiResponse<IEvent[]> = {
      success: true,
      data: events as IEvent[]
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Get user's registered events
 * GET /api/events/my-events
 */
export const getMyEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { status, limit = 20, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build registration filter
    const registrationFilter: any = { userId: req.user.id };
    
    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      registrationFilter.status = statuses as RegistrationStatus[];
    }

    const registrations = await EventRegistration.find(registrationFilter)
      .populate({
        path: 'eventId',
        populate: {
          path: 'organizerId',
          select: 'firstName lastName email'
        }
      })
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await EventRegistration.countDocuments(registrationFilter);
    const totalPages = Math.ceil(total / Number(limit));

    const events = registrations
      .filter(reg => reg.eventId) // Filter out registrations with deleted events
      .map(reg => reg.eventId);

    const response: ApiResponse<PaginatedResponse<IEvent>> = {
      success: true,
      data: {
        data: events as IEvent[],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your events',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

// ============================================================================
// EVENT MANAGEMENT (ADMIN/BOARD)
// ============================================================================

/**
 * Create new event
 * POST /api/events
 */
export const createEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Check if user has permission (admin or board)
    if (!['admin', 'board'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create events'
      });
      return;
    }

    const eventData = {
      ...req.body,
      organizerId: req.user.id
    };

    const event = new Event(eventData);
    await event.save();

    await event.populate('organizerId', 'firstName lastName email');

    // Log event creation
    logEvent('event_created', {
      eventId: event._id.toString(),
      organizerId: req.user.id,
      eventTitle: event.title,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<IEvent> = {
      success: true,
      data: event.toObject() as IEvent,
      message: 'Event created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating event:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Update event
 * PUT /api/events/:id
 */
export const updateEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Check permissions
    const canUpdate = req.user.role === 'admin' || 
                     req.user.role === 'board' || 
                     event.organizerId.toString() === req.user.id;

    if (!canUpdate) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update this event'
      });
      return;
    }

    // Check if event can be edited (not completed or cancelled)
    if ([EventStatus.COMPLETED, EventStatus.CANCELLED].includes(event.status)) {
      res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled events'
      });
      return;
    }

    // Update event
    Object.assign(event, req.body);
    await event.save();

    await event.populate('organizerId', 'firstName lastName email');

    // Log event update
    logEvent('event_updated', {
      eventId: event._id.toString(),
      userId: req.user.id,
      eventTitle: event.title,
      changes: Object.keys(req.body),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<IEvent> = {
      success: true,
      data: event.toObject() as IEvent,
      message: 'Event updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating event:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Delete event
 * DELETE /api/events/:id
 */
export const deleteEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Check permissions
    const canDelete = req.user.role === 'admin' || 
                     req.user.role === 'board' || 
                     event.organizerId.toString() === req.user.id;

    if (!canDelete) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete this event'
      });
      return;
    }

    // Check if event has active registrations
    const activeRegistrations = await EventRegistration.countDocuments({
      eventId: id,
      status: { $in: [RegistrationStatus.REGISTERED, RegistrationStatus.WAITLIST] }
    });

    if (activeRegistrations > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete event with active registrations. Cancel registrations first.'
      });
      return;
    }

    // Delete event and associated registrations
    await Promise.all([
      Event.findByIdAndDelete(id),
      EventRegistration.deleteMany({ eventId: id })
    ]);

    // Log event deletion
    logEvent('event_deleted', {
      eventId: event._id.toString(),
      userId: req.user.id,
      eventTitle: event.title,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Event deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

// ============================================================================
// EVENT REGISTRATION MANAGEMENT
// ============================================================================

/**
 * Register for an event
 * POST /api/events/:id/register
 */
export const registerForEvent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    // Check if registration is possible
    if (!event.canRegister()) {
      if (!event.isRegistrationOpen()) {
        res.status(400).json({
          success: false,
          message: 'Registration is not open for this event'
        });
        return;
      }

      if (!event.hasCapacity()) {
        res.status(400).json({
          success: false,
          message: 'Event is at full capacity'
        });
        return;
      }
    }

    // Check if user is already registered
    const existingRegistration = await EventRegistration.findUserRegistration(
      req.user.id,
      id
    );

    if (existingRegistration) {
      if (existingRegistration.isRegistered()) {
        res.status(400).json({
          success: false,
          message: 'You are already registered for this event'
        });
        return;
      }

      if (existingRegistration.isOnWaitlist()) {
        res.status(400).json({
          success: false,
          message: 'You are already on the waitlist for this event'
        });
        return;
      }

      if (existingRegistration.isCancelled()) {
        // Allow re-registration for cancelled users
        existingRegistration.status = RegistrationStatus.REGISTERED;
        existingRegistration.registeredAt = new Date();
        await existingRegistration.save();
        
        // Increment event registered count
        await event.incrementRegisteredCount();
        
        // Log registration
        logRegistration('event_registration', {
          eventId: id,
          userId: req.user.id,
          status: RegistrationStatus.REGISTERED,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        const response: ApiResponse<null> = {
          success: true,
          message: 'Successfully re-registered for the event'
        };

        res.json(response);
        return;
      }
    }

    // Create new registration
    const registrationStatus = event.hasCapacity() 
      ? RegistrationStatus.REGISTERED 
      : RegistrationStatus.WAITLIST;

    const registration = new EventRegistration({
      eventId: id,
      userId: req.user.id,
      status: registrationStatus
    });

    await registration.save();

    // Increment event registered count if registered (not waitlisted)
    if (registrationStatus === RegistrationStatus.REGISTERED) {
      await event.incrementRegisteredCount();
    }

    // Log registration
    logRegistration('event_registration', {
      eventId: id,
      userId: req.user.id,
      status: registrationStatus,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<null> = {
      success: true,
      message: registrationStatus === RegistrationStatus.REGISTERED 
        ? 'Successfully registered for the event' 
        : 'Added to waitlist successfully'
    };

    res.status(registrationStatus === RegistrationStatus.REGISTERED ? 200 : 201).json(response);
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for event',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Cancel event registration
 * DELETE /api/events/:id/register
 */
export const cancelEventRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    const registration = await EventRegistration.findUserRegistration(
      req.user.id,
      id
    );

    if (!registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
      return;
    }

    if (registration.isCancelled()) {
      res.status(400).json({
        success: false,
        message: 'Registration is already cancelled'
      });
      return;
    }

    if (registration.hasAttended()) {
      res.status(400).json({
        success: false,
        message: 'Cannot cancel registration after attendance'
      });
      return;
    }

    // Cancel registration
    await registration.cancel();

    // Decrement event registered count if they were registered (not waitlisted)
    if (registration.isRegistered()) {
      await event.decrementRegisteredCount();
    }

    // Log cancellation
    logRegistration('event_registration_cancelled', {
      eventId: id,
      userId: req.user.id,
      registrationStatus: registration.status,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Registration cancelled successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error cancelling event registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel registration',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

// ============================================================================
// EVENT UTILITIES
// ============================================================================

/**
 * Get event registration statistics
 * GET /api/events/:id/registrations/stats
 */
export const getEventRegistrationStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
      return;
    }

    const stats = await EventRegistration.getRegistrationStats(id);

    const response: ApiResponse<any> = {
      success: true,
      data: stats[0] || { total: 0, statusCounts: [] }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching registration stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration statistics',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};

/**
 * Get event attendees list
 * GET /api/events/:id/attendees
 */
export const getEventAttendees = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
      return;
    }

    // Check if user has permission to view attendees
    const event = await Event.findById(id);
    
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }

    const canViewAttendees = req.user.role === 'admin' || 
                           req.user.role === 'board' || 
                           event.organizerId.toString() === req.user.id;

    if (!canViewAttendees) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view attendees'
      });
      return;
    }

    const attendees = await EventRegistration.findAttendees(id);

    const response: ApiResponse<any[]> = {
      success: true,
      data: attendees
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching event attendees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event attendees',
      errors: error instanceof Error ? [{ message: error.message }] : undefined
    });
  }
};
