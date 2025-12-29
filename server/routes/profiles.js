const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');

// Get user profile
router.get('/:userId', async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ userId: req.params.userId });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Create or update user profile
router.post('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const profileData = req.body;

        const profile = await UserProfile.findOneAndUpdate(
            { userId },
            { ...profileData, userId },
            { upsert: true, new: true }
        );

        res.json(profile);
    } catch (error) {
        console.error('Error saving profile:', error);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// Get emergency contacts for a user
router.get('/:userId/emergency-contacts', async (req, res) => {
    try {
        console.log('GET emergency-contacts for userId:', req.params.userId);
        const profile = await UserProfile.findOne({ userId: req.params.userId });
        console.log('Profile found:', profile ? 'Yes' : 'No');
        if (!profile) {
            console.log('No profile found, returning empty array');
            return res.json({ emergencyContacts: [] });
        }
        console.log('Returning contacts:', profile.emergencyContacts);
        res.json({ emergencyContacts: profile.emergencyContacts || [] });
    } catch (error) {
        console.error('Error fetching emergency contacts:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to fetch emergency contacts', details: error.message });
    }
});

// Add emergency contact
router.post('/:userId/emergency-contacts', async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, relation } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const profile = await UserProfile.findOneAndUpdate(
            { userId },
            {
                $push: {
                    emergencyContacts: { name, email, relation }
                },
                userId
            },
            { upsert: true, new: true }
        );

        res.json({ emergencyContacts: profile.emergencyContacts });
    } catch (error) {
        console.error('Error adding emergency contact:', error);
        res.status(500).json({ error: 'Failed to add emergency contact' });
    }
});

// Delete emergency contact
router.delete('/:userId/emergency-contacts/:contactId', async (req, res) => {
    try {
        const { userId, contactId } = req.params;

        const profile = await UserProfile.findOneAndUpdate(
            { userId },
            {
                $pull: {
                    emergencyContacts: { _id: contactId }
                }
            },
            { new: true }
        );

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({ emergencyContacts: profile.emergencyContacts });
    } catch (error) {
        console.error('Error deleting emergency contact:', error);
        res.status(500).json({ error: 'Failed to delete emergency contact' });
    }
});

module.exports = router;
