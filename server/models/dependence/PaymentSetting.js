const mongoose = require('mongoose');

const PaymentSettingSchema = new mongoose.Schema({
    gatewayName: {
        type: String,
        required: true,
        unique: true,
        enum: ['Stripe', 'Razorpay'],
    },
    status: {
        type: Boolean,
        default: false,
    },
    mode: {
        type: String,
        enum: ['Test', 'Live'],
        default: 'Test',
    },
    // Stripe  → secretKey = sk_test_... / publishedKey = pk_test_...
    // Razorpay→ publishedKey = rzp_test_... (Key) / secretKey = Secret
    secretKey: {
        type: String,
        required: true,
    },
    publishedKey: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        default: 'Online Payment',
    },
    logo: {
        type: String, // Cloudinary URL
    },
}, { timestamps: true });

module.exports = mongoose.model('PaymentSetting', PaymentSettingSchema);