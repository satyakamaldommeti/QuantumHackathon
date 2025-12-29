const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

/**
 * POST /api/emergency/send-alert
 * Send emergency alert emails to multiple contacts
 */
router.post('/send-alert', async (req, res) => {
    try {
        const { contacts, message, senderName, senderEmail, location } = req.body;

        // Validation
        if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No contacts provided. Please add emergency contacts first.',
            });
        }

        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Emergency message is required',
            });
        }

        if (!senderName || !senderEmail) {
            return res.status(400).json({
                success: false,
                error: 'Sender information is required',
            });
        }

        // Extract email addresses from contacts
        const recipients = contacts.map(contact => contact.email).filter(Boolean);

        if (recipients.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid email addresses found in contacts',
            });
        }

        console.log(`📧 Sending emergency alert to ${recipients.length} recipient(s)...`);

        // Send emergency email
        const result = await emailService.sendEmergencyAlert({
            recipients,
            senderName,
            senderEmail,
            message,
            location,
        });

        res.json({
            success: true,
            message: `Emergency alert sent successfully to ${recipients.length} contact(s)`,
            data: result,
        });

    } catch (error) {
        console.error('Error sending emergency alert:', error);

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send emergency alert',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});

/**
 * GET /api/emergency/verify
 * Verify email service configuration
 */
router.get('/verify', async (req, res) => {
    try {
        const isConfigured = await emailService.verifyConnection();

        res.json({
            success: true,
            configured: isConfigured,
            message: isConfigured
                ? 'Email service is properly configured'
                : 'Email service is not configured. Please check environment variables.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to verify email service',
            details: error.message,
        });
    }
});

/**
 * POST /api/emergency/test
 * Send a test email (for development/testing)
 */
router.post('/test', async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email address is required for testing',
            });
        }

        const result = await emailService.sendEmergencyAlert({
            recipients: [email],
            senderName: name || 'Test User',
            senderEmail: email,
            message: 'This is a test emergency alert from AidSpeak. If you receive this, the email service is working correctly!',
            location: 'https://maps.google.com/?q=37.7749,-122.4194',
        });

        res.json({
            success: true,
            message: 'Test email sent successfully',
            data: result,
        });

    } catch (error) {
        console.error('Error sending test email:', error);

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send test email',
        });
    }
});

module.exports = router;
