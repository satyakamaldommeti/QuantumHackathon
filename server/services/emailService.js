const nodemailer = require('nodemailer');

/**
 * Email Service for sending emergency alerts
 * Supports Gmail, Outlook, and other SMTP services
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment variables
   */
  initializeTransporter() {
    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.warn('⚠️  Email credentials not configured. Email service will not work.');
      console.warn('   Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
      return;
    }

    try {
      // Create transporter based on service
      if (emailService.toLowerCase() === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPassword, // Use App Password for Gmail
          },
        });
      } else if (emailService.toLowerCase() === 'outlook') {
        this.transporter = nodemailer.createTransport({
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          auth: {
            user: emailUser,
            pass: emailPassword,
          },
        });
      } else {
        // Custom SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: emailUser,
            pass: emailPassword,
          },
        });
      }

      console.log(`✅ Email service initialized with ${emailService}`);
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  /**
   * Send emergency alert email to multiple recipients
   * @param {Object} options - Email options
   * @param {Array<string>} options.recipients - Array of recipient email addresses
   * @param {string} options.senderName - Name of the person sending the alert
   * @param {string} options.senderEmail - Email of the person sending the alert
   * @param {string} options.message - Emergency message
   * @param {string} options.location - GPS location URL
   * @returns {Promise<Object>} - Result of email sending operation
   */
  async sendEmergencyAlert({ recipients, senderName, senderEmail, message, location }) {
    if (!this.transporter) {
      throw new Error('Email service not configured. Please check your environment variables.');
    }

    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients specified');
    }

    const emailUser = process.env.EMAIL_USER;
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'long',
    });

    // Create HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 25px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .alert-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .message-box {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9fafb;
            border-radius: 8px;
          }
          .info-row {
            display: flex;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
            width: 120px;
            flex-shrink: 0;
          }
          .info-value {
            color: #111827;
          }
          .location-button {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
          }
          .location-button:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .urgent-badge {
            display: inline-block;
            background-color: #dc2626;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="alert-icon">🚨</div>
            <h1>EMERGENCY ALERT</h1>
            <span class="urgent-badge">Urgent - Immediate Action Required</span>
          </div>

          <div class="message-box">
            <h2 style="margin-top: 0; color: #dc2626;">Emergency Message:</h2>
            <p style="font-size: 16px; margin: 0;">${message}</p>
          </div>

          <div class="info-section">
            <h3 style="margin-top: 0; color: #111827;">Contact Information:</h3>
            <div class="info-row">
              <span class="info-label">From:</span>
              <span class="info-value">${senderName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${senderEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time:</span>
              <span class="info-value">${timestamp}</span>
            </div>
          </div>

          ${location ? `
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-weight: 600; color: #111827; margin-bottom: 15px;">📍 Current Location:</p>
              <a href="${location}" class="location-button" target="_blank">
                View Location on Google Maps
              </a>
              <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">
                Click the button above to see their exact location
              </p>
            </div>
          ` : ''}

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Important:</strong> This is an automated emergency alert. 
              Please contact ${senderName} immediately or call emergency services if needed.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 5px 0;">This email was sent from AidSpeak Emergency Alert System</p>
            <p style="margin: 5px 0;">Please do not reply to this email</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version for email clients that don't support HTML
    const textContent = `
🚨 EMERGENCY ALERT - URGENT 🚨

Emergency Message:
${message}

Contact Information:
- From: ${senderName}
- Email: ${senderEmail}
- Time: ${timestamp}

${location ? `Location: ${location}` : ''}

⚠️ This is an automated emergency alert. Please contact ${senderName} immediately or call emergency services if needed.

---
This email was sent from AidSpeak Emergency Alert System
    `.trim();

    try {
      // Send email to all recipients
      const mailOptions = {
        from: `"AidSpeak Emergency Alert" <${emailUser}>`,
        to: recipients.join(', '),
        subject: `🚨 EMERGENCY ALERT from ${senderName}`,
        text: textContent,
        html: htmlContent,
        priority: 'high',
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
        },
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Emergency email sent successfully to ${recipients.length} recipient(s)`);
      console.log(`   Message ID: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        recipients: recipients.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to send emergency email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Verify email service connection
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service verification failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
