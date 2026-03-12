const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Fail after 5 seconds
            socketTimeoutMS: 45000,
        });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        // Throw error instead of exiting so we don't cause 502 loops on Render/Vercel
        throw error;
    }
};

module.exports = { connectDB };
