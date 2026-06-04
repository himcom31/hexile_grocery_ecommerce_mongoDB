const mongoose = require('mongoose');

const DeliveryChargeSchema = new mongoose.Schema({
    minOrderQty: {
        type: Number,
        required: [true, 'Minimum order quantity is required'],
        min: [0, 'Cannot be negative']
    },
    maxOrderQty: {
        type: Number,
        required: [true, 'Maximum order quantity is required'],
        min: [0, 'Cannot be negative']
    },
    charge: {
        type: Number,
        required: [true, 'Delivery charge is required'],
        min: [0, 'Charge cannot be negative']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryCharge', DeliveryChargeSchema);