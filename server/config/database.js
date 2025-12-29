const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            console.error('MONGODB_URI is not defined in environment variables');
            return;
        }

        await mongoose.connect(mongoURI);

        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        // Don't exit process, allow app to continue without DB
    }
};

module.exports = connectDB;
