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

<<<<<<< Updated upstream
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
=======
const sendWelcomeEmail = async (userEmail, userName, restaurantName, phone, city) => {
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #FD6941 0%, #ff8c6b 100%); padding: 40px 32px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">🍽️ Welcome to EatGreet!</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">Your restaurant journey starts now</p>
            </div>

            <!-- Body -->
            <div style="background: #ffffff; padding: 32px;">
                <p style="font-size: 16px; color: #333; margin-top: 0;">Hi <b>${userName}</b> 👋,</p>
                <p style="color: #555; line-height: 1.7;">We're absolutely thrilled to have you and <b>${restaurantName || 'your restaurant'}</b> join the EatGreet family! Your account has been successfully created.</p>

                <!-- Account Details Card -->
                <div style="background: #FFF5F1; border-left: 4px solid #FD6941; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
                    <p style="margin: 0 0 8px; font-weight: 700; color: #FD6941; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Your Account Details</p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #444;">
                        <tr><td style="padding: 4px 0; color: #888;">Business</td><td style="padding: 4px 0; font-weight: 600;">${restaurantName || '—'}</td></tr>
                        <tr><td style="padding: 4px 0; color: #888;">Email</td><td style="padding: 4px 0; font-weight: 600;">${userEmail}</td></tr>
                        <tr><td style="padding: 4px 0; color: #888;">Phone</td><td style="padding: 4px 0; font-weight: 600;">${phone || '—'}</td></tr>
                        <tr><td style="padding: 4px 0; color: #888;">City</td><td style="padding: 4px 0; font-weight: 600;">${city || '—'}</td></tr>
                        <tr><td style="padding: 4px 0; color: #888;">Plan</td><td style="padding: 4px 0;"><span style="background:#FD6941; color:#fff; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 700;">7-Day Free Trial</span></td></tr>
                    </table>
                </div>

                <!-- Next Steps -->
                <p style="font-weight: 700; color: #222; margin-bottom: 12px;">🚀 What's next?</p>
                <div style="display: grid; gap: 10px;">
                    <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: #f9f9f9; border-radius: 8px;">
                        <span style="font-size: 20px;">1️⃣</span>
                        <div><b style="color: #222;">Login to your dashboard</b><br/><span style="font-size: 13px; color: #666;">Access all your restaurant tools in one place</span></div>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: #f9f9f9; border-radius: 8px;">
                        <span style="font-size: 20px;">2️⃣</span>
                        <div><b style="color: #222;">Complete your business profile</b><br/><span style="font-size: 13px; color: #666;">Add your logo, timings, and location details</span></div>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: #f9f9f9; border-radius: 8px;">
                        <span style="font-size: 20px;">3️⃣</span>
                        <div><b style="color: #222;">Build your digital menu</b><br/><span style="font-size: 13px; color: #666;">Add categories, items, and beautiful images</span></div>
                    </div>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0 16px;">
                    <a href="${process.env.FRONTEND_URL}/login" style="background: #FD6941; color: #fff; padding: 14px 36px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(253,105,65,0.4);">Go to My Dashboard →</a>
                </div>

                <p style="color: #555; font-size: 14px;">Got questions? Just reply to this email — we're always happy to help!</p>
                <p style="color: #333; font-size: 14px;">With ❤️,<br/><b>The EatGreet Team</b></p>
            </div>

            <!-- Footer -->
            <div style="background: #f5f5f5; padding: 20px 32px; text-align: center;">
                <p style="font-size: 12px; color: #999; margin: 0;">You received this email because you registered at EatGreet.<br/>© ${new Date().getFullYear()} EatGreet. All rights reserved.</p>
            </div>
>>>>>>> Stashed changes
        </div>
    `;

    return sendEmail({
        email: userEmail,
<<<<<<< Updated upstream
        subject: isPending ? 'Your EatGreet Application is Under Review' : 'Welcome to EatGreet - Your Journey Begins Here!',
=======
        subject: `🎉 Welcome to EatGreet, ${userName}! Your account is ready.`,
>>>>>>> Stashed changes
        html: html
    });
};

<<<<<<< Updated upstream
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
=======
// Send notification to app admin when a new user registers from the landing page
const sendAdminNotificationEmail = async ({ name, email, phone, city, restaurantName }) => {
    const adminEmail = process.env.APP_ADMIN_EMAIL || process.env.EMAIL_USER;
    const registeredAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <!-- Header -->
            <div style="background: #1a1a2e; padding: 32px; text-align: center;">
                <h1 style="color: #FD6941; margin: 0; font-size: 24px; font-weight: 800;">🔔 New Registration Alert</h1>
                <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">A new restaurant has joined EatGreet</p>
            </div>

            <!-- Body -->
            <div style="background: #ffffff; padding: 32px;">
                <p style="color: #333; margin-top: 0;">Hi Admin, a new user just registered from the landing page. Here are their details:</p>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                    <tr style="background: #f9f9f9;">
                        <td style="padding: 12px 16px; color: #888; font-weight: 600; width: 40%; border-bottom: 1px solid #eee;">Full Name</td>
                        <td style="padding: 12px 16px; color: #222; font-weight: 700; border-bottom: 1px solid #eee;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 16px; color: #888; font-weight: 600; border-bottom: 1px solid #eee;">Email</td>
                        <td style="padding: 12px 16px; color: #222; border-bottom: 1px solid #eee;"><a href="mailto:${email}" style="color: #FD6941;">${email}</a></td>
                    </tr>
                    <tr style="background: #f9f9f9;">
                        <td style="padding: 12px 16px; color: #888; font-weight: 600; border-bottom: 1px solid #eee;">Phone</td>
                        <td style="padding: 12px 16px; color: #222; border-bottom: 1px solid #eee;">${phone || '—'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 16px; color: #888; font-weight: 600; border-bottom: 1px solid #eee;">City</td>
                        <td style="padding: 12px 16px; color: #222; border-bottom: 1px solid #eee;">${city || '—'}</td>
                    </tr>
                    <tr style="background: #f9f9f9;">
                        <td style="padding: 12px 16px; color: #888; font-weight: 600; border-bottom: 1px solid #eee;">Business / Restaurant</td>
                        <td style="padding: 12px 16px; color: #222; font-weight: 700; border-bottom: 1px solid #eee;">${restaurantName || '—'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 16px; color: #888; font-weight: 600;">Registered At</td>
                        <td style="padding: 12px 16px; color: #222;">${registeredAt} IST</td>
                    </tr>
                </table>

                <div style="background: #FFF5F1; border-radius: 10px; padding: 16px; text-align: center; margin-top: 24px;">
                    <p style="margin: 0; color: #FD6941; font-weight: 700; font-size: 14px;">✅ Welcome email has been automatically sent to the user.</p>
                </div>
            </div>

            <!-- Footer -->
            <div style="background: #f5f5f5; padding: 16px 32px; text-align: center;">
                <p style="font-size: 12px; color: #999; margin: 0;">EatGreet Admin Notification — Do not reply to this email.</p>
            </div>
>>>>>>> Stashed changes
        </div>
    `;

    return sendEmail({
<<<<<<< Updated upstream
        email: userEmail,
        subject: 'Action Required: Your EatGreet Account has been Approved!',
=======
        email: adminEmail,
        subject: `🆕 New Registration: ${restaurantName || name} just signed up!`,
>>>>>>> Stashed changes
        html: html
    });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
<<<<<<< Updated upstream
    sendApprovalEmail
=======
    sendAdminNotificationEmail
>>>>>>> Stashed changes
};
