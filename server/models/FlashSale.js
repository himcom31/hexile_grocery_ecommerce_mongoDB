const mongoose = require('mongoose');

const FlashSaleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    minDiscount: { type: Number, required: true }, // e.g., 20%
    startDate: { type: Date, required: true },
    startTime: { type: String, required: true }, // e.g., "10:00 AM"
    endDate: { type: Date, required: true },
    endTime: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: { type: String, required: true }, // Cloudinary URL
    isActive: { type: Boolean, default: true },
    // Flash sale mein kaunse products honge unki list
     products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

module.exports = mongoose.model('FlashSale', FlashSaleSchema);