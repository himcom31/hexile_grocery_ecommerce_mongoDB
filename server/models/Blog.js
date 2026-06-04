const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category', 
        required: true 
    },
    tags: [{ type: String }], // Array of strings for tags
    thumbnail: { type: String, required: true }, // Cloudinary URL (880x440)
    description: { type: String, required: true }, // Full blog content
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, 
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Blog', BlogSchema);