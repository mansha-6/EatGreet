const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// @desc    Get restaurant details
// @route   GET /api/restaurant
// @access  Private (Admin)
const getRestaurantDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user._id); // req.user is set by auth middleware
        if (user && user.restaurantDetails) {
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
                staff: user.staff
            });
        } else {
            res.status(404).json({ message: 'Restaurant details not set' });
        }
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

// @desc Get public restaurant info by ID (Mapped from User)
const getRestaurantPublic = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        // Check if user exists and is an admin (restaurant owner)
        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const restaurantData = {
            _id: user._id,
            name: user.restaurantName || user.name,
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

        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const restaurantData = {
            _id: user._id,
            name: user.restaurantName || user.name,
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
        // Find users who are admins (restaurant owners)
        const users = await User.find({ role: 'admin' }).select('-password');

        // Map users to the structure expected by frontend (simulating old Restaurant model structure)
        const restaurants = users.map(user => ({
            _id: user._id,
            name: user.name, // Owner Name
            email: user.email,
            restaurantName: user.restaurantName, // Business Name
            createdAt: user.restaurantDetails?.joinedAt || user.createdAt,
            isActive: user.restaurantDetails?.isActive ?? true,
            subscription: user.subscription || { plan: 'None', status: 'None' },
            phone: user.phone,
            city: user.city
        }));

        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant subscription (Super Admin)
const updateSubscription = async (req, res) => {
    try {
        const { userId, plan, status, endDate, autoRenew } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
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
        res.json({ message: 'Subscription updated successfully', subscription: user.subscription });
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
        await sendEmail({
            email: user.email,
            subject: 'Action Required: Your EatGreet Subscription is Expiring',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #FD6941;">Subscription Renewal Reminder</h2>
                    <p>Hi ${user.name},</p>
                    <p>This is a gentle reminder that your <b>${user.subscription.plan}</b> package for <b>${user.restaurantName || 'your business'}</b> is expiring soon on <b>${new Date(user.subscription.endDate).toLocaleDateString()}</b>.</p>
                    <p>To avoid any interruption in service, please renew your subscription soon.</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${process.env.FRONTEND_URL}/admin/billing" style="background-color: #FD6941; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Renew Now</a>
                    </div>
                    <p>If you need any help, feel free to contact our support team.</p>
                    <p>Best regards,<br/><b>The EatGreet Team</b></p>
                </div>
            `
        });
        
        user.subscription.lastReminderSent = new Date();
        await user.save();

        res.json({ message: 'Reminder email sent successfully' });
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
    sendSubscriptionReminder
};
