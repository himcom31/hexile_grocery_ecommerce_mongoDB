const mongoose = require('mongoose');

const TaxSchema = new mongoose.Schema({
    taxName: { 
        type: String, 
        required: [true, " fill "], 
        trim: true 
    },
    percentage: { 
        type: Number, 
        required: [true, "Percentage is important"],
        min: [0, "Tax minus "],
        max: [100, "Tax 100% "]
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Tax', TaxSchema);