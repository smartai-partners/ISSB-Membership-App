import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import EventRegistration from '../models/EventRegistration';
import Event from '../models/Event';
import User from '../models/User';
import { RegistrationStatus, EventStatus } from '@issb/types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Utility function to check if user is admin or board member
const isAdminOrBoard = (user: any): boolean => {
  return user && (user.role === 'admin' || user.role === 'board');
};

// Utility function to validate ObjectId
const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// @desc    Get all registrations with filters
// @route   GET /api/registrations
// @access  Private (Admin/Board)
export const getAllRegistrations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      eventId,
      userId,
      startDate,
      endDate,
      sortBy = 'registeredAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (eventId && isValidObjectId(eventId as string)) {
      query.eventId = eventId;
    }

    if (userId && isValidObjectId(userId as string)) {
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.registeredAt = {};
      if (startDate) {
        query.registeredAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.registeredAt.$lte = new Date(endDate as string);
      }
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const registrations = await EventRegistration.find(query)
      .populate('eventId', 'title startDate endDate location')
      .populate('userId', 'firstName lastName email')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await EventRegistration.countDocuments(query);

    res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalRecords: total,
          recordsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get registration by ID
// @route   GET /api/registrations/:id
// @access  Private (Own registration or Admin/Board)
export const getRegistrationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration ID'
      });
    }

    const registration = await EventRegistration.findById(id)
      .populate('eventId')
      .populate('userId', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check if user can access this registration
    const canAccess = isAdminOrBoard(req.user) || registration.userId.toString() === req.user?.id;
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this registration'
      });
    }

    res.json({
      success: true,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new registration
// @route   POST /api/registrations
// @access  Private (Authenticated users)
export const createRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.body;

    if (!eventId || !isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid event ID is required'
      });
    }

    // Check if user exists
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is already registered for this event
    const existingRegistration = await EventRegistration.findUserRegistration(req.user.id, eventId);
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'User is already registered for this event'
      });
    }

    // Check if registration is still open
    if (!event.isRegistrationOpen()) {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed for this event'
      });
    }

    // Check capacity
    let registrationStatus = RegistrationStatus.REGISTERED;
    if (event.capacity && event.registeredCount >= event.capacity) {
      registrationStatus = RegistrationStatus.WAITLIST;
    }

    // Create registration
    const registration = new EventRegistration({
      eventId,
      userId: req.user.id,
      status: registrationStatus,
      registeredAt: new Date()
    });

    await registration.save();

    // Update event registered count if user is directly registered (not waitlisted)
    if (registrationStatus === RegistrationStatus.REGISTERED) {
      await event.incrementRegisteredCount();
    }

    // Populate the registration for response
    await registration.populate('eventId', 'title startDate endDate location');
    await registration.populate('userId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: registration,
      message: registrationStatus === RegistrationStatus.WAITLIST 
        ? 'Event is full. You have been added to the waitlist.' 
        : 'Successfully registered for event'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-in attendee
// @route   PUT /api/registrations/:id/checkin
// @access  Private (Admin/Board or Event Organizer)
export const checkInAttendee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration ID'
      });
    }

    const registration = await EventRegistration.findById(id).populate('eventId');
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check authorization
    const isEventOrganizer = (registration.eventId as any).organizerId.toString() === req.user?.id;
    const canCheckIn = isAdminOrBoard(req.user) || isEventOrganizer;
    
    if (!canCheckIn) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check in attendees for this event'
      });
    }

    // Check if registration can be checked in
    if (!registration.canCheckIn()) {
      return res.status(400).json({
        success: false,
        message: 'Registration cannot be checked in at this time'
      });
    }

    // Perform check-in
    await registration.checkIn();

    // Populate for response
    await registration.populate('userId', 'firstName lastName email');

    res.json({
      success: true,
      data: registration,
      message: 'Attendee checked in successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-out attendee
// @route   PUT /api/registrations/:id/checkout
// @access  Private (Admin/Board or Event Organizer)
export const checkOutAttendee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration ID'
      });
    }

    const registration = await EventRegistration.findById(id).populate('eventId');
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check authorization
    const isEventOrganizer = (registration.eventId as any).organizerId.toString() === req.user?.id;
    const canCheckOut = isAdminOrBoard(req.user) || isEventOrganizer;
    
    if (!canCheckOut) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to check out attendees for this event'
      });
    }

    // Check if registration can be checked out
    if (!registration.canCheckOut()) {
      return res.status(400).json({
        success: false,
        message: 'Registration cannot be checked out at this time'
      });
    }

    // Perform check-out
    await registration.checkOut();

    // Populate for response
    await registration.populate('userId', 'firstName lastName email');

    res.json({
      success: true,
      data: registration,
      message: 'Attendee checked out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel registration
// @route   PUT /api/registrations/:id/cancel
// @access  Private (Own registration or Admin/Board)
export const cancelRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration ID'
      });
    }

    const registration = await EventRegistration.findById(id).populate('eventId');
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check if user can cancel this registration
    const canCancel = isAdminOrBoard(req.user) || registration.userId.toString() === req.user?.id;
    
    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this registration'
      });
    }

    // Check if registration can be cancelled
    if (registration.isCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Registration is already cancelled'
      });
    }

    if (registration.hasAttended()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel registration after attendance'
      });
    }

    // Cancel registration
    await registration.cancel();

    // If the user was directly registered (not waitlisted), decrement event count
    if (registration.status === RegistrationStatus.REGISTERED) {
      const event = await Event.findById(registration.eventId);
      if (event) {
        await event.decrementRegisteredCount();
        
        // Check if we can move someone from waitlist to registered
        const waitlistRegistration = await EventRegistration.findOne({
          eventId: event._id,
          status: RegistrationStatus.WAITLIST
        }).sort({ registeredAt: 1 });

        if (waitlistRegistration) {
          waitlistRegistration.status = RegistrationStatus.REGISTERED;
          await waitlistRegistration.save();
          await event.incrementRegisteredCount();
        }
      }
    }

    // Populate for response
    await registration.populate('userId', 'firstName lastName email');

    res.json({
      success: true,
      data: registration,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get registrations for a specific event
// @route   GET /api/registrations/event/:eventId
// @access  Private (Admin/Board or Event Organizer)
export const getEventRegistrations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 50 } = req.query;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    // Check if event exists and user has permission
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check authorization
    const isEventOrganizer = event.organizerId.toString() === req.user?.id;
    const canView = isAdminOrBoard(req.user) || isEventOrganizer;
    
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view registrations for this event'
      });
    }

    // Build query
    const query: any = { eventId };
    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const registrations = await EventRegistration.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await EventRegistration.countDocuments(query);

    res.json({
      success: true,
      data: {
        event: {
          _id: event._id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          capacity: event.capacity,
          registeredCount: event.registeredCount
        },
        registrations,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalRecords: total,
          recordsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get registrations for a specific user
// @route   GET /api/registrations/user/:userId
// @access  Private (Own registrations or Admin/Board)
export const getUserRegistrations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { status, upcoming, past } = req.query;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Check authorization
    const canView = isAdminOrBoard(req.user) || userId === req.user?.id;
    
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view registrations for this user'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build query
    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    // Filter by upcoming/past events
    if (upcoming === 'true') {
      query['eventId.startDate'] = { $gt: new Date() };
    } else if (past === 'true') {
      query['eventId.endDate'] = { $lt: new Date() };
    }

    const registrations = await EventRegistration.find(query)
      .populate('eventId', 'title startDate endDate location type tier')
      .sort({ 'eventId.startDate': 1 });

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        registrations
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get registration statistics for an event
// @route   GET /api/registrations/stats/:eventId
// @access  Private (Admin/Board or Event Organizer)
export const getEventRegistrationStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;

    if (!isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID'
      });
    }

    // Check if event exists and user has permission
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check authorization
    const isEventOrganizer = event.organizerId.toString() === req.user?.id;
    const canView = isAdminOrBoard(req.user) || isEventOrganizer;
    
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view statistics for this event'
      });
    }

    // Get comprehensive statistics
    const stats = await EventRegistration.aggregate([
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
          statusBreakdown: {
            $push: {
              status: '$_id',
              count: '$count',
              percentage: {
                $round: [
                  { $multiply: [{ $divide: ['$count', { $sum: '$count' }] }, 100] },
                  2
                ]
              }
            }
          }
        }
      }
    ]);

    // Get attendance statistics
    const attendanceStats = await EventRegistration.aggregate([
      { 
        $match: { 
          eventId: new mongoose.Types.ObjectId(eventId),
          'attendance.attended': true
        } 
      },
      {
        $group: {
          _id: null,
          totalAttendees: { $sum: 1 },
          averageStay: {
            $avg: {
              $divide: [
                { $subtract: ['$attendance.checkOutTime', '$attendance.checkInTime'] },
                60000 // Convert to minutes
              ]
            }
          }
        }
      }
    ]);

    // Get registration trend (registrations per day)
    const registrationTrend = await EventRegistration.aggregate([
      { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$registeredAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    const baseStats = stats[0] || { total: 0, statusBreakdown: [] };
    const attendance = attendanceStats[0] || { totalAttendees: 0, averageStay: 0 };

    res.json({
      success: true,
      data: {
        event: {
          _id: event._id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          capacity: event.capacity,
          registeredCount: event.registeredCount,
          remainingCapacity: event.remainingCapacity
        },
        overview: {
          totalRegistrations: baseStats.total,
          statusBreakdown: baseStats.statusBreakdown,
          attendanceRate: baseStats.total > 0 
            ? Math.round((attendance.totalAttendees / baseStats.total) * 100 * 100) / 100 
            : 0
        },
        attendance: {
          totalAttendees: attendance.totalAttendees,
          averageStayMinutes: Math.round(attendance.averageStay || 0)
        },
        registrationTrend,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark attendee as no-show
// @route   PUT /api/registrations/:id/no-show
// @access  Private (Admin/Board or Event Organizer)
export const markAsNoShow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration ID'
      });
    }

    const registration = await EventRegistration.findById(id).populate('eventId');
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check authorization
    const isEventOrganizer = (registration.eventId as any).organizerId.toString() === req.user?.id;
    const canMark = isAdminOrBoard(req.user) || isEventOrganizer;
    
    if (!canMark) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark attendees as no-show for this event'
      });
    }

    // Mark as no-show
    await registration.markAsNoShow();

    // Populate for response
    await registration.populate('userId', 'firstName lastName email');

    res.json({
      success: true,
      data: registration,
      message: 'Attendee marked as no-show'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllRegistrations,
  getRegistrationById,
  createRegistration,
  checkInAttendee,
  checkOutAttendee,
  cancelRegistration,
  getEventRegistrations,
  getUserRegistrations,
  getEventRegistrationStats,
  markAsNoShow
};
