const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        // Create a transporter
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
    }
};

/**
 * Send welcome email to user (initial registration)
 */
const sendWelcomeEmail = async (userEmail, userName, restaurantName, phone, city, isPending = false) => {
    let html = '';

    if (isPending) {
        html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #FD6941 0%, #ff8c6b 100%); padding: 40px 32px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 800;">⏳ Application Received!</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">Your EatGreet journey is about to begin</p>
            </div>
            <div style="background: #ffffff; padding: 32px;">
                <p style="font-size: 16px; color: #333; margin-top: 0;">Hi <b>${userName}</b>,</p>
                <p style="color: #555; line-height: 1.7;">Thank you for registering <b>${restaurantName || 'your business'}</b> with EatGreet!</p>
                <p style="color: #555; line-height: 1.7;">Your application is currently <b>under review</b> by our Super Admin team. We carefully verify each restaurant to maintain our service quality.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FD6941;">
                    <p style="margin: 0; font-weight: 700; color: #222;">What happens next?</p>
                    <ol style="margin-top: 10px; color: #555; font-size: 14px;">
                        <li>Super Admin will verify your restaurant details.</li>
                        <li>Once approved, you will receive a <b>Confirmation ID</b> and <b>Default Password</b>.</li>
                        <li>You can then log in and complete your restaurant onboarding.</li>
                    </ol>
                </div>
                
                <p style="color: #555; font-size: 14px;">Processing usually takes less than 24 hours. Thank you for your patience!</p>
                <p style="color: #333; font-size: 14px; margin-top: 24px;">Best regards,<br/><b>The EatGreet Team</b></p>
            </div>
        </div>`;
    } else {
        html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #FD6941 0%, #ff8c6b 100%); padding: 40px 32px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 800;">🎉 Welcome to EatGreet!</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">Your restaurant journey starts now</p>
            </div>
            <div style="background: #ffffff; padding: 32px;">
                <p style="font-size: 16px; color: #333; margin-top: 0;">Hi <b>${userName}</b> 👋,</p>
                <p style="color: #555; line-height: 1.7;">We're thrilled to have you and <b>${restaurantName || 'your restaurant'}</b> join the family! Your account is active.</p>
                
                <div style="background: #FFF5F1; border-left: 4px solid #FD6941; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
                    <p style="margin: 0 0 8px; font-weight: 700; color: #FD6941; font-size: 13px; text-transform: uppercase;">Your Account Details</p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #444;">
                        <tr><td style="padding: 4px 0; color: #888;">Business</td><td style="padding: 4px 0; font-weight: 600;">${restaurantName || '—'}</td></tr>
                        <tr><td style="padding: 4px 0; color: #888;">Email</td><td style="padding: 4px 0; font-weight: 600;">${userEmail}</td></tr>
                    </table>
                </div>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #FD6941; color: #fff; padding: 14px 36px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">Go to Dashboard →</a>
                </div>
                
                <p style="color: #333; font-size: 14px;">Best regards,<br/><b>The EatGreet Team</b></p>
            </div>
        </div>`;
    }

    return sendEmail({
        email: userEmail,
        subject: isPending ? 'Your EatGreet Application is Under Review' : 'Welcome to EatGreet - Your account is ready!',
        html: html
    });
};

/**
 * Send approval email to user (with random password)
 */
const sendApprovalEmail = async (userEmail, userName, defaultPassword, restaurantName) => {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
            <div style="background: #10B981; padding: 40px 32px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 800;">✅ Application Approved!</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">Your restaurant is ready to go live</p>
            </div>
            <div style="background: #ffffff; padding: 32px;">
                <p style="font-size: 16px; color: #333; margin-top: 0;">Hi <b>${userName}</b>,</p>
                <p style="color: #555; line-height: 1.7;">Great news! Your restaurant <b>${restaurantName}</b> has been approved.</p>
                <p style="color: #555; line-height: 1.7;">You can now log in to your dashboard using the credentials below:</p>
                
                <div style="background-color: #f1f8e9; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #c8e6c9;">
                    <p style="margin: 5px 0; font-size: 14px;"><b>Email / User ID:</b> ${userEmail}</p>
                    <p style="margin: 5px 0; font-size: 14px;"><b>Default Password:</b> <span style="background: #fff; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; font-size: 16px;">${defaultPassword}</span></p>
                </div>
                
                <p style="color: #Ef4444; font-size: 13px; font-weight: 600;">⚠️ Important: Please change your password after your first login.</p>
                
                <div style="text-align: center; margin-top: 32px;">
                    <a href="${loginUrl}" style="background-color: #FD6941; color: white; padding: 14px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; display: inline-block;">Log In Now</a>
                </div>
                
                <p style="color: #333; font-size: 14px; margin-top: 32px;">Welcome to EatGreet!<br/><b>The EatGreet Team</b></p>
            </div>
        </div>`;

    return sendEmail({
        email: userEmail,
        subject: '✅ Action Required: Your EatGreet Account has been Approved!',
        html: html
    });
};

/**
 * Send notification to app admin when a new user registers
 */
const sendAdminNotificationEmail = async ({ name, email, phone, city, restaurantName }) => {
    const adminEmail = process.env.APP_ADMIN_EMAIL || process.env.EMAIL_USER;
    const registeredAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="background: #1a1a2e; padding: 32px; text-align: center;">
                <h1 style="color: #FD6941; margin: 0; font-size: 24px; font-weight: 800;">🔔 New Registration Request</h1>
                <p style="color: #999; margin: 8px 0 0; font-size: 14px;">A new restaurant is waiting for your approval</p>
            </div>
            <div style="background: #ffffff; padding: 32px;">
                <p style="color: #333; margin-top: 0; font-weight: 600;">Full Details:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                    <tr style="background: #f9f9f9; border-bottom: 1px solid #eee;">
                        <td style="padding: 12px; font-weight: 600; color: #888;">Owner Name</td>
                        <td style="padding: 12px; color: #222; font-weight: bold;">${name}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px; font-weight: 600; color: #888;">Email</td>
                        <td style="padding: 12px; color: #222;">${email}</td>
                    </tr>
                    <tr style="background: #f9f9f9; border-bottom: 1px solid #eee;">
                        <td style="padding: 12px; font-weight: 600; color: #888;">Phone</td>
                        <td style="padding: 12px; color: #222;">${phone || '—'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px; font-weight: 600; color: #888;">City</td>
                        <td style="padding: 12px; color: #222;">${city || '—'}</td>
                    </tr>
                    <tr style="background: #f9f9f9;">
                        <td style="padding: 12px; font-weight: 600; color: #888;">Business Name</td>
                        <td style="padding: 12px; color: #FD6941; font-weight: bold;">${restaurantName || '—'}</td>
                    </tr>
                </table>
                <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; text-align: center;">
                    <p style="margin:0; font-size: 12px; color: #555;">Registered at: ${registeredAt} IST</p>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/super-admin/approvals" style="display: inline-block; margin-top: 10px; color: #007bff; text-decoration: none; font-weight: bold;">Review in Dashboard →</a>
                </div>
            </div>
        </div>`;

    return sendEmail({
        email: adminEmail,
        subject: `🆕 Action Required: Approval needed for ${restaurantName || name}`,
        html: html
    });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendApprovalEmail,
    sendAdminNotificationEmail
};
