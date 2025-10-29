import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

// Email configuration interface
interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

// Email data interface
interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, any>;
}

// Email templates
const emailTemplates = {
  emailVerification: (data: any) => ({
    subject: 'Verify Your Email - ISSB Membership Portal',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0ea5e9;">ISSB Membership Portal</h1>
            <h2>Welcome, ${data.name}!</h2>
            <p>Thank you for registering with the ISSB Membership Portal. To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.verificationUrl}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0ea5e9;">${data.verificationUrl}</p>
            
            <p>This link will expire in 24 hours for security reasons.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              If you didn't create an account with ISSB, please ignore this email.
              <br>
              © 2024 International Society of Sign Language Interpreters. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  passwordReset: (data: any) => ({
    subject: 'Password Reset - ISSB Membership Portal',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0ea5e9;">ISSB Membership Portal</h1>
            <h2>Password Reset Request</h2>
            <p>Hello ${data.name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0ea5e9;">${data.resetUrl}</p>
            
            <p>This link will expire in ${data.expiresIn} for security reasons.</p>
            
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              © 2024 International Society of Sign Language Interpreters. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  welcomeEmail: (data: any) => ({
    subject: 'Welcome to ISSB Membership Portal',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to ISSB</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0ea5e9;">Welcome to ISSB Membership Portal</h1>
            <h2>Hello ${data.name},</h2>
            <p>Welcome to the International Society of Sign Language Interpreters Membership Portal!</p>
            <p>Your account has been successfully created and verified. You now have access to:</p>
            <ul>
              <li>Member directory</li>
              <li>Professional development resources</li>
              <li>Volunteer opportunities</li>
              <li>Event registrations</li>
              <li>And much more!</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Login to Your Account
              </a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              © 2024 International Society of Sign Language Interpreters. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  membershipApproved: (data: any) => ({
    subject: 'Membership Application Approved - ISSB',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Membership Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #22c55e;">Congratulations!</h1>
            <h2>Your ISSB Membership Has Been Approved</h2>
            <p>Dear ${data.name},</p>
            <p>We are pleased to inform you that your membership application has been approved! You are now an official member of the International Society of Sign Language Interpreters.</p>
            
            <h3>Your Membership Details:</h3>
            <ul>
              <li><strong>Membership Tier:</strong> ${data.tier}</li>
              <li><strong>Membership Number:</strong> ${data.membershipNumber}</li>
              <li><strong>Effective Date:</strong> ${data.effectiveDate}</li>
            </ul>
            
            <h3>What happens next?</h3>
            <ul>
              <li>Your account is now fully activated</li>
              <li>You can access all member benefits</li>
              <li>You will receive your membership card by mail</li>
              <li>Your welcome package is being prepared</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Access Your Member Portal
              </a>
            </div>
            
            <p>Thank you for joining ISSB. We look forward to your participation in our community!</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              © 2024 International Society of Sign Language Interpreters. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  }),

  eventRegistration: (data: any) => ({
    subject: `Event Registration Confirmed - ${data.eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Event Registration Confirmed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0ea5e9;">Registration Confirmed!</h1>
            <h2>You're registered for ${data.eventTitle}</h2>
            <p>Dear ${data.name},</p>
            <p>Your registration for the following event has been confirmed:</p>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Event Details:</h3>
              <p><strong>Title:</strong> ${data.eventTitle}</p>
              <p><strong>Date:</strong> ${data.eventDate}</p>
              <p><strong>Time:</strong> ${data.eventTime}</p>
              <p><strong>Location:</strong> ${data.eventLocation}</p>
              ${data.virtualLink ? `<p><strong>Virtual Link:</strong> <a href="${data.virtualLink}">${data.virtualLink}</a></p>` : ''}
            </div>
            
            <h3>What to expect:</h3>
            <p>${data.eventDescription}</p>
            
            <h3>Important Notes:</h3>
            <ul>
              ${data.notes ? `<li>${data.notes}</li>` : ''}
              <li>Please arrive 15 minutes early for in-person events</li>
              <li>You will receive a calendar invitation closer to the event date</li>
              <li>Contact us if you need to cancel your registration</li>
            </ul>
            
            <p>We look forward to seeing you at the event!</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              © 2024 International Society of Sign Language Interpreters. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
  }),
};

// Create transporter based on configuration
const createTransporter = (): nodemailer.Transporter => {
  const emailService = process.env.EMAIL_SERVICE;
  
  switch (emailService) {
    case 'smtp':
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    
    // Add other email service configurations here
    // case 'sendgrid':
    //   return nodemailer.createTransport(sendgridTransport({
    //     auth: {
    //       api_user: process.env.SENDGRID_USERNAME,
    //       api_key: process.env.SENDGRID_PASSWORD,
    //     },
    //   }));
    
    default:
      // Create a mock transporter for development
      return {
        sendMail: async (options: any) => {
          logger.info('Mock email sent:', {
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html ? 'HTML content sent' : 'No HTML content',
          });
          return { messageId: 'mock-message-id' };
        },
      } as nodemailer.Transporter;
  }
};

const transporter = createTransporter();

// Send email function
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    let emailContent = {
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    };

    // Use template if provided
    if (emailData.template && emailData.data) {
      const template = emailTemplates[emailData.template as keyof typeof emailTemplates];
      if (template) {
        emailContent = template(emailData.data);
      }
    }

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'ISSB Membership Portal'} <${process.env.EMAIL_FROM}>`,
      to: emailData.to,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    };

    await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent successfully to ${emailData.to}`, {
      subject: emailContent.subject,
      template: emailData.template,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send email:', {
      to: emailData.to,
      subject: emailData.subject,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return false;
  }
};

// Send bulk emails
export const sendBulkEmails = async (emails: EmailData[]): Promise<{ sent: number; failed: number }> => {
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const success = await sendEmail(email);
    if (success) {
      sent++;
    } else {
      failed++;
    }
    
    // Add delay between emails to avoid rate limiting
    if (emails.length > 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  logger.info(`Bulk email sending completed: ${sent} sent, ${failed} failed`);
  
  return { sent, failed };
};

// Email validation helper
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Test email configuration
export const testEmailConfig = async (): Promise<boolean> => {
  try {
    const testEmail = process.env.EMAIL_TEST_ADDRESS || process.env.EMAIL_USER;
    if (!testEmail) {
      throw new Error('No test email address configured');
    }

    const success = await sendEmail({
      to: testEmail,
      subject: 'Test Email - ISSB Membership Portal',
      html: `
        <h1>Email Configuration Test</h1>
        <p>This is a test email to verify that your email configuration is working correctly.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    });

    return success;
  } catch (error) {
    logger.error('Email configuration test failed:', error);
    return false;
  }
};

export default {
  sendEmail,
  sendBulkEmails,
  validateEmail,
  testEmailConfig,
};