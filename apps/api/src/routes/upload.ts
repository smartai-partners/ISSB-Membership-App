import express from 'express';
import multer from 'multer';
import path from 'path';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter function
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf,doc,docx').split(',');
  const fileExt = path.extname(file.originalname).toLowerCase().slice(1);
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type .${fileExt} is not allowed`, 400));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 5, // Maximum 5 files per request
  },
});

// @route   POST /api/v1/upload/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', authenticate, upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }
  
  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`,
    },
    timestamp: new Date().toISOString(),
  });
}));

// @route   POST /api/v1/upload/documents
// @desc    Upload user documents
// @access  Private
router.post('/documents', authenticate, upload.array('documents', 5), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError('No files uploaded', 400);
  }
  
  const files = req.files as Express.Multer.File[];
  
  res.json({
    success: true,
    message: `${files.length} documents uploaded successfully`,
    data: {
      files: files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
        url: `/uploads/${file.filename}`,
      })),
    },
    timestamp: new Date().toISOString(),
  });
}));

// @route   DELETE /api/v1/upload/:filename
// @desc    Delete uploaded file
// @access  Private
router.delete('/:filename', authenticate, asyncHandler(async (req, res) => {
  const fs = require('fs');
  const filePath = path.join(process.env.UPLOAD_DIR || './uploads', req.params.filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'File deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } else {
    throw new AppError('File not found', 404);
  }
}));

// Error handling middleware for multer
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        maxSize: process.env.MAX_FILE_SIZE || '10MB',
        timestamp: new Date().toISOString(),
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        maxFiles: 5,
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  next(error);
});

export default router;