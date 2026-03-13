const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const { protect, superadmin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/setup-password', setupPassword);
router.post('/superadmin/send-otp', sendSuperAdminOtp);
router.post('/superadmin/verify-otp', verifySuperAdminOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/users', protect, superadmin, getUsers);
router.get('/superadmin/login-activity', protect, superadmin, getSuperAdminLoginActivity);

module.exports = router;
