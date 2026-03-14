const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

// Initialize Razorpay lazily to prevent crash if keys are missing
let razorpay;
const getRazorpay = () => {
    if (razorpay) return razorpay;
    
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay API keys are missing in environment variables');
    }

    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    return razorpay;
};

// @desc    Get all payments (Aggregated from Users)
// @route   GET /api/payments
// @access  Private (Super Admin)
const getPayments = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let start = startDate ? new Date(startDate) : null;
        let end = endDate ? new Date(endDate) : null;

        // 1. Fetch all admins (restaurant owners)
        const users = await User.find({ role: 'admin' }).select('name restaurantName payments');

        let allPayments = [];

        // 2. Flatten and Filter payments from all users
        users.forEach(user => {
            if (user.payments && user.payments.length > 0) {
                const userPayments = user.payments
                    .filter(p => {
                        const pDate = new Date(p.date);
                        if (start && pDate < start) return false;
                        if (end && pDate > end) return false;
                        return true;
                    })
                    .map(p => ({
                        ...p.toObject(),
                        _id: p._id,
                        restaurant: { name: user.restaurantName || user.name }
                    }));
                allPayments.push(...userPayments);
            }
        });

        // Add demo data if empty (for visualization until real payments happen)
        if (allPayments.length === 0) {
            users.forEach(user => {
                const demo = {
                    _id: `demo_${Math.random()}`,
                    transactionId: `TXN${Math.floor(Math.random() * 10000)}`,
                    amount: Math.floor(Math.random() * 4000) + 1000,
                    status: 'Completed',
                    method: 'Razorpay',
                    date: new Date(),
                    restaurant: { name: user.restaurantName || user.name }
                };
                allPayments.push(demo);
            });
        }

        // Sort by date desc
        allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 3. Calculate Stats
        const totalRevenue = allPayments
            .filter(p => p.status === 'Completed')
            .reduce((acc, curr) => acc + (curr.amount || 0), 0);

        const pendingAmount = allPayments
            .filter(p => p.status === 'Pending')
            .reduce((acc, curr) => acc + (curr.amount || 0), 0);

        res.json({
            transactions: allPayments,
            stats: {
                totalRevenue,
                pendingAmount,
                totalTransactions: allPayments.length
            }
        });
    } catch (error) {
        console.error("Payment Fetch Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify account details for payment (Public)
// @route   POST /api/payments/verify-account
// @access  Public
const verifyAccountForPayment = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('name email password role phone restaurantName restaurantDetails');
        
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: "Only restaurant admins can perform this action" });
        }

        // Return details for confirmation
        res.json({
            userId: user._id,
            adminName: user.name,
            email: user.email,
            phone: user.phone,
            restaurantName: user.restaurantName,
            address: user.restaurantDetails?.address || "Address not set",
            city: user.city
        });
    } catch (error) {
        console.error("Account Verification Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new Razorpay order
// @route   POST /api/payments/create-order
// @access  Public (But requires verified userId)
const createOrder = async (req, res) => {
    try {
        const { amount, planType, userId } = req.body; 
        const targetUserId = req.user?._id || userId;

        console.log("💳 Creating Payment Order:", { amount, planType, userId: targetUserId });

        if (!targetUserId) {
            return res.status(400).json({ message: "Authentication required (User ID missing)" });
        }

        if (!amount || !planType) {
            return res.status(400).json({ message: "Amount and Plan Type are required" });
        }

        // Razorpay expects amount in paise (integer)
        const amountInPaise = Math.round(Number(amount) * 100);

        if (isNaN(amountInPaise)) {
            return res.status(400).json({ message: "Invalid amount provided" });
        }

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: targetUserId.toString(),
                planType: planType
            }
        };

        console.log("📦 Razorpay Options:", options);

        const rzp = getRazorpay();
        const order = await rzp.orders.create(options);
        
        console.log("✅ Razorpay Order Created:", order.id);
        res.json(order);
    } catch (error) {
        console.error("❌ Create Order Error:", error);
        res.status(500).json({ 
            message: error.message || "Failed to create payment order",
            hint: error.name === 'Error' && error.message.includes('Razorpay API keys') 
                ? "Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Render environment variables."
                : undefined
        });
    }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payments/verify
// @access  Public (But requires verified userId)
const verifyPayment = async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            planType,
            amount,
            userId // Use this if not logged in
        } = req.body;

        const targetUserId = req.user?._id || userId;

        if (!targetUserId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update User Subscription and Payment History
            const user = await User.findById(targetUserId);
            
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Calculate Plan dates
            const startDate = new Date();
            const endDate = new Date();
            if (planType === 'Monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
            } else if (planType === 'Annually') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }

            // Update Subscription
            user.subscription = {
                plan: planType,
                status: 'Active',
                startDate,
                endDate,
                autoRenew: false
            };

            // Add Payment Record
            user.payments.push({
                transactionId: razorpay_payment_id,
                amount: amount, // original INR amount
                status: 'Completed',
                method: 'Razorpay',
                date: new Date()
            });

            // Ensure restaurant is active if they paid
            if (user.restaurantDetails) {
                user.restaurantDetails.isActive = true;
            }

            await user.save();

            // Emit event for Super Admin real-time updates
            const io = req.app.get('io');
            if (io) {
                io.emit('newPayment', {
                    transactionId: razorpay_payment_id,
                    restaurantName: user.restaurantName,
                    amount: amount,
                    plan: planType
                });
            }

            res.json({ 
                success: true, 
                message: "Payment verified and plan activated",
                subscription: user.subscription
            });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPayments, createOrder, verifyPayment, verifyAccountForPayment };
