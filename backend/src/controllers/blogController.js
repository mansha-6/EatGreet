const Blog = require('../models/Blog');

// @desc    Get all blogs (Public)
// @route   GET /api/blogs
const getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ isPublished: true }).sort({ publishedAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single blog by slug (Public)
// @route   GET /api/blogs/:slug
const getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });
        if (blog) {
            res.json(blog);
        } else {
            res.status(404).json({ message: 'Blog not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a blog (Super Admin)
// @route   POST /api/blogs
const createBlog = async (req, res) => {
    try {
        const { title, content, coverImage, author, category, tags, metaTitle, metaDescription } = req.body;
        
        // Simple slug generation
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        const blog = await Blog.create({
            title,
            slug,
            content,
            coverImage,
            author,
            category,
            tags,
            metaTitle,
            metaDescription,
            isPublished: true,
            publishedAt: new Date()
        });

        res.status(201).json(blog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a blog (Super Admin)
// @route   DELETE /api/blogs/:id
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (blog) {
            await blog.deleteOne();
            res.json({ message: 'Blog removed' });
        } else {
            res.status(404).json({ message: 'Blog not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBlogs,
    getBlogBySlug,
    createBlog,
    deleteBlog
};
