const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true, 
        trim: true 
    },
    image: { 
        type: String, 
        required: true 
    }, // Cloudinary URL (400x250 px)
    // link: { 
        // type: String 
    // }, // Banner pe click karne pe kahan jayega (e.g., /category/vegetables)
    // position: { 
        // type: String, 
        // enum: ['Home_Top', 'Home_Middle', 'Sidebar', 'Bottom'],
        // default: 'Home_Top' 
    // },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Ad', AdSchema);