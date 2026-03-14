const express = require('express');
const router = express.Router();
const { getPayments, createOrder, verifyPayment, verifyAccountForPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getPayments);
router.post('/verify-account', verifyAccountForPayment); // Public
router.post('/create-order', createOrder); // Public (validates userId internally if not logged in)
router.post('/verify', verifyPayment); // Public (validates userId internally if not logged in)

module.exports = router;
