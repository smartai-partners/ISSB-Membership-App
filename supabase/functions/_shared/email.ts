// Email Service
// Purpose: Send transactional emails using Resend API

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

export class EmailService {
  private apiKey: string;
  private baseUrl = 'https://api.resend.com';
  private defaultFrom: string;

  constructor() {
    this.apiKey = Deno.env.get('RESEND_API_KEY') || '';
    this.defaultFrom = Deno.env.get('EMAIL_FROM') || 'ISSB Membership <noreply@issb.org>';

    if (!this.apiKey) {
      console.warn('RESEND_API_KEY not set - emails will not be sent');
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey) {
      console.error('Cannot send email: RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: options.from || this.defaultFrom,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          ...(options.replyTo && { reply_to: options.replyTo }),
          ...(options.cc && { cc: Array.isArray(options.cc) ? options.cc : [options.cc] }),
          ...(options.bcc && { bcc: Array.isArray(options.bcc) ? options.bcc : [options.bcc] }),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Email send failed:', error);
        return { success: false, error };
      }

      const result = await response.json();
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Template: Welcome Email
  welcomeEmail(userName: string, userEmail: string): EmailTemplate {
    return {
      subject: 'Welcome to ISSB - Islamic Society of San Bernardino',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ISSB!</h1>
            </div>
            <div class="content">
              <p>Dear ${userName},</p>

              <p>As-salamu alaykum! Welcome to the Islamic Society of San Bernardino (ISSB) community portal.</p>

              <p>We're excited to have you join our community. Your account has been successfully created, and you now have access to:</p>

              <ul>
                <li>Event registration and calendar</li>
                <li>Photo galleries from community events</li>
                <li>Volunteer opportunities</li>
                <li>Donation and membership management</li>
                <li>Community announcements</li>
              </ul>

              <p>Get started by exploring our upcoming events and activities:</p>

              <a href="${Deno.env.get('FRONTEND_URL')}/events" class="button">Browse Events</a>

              <p>If you have any questions or need assistance, please don't hesitate to reach out to us.</p>

              <p>Jazakum Allahu khairan,<br>
              The ISSB Team</p>
            </div>
            <div class="footer">
              <p>Islamic Society of San Bernardino<br>
              This email was sent to ${userEmail}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Template: Event Registration Confirmation
  eventRegistrationEmail(userName: string, eventTitle: string, eventDate: string, eventLocation: string): EmailTemplate {
    return {
      subject: `Event Registration Confirmed - ${eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .event-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16a34a; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Registration Confirmed</h1>
            </div>
            <div class="content">
              <p>Dear ${userName},</p>

              <p>Your registration for the following event has been confirmed:</p>

              <div class="event-details">
                <h2 style="margin-top: 0; color: #16a34a;">${eventTitle}</h2>
                <p><strong>Date:</strong> ${eventDate}</p>
                <p><strong>Location:</strong> ${eventLocation}</p>
              </div>

              <p>We look forward to seeing you there! If you need to cancel your registration, you can do so from your account dashboard.</p>

              <a href="${Deno.env.get('FRONTEND_URL')}/events" class="button">View Event Details</a>

              <p>Jazakum Allahu khairan,<br>
              The ISSB Events Team</p>
            </div>
            <div class="footer">
              <p>Islamic Society of San Bernardino<br>
              Need to cancel? Visit your account dashboard</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Template: Payment Success
  paymentSuccessEmail(userName: string, amount: number, currency: string, description: string, receiptUrl?: string): EmailTemplate {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);

    return {
      subject: 'Payment Received - Thank You!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .payment-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .amount { font-size: 32px; font-weight: bold; color: #16a34a; margin: 10px 0; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received</h1>
            </div>
            <div class="content">
              <p>Dear ${userName},</p>

              <p>Thank you for your payment. We have successfully received:</p>

              <div class="payment-details">
                <div class="amount">${formattedAmount}</div>
                <p><strong>For:</strong> ${description}</p>
                <p style="color: #6b7280; font-size: 14px;">This payment has been processed successfully.</p>
              </div>

              ${receiptUrl ? `<a href="${receiptUrl}" class="button">Download Receipt</a>` : ''}

              <p>Your support helps us continue serving the community. May Allah accept your contribution and bless you abundantly.</p>

              <p>Jazakum Allahu khairan,<br>
              The ISSB Team</p>
            </div>
            <div class="footer">
              <p>Islamic Society of San Bernardino<br>
              Questions? Contact us at finance@issb.org</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Template: Monthly Report Ready
  reportReadyEmail(userName: string, reportType: string, downloadUrl: string): EmailTemplate {
    return {
      subject: 'Your Monthly Report is Ready',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Report Ready</h1>
            </div>
            <div class="content">
              <p>Dear ${userName},</p>

              <p>Your ${reportType} report has been generated and is ready for download.</p>

              <a href="${downloadUrl}" class="button">Download Report</a>

              <p><small>This download link will expire in 7 days.</small></p>

              <p>Best regards,<br>
              The ISSB Team</p>
            </div>
            <div class="footer">
              <p>Islamic Society of San Bernardino</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Template: Volunteer Hours Approved
  volunteerHoursApprovedEmail(userName: string, hours: number, description: string): EmailTemplate {
    return {
      subject: 'Volunteer Hours Approved',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .hours-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; border: 2px solid #16a34a; }
            .hours { font-size: 48px; font-weight: bold; color: #16a34a; }
            .button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Volunteer Hours Approved!</h1>
            </div>
            <div class="content">
              <p>Dear ${userName},</p>

              <p>Great news! Your volunteer hours have been approved.</p>

              <div class="hours-box">
                <div class="hours">${hours}</div>
                <p style="margin: 0;">Hours Approved</p>
              </div>

              <p><strong>Activity:</strong> ${description}</p>

              <p>Thank you for your dedication and service to the community. Your contribution makes a real difference!</p>

              <a href="${Deno.env.get('FRONTEND_URL')}/volunteer" class="button">View Your Progress</a>

              <p>Jazakum Allahu khairan,<br>
              The ISSB Volunteer Team</p>
            </div>
            <div class="footer">
              <p>Islamic Society of San Bernardino</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }
}

// Export singleton instance
export const getEmailService = () => new EmailService();
