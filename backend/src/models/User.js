const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin', 'superadmin'], default: 'customer' },
    phone: { type: String },
    city: { type: String },
    restaurantName: { type: String }, // Added to derive tenant database name
    currency: { type: String, default: 'INR' },
    profilePicture: { type: String },

    // Embed Restaurant Details (Merged 'resto_names' into Users)
    restaurantDetails: {
        description: { type: String },
        address: { type: String },
        contactNumber: { type: String },
        logo: { type: String },
        gstNumber: { type: String },
        cuisineType: { type: String },
        businessEmail: { type: String },
        location: {
            lat: { type: Number, default: 23.0225 },
            lng: { type: Number, default: 72.5714 }
        },
        operatingHours: {
            open: { type: String, default: '09:00' },
            close: { type: String, default: '23:00' }
        },
        isActive: { type: Boolean, default: true },
        totalTables: { type: Number, default: 0 },
        tableNumbers: [{ type: String }],
        monthlyExpense: { type: Number, default: 0 },
        joinedAt: { type: Date, default: Date.now }
    },

    orderPreferences: {
        acceptOrders: { type: Boolean, default: true },
        autoAccept: { type: Boolean, default: false },
        cancelEnabled: { type: Boolean, default: true },
        avgPrepTime: { type: Number, default: 25 }
    },

    bankDetails: {
        accountHolder: { type: String },
        accountNumber: { type: String },
        bankName: { type: String },
        ifscCode: { type: String },
        settlementCycle: { type: String, default: 'Daily (T+1)' }
    },

    notificationPreferences: {
        newOrder: { type: Boolean, default: true },
        statusUpdates: { type: Boolean, default: true },
        lowStock: { type: Boolean, default: true },
        paymentReceived: { type: Boolean, default: true }
    },

    staff: [{
        name: { type: String },
        role: { type: String },
        email: { type: String },
        isActive: { type: Boolean, default: true }
    }],

    // Subscription Details
    subscription: {
        plan: { type: String, enum: ['Trial', 'Monthly', 'Annually', 'None', 'Customized'], default: 'None' },
        status: { type: String, enum: ['Active', 'Expired', 'Expiring', 'None'], default: 'None' },
        startDate: { type: Date },
        endDate: { type: Date },
        lastReminderSent: { type: Date },
        autoRenew: { type: Boolean, default: false }
    },

    // Embed Payments (Merged 'payments' into Users)
    payments: [{
        transactionId: { type: String },
        amount: { type: Number },
        status: { type: String, enum: ['Completed', 'Pending', 'Failed'], default: 'Completed' },
        method: { type: String },
        date: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.syncSubscription = async function () {
    // Only sync for admin roles that have a plan
    if (!['admin', 'superadmin'].includes(this.role) || !this.subscription?.endDate) return false;

    const now = new Date();
    const endDate = new Date(this.subscription.endDate);
    const diff = endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

    let changed = false;
    let newStatus = 'Active';

    if (daysLeft <= 0) {
        newStatus = 'Expired';
    } else if (daysLeft <= 3) {
        newStatus = 'Expiring';
    }

    if (this.subscription.status !== newStatus) {
        this.subscription.status = newStatus;
        changed = true;
    }

    // Auto Deactivate Logic - Force isActive to false ONLY if it's expired
    const currentlyActive = this.get('restaurantDetails.isActive');
    if (newStatus === 'Expired' && currentlyActive !== false) {
        if (!this.restaurantDetails) this.restaurantDetails = {};
        this.set('restaurantDetails.isActive', false);
        this.markModified('restaurantDetails');
        changed = true;
    }

    if (changed) {
        await this.save();
    }
    return changed;
};

module.exports = mongoose.model('User', userSchema);
