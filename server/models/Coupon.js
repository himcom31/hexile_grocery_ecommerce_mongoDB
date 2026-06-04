const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
    couponCode: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ['Amount', 'Percentage'], required: true },
    discountValue: { type: Number, required: true }, // Kitna discount dena hai
    minOrderAmount: { type: Number, required: true }, // Kam se kam kitne ka order ho
    maxDiscountAmount: { type: Number }, // Agar percentage hai toh max kitna katega
    limitPerUser: { type: Number, default: 1 }, // Ek banda kitni baar use karega
    
    // Select Shops ki jagah Category ya User-specific scope
    applicableFor: { 
        type: String, 
        enum: ['All', 'New_User', 'Category_Specific'], 
        default: 'All' 
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Agar Category_Specific hai

    startDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    expiryTime: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);