# Emergency Email Implementation - Quick Reference

## ✅ What Was Implemented

### Backend Components

1. **Email Service** (`server/services/emailService.js`)
   - Professional HTML email templates
   - Support for Gmail, Outlook, and custom SMTP
   - Automatic location embedding in emails
   - High-priority email flags

2. **API Routes** (`server/routes/emergency.js`)
   - `POST /api/emergency/send-alert` - Send emergency emails
   - `GET /api/emergency/verify` - Check email configuration
   - `POST /api/emergency/test` - Send test email

3. **Server Integration** (`server/index.js`)
   - Added emergency routes to Express app

### Frontend Components

4. **EmergencyPage Updates** (`src/pages/EmergencyPage.tsx`)
   - Real GPS location fetching
   - API integration for sending emails
   - Improved error handling
   - User feedback via toasts

### Documentation

5. **Setup Guide** (`EMAIL_SETUP_GUIDE.md`)
   - Detailed configuration instructions
   - Troubleshooting guide
   - API reference

6. **Environment Template** (`server/.env.example`)
   - Template for email configuration

## 🚀 Quick Start

### 1. Install Dependencies (Already Done)
```bash
cd server
npm install nodemailer
```

### 2. Configure Email Service

Add to `server/.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**For Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Create new app password for "Mail"
3. Copy the 16-character password (no spaces)

### 3. Restart Server
```bash
cd server
npm start
```

Look for: `✅ Email service initialized with gmail`

### 4. Test the Service

**Option 1: Test Endpoint**
```bash
curl -X POST http://localhost:3001/api/emergency/test \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "name": "Test User"}'
```

**Option 2: Use the App**
1. Go to Emergency Page
2. Add a contact with your email
3. Click "SEND SOS"
4. Check your email

## 📧 Email Features

### What Recipients Receive

- **Professional HTML Email** with:
  - 🚨 Emergency alert header
  - Custom emergency message
  - Sender information
  - Timestamp
  - 📍 Google Maps location link
  - High-priority flags

### Example Email Content

```
🚨 EMERGENCY ALERT - URGENT 🚨

Emergency Message:
HELP! I am experiencing a medical emergency. Please contact me immediately.

Contact Information:
- From: John Doe
- Email: john@example.com
- Time: Sunday, December 29, 2025 at 1:35:08 AM

📍 View Location on Google Maps
[Interactive button with GPS coordinates]

⚠️ This is an automated emergency alert.
Please contact John Doe immediately or call emergency services if needed.
```

## 🔧 API Endpoints

### Send Emergency Alert
```javascript
POST /api/emergency/send-alert

// Request
{
  "contacts": [
    { "name": "John", "email": "john@example.com", "relation": "Spouse" }
  ],
  "message": "Emergency message here",
  "senderName": "Jane Smith",
  "senderEmail": "jane@example.com",
  "location": "https://maps.google.com/?q=37.7749,-122.4194"
}

// Response
{
  "success": true,
  "message": "Emergency alert sent successfully to 1 contact(s)",
  "data": {
    "messageId": "<id>",
    "recipients": 1,
    "timestamp": "2025-12-29T01:35:08.000Z"
  }
}
```

### Verify Configuration
```javascript
GET /api/emergency/verify

// Response
{
  "success": true,
  "configured": true,
  "message": "Email service is properly configured"
}
```

### Send Test Email
```javascript
POST /api/emergency/test

// Request
{
  "email": "test@example.com",
  "name": "Test User"
}
```

## 🐛 Troubleshooting

### "Email service not configured"
- Check `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
- Restart the server

### "Invalid login" (Gmail)
- Use **App Password**, not regular password
- Enable 2-Factor Authentication first
- Remove spaces from app password

### Emails going to spam
- Add sender to contacts
- Check spam folder initially
- Email is marked as high priority

### GPS location not working
- App uses HTTPS for geolocation
- Grant location permissions
- Falls back to default coordinates if unavailable

## 📁 File Structure

```
aidspeak-first-aid/
├── server/
│   ├── services/
│   │   └── emailService.js          # Email service implementation
│   ├── routes/
│   │   └── emergency.js             # Emergency API routes
│   ├── index.js                     # Updated with emergency routes
│   ├── .env                         # Add email config here
│   └── .env.example                 # Template
├── src/
│   └── pages/
│       └── EmergencyPage.tsx        # Updated with email integration
├── EMAIL_SETUP_GUIDE.md             # Detailed documentation
└── EMAIL_QUICK_REFERENCE.md         # This file
```

## ✨ Key Features

1. **Real GPS Location** - Fetches actual device location
2. **Professional Emails** - Beautiful HTML templates
3. **Error Handling** - Comprehensive error messages
4. **Multiple Providers** - Gmail, Outlook, custom SMTP
5. **High Priority** - Emails marked as urgent
6. **Fallback Support** - Works even if GPS fails
7. **User Feedback** - Toast notifications for all actions
8. **Testing Tools** - Built-in test endpoints

## 🔐 Security Notes

- Never commit `.env` file
- Use App Passwords, not main passwords
- Rotate credentials periodically
- Limit `.env` file access
- Use HTTPS in production

## 📞 Next Steps

1. **Configure email credentials** in `server/.env`
2. **Restart the server** to load new configuration
3. **Test with your email** using the test endpoint
4. **Add emergency contacts** in the app
5. **Send a test SOS** to verify everything works

## 💡 Tips

- Test with your own email first
- Check spam folder initially
- Ensure contacts have consented
- Use descriptive emergency messages
- Keep contact list updated

---

For detailed setup instructions, see `EMAIL_SETUP_GUIDE.md`
