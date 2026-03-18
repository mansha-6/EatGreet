const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail, sendAdminNotificationEmail, sendSuperAdminOtpEmail, sendForgotPasswordEmail } = require('../utils/emailService');

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

const validatePassword = (password) => {
    if (!password) return { isValid: false, message: 'Password is required' };
    if (password.length < 8 || password.length > 15) {
        return { isValid: false, message: 'Password must be between 8 and 15 characters' };
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
        return { isValid: false, message: 'Password must include uppercase, lowercase, numbers, and symbols' };
    }
    return { isValid: true };
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, phone, city, restaurantName, currency, registrationNote } = req.body;

    // Only validate password complexity for non-admin initial registrations
    // Admin registrations from landing page use phone as temporary password (handled in SetupPassword later)
    const isInitialAdminReg = (role === 'admin' && password === phone);
    if (!isInitialAdminReg) {
        const passValidation = validatePassword(password);
        if (!passValidation.isValid) {
            return res.status(400).json({ message: passValidation.message });
        }
    }

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
            registrationNote,
            subscription,
            isApproved: role === 'admin' ? false : true
        });

        if (user) {
            const isAdmin = user.role === 'admin';

            // If it's a pending admin, respond immediately
            if (isAdmin && !user.isApproved) {
                res.status(201).json({
                    message: 'Registration successful! Your application is pending approval from our Super Admin team. You will receive an email with your credentials once verified.',
                    isApproved: false,
                    email: user.email
                });
            } else {
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
            }

            // 3. Dispatch emails in background AFTER response
            if (isAdmin) {
                // 1. Send welcome email to the new restaurant admin (Under Review)
                sendWelcomeEmail(
                    user.email,
                    user.name,
                    user.restaurantName,
                    user.phone,
                    user.city,
                    true, // isPending = true
                    user.registrationNote
                ).catch(err => console.error("❌ Background Welcome email failed:", err.message));

                // 2. Notify the Super Admin about this new registration
                sendAdminNotificationEmail({
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    city: user.city,
                    restaurantName: user.restaurantName,
                    registrationNote: user.registrationNote
                }).catch(err => console.error("❌ Background Admin notification failed:", err.message));
            }

            return; // Exit function after response and async dispatch
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

            // For restaurant admins, ensure they have completed onboarding OR have existing details before allowing login
            const hasBasicDetails = user.restaurantDetails?.address?.trim() && user.restaurantDetails?.cuisineType?.trim();
            if (user.role === 'admin' && !user.isOnboarded && !hasBasicDetails) {
                return res.status(401).json({ message: 'Please complete your restaurant setup using the link sent to your email before logging in.' });
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
            console.error(`🚨 EMAIL_SERVICE_ERROR: EMAIL_USER is ${process.env.EMAIL_USER ? 'PRESENT' : 'MISSING'}, EMAIL_PASS is ${process.env.EMAIL_PASS ? 'PRESENT' : 'MISSING'}.`);
            return res.status(503).json({
                message: 'Email service is not configured on server. Please set EMAIL_USER and EMAIL_PASS.'
            });
        }

        const otpCode = createOtpCode();
        const newOtpData = {
            codeHash: hashOtp(otpCode),
            expiresAt: new Date(now.getTime() + 5 * 60 * 1000), // Extended to 5 mins for better UX
            lastSentAt: now,
            attempts: 0
        };

        // 2. Send email first. If it fails, we don't update the user's OTP in DB.
        console.log(`📡 Dispatching Super Admin OTP to ${normalizedEmail}...`);
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG_OTP === 'true') {
            console.log(`🔑 [SECURITY LOG] Super Admin OTP Code: ${otpCode}`);
        }
        
        try {
            await sendSuperAdminOtpEmail(normalizedEmail, otpCode);
            
            // 3. Only save to DB if email sent successfully
            user.superAdminOtp = newOtpData;
            await user.save();

            res.status(200).json({
                message: 'Access code sent! Please check your email.',
                otpSent: true
            });
        } catch (emailError) {
            console.error(`❌ Email Delivery Failed: ${emailError.message}`);
            res.status(500).json({ 
                message: `Failed to deliver OTP email: ${emailError.message}`,
                debug: process.env.NODE_ENV === 'development' ? emailError.stack : undefined
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
            // If email is being changed, check if new email is already taken
            if (req.body.email && req.body.email !== user.email) {
                const emailExists = await User.findOne({ email: req.body.email });
                if (emailExists) {
                    return res.status(400).json({ message: 'Email address already in use by another account' });
                }
            }

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

// @desc    Setup account password with token
// @route   POST /api/auth/setup-password
// @access  Public
const setupPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and Password are required' });
        }

        const passValidation = validatePassword(password);
        if (!passValidation.isValid) {
            return res.status(400).json({ message: passValidation.message });
        }

        const user = await User.findOne({
            setupToken: token,
            setupTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired setup token' });
        }

        // Update password and clear setup token
        user.password = password;
        user.setupToken = null;
        user.setupTokenExpires = null;

        await user.save();

        res.json({
            message: 'Password set successfully. You can now log in.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Please provide an email address' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No account found with that email address' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        try {
            await sendForgotPasswordEmail(user.email, user.name, resetUrl);
            res.status(200).json({ message: 'Password reset link sent to your email' });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        console.error('🔥 Forgot Password Error:', error);
        res.status(500).json({ 
            message: error.message || 'Internal Server Error during password reset request',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Set new password
        const passValidation = validatePassword(req.body.password);
        if (!passValidation.isValid) {
            return res.status(400).json({ message: passValidation.message });
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
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
    verifySuperAdminOtp,
    setupPassword,
    forgotPassword,
    resetPassword
};
