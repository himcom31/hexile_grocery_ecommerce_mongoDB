const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, unique: true, lowercase: true },
    phone: { type: String, unique: true, required: true },
    password: { type: String }, // Optional agar admin add kar raha hai
    avatar: { type: String }, // Profile Picture URL
    address: [{
        street: String,
        city: String,
        pincode: String,
        isDefault: { type: Boolean, default: false }
    }],
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);