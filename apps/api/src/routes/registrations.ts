import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import RegistrationController from '../controllers/RegistrationController';

const router = express.Router();

// Apply authentication to all registration routes
router.use(authenticate);

// @route   GET /api/v1/registrations
// @desc    Get all registrations with filters
// @access  Private (Admin/Board)
router.get('/', asyncHandler(RegistrationController.getAllRegistrations));

// @route   GET /api/v1/registrations/:id
// @desc    Get registration by ID
// @access  Private (Own registration or Admin/Board)
router.get('/:id', asyncHandler(RegistrationController.getRegistrationById));

// @route   POST /api/v1/registrations
// @desc    Create new registration
// @access  Private (Authenticated users)
router.post('/', asyncHandler(RegistrationController.createRegistration));

// @route   PUT /api/v1/registrations/:id/checkin
// @desc    Check-in attendee
// @access  Private (Admin/Board or Event Organizer)
router.put('/:id/checkin', asyncHandler(RegistrationController.checkInAttendee));

// @route   PUT /api/v1/registrations/:id/checkout
// @desc    Check-out attendee
// @access  Private (Admin/Board or Event Organizer)
router.put('/:id/checkout', asyncHandler(RegistrationController.checkOutAttendee));

// @route   PUT /api/v1/registrations/:id/cancel
// @desc    Cancel registration
// @access  Private (Own registration or Admin/Board)
router.put('/:id/cancel', asyncHandler(RegistrationController.cancelRegistration));

// @route   PUT /api/v1/registrations/:id/no-show
// @desc    Mark attendee as no-show
// @access  Private (Admin/Board or Event Organizer)
router.put('/:id/no-show', asyncHandler(RegistrationController.markAsNoShow));

// @route   GET /api/v1/registrations/event/:eventId
// @desc    Get registrations for a specific event
// @access  Private (Admin/Board or Event Organizer)
router.get('/event/:eventId', asyncHandler(RegistrationController.getEventRegistrations));

// @route   GET /api/v1/registrations/user/:userId
// @desc    Get registrations for a specific user
// @access  Private (Own registrations or Admin/Board)
router.get('/user/:userId', asyncHandler(RegistrationController.getUserRegistrations));

// @route   GET /api/v1/registrations/stats/:eventId
// @desc    Get registration statistics for an event
// @access  Private (Admin/Board or Event Organizer)
router.get('/stats/:eventId', asyncHandler(RegistrationController.getEventRegistrationStats));

export default router;
