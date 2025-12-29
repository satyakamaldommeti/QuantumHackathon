const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    dateOfBirth: {
        type: String,
        trim: true
    },
    gender: {
        type: String,
        trim: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    emergencyContacts: [{
        name: String,
        email: String,
        relation: String
    }],
    medicalInfo: {
        bloodType: String,
        allergies: [String],
        medications: [String],
        conditions: [String]
    },
    preferences: {
        language: {
            type: String,
            default: 'en'
        },
        notifications: {
            type: Boolean,
            default: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
