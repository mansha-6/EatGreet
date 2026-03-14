const nodemailer = require('nodemailer');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

// Force Node.js to prioritize IPv4 over IPv6. 
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const LOGO_URL = 'https://eat-greet.vercel.app/logo-full.png';

// Path to local logo for embedding
const LOCAL_LOGO_PATH = path.join(__dirname, '../../../frontend/public/logo-full.png');

const createTransporter = ({ host, port, secure }) => nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Standard connection settings
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 15000, 
    greetingTimeout: 15000,
    socketTimeout: 30000,
    family: 4, // Force IPv4 to prevent ENETUNREACH on IPv6-only resolution
    tls: {
        // Essential for working with varied hosting environments
        rejectUnauthorized: false
    }
});

const smtpHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.EMAIL_PORT, 10) || 587;
const smtpSecure = smtpPort === 465;

const primaryTransporter = createTransporter({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure
});

/**
 * Verify SMTP Connection
 */
const verifySMTP = async () => {
    try {
        await primaryTransporter.verify();
        console.log('✅ SMTP Connection verified successfully');
        return true;
    } catch (error) {
        console.error('❌ SMTP Verification failed:', error.message);
        return false;
    }
};

/**
 * Core internal send function
 */
const sendEmail = async (options) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('CRITICAL: Missing EMAIL_USER or EMAIL_PASS in environment.');
            return;
        }

        const mailOptions = {
            from: `"EatGreet" <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            text: options.message || "EatGreet Notification",
            html: options.html,
            attachments: options.attachments || []
        };

        const info = await primaryTransporter.sendMail(mailOptions);
        console.log(`✉️ Email successfully sent to ${options.email} | ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`❌ Mail delivery failed to ${options.email}:`, error.message);
        throw error;
    }
};

/**
 * WELCOME EMAIL (Initial registration)
 */
const sendWelcomeEmail = async (userEmail, userName, restaurantName, phone, city, isPending = false, registrationNote = '') => {
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
            .logo { display: block; }
            .logo img { height: 45px; width: auto; display: block; border: none; }
            .hero { padding: 40px 32px 10px; text-align: center; }
            .hero-title { font-family: Georgia, serif; font-size: 28px; color: #0f172a; margin: 0; font-weight: bold; line-height: 1.2; text-transform: uppercase; letter-spacing: 1px; }
            .hero-subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; color: #475569; margin: 12px 0 0; }
            .content { padding: 30px 32px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            .text { font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 20px; }
            .box { background-color: #f8fafc; border-radius: 16px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0; }
            .box-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin: 0 0 12px; }
            .btn-wrap { text-align: center; margin: 40px 0 20px; }
            .btn { display: inline-block; background-color: #FD6941; color: #ffffff !important; padding: 18px 48px; border-radius: 14px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 6px 20px rgba(253,105,65,0.3); }
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
                                <div style="display: block; text-align: center;">
                                    <img src="${LOGO_URL}" alt="EatGreet Logo" style="height: 50px; width: auto; display: block; margin: 0 auto; border: none;">
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="hero">
                                <h1 class="hero-title">WELCOME TO EATGREET</h1>
                                <p class="hero-subtitle">Application Received • Under Review</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="content">
                                <p class="text" style="font-weight: 600; color: #0f172a;">Hello,</p>
                                <p class="text">Thank you for registering <b>${restaurantName || 'your business'}</b> with EatGreet. Your application has been received and is currently being processed by our team.</p>
                                
                                ${registrationNote ? `
                                 <div class="box">
                                     <p class="box-title">Your Requirements / Notes</p>
                                     <p style="margin: 6px 0 0; font-size: 14px; color: #475569; font-style: italic; background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9;">"${registrationNote}"</p>
                                 </div>
                                ` : ''}

                                <div class="box" style="background-color: #fffbeb; border-color: #fef3c7; border-left: 4px solid #f59e0b;">
                                    <p class="box-title" style="color: #92400e;">Security Status: Pending Review</p>
                                    <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.8;">
                                        <li>Our team will verify your business details within 24 hours</li>
                                        <li>Dashboard access is temporarily restricted until approval</li>
                                        <li>You'll receive a confirmation email once your account is ready</li>
                                    </ul>
                                </div>
                                <p style="color: #94a3b8; font-size: 11px; margin: 16px 0 0;">© ${new Date().getFullYear()} EatGreet. All rights reserved.</p>
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
        subject: 'Welcome to EatGreet - your request under Review',
        html: html
    });
};

/**
 * APPROVAL EMAIL (When admin approves registration)
 */
const sendApprovalEmail = async (userEmail, userName, setupUrl, restaurantName) => {
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
            .logo { display: block; }
            .logo img { height: 50px; width: auto; display: block; border: none; }
            .hero { padding: 40px 32px 10px; text-align: center; }
            .hero-title { font-family: Georgia, serif; font-size: 28px; color: #0f172a; margin: 0; font-weight: bold; line-height: 1.2; text-transform: uppercase; letter-spacing: 1px; }
            .hero-subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; color: #475569; margin: 12px 0 0; }
            .content { padding: 30px 32px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            .text { font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 20px; }
            .box { background-color: #f8fafc; border-radius: 16px; padding: 32px; margin: 30px 0; border: 1px solid #e2e8f0; text-align: center; }
            .box-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin: 0 0 24px; }
            .btn-wrap { text-align: center; margin: 40px 0 20px; }
            .btn { display: inline-block; background-color: #FD6941; color: #ffffff !important; padding: 18px 48px; border-radius: 14px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 6px 20px rgba(253,105,65,0.3); }
            .alert { background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 16px; color: #166534; font-size: 14px; text-align: center; font-weight: 500; margin-top: 24px; }
            .footer { background-color: #f8fafc; padding: 40px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            @media only screen and (max-width: 600px) {
                .wrapper { padding: 20px 10px; }
                .header-top, .hero, .content { padding-left: 20px; padding-right: 20px; }
                .hero-title { font-size: 32px; }
                .box { padding: 20px; }
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
                                <div style="display: block; text-align: center;">
                                    <img src="${LOGO_URL}" alt="EatGreet Logo" style="height: 50px; width: auto; display: block; margin: 0 auto; border: none;">
                                </div>
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
                                <p class="text" style="font-weight: 600; color: #0f172a;">Hello,</p>
                                <p class="text">We are thrilled to inform you that <b>${restaurantName}</b> has been approved for the EatGreet platform. Your personalized command center is ready.</p>
                                
                                <p class="text">Before you can access your dashboard, you need to set your permanent password and complete your restaurant profile.</p>
                                
                                <div class="btn-wrap">
                                    <a href="${setupUrl}" class="btn">Start Your Onboarding</a>
                                </div>

                                <div class="alert">
                                    <b>Security Note:</b> This link is unique to your email and will expire in 7 days.
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p style="color: #94a3b8; font-size: 11px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Powered by</p>
                                <img src="${LOGO_URL}" alt="EatGreet Logo" style="height: 32px; width: auto; display: block; margin: 0 auto; border: none;">
                                <p style="color: #94a3b8; font-size: 11px; margin: 16px 0 0;">© ${new Date().getFullYear()} EatGreet. All rights reserved.</p>
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
        subject: '✅ Approved: Complete your EatGreet Setup',
        html: html
    });
};

/**
 * REJECTION EMAIL (When admin declines registration)
 */
const sendRejectionEmail = async (userEmail, restaurantName) => {
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
            .logo { display: block; }
            .logo img { height: 45px; width: auto; display: block; margin: 0 auto; border: none; }
            .hero { padding: 40px 32px 10px; text-align: center; }
            .hero-title { font-family: Georgia, serif; font-size: 28px; color: #0f172a; margin: 0; font-weight: bold; line-height: 1.2; text-transform: uppercase; letter-spacing: 1px; }
            .hero-subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; color: #475569; margin: 12px 0 0; }
            .content { padding: 30px 32px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            .text { font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 20px; }
            .box { background-color: #fff1f2; border-radius: 16px; padding: 24px; margin: 30px 0; border: 1px solid #fecaca; }
            .footer { background-color: #f8fafc; padding: 40px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            @media only screen and (max-width: 600px) {
                .wrapper { padding: 20px 10px; }
                .hero-title { font-size: 24px; }
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
                                <div style="display: block; text-align: center;">
                                    <img src="${LOGO_URL}" alt="EatGreet Logo" style="height: 50px; width: auto; display: block; margin: 0 auto; border: none;">
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="hero">
                                <h1 class="hero-title">Application Status Update</h1>
                                <p class="hero-subtitle">Regarding ${restaurantName}</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="content">
                                <p class="text" style="font-weight: 600; color: #0f172a;">Hello,</p>
                                <p class="text">Thank you for your interest in partnering with EatGreet. After reviewing your business details, we regret to inform you that we are unable to approve your application at this time.</p>
                                
                                <div class="box">
                                    <p style="margin: 0; font-size: 14px; color: #9f1239; line-height: 1.6;">
                                        Our decision is based on our current platform guidelines and business requirements. Please note that this decision is final for this specific application.
                                    </p>
                                </div>

                                <p class="text">We appreciate the time you took to apply and wish you the best in your future endeavors.</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p style="color: #94a3b8; font-size: 11px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Powered by</p>
                                <img src="${LOGO_URL}" alt="EatGreet Logo" style="height: 32px; width: auto; display: block; margin: 0 auto; border: none;">
                                <p style="color: #94a3b8; font-size: 11px; margin: 16px 0 0;">© ${new Date().getFullYear()} EatGreet. All rights reserved.</p>
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
        subject: 'Update: Your EatGreet Application Request',
        html: html
    });
};

/**
 * ONBOARDING SUCCESS EMAIL (Sent after restaurant completes setup)
 */
const sendOnboardingSuccessEmail = async (userEmail, restaurantName, dashboardUrl) => {
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
            .logo { display: block; }
            .logo img { height: 45px; width: auto; display: block; margin: 0 auto; border: none; }
            .hero { padding: 40px 32px 10px; text-align: center; }
            .hero-title { font-family: Georgia, serif; font-size: 28px; color: #0f172a; margin: 0; font-weight: bold; line-height: 1.2; text-transform: uppercase; letter-spacing: 1px; }
            .hero-subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; color: #475569; margin: 12px 0 0; }
            .content { padding: 30px 32px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            .text { font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 20px; }
            .btn-wrap { text-align: center; margin: 40px 0 20px; }
            .btn { display: inline-block; background-color: #FD6941; color: #ffffff !important; padding: 18px 48px; border-radius: 14px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 6px 20px rgba(253,105,65,0.3); }
            .footer { background-color: #f8fafc; padding: 40px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            @media only screen and (max-width: 600px) {
                .wrapper { padding: 20px 10px; }
                .hero-title { font-size: 24px; }
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
                                <div style="display: block; text-align: center;">
                                    <img src="${LOGO_URL}" alt="EatGreet Logo" style="height: 50px; width: auto; display: block; margin: 0 auto; border: none;">
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="hero">
                                <h1 class="hero-title">Setup Complete!</h1>
                                <p class="hero-subtitle">Your dashboard for ${restaurantName} is ready</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="content">
                                <p class="text" style="font-weight: 600; color: #0f172a;">Congratulations!</p>
                                <p class="text">You have successfully completed the onboarding process for <b>${restaurantName}</b>. Your restaurant profile, menu settings, and security credentials are now fully active.</p>
                                
                                <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
                                    <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin: 0 0 16px;">Your Secure Login Details</p>
                                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                        <tr>
                                            <td style="padding-bottom: 12px;">
                                                <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Email / Username</p>
                                                <p style="margin: 4px 0 0; font-size: 16px; color: #0f172a; font-weight: 600;">${userEmail}</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Password</p>
                                                <p style="margin: 4px 0 0; font-size: 14px; color: #0f172a; font-weight: 500;">The secure password you created during setup</p>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <p class="text">You can now access your restaurant dashboard to manage your menu, track live orders, and view sales analytics.</p>

                                <div class="btn-wrap">
                                    <a href="${dashboardUrl}" class="btn">Login to Your Dashboard</a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p style="color: #94a3b8; font-size: 11px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Powered by</p>
                                <img src="${LOGO_URL}" alt="EatGreet Logo" style="height: 32px; width: auto; display: block; margin: 0 auto; border: none;">
                                <p style="color: #94a3b8; font-size: 11px; margin: 16px 0 0;">© ${new Date().getFullYear()} EatGreet. All rights reserved.</p>
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
        subject: `🚀 Your Dashboard is Ready: ${restaurantName}`,
        html: html
    });
};

/**
 * ADMIN NOTIFICATION (New registration)
 */
const sendAdminNotificationEmail = async ({ name, email, phone, city, restaurantName, registrationNote }) => {
    const adminEmail = process.env.APP_ADMIN_EMAIL || process.env.EMAIL_USER;
    const registeredAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: #ffffff; padding: 32px; text-align: center; border-bottom: 2px solid #FD6941;">
            <div style="margin-bottom: 0; text-align: center; display: inline-block;">
                <img src="${LOGO_URL}" alt="EatGreet Logo" style="height: 45px; width: auto; display: block; border: none;">
            </div>
            <h1 style="color: #0f172a; margin: 16px 0 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">New Registration Request</h1>
            <p style="color: #64748b; margin: 8px 0 0; font-size: 13px;">Action required for approval</p>
        </div>
        <div style="background: #ffffff; padding: 32px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px;">Business Name</p>
                <p style="margin: 4px 0 16px; font-size: 16px; color: #0f172a; font-weight: 800;">${restaurantName || 'New Restaurant'}</p>
                
                ${registrationNote ? `
                <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px;">Requirements / Notes</p>
                <p style="margin: 4px 0 0; font-size: 14px; color: #475569; font-style: italic;">"${registrationNote}"</p>
                ` : ''}
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-top: 24px; background: #f1f5f9; padding: 12px; border-radius: 8px;">
                🛡️ <b>Privacy Note:</b> Personal contact details have been withheld from this email. Please log in to the Super Admin Dashboard to securely view applicant details and process the review.
            </p>
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
        <div style="background: #ffffff; padding: 32px; text-align: center; border-bottom: 2px solid #FD6941;">
            <div style="margin-bottom: 0; text-align: center; display: inline-block;">
                <img src="${LOGO_URL}" alt="EatGreet Logo" style="height: 45px; width: auto; display: block; border: none;">
            </div>
            <h1 style="color: #0f172a; margin: 16px 0 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Subscription Reminder</h1>
        </div>
        <div style="background: #ffffff; padding: 32px;">
            <p>Hello,</p>
            <p style="color: #555; line-height: 1.6;">This is a friendly reminder that your <b>${planName}</b> plan will expire on <b>${new Date(endDate).toLocaleDateString()}</b>.</p>
            <p style="color: #555; line-height: 1.6;">To ensure uninterrupted service for your restaurant, please renew your plan soon.</p>
            <div style="margin: 30px 0; text-align: center;">
                <a href="${FRONTEND_URL}/renew-subscription" style="background-color: #FD6941; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">Renew Now</a>
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

/**
 * NEW ORDER NOTIFICATION (Sent to Restaurant Admin)
 */
const sendNewOrderNotificationEmail = async (adminEmail, restaurantName, orderData) => {
    const { items, totalAmount, tableNumber, customerInfo, dailySequence, instruction } = orderData;
    const formattedTotal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount);
    
    const itemsHtml = items.map(item => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px 0;">
                <p style="margin: 0; font-size: 14px; color: #0f172a; font-weight: 600;">${item.name || 'Item'}</p>
                <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">Qty: ${item.quantity || 1}</p>
            </td>
            <td style="padding: 12px 0; text-align: right; vertical-align: middle;">
                <p style="margin: 0; font-size: 14px; color: #0f172a; font-weight: 600;">₹${item.price * (item.quantity || 1)}</p>
            </td>
        </tr>
    `).join('');

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
            .logo { display: block; }
            .logo img { height: 50px; width: auto; display: block; border: none; }
            .hero { padding: 40px 32px 10px; text-align: center; }
            .hero-title { font-family: Georgia, serif; font-size: 28px; color: #0f172a; margin: 0; font-weight: bold; line-height: 1.2; text-transform: uppercase; letter-spacing: 1px; }
            .hero-subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; color: #475569; margin: 12px 0 0; }
            .content { padding: 30px 32px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            .text { font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 20px; }
            .box { background-color: #f8fafc; border-radius: 16px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0; }
            .box-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin: 0 0 12px; }
            .btn-wrap { text-align: center; margin: 40px 0 20px; }
            .btn { display: inline-block; background-color: #FD6941; color: #ffffff !important; padding: 18px 48px; border-radius: 14px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 6px 20px rgba(253,105,65,0.3); }
            .footer { background-color: #f8fafc; padding: 40px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            @media only screen and (max-width: 600px) {
                .wrapper { padding: 20px 10px; }
                .header-top, .hero, .content { padding-left: 20px; padding-right: 20px; }
                .hero-title { font-size: 28px; }
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
                                <div style="display: block; text-align: center;">
                                    <img src="${LOGO_URL}" alt="EatGreet Logo" style="height: 50px; width: auto; display: block; margin: 0 auto; border: none;">
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="hero">
                                <h1 class="hero-title">New Order Received!</h1>
                                <p class="hero-subtitle">Ticket #${dailySequence} • Table ${tableNumber || 'Takeaway'}</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="content">
                                <p class="text">A new order has been placed successfully at <b>${restaurantName}</b>. Below are the order details for your records.</p>
                                
                                <div class="box">
                                    <p class="box-title">Order Items</p>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 24px;">
                                        ${itemsHtml}
                                        <tr>
                                            <td style="padding: 24px 0 0;">
                                                <p style="margin: 0; font-size: 16px; color: #0f172a; font-weight: 800; text-transform: uppercase;">Total Amount</p>
                                            </td>
                                            <td style="padding: 24px 0 0; text-align: right;">
                                                <p style="margin: 0; font-size: 20px; color: #FD6941; font-weight: 800;">${formattedTotal}</p>
                                            </td>
                                        </tr>
                                    </table>

                                    ${instruction ? `
                                    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #e2e8f0;">
                                        <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px;">Special Instructions</p>
                                        <p style="margin: 6px 0 0; font-size: 13px; color: #475569; font-style: italic;">"${instruction}"</p>
                                    </div>
                                    ` : ''}
                                </div>

                                <div class="btn-wrap">
                                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/orders" class="btn">View Order Dashboard</a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p style="color: #94a3b8; font-size: 11px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 1px;">Powered by</p>
                                <img src="${LOGO_URL}" alt="EatGreet Logo" style="height: 32px; width: auto; display: block; margin: 0 auto; border: none;">
                                <p style="color: #94a3b8; font-size: 11px; margin: 16px 0 0;">© ${new Date().getFullYear()} EatGreet. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;

    return sendEmail({
        email: adminEmail,
        subject: `🔔 New Order #${dailySequence} - Table ${tableNumber || 'Takeaway'}`,
        html: html
    });
};

const sendSuperAdminOtpEmail = async (userEmail, otpCode) => {
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: #ffffff; padding: 32px; text-align: center; border-bottom: 2px solid #111827;">
            <div style="margin-bottom: 0; text-align: center; display: inline-block;">
                <img src="${LOGO_URL}" alt="EatGreet Logo" style="height: 45px; width: auto; display: block; border: none;">
            </div>
            <h1 style="color: #111827; margin: 16px 0 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Super Admin OTP</h1>
            <p style="color: #64748b; margin: 8px 0 0; font-size: 13px;">EatGreet secure access verification</p>
        </div>
        <div style="background: #ffffff; padding: 32px;">
            <p style="color: #374151; line-height: 1.6; margin: 0 0 12px;">
                Use this one-time password to sign in to your Super Admin portal.
            </p>
            <div style="text-align:center; margin: 28px 0;">
                <span style="display:inline-block; letter-spacing: 6px; font-size: 32px; font-weight: 800; color: #111827; background: #f3f4f6; padding: 14px 20px; border-radius: 12px; border: 1px dashed #9ca3af;">${otpCode}</span>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin: 0;">This OTP expires in 2 minutes.</p>
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

/**
 * PASSWORD RESET EMAIL
 */
const sendForgotPasswordEmail = async (userEmail, userName, resetUrl) => {
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
            .logo img { height: 50px; width: auto; display: block; margin: 0 auto; border: none; }
            .hero { padding: 40px 32px 10px; text-align: center; }
            .hero-title { font-family: Georgia, serif; font-size: 28px; color: #0f172a; margin: 0; font-weight: bold; line-height: 1.2; text-transform: uppercase; letter-spacing: 1px; }
            .content { padding: 30px 32px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
            .text { font-size: 16px; color: #475569; line-height: 1.6; margin: 0 0 20px; }
            .btn-wrap { text-align: center; margin: 40px 0 20px; }
            .btn { display: inline-block; background-color: #000000; color: #ffffff !important; padding: 18px 48px; border-radius: 14px; font-weight: 600; font-size: 16px; text-decoration: none; box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
            .alert { background-color: #fff1f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; color: #9f1239; font-size: 13px; text-align: center; margin-top: 24px; }
            .footer { background-color: #f8fafc; padding: 40px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
    </head>
    <body>
        <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td align="center">
                    <table class="container" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                            <td class="header-top">
                                <img src="${LOGO_URL}" alt="EatGreet Logo">
                            </td>
                        </tr>
                        <tr>
                            <td class="hero">
                                <h1 class="hero-title">Reset Your Password</h1>
                            </td>
                        </tr>
                        <tr>
                            <td class="content">
                                <p class="text">Hello <b>${userName}</b>,</p>
                                <p class="text">We received a request to reset the password for your EatGreet account. Click the button below to choose a new password.</p>
                                
                                <div class="btn-wrap">
                                    <a href="${resetUrl}" class="btn">Reset Password</a>
                                </div>

                                <div class="alert">
                                    <b>Security Note:</b> This link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact support if you have concerns.
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} EatGreet. All rights reserved.</p>
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
        subject: '🔐 Password Reset Request - EatGreet',
        html: html
    });
};

module.exports = {
    sendEmail,
    verifySMTP,
    sendWelcomeEmail,
    sendApprovalEmail,
    sendRejectionEmail,
    sendOnboardingSuccessEmail,
    sendAdminNotificationEmail,
    sendSubscriptionReminder,
    sendSuperAdminOtpEmail,
    sendNewOrderNotificationEmail,
    sendForgotPasswordEmail
};
