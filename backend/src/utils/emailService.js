const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        // Create a transporter
        // You can use services like Gmail, Outlook, or 3rd party like SendGrid/Mailtrap
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER, // Your email
                pass: process.env.EMAIL_PASS, // Your email password or App Password
            },
        });

        // Define email options
        const mailOptions = {
            from: `"EatGreet Team" <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Email sending failed:', error);
        // Don't throw error to not break the main flow (optional)
        // throw error; 
    }
};

const sendWelcomeEmail = async (userEmail, userName) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #FD6941;">Welcome to EatGreet!</h1>
            </div>
            <p>Hi <b>${userName}</b>,</p>
            <p>Welcome to the EatGreet family! We're thrilled to have you onboard.</p>
            <p>With EatGreet, you can easily manage your business, track sales, and connect with your customers in a modern way.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><b>What's next?</b></p>
                <ul style="margin-top: 10px; color: #555;">
                    <li>Complete your business profile</li>
                    <li>Choose a subscription package (Silver, Gold, or Trial)</li>
                    <li>Start adding your menu and taking orders</li>
                </ul>
            </div>
            <p>If you have any questions, feel free to reply to this email. Our team is here to help!</p>
            <p>Best regards,<br/><b>The EatGreet Team</b></p>
            <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
            <p style="font-size: 12px; color: #999; text-align: center;">You're receiving this because you signed up for EatGreet.</p>
        </div>
    `;

    return sendEmail({
        email: userEmail,
        subject: 'Welcome to EatGreet - Your Journey Begins Here!',
        html: html
    });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail
};
