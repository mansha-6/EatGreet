const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    try {
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');

        const email = 'antigravity_test_' + Date.now() + '@example.com';
        const user = new User({
            name: 'Test Owner',
            email: email,
            password: 'dummy_password',
            restaurantName: 'Test Place',
            phone: '9999999999',
            city: 'Test City',
            cuisine: 'Italian',
            role: 'admin',
            isApproved: false,
            setupToken: token,
            setupTokenExpires: Date.now() + 3600000 
        });
        
        await user.save();
        
        const http = require('http');
        const postData = JSON.stringify({
            token: token,
            restaurantName: 'Test Place Updated',
            description: 'A cozy place',
            address: '123 Test St',
            contactNumber: '1234567890',
            gstNumber: 'TESTGST123',
            cuisineType: 'Italian',
            businessEmail: email
        });

        const req = http.request({
            hostname: '127.0.0.1',
            port: 5001,
            path: '/api/restaurant/onboard',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { 
                console.log('Response:', data);
                mongoose.disconnect(); 
            });
        });

        req.write(postData);
        req.end();

    } catch(err) { console.error(err); mongoose.disconnect(); }
};
run();

