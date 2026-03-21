const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    author: { type: String, default: 'EatGreet Team' },
    coverImage: { type: String },
    category: { type: String, default: 'General' },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    metaTitle: { type: String },
    metaDescription: { type: String },
}, { timestamps: true });

// Pre-save to generate slug if not provided? Or handle in controller.
// For now, simple schema.

module.exports = mongoose.model('Blog', blogSchema);
