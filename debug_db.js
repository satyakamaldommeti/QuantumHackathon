import mongoose from 'mongoose';
import Conversation from './server/models/Conversation.js';
import dotenv from 'dotenv';

dotenv.config();

const testDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const conv = new Conversation({
            userId: 'debug-user',
            messages: [{ role: 'user', content: 'Debug message' }],
        });

        console.log('Saving conversation...');
        const saved = await conv.save();
        console.log('Saved!', saved);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        if (err.errors) {
            Object.keys(err.errors).forEach(key => {
                console.error(`Validation error for ${key}:`, err.errors[key].message);
            });
        }
        process.exit(1);
    }
};

testDB();
