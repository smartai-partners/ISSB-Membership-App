import express from 'express';
import { authenticate, authorize, checkOwnership } from '../middleware/auth';
import MembershipController from '../controllers/MembershipController';

const router = express.Router();

// Apply authentication to all membership routes
router.use(authenticate);

// @route   GET /api/membership
// @desc    Get all memberships with pagination and filtering
// @access  Private (Admin/Board only)
router.get('/', 
  authorize('admin', 'board'), 
  MembershipController.getAllMemberships
);

// @route   GET /api/membership/expiring
// @desc    Get memberships expiring within specified days
// @access  Private (Admin/Board only)
router.get('/expiring', 
  authorize('admin', 'board'), 
  MembershipController.getExpiringMemberships
);

// @route   GET /api/membership/stats
// @desc    Get membership statistics
// @access  Private (Admin/Board only)
router.get('/stats', 
  authorize('admin', 'board'), 
  MembershipController.getMembershipStats
);

// @route   GET /api/membership/:id
// @desc    Get membership by ID
// @access  Private (Admin/Board or membership owner)
router.get('/:id', 
  MembershipController.getMembershipById
);

// @route   POST /api/membership
// @desc    Create a new membership
// @access  Private (Admin/Board only)
router.post('/', 
  authorize('admin', 'board'), 
  MembershipController.createMembership
);

// @route   PUT /api/membership/:id
// @desc    Update membership
// @access  Private (Admin/Board only)
router.put('/:id', 
  authorize('admin', 'board'), 
  MembershipController.updateMembership
);

// @route   DELETE /api/membership/:id
// @desc    Cancel membership
// @access  Private (Admin/Board only)
router.delete('/:id', 
  authorize('admin', 'board'), 
  MembershipController.cancelMembership
);

// @route   GET /api/membership/user/:userId
// @desc    Get user's membership
// @access  Private (Admin/Board or the user themselves)
router.get('/user/:userId', 
  checkOwnership('userId'),
  MembershipController.getUserMembership
);

// @route   POST /api/membership/:id/renew
// @desc    Renew membership
// @access  Private (Admin/Board or membership owner)
router.post('/:id/renew', 
  MembershipController.renewMembership
);

export default router;