
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();
const User = require('./src/models/User');
const { sendForgotPasswordEmail } = require('./src/utils/emailService');

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'wylifu@denipl.net';
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found');
            process.exit(0);
        }

        console.log('User found:', user.email);

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000;

        console.log('Saving user...');
        await user.save();
        console.log('User saved');

        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

        console.log('Sending email...');
        await sendForgotPasswordEmail(user.email, user.name, resetUrl);
        console.log('Email sent successfully');

    } catch (error) {
        console.error('ERROR DETECTED:', error);
    } finally {
        await mongoose.disconnect();
    }
};

test();
