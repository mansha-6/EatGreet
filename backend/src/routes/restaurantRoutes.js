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
    deleteRestaurant
} = require('../controllers/restaurantController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getRestaurantDetails)
    .put(protect, admin, updateRestaurantDetails)
    .post(protect, admin, createRestaurant);

router.get('/all', protect, getAllRestaurants);
router.put('/subscription', protect, updateSubscription);
router.post('/reminder', protect, sendSubscriptionReminder);

router.get('/:id', getRestaurantPublic);
router.delete('/:id', protect, deleteRestaurant);
router.get('/slug/:name', getRestaurantByName);

module.exports = router;
