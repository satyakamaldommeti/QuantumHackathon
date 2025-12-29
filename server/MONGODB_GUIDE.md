# MongoDB Integration Guide

## Overview
This application now uses MongoDB to store:
- **Chat History**: All conversations with messages and timestamps
- **Feedback**: User feedback with ratings and comments
- **User Profiles**: User information and medical data
- **Documents**: Uploaded files (PDFs, images, etc.)

## Database Connection
The MongoDB connection string is stored in the `.env` file:
```env
MONGODB_URI=mongodb+srv://prashanth:prashanth@cluster0.mcuwliu.mongodb.net/?appName=Cluster0
```

## API Endpoints

### Conversations
- `GET /api/conversations` - Get all conversations for a user
- `GET /api/conversations/:id` - Get a specific conversation with all messages
- `POST /api/conversations` - Create a new conversation
- `POST /api/conversations/:id/messages` - Add a message to a conversation
- `DELETE /api/conversations/:id` - Delete a conversation

### Feedback
- `GET /api/feedback` - Get all feedback (optional query params: userId, conversationId)
- `POST /api/feedback` - Submit feedback

### User Profiles
- `GET /api/profiles/:userId` - Get user profile
- `POST /api/profiles/:userId` - Create or update user profile

### Documents
- `POST /api/documents/upload` - Upload a document (multipart/form-data)
- `GET /api/documents` - Get all documents (optional query params: userId, conversationId)
- `DELETE /api/documents/:id` - Delete a document

## Usage Examples

### Save a Conversation
```javascript
const response = await fetch('http://localhost:3001/api/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    messages: [
      { role: 'user', content: 'I have a headache' },
      { role: 'assistant', content: 'I can help with that...' }
    ],
    isEmergency: false
  })
});
```

### Submit Feedback
```javascript
const response = await fetch('http://localhost:3001/api/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: '507f1f77bcf86cd799439011',
    rating: 5,
    comment: 'Very helpful!',
    category: 'helpful'
  })
});
```

### Upload a Document
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('userId', 'user123');
formData.append('category', 'medical-report');

const response = await fetch('http://localhost:3001/api/documents/upload', {
  method: 'POST',
  body: formData
});
```

## Database Models

### Conversation
- `userId`: String
- `messages`: Array of { role, content, timestamp }
- `preview`: String (auto-generated from first message)
- `isEmergency`: Boolean
- `createdAt`, `updatedAt`: Timestamps

### Feedback
- `conversationId`: Reference to Conversation
- `userId`: String
- `rating`: Number (1-5)
- `comment`: String
- `category`: Enum (helpful, unclear, incorrect, excellent, other)
- `createdAt`: Timestamp

### UserProfile
- `userId`: String (unique)
- `name`, `email`, `phoneNumber`: String
- `emergencyContacts`: Array of contacts
- `medicalInfo`: { bloodType, allergies, medications, conditions }
- `preferences`: { language, notifications }

### Document
- `userId`: String
- `conversationId`: Reference to Conversation
- `fileName`, `originalName`: String
- `fileType`, `fileSize`: String, Number
- `filePath`: String
- `category`: Enum (medical-report, prescription, insurance, id-document, other)
- `uploadedAt`: Timestamp

## File Storage
Uploaded documents are stored in the `uploads/` directory with unique filenames.

## Next Steps
1. Integrate conversation saving when users chat
2. Add feedback UI component
3. Create user profile management page
4. Implement document upload functionality in the chat interface
