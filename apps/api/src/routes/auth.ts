import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User';
import { 
  authenticate, 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  sensitiveOperationLimit,
} from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { logger, logAuth } from '../config/logger';
import { sendEmail } from '../services/emailService';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot be more than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name cannot be more than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name cannot be more than 50 characters'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
  agreeToPrivacy: z.boolean().refine(val => val === true, 'You must agree to the privacy policy'),
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot be more than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot be more than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
  // Validate input
  const validatedData = registerSchema.parse(req.body);
  
  // Check if user already exists
  const existingUser = await User.findByEmail(validatedData.email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Create user
  const user = await User.create({
    email: validatedData.email,
    password: validatedData.password,
    firstName: validatedData.firstName,
    lastName: validatedData.lastName,
    phone: validatedData.phone,
    dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
    status: 'active', // Option 2: Auto-activate user
  });
  
  // Send verification email (if email service is configured)
  try {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    user.emailVerifiedAt = undefined; // Will be set when email is verified
    await user.save();
    
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - ISSB Membership Portal',
      template: 'emailVerification',
      data: {
        name: user.fullName,
        verificationToken,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`,
      },
    });
    
    logger.info(`Verification email sent to ${user.email}`);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
  }
  
  // Generate tokens
  const token = generateToken({ 
    id: user._id, 
    email: user.email, 
    role: user.role,
    tier: user.tier 
  });
  
  const refreshToken = generateRefreshToken({ 
    id: user._id, 
    email: user.email 
  });
  
  // Store refresh token
  user.refreshTokens.push({ token: refreshToken });
  await user.save({ validateBeforeSave: false });
  
  logAuth('User registration successful', true, user._id.toString(), user.email, req.ip, req.get('User-Agent'));
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email to verify your account.',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tier: user.tier,
        status: user.status,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    },
    timestamp: new Date().toISOString(),
  });
}));

// @route   POST /api/v1/auth/login
// @desc    Login user
// @access  Public
router.post('/login', sensitiveOperationLimit(5, 15 * 60 * 1000), asyncHandler(async (req, res) => {
  // Validate input
  const validatedData = loginSchema.parse(req.body);
  
  // Check if user exists and select password field
  const user = await User.findByEmail(validatedData.email).select('+password');
  if (!user) {
    logAuth('Login failed - user not found', false, undefined, validatedData.email, req.ip, req.get('User-Agent'));
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Check if account is locked
  if (user.isLocked) {
    logAuth('Login attempt on locked account', false, user._id.toString(), user.email, req.ip, req.get('User-Agent'));
    return res.status(423).json({
      success: false,
      message: 'Account is temporarily locked due to too many failed login attempts',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Check password
  const isPasswordValid = await user.comparePassword(validatedData.password);
  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    logAuth('Login failed - invalid password', false, user._id.toString(), user.email, req.ip, req.get('User-Agent'));
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Check if user is active
  if (user.status !== 'active') {
    logAuth('Login attempt with inactive account', false, user._id.toString(), user.email, req.ip, req.get('User-Agent'));
    return res.status(401).json({
      success: false,
      message: 'Account is not active. Please contact support.',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  // Update last login
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  
  // Generate tokens
  const token = generateToken({ 
    id: user._id, 
    email: user.email, 
    role: user.role,
    tier: user.tier 
  });
  
  const refreshToken = generateRefreshToken({ 
    id: user._id, 
    email: user.email 
  });
  
  // Store refresh token
  user.refreshTokens.push({ token: refreshToken });
  await user.save({ validateBeforeSave: false });
  
  logAuth('Login successful', true, user._id.toString(), user.email, req.ip, req.get('User-Agent'));
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tier: user.tier,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      token,
      refreshToken,
    },
    timestamp: new Date().toISOString(),
  });
}));

// @route   POST /api/v1/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required',
      timestamp: new Date().toISOString(),
    });
  }
  
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Check if refresh token exists in user's refresh tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Generate new tokens
    const newToken = generateToken({ 
      id: user._id, 
      email: user.email, 
      role: user.role,
      tier: user.tier 
    });
    
    const newRefreshToken = generateRefreshToken({ 
      id: user._id, 
      email: user.email 
    });
    
    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save({ validateBeforeSave: false });
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      timestamp: new Date().toISOString(),
    });
  }
}));

// @route   POST /api/v1/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.id);
  
  if (user) {
    // Remove current refresh token
    const { refreshToken } = req.body;
    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    }
    
    await user.save({ validateBeforeSave: false });
  }
  
  logAuth('Logout successful', true, req.user!.id, req.user!.email, req.ip, req.get('User-Agent'));
  
  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString(),
  });
}));

// @route   POST /api/v1/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', sensitiveOperationLimit(3, 15 * 60 * 1000), asyncHandler(async (req, res) => {
  const validatedData = forgotPasswordSchema.parse(req.body);
  
  const user = await User.findByEmail(validatedData.email);
  if (!user) {
    // Don't reveal whether user exists or not for security
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  
  try {
    // TODO: Send password reset email
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Password Reset - ISSB Membership Portal',
    //   template: 'passwordReset',
    //   data: {
    //     name: user.fullName,
    //     resetToken,
    //     resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`,
    //     expiresIn: '10 minutes',
    //   },
    // });
    
    logger.info(`Password reset email would be sent to ${user.email}`);
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    throw new AppError('Could not send email, please try again later', 500);
  }
  
  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent',
    timestamp: new Date().toISOString(),
  });
}));

// @route   POST /api/v1/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', asyncHandler(async (req, res) => {
  const validatedData = resetPasswordSchema.parse(req.body);
  
  // Hash the token to compare with database
  const hashedToken = crypto
    .createHash('sha256')
    .update(validatedData.token)
    .digest('hex');
  
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Token is invalid or has expired',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Set new password
  user.password = validatedData.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = new Date();
  
  // Clear all refresh tokens
  user.refreshTokens = [];
  
  await user.save();
  
  logAuth('Password reset successful', true, user._id.toString(), user.email, req.ip, req.get('User-Agent'));
  
  res.json({
    success: true,
    message: 'Password has been reset successfully',
    timestamp: new Date().toISOString(),
  });
}));

// @route   POST /api/v1/auth/change-password
// @desc    Change password for authenticated user
// @access  Private
router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
  const validatedData = changePasswordSchema.parse(req.body);
  
  const user = await User.findById(req.user!.id).select('+password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(validatedData.currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Update password
  user.password = validatedData.newPassword;
  user.passwordChangedAt = new Date();
  
  // Clear all refresh tokens to force re-login
  user.refreshTokens = [];
  
  await user.save();
  
  logAuth('Password change successful', true, user._id.toString(), user.email, req.ip, req.get('User-Agent'));
  
  res.json({
    success: true,
    message: 'Password has been changed successfully',
    timestamp: new Date().toISOString(),
  });
}));

// @route   GET /api/v1/auth/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Token is invalid or has expired',
      timestamp: new Date().toISOString(),
    });
  }

  // Verify email
  user.emailVerifiedAt = new Date();
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });

  logAuth('Email verification successful', true, user._id.toString(), user.email, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    message: 'Email verified successfully',
    timestamp: new Date().toISOString(),
  });
}));

// @route   GET /api/v1/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
      timestamp: new Date().toISOString(),
    });
  }
  
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        tier: user.tier,
        status: user.status,
        avatar: user.avatar,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        emailVerifiedAt: user.emailVerifiedAt,
        lastLoginAt: user.lastLoginAt,
        profile: user.profile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    },
    timestamp: new Date().toISOString(),
  });
}));

export default router;