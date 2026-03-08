const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendWelcomeEmail, sendAdminNotificationEmail } = require('../utils/emailService');

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
            sendWelcomeEmail(
                user.email,
                user.name,
                user.restaurantName,
                user.phone,
                user.city,
                isAdmin // isPending = true if admin
            ).catch(err => console.error("Welcome email failed:", err));

            // 2. Notify the Super Admin about this new registration - async
            if (isAdmin) {
                sendAdminNotificationEmail({
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    city: user.city,
                    restaurantName: user.restaurantName
                }).catch(err => console.error("Admin notification email failed:", err));
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
    try {
        const { email } = req.body;
        const normalizedEmail = (email || '').toLowerCase().trim();

        if (normalizedEmail !== SUPER_ADMIN_LOGIN_EMAIL) {
            return res.status(403).json({ message: 'Unauthorized email for Super Admin OTP.' });
        }

        const user = await User.findOne({ role: 'superadmin' });
        if (!user) {
            return res.status(404).json({ message: 'Super Admin account not found.' });
        }
        const now = new Date();
        const lastSent = user.superAdminOtp?.lastSentAt ? new Date(user.superAdminOtp.lastSentAt) : null;
        if (lastSent && now.getTime() - lastSent.getTime() < 60 * 1000) {
            return res.status(429).json({ message: 'OTP already sent recently. Please wait 60 seconds.' });
        }

        const otpCode = createOtpCode();
        const { sendSuperAdminOtpEmail } = require('../utils/emailService');

        await sendSuperAdminOtpEmail(normalizedEmail, otpCode);

        user.superAdminOtp = {
            codeHash: hashOtp(otpCode),
            expiresAt: new Date(now.getTime() + 60 * 1000),
            lastSentAt: now,
            attempts: 0
        };
        await user.save();

        res.status(201).json({ message: 'OTP sent to Super Admin email.' });
    } catch (error) {
        console.error('❌ Super Admin OTP Error:', error);
        res.status(500).json({ message: error.message || 'Internal Server Error' });
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

        if (normalizedEmail !== SUPER_ADMIN_LOGIN_EMAIL) {
            return res.status(403).json({ message: 'Unauthorized email for Super Admin OTP.' });
        }
        if (!/^\d{6}$/.test(enteredOtp)) {
            return res.status(400).json({ message: 'Enter valid 6-digit OTP.' });
        }

        const user = await User.findOne({ role: 'superadmin' })
            .select('name email role phone city restaurantName currency profilePicture restaurantDetails subscription isOnboarded isApproved superAdminOtp securityLogs');
        if (!user) {
            return res.status(404).json({ message: 'Super Admin account not found.' });
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
        if (otpHash !== user.superAdminOtp.codeHash) {
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
