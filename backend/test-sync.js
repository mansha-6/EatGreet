const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const testSync = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: 'mansha23@gmail.com' });
    if (!user) {
        console.log('User not found');
        process.exit(0);
    }

    console.log('Initial Status:', user.subscription.status);
    console.log('Initial IsActive:', user.restaurantDetails?.isActive);
    console.log('End Date:', user.subscription.endDate);

    const changed = await user.syncSubscription();
    console.log('Changed:', changed);

    const refreshedUser = await User.findOne({ email: 'mansha23@gmail.com' });
    console.log('Final Status:', refreshedUser.subscription.status);
    console.log('Final IsActive:', refreshedUser.restaurantDetails?.isActive);

    process.exit(0);
};

testSync();
