const nodemailer = require('nodemailer');

// 1. Create a persistent transporter pool for better performance
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    pool: true, // Use a pool for multiple messages
    maxConnections: 5,
    maxMessages: 100,
    // Fail fast on bad SMTP/network to avoid long API hangs
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
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
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased; }
            .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 15px; text-align: center; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: left; }
            .header-top { padding: 32px 32px 10px; }
            .logo { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; text-decoration: none; display: flex; align-items: center; }
            .logo span { color: #FD6941; }
            .logo-icon { margin-right: 8px; font-size: 24px; }
            .hero { padding: 40px 32px 10px; text-align: center; }
            .hero-title { font-family: Georgia, serif; font-size: 42px; color: #0f172a; margin: 0; font-weight: bold; line-height: 1.1; }
            .hero-subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 18px; color: #475569; margin: 12px 0 0; }
            .content { padding: 30px 32px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            .text { font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 20px; }
            .box { background-color: #f8fafc; border-radius: 16px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0; }
            .box-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin: 0 0 12px; }
            .btn-wrap { text-align: center; margin: 40px 0 20px; }
            .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 18px 48px; border-radius: 14px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 6px 20px rgba(79,70,229,0.3); }
            .footer { background-color: #f8fafc; padding: 40px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            @media only screen and (max-width: 600px) {
                .wrapper { padding: 20px 10px; }
                .header-top, .hero, .content { padding-left: 20px; padding-right: 20px; }
                .hero-title { font-size: 32px; }
                .box { padding: 16px; }
            }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc;">
        <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td align="center">
                    <table class="container" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px; background-color: #ffffff;">
                        <tr>
                            <td class="header-top">
                                <div class="logo"><span class="logo-icon">🍽️</span> <span>Eat</span>Greet</div>
                            </td>
                        </tr>
                        <tr>
                            <td class="hero">
                                <h1 class="hero-title">${isPending ? 'Almost There!' : 'Hola!'}</h1>
                                <p class="hero-subtitle">${isPending ? 'Your application is under review' : 'Welcome to EatGreet!'}</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="content">
                                <p class="text" style="font-weight: 600; color: #0f172a;">Hi ${userName},</p>
                                <p class="text">Thank you for registering <b>${restaurantName || 'your business'}</b> with EatGreet. ${isPending ? 'We verify each registration to maintain the highest quality standards for our community.' : 'Your account is now active and ready. You can log in to access your command center and start managing your restaurant.'}</p>
                                
                                ${isPending ? `
                                <div class="box">
                                    <p class="box-title">Next Steps</p>
                                    <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 15px; line-height: 1.8;">
                                        <li>Account verification (usually within 24 hours)</li>
                                        <li>Approval notification with your secure credentials</li>
                                        <li>Profile setup and restaurant launch</li>
                                    </ul>
                                </div>
                                ` : `
                                <div class="btn-wrap">
                                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/login" class="btn" style="background-color: #4f46e5;">Get Started</a>
                                </div>
                                `}
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px;">Powered by</p>
                                <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 4px;"><span style="color: #FD6941;">Eat</span>Greet</div>
                                <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0;">© ${new Date().getFullYear()} EatGreet. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;

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
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/login`;
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased; }
            .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 15px; text-align: center; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: left; }
            .header-top { padding: 32px 32px 10px; }
            .logo { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; text-decoration: none; display: flex; align-items: center; }
            .logo span { color: #FD6941; }
            .logo-icon { margin-right: 8px; font-size: 24px; }
            .hero { padding: 40px 32px 10px; text-align: center; }
            .hero-title { font-family: Georgia, serif; font-size: 42px; color: #0f172a; margin: 0; font-weight: bold; line-height: 1.1; }
            .hero-subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 18px; color: #475569; margin: 12px 0 0; }
            .content { padding: 30px 32px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            .text { font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 20px; }
            .box { background-color: #f8fafc; border-radius: 16px; padding: 32px; margin: 30px 0; border: 1px solid #e2e8f0; text-align: center; }
            .box-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin: 0 0 24px; }
            .cred-label { font-size: 12px; color: #94a3b8; font-weight: 600; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
            .cred-val { font-size: 16px; color: #0f172a; font-weight: 500; margin: 0 0 24px; }
            .pass-val { background: #ffffff; padding: 12px 24px; border-radius: 12px; font-family: 'SF Mono', Consolas, monospace; font-weight: 700; font-size: 24px; border: 2px dashed #cbd5e1; color: #4f46e5; display: inline-block; letter-spacing: 4px; margin: 0; }
            .btn-wrap { text-align: center; margin: 40px 0 20px; }
            .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 18px 48px; border-radius: 14px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 6px 20px rgba(79,70,229,0.3); }
            .alert { background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 16px; color: #ef4444; font-size: 14px; text-align: center; font-weight: 500; margin-top: 24px; }
            .footer { background-color: #f8fafc; padding: 40px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            @media only screen and (max-width: 600px) {
                .wrapper { padding: 20px 10px; }
                .header-top, .hero, .content { padding-left: 20px; padding-right: 20px; }
                .hero-title { font-size: 32px; }
                .box { padding: 20px; }
                .pass-val { font-size: 20px; padding: 10px 16px; letter-spacing: 2px; }
            }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc;">
        <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td align="center">
                    <table class="container" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px; background-color: #ffffff;">
                        <tr>
                            <td class="header-top">
                                <div class="logo"><span class="logo-icon">🍽️</span> <span>Eat</span>Greet</div>
                            </td>
                        </tr>
                        <tr>
                            <td class="hero">
                                <h1 class="hero-title">Approval Granted!</h1>
                                <p class="hero-subtitle">Welcome to the family, ${restaurantName}</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="content">
                                <p class="text" style="font-weight: 600; color: #0f172a;">Hi ${userName},</p>
                                <p class="text">We are thrilled to inform you that <b>${restaurantName}</b> has been approved for the EatGreet platform. Your personalized command center is now ready for access.</p>
                                
                                <div class="box">
                                    <p class="box-title">Secure Access Credentials</p>
                                    
                                    <p class="cred-label">USER ID</p>
                                    <p class="cred-val">${userEmail}</p>
                                    
                                    <p class="cred-label">TEMPORARY PASSWORD</p>
                                    <p class="pass-val">${defaultPassword}</p>
                                </div>
                                <div class="alert">
                                    Please change your password immediately upon first login.
                                </div>
                                
                                <div class="btn-wrap">
                                    <a href="${loginUrl}" class="btn">Sign In to Dashboard</a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px;">Powered by</p>
                                <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 4px;"><span style="color: #FD6941;">Eat</span>Greet</div>
                                <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0;">© ${new Date().getFullYear()} EatGreet. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;

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
