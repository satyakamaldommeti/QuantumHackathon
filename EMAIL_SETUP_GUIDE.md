# Email Service Configuration Guide

This guide will help you configure the email service for sending emergency alerts in AidSpeak.

## Overview

The emergency email service uses **Nodemailer** to send professional HTML emails to emergency contacts. It supports multiple email providers including Gmail, Outlook, and custom SMTP servers.

## Configuration Steps

### 1. Choose Your Email Provider

#### Option A: Gmail (Recommended for Testing)

1. **Create or use an existing Gmail account**
2. **Enable 2-Factor Authentication** (if not already enabled)
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

3. **Generate an App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "AidSpeak Emergency"
   - Copy the 16-character password (remove spaces)

4. **Add to `.env` file in the `server` directory:**
   ```env
   # Email Service Configuration
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

#### Option B: Outlook/Hotmail

1. **Use your Outlook/Hotmail account**
2. **Add to `.env` file:**
   ```env
   # Email Service Configuration
   EMAIL_SERVICE=outlook
   EMAIL_USER=your-email@outlook.com
   EMAIL_PASSWORD=your-outlook-password
   ```

#### Option C: Custom SMTP Server

For other email providers or custom SMTP servers:

```env
# Email Service Configuration
EMAIL_SERVICE=custom
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
```

### 2. Update Your `.env` File

Your complete `.env` file should look like this:

```env
# MongoDB Configuration
MONGODB_URI=your-mongodb-connection-string

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Email Service Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Restart the Server

After updating the `.env` file, restart your server:

```bash
cd server
npm start
```

You should see:
```
✅ Email service initialized with gmail
```

## Testing the Email Service

### Method 1: Using the API Directly

Test the email service with a simple API call:

```bash
curl -X POST http://localhost:3001/api/emergency/test \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@example.com",
    "name": "Test User"
  }'
```

### Method 2: Using the Emergency Page

1. Log in to AidSpeak
2. Go to the Emergency Page
3. Add an emergency contact with your email
4. Click "SEND SOS" button
5. Check your email inbox (and spam folder)

### Method 3: Verify Configuration

Check if the email service is properly configured:

```bash
curl http://localhost:3001/api/emergency/verify
```

## Email Features

### What Gets Sent

When an emergency alert is triggered, recipients receive:

1. **Professional HTML Email** with:
   - 🚨 Emergency header with urgent styling
   - Custom emergency message
   - Sender's name and email
   - Timestamp of the alert
   - 📍 Google Maps link to sender's location
   - Warning to contact immediately

2. **Plain Text Version** for email clients that don't support HTML

3. **High Priority** flags to ensure the email stands out

### Email Template Preview

```
🚨 EMERGENCY ALERT

Emergency Message:
[Your custom message]

Contact Information:
- From: John Doe
- Email: john@example.com
- Time: Sunday, December 29, 2025 at 1:35:08 AM

📍 View Location on Google Maps
[Button with link to exact GPS coordinates]

⚠️ Important: This is an automated emergency alert.
Please contact John Doe immediately or call emergency services if needed.
```

## Troubleshooting

### Issue: "Email service not configured"

**Solution:** Make sure you have set `EMAIL_USER` and `EMAIL_PASSWORD` in your `.env` file.

### Issue: "Invalid login" or "Authentication failed"

**For Gmail:**
- Make sure you're using an **App Password**, not your regular Gmail password
- Verify 2-Factor Authentication is enabled
- Check that the App Password has no spaces

**For Outlook:**
- Try enabling "Less secure app access" in your account settings
- Or use an app-specific password if available

### Issue: Emails going to spam

**Solution:**
- Ask recipients to add your email to their contacts
- The email service marks messages as "High Priority" which helps
- Some email providers may initially flag automated emails as spam

### Issue: "Geolocation not available"

**Solution:**
- The app will use fallback coordinates if GPS is unavailable
- Make sure you're accessing the app via HTTPS (required for geolocation)
- Grant location permissions when prompted by the browser

## Security Best Practices

1. **Never commit `.env` file to version control** - It's already in `.gitignore`
2. **Use App Passwords** instead of your main email password
3. **Rotate passwords** periodically
4. **Limit access** to the `.env` file on your server
5. **Use environment-specific** configurations for development/production

## API Endpoints

### Send Emergency Alert
```
POST /api/emergency/send-alert
```

**Request Body:**
```json
{
  "contacts": [
    { "name": "John Doe", "email": "john@example.com", "relation": "Spouse" }
  ],
  "message": "HELP! I am experiencing a medical emergency...",
  "senderName": "Jane Smith",
  "senderEmail": "jane@example.com",
  "location": "https://maps.google.com/?q=37.7749,-122.4194"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Emergency alert sent successfully to 1 contact(s)",
  "data": {
    "messageId": "<unique-message-id>",
    "recipients": 1,
    "timestamp": "2025-12-29T01:35:08.000Z"
  }
}
```

### Verify Email Configuration
```
GET /api/emergency/verify
```

**Response:**
```json
{
  "success": true,
  "configured": true,
  "message": "Email service is properly configured"
}
```

### Send Test Email
```
POST /api/emergency/test
```

**Request Body:**
```json
{
  "email": "test@example.com",
  "name": "Test User"
}
```

## Production Deployment

For production environments:

1. **Use a dedicated email service** like:
   - SendGrid
   - AWS SES (Simple Email Service)
   - Mailgun
   - Postmark

2. **Update environment variables** on your hosting platform

3. **Set up SPF and DKIM records** for better email deliverability

4. **Monitor email sending** and set up alerts for failures

5. **Implement rate limiting** to prevent abuse

## Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with the `/api/emergency/verify` endpoint
4. Send a test email to yourself first

---

**Note:** This email service is designed for emergency alerts. Please use responsibly and ensure all recipients have consented to receive emergency notifications.
