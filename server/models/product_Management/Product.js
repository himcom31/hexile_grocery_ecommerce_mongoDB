const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    // Product Info
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },

    // General Information
    brand: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Brand' 
},
    unit: { type: String, required: true }, // kg, pc, packet
    sku: { type: String, required: true, unique: true },
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category', 
        required: true 
    },

    // Price Information
    buyingPrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    discountPrice: { type: Number, default: 0 },
    stockQuantity: { type: Number, required: true },
    minOrderQuantity: { type: Number, default: 1 },

    // Images & Video
    thumbnail: { type: String, required: true }, // S3/Cloudinary URL
    additionalImages: [{ type: String }],
    videoType: { type: String, enum: ['Upload', 'YouTube', 'Vimeo', 'Dailymotion'] },
    videoUrl: { type: String },
    attributes: [
    {
        key:   { type: String, required: true },
        value: { type: String, required: true },
    }
],

    // SEO Information
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: [{ type: String }],

    // Meta Data
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);