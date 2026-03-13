const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendWelcomeEmail, sendAdminNotificationEmail, sendSuperAdminOtpEmail } = require('../utils/emailService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const detectDevice = (userAgent = '') => {
    const ua = userAgent.toLowerCase();
    if (!ua) return 'Unknown Device';

    const os = ua.includes('windows') ? 'Windows'
        : ua.includes('mac os') || ua.includes('macintosh') ? 'macOS'
            : ua.includes('android') ? 'Android'
                : ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios') ? 'iOS'
                    : ua.includes('linux') ? 'Linux'
                        : 'Unknown OS';

    const browser = ua.includes('edg/') ? 'Edge'
        : ua.includes('chrome/') ? 'Chrome'
            : ua.includes('safari/') && !ua.includes('chrome/') ? 'Safari'
                : ua.includes('firefox/') ? 'Firefox'
                    : 'Unknown Browser';

    return `${browser} on ${os}`;
};

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.ip || req.connection?.remoteAddress || 'Unknown';
};

const getLocationHint = (req) => {
    const city = req.headers['x-vercel-ip-city'];
    const region = req.headers['x-vercel-ip-country-region'];
    const country = req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'];

    if (city && country) return `${city}, ${country}`;
    if (region && country) return `${region}, ${country}`;
    if (country) return `${country}`;
    return 'Unknown';
};

const SUPER_ADMIN_LOGIN_EMAIL = (process.env.SUPERADMIN_LOGIN_EMAIL || 'superadmin.eatgreet@gmail.com').toLowerCase().trim();

const createOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));
const hashOtp = (otpCode) => crypto.createHash('sha256').update(otpCode).digest('hex');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, phone, city, restaurantName, currency } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const subscription = role === 'admin' ? {
            plan: 'Trial',
            status: 'Active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            autoRenew: false
        } : { plan: 'None', status: 'None' };

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'customer',
            phone,
            city,
            restaurantName,
            currency: currency || 'INR',
            subscription,
            isApproved: role === 'admin' ? false : true
        });

        if (user) {
            const isAdmin = user.role === 'admin';

            // 1. Send welcome email to the new user (Under Review if Admin) - async
            try {
                await sendWelcomeEmail(
                    user.email,
                    user.name,
                    user.restaurantName,
                    user.phone,
                    user.city,
                    isAdmin // isPending = true if admin
                );
            } catch (err) {
                console.error("❌ Welcome email failed for:", user.email, err.message);
            }

            // 2. Notify the Super Admin about this new registration - async
            if (isAdmin) {
                try {
                    await sendAdminNotificationEmail({
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        city: user.city,
                        restaurantName: user.restaurantName
                    });
                } catch (err) {
                    console.error("❌ Admin notification email failed:", err.message);
                }
            }

            // If it's a pending admin, we stop here with a specific message
            if (isAdmin && !user.isApproved) {
                return res.status(201).json({
                    message: 'Registration successful! Your application is pending approval from our Super Admin team. You will receive an email with your credentials once verified.',
                    isApproved: false,
                    email: user.email
                });
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                restaurantName: user.restaurantName,
                currency: user.currency,
                profilePicture: user.profilePicture,
                subscription: user.subscription,
                isOnboarded: user.isOnboarded,
                isApproved: user.isApproved,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('name email password role phone city restaurantName currency profilePicture restaurantDetails subscription isOnboarded isApproved');

        if (user && (await user.matchPassword(password))) {
            if (!user.isApproved) {
                return res.status(401).json({ message: 'Your account is pending approval. Please check your email for confirmation.' });
            }

            if (user.role === 'superadmin') {
                return res.status(403).json({ message: 'Super Admin must login using OTP. Use /super-admin/secure-login.' });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                city: user.city,
                restaurantName: user.restaurantName,
                currency: user.currency,
                profilePicture: user.profilePicture,
                restaurantDetails: user.restaurantDetails,
                subscription: user.subscription,
                isOnboarded: user.isOnboarded,
                isApproved: user.isApproved,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send OTP for super-admin secure login
// @route   POST /api/auth/superadmin/send-otp
// @access  Public
const sendSuperAdminOtp = async (req, res) => {
    console.log('📬 NEW OTP REQUEST RECEIVED:', req.body);
    try {
        const { email } = req.body;
        const normalizedEmail = (email || '').toLowerCase().trim();

        const user = await User.findOne({ role: 'superadmin' });
        if (!user) {
            console.error('🚨 SUPERADMIN_AUTH_ERROR: No user with role [superadmin] found in database!');
            return res.status(404).json({ message: 'Super Admin account not found in database.' });
        }

        // Determine authorized email: Priority 1: Env Var | Priority 2: Database Email
        const authorizedEmail = (process.env.SUPERADMIN_LOGIN_EMAIL || user.email).toLowerCase().trim();

        if (normalizedEmail !== authorizedEmail) {
            console.warn(`🚨 SUPERADMIN_AUTH_FAILURE: Received [${normalizedEmail}] but expected [${authorizedEmail}]`);
            return res.status(403).json({ 
                message: 'Unauthorized email for Super Admin access.',
                debug: process.env.NODE_ENV === 'development' ? `Expected ${authorizedEmail}` : undefined
            });
        }

        const now = new Date();
        const lastSent = user.superAdminOtp?.lastSentAt ? new Date(user.superAdminOtp.lastSentAt) : null;
        if (lastSent && now.getTime() - lastSent.getTime() < 60 * 1000) {
            return res.status(429).json({ message: 'OTP already sent recently. Please wait 60 seconds.' });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(503).json({
                message: 'Email service is not configured on server. Please set EMAIL_USER and EMAIL_PASS.'
            });
        }

        const otpCode = createOtpCode();

        user.superAdminOtp = {
            codeHash: hashOtp(otpCode),
            expiresAt: new Date(now.getTime() + 2 * 60 * 1000),
            lastSentAt: now,
            attempts: 0
        };
        await user.save();

        // On Vercel, we MUST await the email sending, otherwise the serverless function 
        // will terminate before the background task completes, and the user won't get the OTP.
        console.log(`📡 Sending Super Admin OTP to ${normalizedEmail}...`);
        
        // Print to logs as a fallback so you can always see the code in Render/Vercel Dashboard
        console.log(`🔑 [SECURITY LOG] Super Admin OTP Code: ${otpCode}`);
        if (process.env.SUPERADMIN_OTP_BYPASS) {
            console.log(`🔒 [SECURITY LOG] Bypass Code is active: ${process.env.SUPERADMIN_OTP_BYPASS}`);
        }

        try {
            await sendSuperAdminOtpEmail(normalizedEmail, otpCode);
            console.log(`✅ Super Admin OTP delivered via email to ${normalizedEmail}`);

            res.status(200).json({ 
                message: 'Access code sent! Please check your email.',
                otpSent: true 
            });
        } catch (emailError) {
            console.error(`❌ Email Delivery Failed: ${emailError.message}`);
            // If email fails, we still returned the code in logs (above), 
            // but we should tell the user there was a delivery issue.
            return res.status(502).json({ 
                message: 'Failed to deliver OTP email. Please check server logs or try again.',
                error: emailError.message
            });
        }
    } catch (error) {
        console.error('❌ Super Admin OTP Error:', error);
        if (error.code === 'EAUTH') {
            return res.status(502).json({ message: 'SMTP authentication failed. Please verify email credentials.' });
        }
        if (['ECONNECTION', 'ETIMEDOUT', 'ESOCKET'].includes(error.code)) {
            return res.status(504).json({ message: 'Email server timeout. Please try again in a moment.' });
        }
        res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }
};


// @desc    Verify OTP and login as super-admin
// @route   POST /api/auth/superadmin/verify-otp
// @access  Public
const verifySuperAdminOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = (email || '').toLowerCase().trim();
        const enteredOtp = (otp || '').toString().trim();

        if (!/^\d{6}$/.test(enteredOtp)) {
            return res.status(400).json({ message: 'Enter valid 6-digit OTP.' });
        }

        const user = await User.findOne({ role: 'superadmin' })
            .select('name email role phone city restaurantName currency profilePicture restaurantDetails subscription isOnboarded isApproved superAdminOtp securityLogs');
        
        if (!user) {
            console.error('🚨 SUPERADMIN_AUTH_ERROR_VERIFY: No user with role [superadmin] found in database!');
            return res.status(404).json({ message: 'Super Admin account not found.' });
        }

        // Determine authorized email: Priority 1: Env Var | Priority 2: Database Email
        const authorizedEmail = (process.env.SUPERADMIN_LOGIN_EMAIL || user.email).toLowerCase().trim();

        if (normalizedEmail !== authorizedEmail) {
            console.warn(`🚨 SUPERADMIN_AUTH_FAILURE_VERIFY: Received [${normalizedEmail}] but expected [${authorizedEmail}]`);
            return res.status(403).json({ 
                message: 'Unauthorized email for Super Admin verification.',
                debug: process.env.NODE_ENV === 'development' ? `Expected ${authorizedEmail}` : undefined
            });
        }
        if (!user.superAdminOtp?.codeHash || !user.superAdminOtp?.expiresAt) {
            return res.status(400).json({ message: 'Please request OTP first.' });
        }

        if (new Date(user.superAdminOtp.expiresAt) < new Date()) {
            return res.status(400).json({ message: 'OTP expired. Request a new one.' });
        }

        if (user.superAdminOtp.attempts >= 5) {
            return res.status(429).json({ message: 'Too many attempts. Request a new OTP.' });
        }

        const otpHash = hashOtp(enteredOtp);
        const bypassCode = process.env.SUPERADMIN_OTP_BYPASS;
        const isBypass = bypassCode && enteredOtp === bypassCode;

        if (!isBypass && otpHash !== user.superAdminOtp.codeHash) {
            user.superAdminOtp.attempts += 1;
            await user.save();
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        const device = detectDevice(req.headers['user-agent'] || '');
        const logEntry = {
            eventType: 'login',
            at: new Date(),
            ipAddress: getClientIp(req),
            location: getLocationHint(req),
            device,
            userAgent: req.headers['user-agent'] || ''
        };
        user.securityLogs = [logEntry, ...(user.securityLogs || [])].slice(0, 100);
        user.superAdminOtp = { codeHash: '', expiresAt: null, lastSentAt: new Date(), attempts: 0 };
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            city: user.city,
            restaurantName: user.restaurantName,
            currency: user.currency,
            profilePicture: user.profilePicture,
            restaurantDetails: user.restaurantDetails,
            subscription: user.subscription,
            isOnboarded: user.isOnboarded,
            isApproved: user.isApproved,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get super-admin login activity
// @route   GET /api/auth/superadmin/login-activity
// @access  Private (Super Admin)
const getSuperAdminLoginActivity = async (req, res) => {
    try {
        const superAdmins = await User.find({ role: 'superadmin' })
            .select('name email securityLogs')
            .lean();

        const rows = superAdmins.flatMap((admin) =>
            (admin.securityLogs || [])
                .filter((log) => log.eventType === 'login')
                .map((log) => ({
                    who: admin.name || admin.email || 'Super Admin',
                    email: admin.email || '',
                    when: log.at || null,
                    where: log.location || 'Unknown',
                    which: log.device || 'Unknown Device',
                    ip: log.ipAddress || 'Unknown'
                }))
        );

        rows.sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0));

        res.json(rows.slice(0, 50));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                city: user.city,
                restaurantName: user.restaurantName,
                currency: user.currency,
                profilePicture: user.profilePicture,
                restaurantDetails: user.restaurantDetails,
                subscription: user.subscription,
                isOnboarded: user.isOnboarded
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            user.city = req.body.city || user.city;
            user.restaurantName = req.body.restaurantName || user.restaurantName;
            user.currency = req.body.currency || user.currency;
            user.profilePicture = req.body.profilePicture || user.profilePicture;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                city: updatedUser.city,
                restaurantName: updatedUser.restaurantName,
                currency: updatedUser.currency,
                profilePicture: updatedUser.profilePicture,
                restaurantDetails: updatedUser.restaurantDetails,
                isOnboarded: updatedUser.isOnboarded,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users (Super Admin)
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    authUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    getSuperAdminLoginActivity,
    sendSuperAdminOtp,
    verifySuperAdminOtp
};
