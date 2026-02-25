const express = require('express');
const router = express.Router();
const { registerUser, authUser, getUserProfile, updateUserProfile, getUsers } = require('../controllers/authController');
const { protect, superadmin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/users', protect, superadmin, getUsers);

module.exports = router;
