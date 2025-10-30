import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import ApplicationController from '../controllers/ApplicationController';
import { UserRole } from '@issb/types';

const router = express.Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// @route   POST /api/applications
// @desc    Create a new membership application
// @access  Public
router.post('/', ApplicationController.createApplication);

// ============================================================================
// AUTHENTICATED USER ROUTES
// ============================================================================

// @route   GET /api/applications/my-applications
// @desc    Get user's applications
// @access  Private
router.get('/my-applications', authenticate, ApplicationController.getMyApplications);

// @route   GET /api/applications/:id
// @desc    Get application by ID
// @access  Private (Owner or Admin/Board)
router.get('/:id', authenticate, ApplicationController.getApplicationById);

// @route   PUT /api/applications/:id
// @desc    Update application
// @access  Private (Owner or Admin/Board)
router.put('/:id', authenticate, ApplicationController.updateApplication);

// @route   POST /api/applications/:id/submit
// @desc    Submit application
// @access  Private (Owner only)
router.post('/:id/submit', authenticate, ApplicationController.submitApplication);

// ============================================================================
// ADMIN/BOARD ONLY ROUTES
// ============================================================================

// @route   GET /api/applications
// @desc    List all applications with filters
// @access  Private (Admin/Board only)
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.BOARD),
  ApplicationController.listApplications
);

// @route   GET /api/applications/stats
// @desc    Get application statistics
// @access  Private (Admin/Board only)
router.get(
  '/stats',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.BOARD),
  ApplicationController.getApplicationStats
);

// @route   POST /api/applications/:id/review
// @desc    Start application review
// @access  Private (Admin/Board only)
router.post(
  '/:id/review',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.BOARD),
  ApplicationController.startReview
);

// @route   PUT /api/applications/:id/approve
// @desc    Approve application
// @access  Private (Admin/Board only)
router.put(
  '/:id/approve',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.BOARD),
  ApplicationController.approveApplication
);

// @route   PUT /api/applications/:id/reject
// @desc    Reject application
// @access  Private (Admin/Board only)
router.put(
  '/:id/reject',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.BOARD),
  ApplicationController.rejectApplication
);

export default router;