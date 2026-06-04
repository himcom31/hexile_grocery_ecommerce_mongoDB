const mongoose = require('mongoose');

const BusinessSettingSchema = new mongoose.Schema({
    // Basic Info
    companyName: { type: String,},
    companyEmail: { type: String },
    companyPhone: { type: String},

    // Business Model logic
    businessModel: { 
        type: String, 
        enum: ['Single Shop'], 
        
    },

    // Currency & Timezone
    currencyPosition: { 
        type: String, 
        enum: ['Left', 'Right'], 
        default: 'Left' 
    },
    timeZone: { type: String, default: "UTC/GMT +06:00" },

    // Payment Method Setup (Toggles)
    cashOnDelivery: { type: Boolean, default: true },
    onlinePayment: { type: Boolean, default: true },

    // Additional fields (Future use)
    logo: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BusinessSetting', BusinessSettingSchema);