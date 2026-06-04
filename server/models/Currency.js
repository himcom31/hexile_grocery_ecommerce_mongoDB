const mongoose = require('mongoose');

const CurrencySchema = new mongoose.Schema({
    currencyName: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    }, // e.g., Indian Rupee
    currencySymbol: { 
        type: String, 
        required: true 
    }, // e.g., ₹
    currencyCode: { 
        type: String, 
        required: true, 
        uppercase: true 
    }, // e.g., INR
    exchangeRate: { 
        type: Number, 
        required: true, 
        default: 1 
    }, // Base currency se kitna value hai
    isDefault: { 
        type: Boolean, 
        default: false 
    } // Kya yehi main currency hai?
}, { timestamps: true });

module.exports = mongoose.model('Currency', CurrencySchema);