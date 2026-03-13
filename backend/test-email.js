const nodemailer = require('nodemailer');
require('dotenv').config();

const testSmtp = async () => {
    console.log('--- SMTP TEST START ---');
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
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await transporter.verify();
        console.log('✅ SUCCESS: SMTP connection is active and credentials are correct.');
    } catch (error) {
        console.error('❌ FAILURE: SMTP connection failed.');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        
        if (error.code === 'EAUTH') {
            console.error('TIP: This is an Authentication error. Check if "App Password" is correct or if 2FA is enabled.');
        }
    }
    console.log('--- SMTP TEST END ---');
};

testSmtp();
