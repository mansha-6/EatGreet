const express = require('express');
const router = express.Router();
const {
    getBlogs,
    getBlogBySlug,
    createBlog,
    deleteBlog
} = require('../controllers/blogController');
const { protect, superadmin } = require('../middleware/authMiddleware');

router.get('/', getBlogs);
router.get('/:slug', getBlogBySlug);
router.post('/', protect, superadmin, createBlog);
router.delete('/:id', protect, superadmin, deleteBlog);

module.exports = router;
