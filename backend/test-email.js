require('dotenv').config();
const { sendEmail } = require('./src/utils/emailService');

const test = async () => {
    try {
        console.log('Testing email transport...');
        console.log('User:', process.env.EMAIL_USER);
        const info = await sendEmail({
            email: 'superadmin.eatgreet@gmail.com',
            subject: 'Test Email from Localhost',
            text: 'This is a test to verify SMTP settings.'
        });
        console.log('Email sent successfully:', info.messageId);
        process.exit(0);
    } catch (error) {
        console.error('Email Test Failed:');
        console.error(error);
        process.exit(1);
    }
};

test();
