const mongoose = require('mongoose');
const Conversation = require('./models/Conversation');
require('dotenv').config({ path: '../.env' }); // Load from root .env

const testDB = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
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
