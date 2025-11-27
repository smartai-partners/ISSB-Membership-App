import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User';
import authRoutes from '../routes/auth';

// Mock email service
jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

describe('Auth Fix Verification', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Registration and Verification Flow', () => {
    it('should register a user with ACTIVE status', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        agreeToTerms: true,
        agreeToPrivacy: true,
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.status).toBe('active'); // Option 2 check

      // Check database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeDefined();
      expect(user!.status).toBe('active');
      expect(user!.verificationToken).toBeDefined();
      expect(user!.verificationTokenExpires).toBeDefined();
    });

    it('should fail to verify email with expired token', async () => {
      // 1. Register
      const userData = {
        email: 'expired@example.com',
        password: 'Password123!',
        firstName: 'Expired',
        lastName: 'User',
        agreeToTerms: true,
        agreeToPrivacy: true,
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Manually expire token
      await User.updateOne(
        { email: userData.email },
        { verificationTokenExpires: new Date(Date.now() - 10000) }
      );

      const user = await User.findOne({ email: userData.email });
      const token = user!.verificationToken;

      // 2. Verify
      const res = await request(app)
        .get(`/api/v1/auth/verify-email/${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Token is invalid or has expired');
    });

    it('should verify email with valid token', async () => {
      // 1. Register
      const userData = {
        email: 'verify@example.com',
        password: 'Password123!',
        firstName: 'Verify',
        lastName: 'User',
        agreeToTerms: true,
        agreeToPrivacy: true,
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      const user = await User.findOne({ email: userData.email });
      const token = user!.verificationToken;
      expect(token).toBeDefined();

      // 2. Verify
      const res = await request(app)
        .get(`/api/v1/auth/verify-email/${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Email verified successfully');

      // 3. Check DB
      const updatedUser = await User.findOne({ email: userData.email });
      expect(updatedUser!.emailVerifiedAt).toBeDefined();
      expect(updatedUser!.verificationToken).toBeUndefined();
    });

    it('should allow login immediately after registration', async () => {
      const userData = {
        email: 'login@example.com',
        password: 'Password123!',
        firstName: 'Login',
        lastName: 'User',
        agreeToTerms: true,
        agreeToPrivacy: true,
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      const loginData = {
        email: userData.email,
        password: userData.password,
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
