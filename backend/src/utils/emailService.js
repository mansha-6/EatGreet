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

const sendWelcomeEmail = async (userEmail, userName, isPending = false) => {
    const html = isPending ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #FD6941;">Registration Received!</h1>
            </div>
            <p>Hi <b>${userName}</b>,</p>
            <p>Thank you for registering your restaurant with EatGreet!</p>
            <p>Your application is currently <b>under review</b> by our Super Admin team. We carefully verify each restaurant to maintain our service quality.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><b>What happens next?</b></p>
                <ol style="margin-top: 10px; color: #555;">
                    <li>Super Admin will verify your details.</li>
                    <li>Once approved, you will receive a second email with your <b>Confirmation ID</b> and <b>Default Password</b>.</li>
                    <li>You can then log in and complete your restaurant onboarding.</li>
                </ol>
            </div>
            <p>Processing usually takes less than 24 hours. Thank you for your patience!</p>
            <p>Best regards,<br/><b>The EatGreet Team</b></p>
        </div>
    ` : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #FD6941;">Welcome to EatGreet!</h1>
            </div>
            <p>Hi <b>${userName}</b>,</p>
            <p>Welcome to the EatGreet family! We're thrilled to have you onboard.</p>
            <p>With EatGreet, you can easily manage your business, track sales, and connect with your customers in a modern way.</p>
            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Best regards,<br/><b>The EatGreet Team</b></p>
        </div>
    `;

    return sendEmail({
        email: userEmail,
        subject: isPending ? 'Your EatGreet Application is Under Review' : 'Welcome to EatGreet - Your Journey Begins Here!',
        html: html
    });
};

const sendApprovalEmail = async (userEmail, userName, defaultPassword, restaurantName) => {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/login`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #4CAF50;">Application Approved!</h1>
            </div>
            <p>Hi <b>${userName}</b>,</p>
            <p>Great news! Your restaurant <b>${restaurantName}</b> has been approved by the EatGreet administration.</p>
            <p>You can now log in to your dashboard using the credentials below:</p>
            <div style="background-color: #f1f8e9; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #c8e6c9;">
                <p style="margin: 5px 0;"><b>Login URL:</b> <a href="${loginUrl}">${loginUrl}</a></p>
                <p style="margin: 5px 0;"><b>Email / User ID:</b> ${userEmail}</p>
                <p style="margin: 5px 0;"><b>Default Password:</b> <span style="background: #fff; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${defaultPassword}</span></p>
            </div>
            <p style="color: #f44336; font-size: 13px;"><b>Important:</b> For security reasons, you will be asked to complete your restaurant setup and we recommend updating your password after your first login.</p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="${loginUrl}" style="background-color: #FD6941; color: white; padding: 14px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">Log In Now</a>
            </div>
            <p style="margin-top: 30px;">Welcome to the future of restaurant management!</p>
            <p>Best regards,<br/><b>The EatGreet Team</b></p>
        </div>
    `;

    return sendEmail({
        email: userEmail,
        subject: 'Action Required: Your EatGreet Account has been Approved!',
        html: html
    });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendApprovalEmail
};
