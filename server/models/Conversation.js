const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const conversationSchema = new mongoose.Schema({
    userId: {
        type: String,
        default: 'anonymous'
    },
    messages: [messageSchema],
    preview: {
        type: String,
        default: 'New Conversation'
    },
    isEmergency: {
        type: Boolean,
        default: false
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

// Update preview when messages are added
// Update preview when messages are added
conversationSchema.pre('save', async function () {
    if (this.isModified('messages') && this.messages && this.messages.length > 0) {
        const firstUserMessage = this.messages.find(msg => msg.role === 'user');
        if (firstUserMessage) {
            this.preview = firstUserMessage.content.substring(0, 100) + (firstUserMessage.content.length > 100 ? '...' : '');
        }
    }
});

module.exports = mongoose.model('Conversation', conversationSchema);
