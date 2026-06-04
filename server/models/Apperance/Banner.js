const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    bannerImage: { type: String, required: true }, // Image ka URL ya path
    isOwnShop: { type: Boolean, default: false },   // "This Banner For Own Shop" check
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Banner', BannerSchema);