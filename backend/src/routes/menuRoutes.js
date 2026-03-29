const express = require('express');
const router = express.Router();
const { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } = require('../controllers/menuController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');
const { resolveTenant } = require('../middleware/tenantMiddleware');

router.route('/')
    .get(optionalProtect, resolveTenant, getMenuItems)
    .post(protect, admin, resolveTenant, createMenuItem);

router.route('/:id')
    .put(protect, admin, resolveTenant, updateMenuItem)
    .delete(protect, admin, resolveTenant, deleteMenuItem);

module.exports = router;
