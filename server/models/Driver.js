const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
    fullName:      { type: String, required: true },
    email:         { type: String, unique: true, required: true },
    phone:         { type: String, unique: true, required: true },
    password:      { type: String },        // plain text — shown in edit form
    profileImage:  { type: String },        // Cloudinary URL

    // Personal info
    gender:        { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    dateOfBirth:   { type: String },        // "YYYY-MM-DD" string — no Date conversion needed
    drivingLicense:{ type: String },

    // Vehicle
    vehicleType:   { type: String, enum: ['Bike', 'Scooter', 'Cycle', 'Mini Truck'], required: true },
    vehicleNumber: { type: String, sparse: true },

    // Work status
    isOnline:      { type: Boolean, default: false },
    currentLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },

    // Stats
    totalOrdersDelivered: { type: Number, default: 0 },
    totalEarnings:        { type: Number, default: 0 },
    rating:               { type: Number, default: 5 },

    // Identity
    identityType:   { type: String, enum: ['Aadhar', 'Driving_License', 'PAN'], required: true },
    identityNumber: { type: String, required: true },

    isActive: { type: Boolean, default: true }

}, { timestamps: true });

module.exports = mongoose.model('Driver', DriverSchema);