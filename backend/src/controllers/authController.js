const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail, sendAdminNotificationEmail } = require('../utils/emailService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

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

            // 1. Send welcome email to the new user (Under Review if Admin)
            await sendWelcomeEmail(
                user.email,
                user.name,
                user.restaurantName,
                user.phone,
                user.city,
                isAdmin // isPending = true if admin
            );

            // 2. Notify the Super Admin about this new registration
            if (isAdmin) {
                await sendAdminNotificationEmail({
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    city: user.city,
                    restaurantName: user.restaurantName
                });
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
        const user = await User.findOne({ email }).select('name email password role restaurantName currency profilePicture subscription isOnboarded isApproved');

        if (user && (await user.matchPassword(password))) {
            if (!user.isApproved) {
                return res.status(401).json({ message: 'Your account is pending approval. Please check your email for confirmation.' });
            }

            res.json({
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
            res.status(401).json({ message: 'Invalid email or password' });
        }
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

module.exports = { registerUser, authUser, getUserProfile, updateUserProfile, getUsers };
