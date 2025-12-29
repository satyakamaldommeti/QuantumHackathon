const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    userId: {
        type: String,
        default: 'anonymous'
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    },
    fileName: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['medical-report', 'prescription', 'insurance', 'id-document', 'other'],
        default: 'other'
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
