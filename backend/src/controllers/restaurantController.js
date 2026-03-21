const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {
    sendEmail,
    sendApprovalEmail,
    sendRejectionEmail,
    sendOnboardingSuccessEmail,
    sendSubscriptionReminder: sendSubReminder
} = require('../utils/emailService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Get restaurant details
// @route   GET /api/restaurant
// @access  Private (Admin)
const getRestaurantDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.syncSubscription();

        if (!user.restaurantDetails) {
            return res.status(404).json({ message: 'Restaurant details not set' });
        }

        res.json({
            _id: user._id,
            name: user.restaurantName || user.name,
            description: user.restaurantDetails.description,
            address: user.restaurantDetails.address,
            contactNumber: user.restaurantDetails.contactNumber,
            logo: user.restaurantDetails.logo,
            gstNumber: user.restaurantDetails.gstNumber,
            cuisineType: user.restaurantDetails.cuisineType,
            businessEmail: user.restaurantDetails.businessEmail,
            isActive: user.restaurantDetails.isActive ?? true,
            totalTables: user.restaurantDetails.totalTables || 0,
            currency: user.currency || 'INR',
            location: user.restaurantDetails.location,
            operatingHours: user.restaurantDetails.operatingHours,
            monthlyExpense: user.restaurantDetails.monthlyExpense || 0,
            tableNumbers: user.restaurantDetails.tableNumbers || [],
            orderPreferences: user.orderPreferences,
            bankDetails: user.bankDetails,
            notificationPreferences: user.notificationPreferences,
            subscription: user.subscription || { plan: 'None', status: 'None' },
            joinedAt: user.restaurantDetails?.joinedAt || user.createdAt,
            staff: user.staff
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant details
// @route   PUT /api/restaurant
// @access  Private (Admin)
const updateRestaurantDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // Init details object if missing
            if (!user.restaurantDetails) user.restaurantDetails = {};

            user.restaurantName = req.body.name || user.restaurantName;

            user.restaurantDetails.description = req.body.description || user.restaurantDetails.description;
            user.restaurantDetails.address = req.body.address || user.restaurantDetails.address;
            user.restaurantDetails.contactNumber = req.body.contactNumber || user.restaurantDetails.contactNumber;
            user.restaurantDetails.logo = req.body.logo || user.restaurantDetails.logo;
            user.restaurantDetails.gstNumber = req.body.gstNumber || user.restaurantDetails.gstNumber;
            user.restaurantDetails.cuisineType = req.body.cuisineType || user.restaurantDetails.cuisineType;
            user.restaurantDetails.businessEmail = req.body.businessEmail || user.restaurantDetails.businessEmail;
            user.restaurantDetails.totalTables = req.body.totalTables ?? user.restaurantDetails.totalTables;
            user.restaurantDetails.tableNumbers = req.body.tableNumbers || user.restaurantDetails.tableNumbers;
            user.restaurantDetails.monthlyExpense = req.body.monthlyExpense !== undefined ? Number(req.body.monthlyExpense) : user.restaurantDetails.monthlyExpense;

            // New Fields
            if (req.body.location) {
                user.restaurantDetails.location = {
                    lat: req.body.location.lat ?? user.restaurantDetails.location.lat,
                    lng: req.body.location.lng ?? user.restaurantDetails.location.lng
                };
            }
            if (req.body.operatingHours) {
                user.restaurantDetails.operatingHours = {
                    open: req.body.operatingHours.open || user.restaurantDetails.operatingHours.open,
                    close: req.body.operatingHours.close || user.restaurantDetails.operatingHours.close
                };
            }
            if (req.body.orderPreferences) {
                user.orderPreferences = {
                    acceptOrders: req.body.orderPreferences.acceptOrders ?? user.orderPreferences.acceptOrders,
                    autoAccept: req.body.orderPreferences.autoAccept ?? user.orderPreferences.autoAccept,
                    cancelEnabled: req.body.orderPreferences.cancelEnabled ?? user.orderPreferences.cancelEnabled,
                    avgPrepTime: req.body.orderPreferences.avgPrepTime ?? user.orderPreferences.avgPrepTime
                };
            }
            if (req.body.bankDetails) {
                user.bankDetails = {
                    accountHolder: req.body.bankDetails.accountHolder || user.bankDetails.accountHolder,
                    accountNumber: req.body.bankDetails.accountNumber || user.bankDetails.accountNumber,
                    bankName: req.body.bankDetails.bankName || user.bankDetails.bankName,
                    ifscCode: req.body.bankDetails.ifscCode || user.bankDetails.ifscCode,
                    settlementCycle: req.body.bankDetails.settlementCycle || user.bankDetails.settlementCycle
                };
            }
            if (req.body.notificationPreferences) {
                user.notificationPreferences = {
                    newOrder: req.body.notificationPreferences.newOrder ?? user.notificationPreferences.newOrder,
                    statusUpdates: req.body.notificationPreferences.statusUpdates ?? user.notificationPreferences.statusUpdates,
                    emailNotifications: req.body.notificationPreferences.emailNotifications ?? user.notificationPreferences.emailNotifications,
                    paymentReceived: req.body.notificationPreferences.paymentReceived ?? user.notificationPreferences.paymentReceived
                };
            }
            if (req.body.staff) {
                user.staff = req.body.staff;
            }

            const updatedUser = await user.save();
            const details = updatedUser.restaurantDetails.toObject();

            res.json({
                ...details,
                name: updatedUser.restaurantName,
                restaurantDetails: details
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create restaurant (Updates User with Restaurant Details)
// @route   POST /api/restaurant
// @access  Private (Admin)
const createRestaurant = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user.restaurantDetails && user.restaurantDetails.isActive) {
            // Technically checking if they already 'have' a restaurant
            // For now we assume 1 user = 1 restaurant
            // return res.status(400).json({ message: 'Restaurant already exists' });
            // Actually, create might be treated as upsert or init
        }

        user.restaurantName = req.body.name;
        user.restaurantDetails = {
            description: req.body.description,
            address: req.body.address,
            contactNumber: req.body.contactNumber,
            logo: req.body.logo,
            gstNumber: req.body.gstNumber,
            isActive: true,
            joinedAt: new Date()
        };

        const updated = await user.save();
        res.status(201).json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Complete restaurant onboarding
// @route   POST /api/restaurant/onboard
// @access  Public (Token) / Private (Admin)
const completeOnboarding = async (req, res) => {
    try {
        const {
            token,
            password,
            restaurantName,
            description,
            address,
            contactNumber,
            gstNumber,
            cuisineType,
            businessEmail,
            location,
            operatingHours
        } = req.body;

        let user;

        // 1. Find User (either by current auth or by setup token)
        if (token) {
            user = await User.findOne({
                setupToken: token,
                setupTokenExpires: { $gt: Date.now() }
            });
            if (!user) {
                return res.status(404).json({ message: 'Invalid or expired setup token' });
            }
        } else if (req.user) {
            user = await User.findById(req.user._id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
        } else {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // 2. Setup or Update Password
        if (token) {
            const checks = {
                length: password && password.length >= 8 && password.length <= 16,
                upper: /[A-Z]/.test(password),
                lower: /[a-z]/.test(password),
                digit: /[0-9]/.test(password),
                symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
            };

            const missing = [];
            if (!password) missing.push("Password required");
            else {
                if (password.length < 8) missing.push("Password too short (min 8 chars)");
                if (password.length > 16) missing.push("Password too long (max 16 chars)");
                if (!checks.upper) missing.push("Uppercase letter missing");
                if (!checks.lower) missing.push("Lowercase letter missing");
                if (!checks.digit) missing.push("Digit missing");
                if (!checks.symbol) missing.push("Symbol missing");
            }

            if (missing.length > 0) {
                return res.status(400).json({ message: missing[0] });
            }
            user.password = password;
            // Clear setup token after use and save to usedSetupTokens
            if (!user.usedSetupTokens) user.usedSetupTokens = [];
            user.usedSetupTokens.push(token);
            user.setupToken = undefined;
            user.setupTokenExpires = undefined;
            user.isApproved = true; // Ensure they are marked approved
        } else if (password) {
            if (password.length >= 6) {
                user.password = password;
            }
        }

        // Mandatory fields check
        if (!restaurantName || !address || !contactNumber || !gstNumber || !cuisineType || !businessEmail) {
            return res.status(400).json({ message: 'Please fill all mandatory fields' });
        }

        // 3. Update Restaurant Details
        user.restaurantName = restaurantName;
        user.restaurantDetails = {
            ...user.restaurantDetails,
            description,
            address,
            contactNumber,
            gstNumber,
            cuisineType,
            businessEmail,
            location: location || { lat: 23.0225, lng: 72.5714 },
            operatingHours: operatingHours || { open: '09:00', close: '23:00' },
            isActive: true,
            joinedAt: user.restaurantDetails?.joinedAt || new Date()
        };

        user.isOnboarded = true;

        const updatedUser = await user.save();

        // Send Success Email in background
        const { sendOnboardingSuccessEmail } = require('../utils/emailService');
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const slug = restaurantName.toLowerCase().replace(/\s+/g, '-');
        const dashboardUrl = `${frontendUrl}/${slug}/admin`;

        sendOnboardingSuccessEmail(
            updatedUser.email,
            updatedUser.restaurantName,
            dashboardUrl
        ).catch(err => console.error('❌ Background Onboarding success email failed:', err.message));

        res.json({
            message: 'Onboarding completed successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                restaurantName: updatedUser.restaurantName,
                isOnboarded: updatedUser.isOnboarded,
                restaurantDetails: updatedUser.restaurantDetails,
                token: generateToken(updatedUser._id)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSetupDetails = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({
            $or: [
                { setupToken: token, setupTokenExpires: { $gt: Date.now() } },
                { usedSetupTokens: token }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'Invalid or expired setup token' });
        }

        if (user.usedSetupTokens && user.usedSetupTokens.includes(token)) {
            return res.json({
                alreadyOnboarded: true,
                restaurantName: user.restaurantName,
                email: user.email
            });
        }

        res.json({
            name: user.name,
            email: user.email,
            phone: user.phone,
            restaurantName: user.restaurantName
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all pending restaurant registrations (Super Admin)c Get public restaurant info by ID (Mapped from User)
const getRestaurantPublic = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (user) {
            await user.syncSubscription();
        }

        // Check if user exists and is an admin (restaurant owner)
        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const restaurantData = {
            _id: user._id,
            name: user.restaurantName || user.name,
            restaurantName: user.restaurantName,
            description: user.restaurantDetails?.description,
            address: user.restaurantDetails?.address,
            contactNumber: user.restaurantDetails?.contactNumber,
            logo: user.restaurantDetails?.logo,
            gstNumber: user.restaurantDetails?.gstNumber,
            cuisineType: user.restaurantDetails?.cuisineType,
            businessEmail: user.restaurantDetails?.businessEmail,
            isActive: user.restaurantDetails?.isActive ?? true,
            currency: user.currency || 'INR'
        };

        res.json(restaurantData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get public restaurant info by DB Name (or slug) - useful for domains
const getRestaurantByName = async (req, res) => {
    try {
        const name = req.params.name;
        // Create a regex that allows hyphens in the input to match spaces or hyphens in the DB
        const searchPattern = name.replace(/-/g, '[\\s-]');
        const regex = new RegExp(`^${searchPattern}$`, 'i');

        const user = await User.findOne({
            $or: [
                { restaurantName: { $regex: regex } },
                { name: { $regex: regex } }
            ]
        }).select('-password');

        if (user) {
            await user.syncSubscription();
        }

        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const restaurantData = {
            _id: user._id,
            name: user.restaurantName || user.name,
            restaurantName: user.restaurantName,
            description: user.restaurantDetails?.description,
            address: user.restaurantDetails?.address,
            contactNumber: user.restaurantDetails?.contactNumber,
            logo: user.restaurantDetails?.logo,
            gstNumber: user.restaurantDetails?.gstNumber,
            cuisineType: user.restaurantDetails?.cuisineType,
            businessEmail: user.restaurantDetails?.businessEmail,
            isActive: user.restaurantDetails?.isActive ?? true,
            currency: user.currency || 'INR'
        };

        res.json(restaurantData);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all restaurants (Super Admin) - Now fetching from Users
const getAllRestaurants = async (req, res) => {
    try {
        // Find users who are admins or superadmins with a restaurant name
        const users = await User.find({
            role: 'admin',
            restaurantName: { $exists: true, $ne: '' }
        }).select('-password');
        const now = new Date();

        // Map users to the structure expected by frontend (simulating old Restaurant model structure)
        const restaurants = await Promise.all(users.map(async user => {
            await user.syncSubscription();

            return {
                _id: user._id,
                role: user.role,
                name: user.name, // Owner Name
                email: user.email,
                profilePicture: user.profilePicture,
                isApproved: user.isApproved,
                isOnboarded: user.isOnboarded,
                restaurantName: user.restaurantName, // Business Name
                createdAt: user.restaurantDetails?.joinedAt || user.createdAt,
                registeredAt: user.createdAt,
                updatedAt: user.updatedAt,
                isActive: user.get('restaurantDetails.isActive') ?? true,
                subscription: user.subscription || { plan: 'None', status: 'None' },
                phone: user.phone,
                city: user.city,
                currency: user.currency || 'INR',
                cuisine: user.restaurantDetails?.cuisineType || '',
                restaurantDetails: user.restaurantDetails || {},
                orderPreferences: user.orderPreferences || {},
                bankDetails: user.bankDetails || {},
                notificationPreferences: user.notificationPreferences || {},
                staffCount: Array.isArray(user.staff) ? user.staff.length : 0
            };
        }));

        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant subscription (Super Admin)
const updateSubscription = async (req, res) => {
    try {
        const { userId, plan, status, endDate, autoRenew, isActive } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update Activation Status if provided
        if (isActive !== undefined) {
            if (!user.restaurantDetails) user.restaurantDetails = {};
            user.restaurantDetails.isActive = isActive;

            // Helpful UX: If the Super Admin manually reactivates an expired/new restaurant, 
            // give them a 14-day extension (Trial) so it doesn't immediately flip back to false
            const now = new Date();
            const isExpired = !user.subscription.endDate || new Date(user.subscription.endDate) <= now;
            if (isActive === true && isExpired) {
                user.subscription.endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Set to +7 days for trial/reactivation
                user.subscription.status = 'Active';
                if (user.subscription.plan === 'None') {
                    user.subscription.plan = 'Trial';
                }
            } else if (isActive === false) {
                user.subscription.endDate = now;
                user.subscription.status = 'Expired';
            }
        }

        // If Super Admin explicitly sets plan to Trial, force 7 days
        if (plan === 'Trial') {
            const now = new Date();
            user.subscription.endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            user.subscription.status = 'Active';
        }

        user.subscription = {
            ...user.subscription,
            plan: plan || user.subscription.plan,
            status: status || user.subscription.status,
            endDate: (plan === 'Trial') ? user.subscription.endDate : (endDate ? new Date(endDate) : user.subscription.endDate),
            autoRenew: autoRenew !== undefined ? autoRenew : user.subscription.autoRenew,
            startDate: user.subscription.startDate || new Date()
        };

        await user.save();
        await user.syncSubscription();
        res.json({ message: 'Subscription updated successfully', subscription: user.subscription, isActive: user.restaurantDetails?.isActive });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send subscription reminder (Super Admin)
const sendSubscriptionReminder = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Real email sending
        const { sendSubscriptionReminder } = require('../utils/emailService');
        await sendSubscriptionReminder(
            user.email,
            user.name,
            user.subscription.plan,
            user.subscription.endDate
        );

        user.subscription.lastReminderSent = new Date();
        await user.save();

        res.json({ message: 'Reminder email sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a restaurant
// @route   DELETE /api/restaurant/:id
// @access  Private (Super Admin)
const deleteRestaurant = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Technically checking role if they are an Admin (Restaurant)
        if (user.role !== 'admin') {
            return res.status(400).json({ message: 'User is not a restaurant owner' });
        }

        await User.deleteOne({ _id: req.params.id });

        res.json({ message: 'Restaurant deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all pending restaurant registrations (Super Admin)
const getPendingApprovals = async (req, res) => {
    try {
        const users = await User.find({
            role: 'admin',
            isApproved: false
        }).select('-password').sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve a restaurant registration (Super Admin)
const approveRestaurant = async (req, res) => {
    try {
        const crypto = require('crypto');
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isApproved) {
            return res.status(400).json({ message: 'User is already approved' });
        }

        // Generate a secure setup token (valid for 7 days)
        const setupToken = crypto.randomBytes(32).toString('hex');

        user.isApproved = true;
        user.setupToken = setupToken;
        user.setupTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const restaurantSlug = user.restaurantName?.toLowerCase()?.replace(/\s+/g, '-') || 'restaurant';
        const setupUrl = `${frontendUrl}/${restaurantSlug}/onboarding?token=${setupToken}`;

        // Send approval email
        try {
            console.log(`📡 Attempting to send approval email to: ${user.email}`);
            await sendApprovalEmail(
                user.email,
                user.name,
                setupUrl,
                user.restaurantName || 'your restaurant'
            );
            console.log(`✅ Approval email successfully sent to: ${user.email}`);
        } catch (err) {
            console.error(`❌ Approval email delivery failed to ${user.email}:`, err.message);
        }

        res.json({ message: 'Restaurant approved and onboarding link sent.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject a restaurant registration (Super Admin)
const rejectRestaurant = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isApproved) {
            return res.status(400).json({ message: 'User is already approved and cannot be rejected' });
        }

        // Determine recipient email
        const targetEmail = user.email || user.restaurantDetails?.businessEmail;

        if (!targetEmail) {
            console.warn(`⚠️ No email address found for user ${user._id} during rejection.`);
        } else {
            try {
                console.log(`📡 Attempting to send rejection email to: ${targetEmail}`);
                // Send rejection email and await it before deleting user data
                await sendRejectionEmail(
                    targetEmail,
                    user.restaurantName || 'your restaurant'
                );
                console.log(`✅ Rejection email successfully sent to: ${targetEmail}`);
            } catch (err) {
                console.error(`❌ Rejection email delivery failed to ${targetEmail}:`, err.message);
                // We still proceed with deletion to keep the system clean
            }
        }

        // Add a very small delay to ensure SMTP pool/process doesn't cut off
        await new Promise(resolve => setTimeout(resolve, 500));

        // Delete the user account after rejection
        await User.deleteOne({ _id: req.params.id });

        res.json({ message: 'Restaurant registration rejected and user account removed.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRestaurantDetails,
    updateRestaurantDetails,
    createRestaurant,
    getRestaurantPublic,
    getAllRestaurants,
    getRestaurantByName,
    updateSubscription,
    sendSubscriptionReminder,
    deleteRestaurant,
    completeOnboarding,
    getSetupDetails,
    getPendingApprovals,
    approveRestaurant,
    rejectRestaurant
};
