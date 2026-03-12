const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

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
                    lowStock: req.body.notificationPreferences.lowStock ?? user.notificationPreferences.lowStock,
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
// @access  Private (Admin)
const completeOnboarding = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const {
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

        // Mandatory fields check (as a backup to frontend validation)
        if (!restaurantName || !address || !contactNumber || !gstNumber || !cuisineType || !businessEmail) {
            return res.status(400).json({ message: 'Please fill all mandatory fields' });
        }

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
        res.json({
            message: 'Onboarding completed successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                restaurantName: updatedUser.restaurantName,
                isOnboarded: updatedUser.isOnboarded,
                restaurantDetails: updatedUser.restaurantDetails
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get public restaurant info by ID (Mapped from User)
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
                user.subscription.endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 days
                user.subscription.status = 'Active';
                if (user.subscription.plan === 'None') {
                    user.subscription.plan = 'Trial';
                }
            }
        }

        user.subscription = {
            ...user.subscription,
            plan: plan || user.subscription.plan,
            status: status || user.subscription.status,
            endDate: endDate ? new Date(endDate) : user.subscription.endDate,
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
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isApproved) {
            return res.status(400).json({ message: 'User is already approved' });
        }

        // Use the user's phone number as the temporary password for consistency
        const defaultPassword = user.phone || 'YourMobileNumber';

        user.isApproved = true;
        user.password = defaultPassword; // Schema middleware will hash it on .save()

        await user.save();

        // Send approval email in background so approval API stays fast
        const { sendApprovalEmail } = require('../utils/emailService');
        sendApprovalEmail(
            user.email,
            user.name,
            defaultPassword,
            user.restaurantName || 'your restaurant'
        ).catch((err) => {
            console.error('Approval email failed:', err.message);
        });

        res.json({ message: 'Restaurant approved. Credentials email is being sent.' });
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
    getPendingApprovals,
    approveRestaurant
};
