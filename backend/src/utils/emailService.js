const nodemailer = require('nodemailer');

// 1. Create a persistent transporter pool for better performance
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    pool: true, // Use a pool for multiple messages
    maxConnections: 5,
    maxMessages: 100,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false // Helps with some restricted environments
    }
});

/**
 * Verify SMTP Connection on initialization
 */
const verifySMTP = async () => {
    try {
        await transporter.verify();
        console.log('✅ SMTP Connection verified successfully');
        return true;
    } catch (error) {
        console.warn('❌ SMTP Verification failed. Check EMAIL_USER and EMAIL_PASS in .env');
        console.error(error);
        return false;
    }
};

// Start verification immediately (fire and forget)
verifySMTP();

/**
 * Core internal send function
 */
const sendEmail = async (options) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Missing EMAIL credentials in .env');
            return null;
        }

        const mailOptions = {
            from: `"EatGreet Team" <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            text: options.message || "Message content is empty.",
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Email sent to ${options.email} | ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`❌ Mail delivery failed to ${options.email}:`, error.message);
        if (error.code === 'EAUTH') {
            console.error('CRITICAL: SMTP Authentication failed. Verify EMAIL_USER and EMAIL_PASS.');
        }
        throw error;
    }

};

/**
 * WELCOME EMAIL (Initial registration)
 */
const sendWelcomeEmail = async (userEmail, userName, restaurantName, phone, city, isPending = false) => {
    const welcomeHeader = isPending ? '⏳ Application Received!' : '🎉 Welcome to EatGreet!';
    const welcomeSubtext = isPending ? 'Your EatGreet journey is about to begin' : 'Your restaurant journey starts now';

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #eee;">
        <div style="background: linear-gradient(135deg, #FD6941 0%, #ff8c6b 100%); padding: 40px 32px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 800;">${welcomeHeader}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px;">${welcomeSubtext}</p>
        </div>
        <div style="background: #ffffff; padding: 32px;">
            <p style="font-size: 16px; color: #333; margin-top: 0;">Hi <b>${userName}</b>,</p>
            <p style="color: #555; line-height: 1.7;">Thank you for registering <b>${restaurantName || 'your business'}</b> with EatGreet!</p>
            
            ${isPending ? `
                <p style="color: #555; line-height: 1.7;">Your application is currently <b>under review</b> by our Admin team. We verify each registration to maintain our community quality.</p>
                <div style="background-color: #f9f9f9; padding: 18px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #FD6941;">
                    <p style="margin: 0 0 10px; font-weight: 700; color: #333;">Next Steps:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 14px; line-height: 1.6;">
                        <li>Admin verification (usually < 24 hrs).</li>
                        <li>Approval notification with your credentials.</li>
                        <li>Complete your restaurant profile and go live!</li>
                    </ul>
                </div>
            ` : `
                <p style="color: #555; line-height: 1.7;">Your account is now active and ready. You can log in to access your dashboard and start managing your restaurant.</p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background: #FD6941; color: #fff; padding: 14px 40px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">Login to Dashboard →</a>
                </div>
            `}

            <p style="color: #888; font-size: 13px; margin-top: 30px; border-top: 1px solid #f0f0f0; pt: 20px;">
                Owner Name: ${userName}<br/>
                Reg. Phone: ${phone || 'N/A'}<br/>
                City: ${city || 'N/A'}
            </p>
            <p style="color: #333; font-size: 14px; margin-top: 24px;">Best regards,<br/><b>The EatGreet Team</b></p>
        </div>
    </div>`;

    return sendEmail({
        email: userEmail,
        subject: isPending ? 'Under Review: Your EatGreet Application' : 'Welcome to EatGreet - Account Ready!',
        html: html
    });
};

/**
 * APPROVAL EMAIL (When admin approves registration)
 */
const sendApprovalEmail = async (userEmail, userName, defaultPassword, restaurantName) => {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #eee;">
        <div style="background: #10B981; padding: 40px 32px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 800;">✅ Application Approved!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px;">Welcome to the family, ${restaurantName}!</p>
        </div>
        <div style="background: #ffffff; padding: 32px;">
            <p style="font-size: 16px; color: #333; margin-top: 0;">Hi <b>${userName}</b>,</p>
            <p style="color: #555; line-height: 1.7;">Great news! Your restaurant <b>${restaurantName}</b> has been approved. You can now access your master dashboard.</p>
            
            <div style="background-color: #f1f8e9; padding: 24px; border-radius: 12px; margin: 25px 0; border: 1px solid #c8e6c9;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #888; text-transform: uppercase; font-weight: 700;">Your Credentials:</p>
                <p style="margin: 5px 0; font-size: 14px; color: #222;"><b>User ID:</b> ${userEmail}</p>
                <p style="margin: 10px 0 0; font-size: 14px; color: #222;"><b>Password:</b> <span style="background: #fff; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-weight: bold; font-size: 18px; border: 1px dashed #10B981; color: #065f46;">${defaultPassword}</span></p>
            </div>
            
            <p style="color: #Ef4444; font-size: 13px; font-weight: 600; text-align: center;">⚠️ Please change your password immediately after logging in.</p>
            
            <div style="text-align: center; margin-top: 32px;">
                <a href="${loginUrl}" style="background-color: #FD6941; color: white; padding: 14px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(253,105,65,0.25);">Log In Now →</a>
            </div>
            
            <p style="color: #333; font-size: 14px; margin-top: 32px; border-top: 1px solid #f0f0f0; padding-top: 20px;">Welcome to EatGreet!<br/><b>The EatGreet Team</b></p>
        </div>
    </div>`;

    return sendEmail({
        email: userEmail,
        subject: '✅ Approved: Log in to your EatGreet Dashboard',
        html: html
    });
};

/**
 * ADMIN NOTIFICATION (New registration)
 */
const sendAdminNotificationEmail = async ({ name, email, phone, city, restaurantName }) => {
    const adminEmail = process.env.APP_ADMIN_EMAIL || process.env.EMAIL_USER;
    const registeredAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: #1a1a2e; padding: 32px; text-align: center;">
            <h1 style="color: #FD6941; margin: 0; font-size: 24px; font-weight: 800;">🔔 New Registration Request</h1>
            <p style="color: #888; margin: 8px 0 0; font-size: 14px;">Verification required for approval</p>
        </div>
        <div style="background: #ffffff; padding: 32px;">
            <p style="color: #222; margin-top: 0; font-weight: 700; font-size: 16px; border-bottom: 2px solid #FD6941; display: inline-block;">Details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <tr style="background: #fdfdfd; border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 12px; font-weight: 600; color: #666;">Owner Name</td>
                    <td style="padding: 12px; color: #111; font-weight: 700;">${name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 12px; font-weight: 600; color: #666;">Contact</td>
                    <td style="padding: 12px; color: #111;">${email}<br/>${phone || '—'}</td>
                </tr>
                <tr style="background: #fdfdfd; border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 12px; font-weight: 600; color: #666;">Location</td>
                    <td style="padding: 12px; color: #111;">${city || '—'}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; font-weight: 600; color: #666;">Restaurant</td>
                    <td style="padding: 12px; color: #FD6941; font-weight: 800; font-size: 16px;">${restaurantName || '—'}</td>
                </tr>
            </table>
            <div style="background: #fff4f1; padding: 20px; border-radius: 12px; text-align: center; margin-top: 10px;">
                <p style="margin:0 0 15px; font-size: 12px; color: #888;">Registration Time: ${registeredAt} IST</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/super-admin" style="background: #1a1a2e; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Review Application →</a>
            </div>

        </div>
    </div>`;

    return sendEmail({
        email: adminEmail,
        subject: `🆕 New Registration: ${restaurantName || name}`,
        html: html
    });
};

/**
 * SUBSCRIPTION REMINDER (Manual admin trigger)
 */
const sendSubscriptionReminder = async (userEmail, userName, planName, endDate) => {
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: #FD6941; padding: 32px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 800;">Subscription Reminder</h1>
        </div>
        <div style="background: #ffffff; padding: 32px;">
            <p>Hi ${userName},</p>
            <p style="color: #555; line-height: 1.6;">This is a friendly reminder that your <b>${planName}</b> plan will expire on <b>${new Date(endDate).toLocaleDateString()}</b>.</p>
            <p style="color: #555; line-height: 1.6;">To ensure uninterrupted service for your restaurant, please renew your plan soon.</p>
            <div style="margin: 30px 0; text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/billing" style="background-color: #FD6941; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">Renew Now</a>
            </div>
            <p style="color: #333; font-size: 14px; margin-top: 32px;">Best regards,<br/><b>The EatGreet Team</b></p>
        </div>
    </div>`;

    return sendEmail({
        email: userEmail,
        subject: 'Action Required: Your EatGreet Subscription is Expiring',
        html: html
    });
};

const sendSuperAdminOtpEmail = async (userEmail, otpCode) => {
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: #111827; padding: 32px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 800;">Super Admin OTP</h1>
            <p style="color: #d1d5db; margin: 8px 0 0; font-size: 14px;">EatGreet secure access verification</p>
        </div>
        <div style="background: #ffffff; padding: 32px;">
            <p style="color: #374151; line-height: 1.6; margin: 0 0 12px;">
                Use this one-time password to sign in to your Super Admin portal.
            </p>
            <div style="text-align:center; margin: 28px 0;">
                <span style="display:inline-block; letter-spacing: 6px; font-size: 32px; font-weight: 800; color: #111827; background: #f3f4f6; padding: 14px 20px; border-radius: 12px; border: 1px dashed #9ca3af;">${otpCode}</span>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin: 0;">This OTP expires in 60 seconds.</p>
            <p style="color: #ef4444; font-size: 13px; margin-top: 10px;">If you did not request this, ignore this email.</p>
            <p style="color: #374151; font-size: 14px; margin-top: 20px;">The EatGreet Security System</p>
        </div>
    </div>`;

    return sendEmail({
        email: userEmail,
        subject: 'Your EatGreet Super Admin OTP',
        html
    });
};

module.exports = {
    sendEmail,
    verifySMTP,
    sendWelcomeEmail,
    sendApprovalEmail,
    sendAdminNotificationEmail,
    sendSubscriptionReminder,
    sendSuperAdminOtpEmail
};
