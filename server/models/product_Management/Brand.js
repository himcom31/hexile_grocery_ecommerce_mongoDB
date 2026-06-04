const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    logo: { 
        type: String, 
        required: true 
    }, // Cloudinary URL
    description: { 
        type: String 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Brand', BrandSchema);