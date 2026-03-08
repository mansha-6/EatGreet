const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/restaurantController');
const { protect, admin, superadmin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getRestaurantDetails)
    .put(protect, admin, updateRestaurantDetails)
    .post(protect, admin, createRestaurant);

router.post('/onboard', protect, admin, completeOnboarding);

router.get('/all', protect, superadmin, getAllRestaurants);

router.get('/pending', protect, superadmin, getPendingApprovals);
router.put('/approve/:id', protect, superadmin, approveRestaurant);

router.put('/subscription', protect, updateSubscription);
router.post('/reminder', protect, sendSubscriptionReminder);

router.get('/:id', getRestaurantPublic);
router.delete('/:id', protect, superadmin, deleteRestaurant);

router.get('/slug/:name', getRestaurantByName);

module.exports = router;
