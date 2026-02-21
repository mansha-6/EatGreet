const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { protect, admin } = require('../middleware/authMiddleware');

// Offers are public for viewing but require admin access to create/update/delete
router.get('/', offerController.getOffers);

// Admin only routes
router.use(protect);
router.use(admin);

router.post('/', offerController.createOffer);
router.put('/:id', offerController.updateOffer);
router.delete('/:id', offerController.deleteOffer);

module.exports = router;
