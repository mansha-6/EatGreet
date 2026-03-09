require('dotenv').config();
const nodemailer = require('nodemailer');

const testSMTP = async () => {
    console.log('Testing SMTP with:');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Host:', process.env.EMAIL_HOST || 'smtp.gmail.com');
    console.log('Port:', process.env.EMAIL_PORT || 587);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_PORT == 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 60000,
        greetingTimeout: 60000,
        socketTimeout: 60000,
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection verified!');

        console.log('Sending test mail to:', process.env.EMAIL_USER);
        const info = await transporter.sendMail({
            from: `"EatGreet Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: 'SMTP Test',
            text: 'If you see this, SMTP is working.'
        });
        console.log('✅ Test mail sent:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Test failed:');
        console.error(error);
    }
};

testSMTP();
