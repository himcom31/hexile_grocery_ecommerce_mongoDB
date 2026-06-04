const mongoose = require('mongoose');

const SocialAuthSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        unique: true,
        enum: ['Google'], // Extend later: 'Facebook', 'Apple'
    },
    clientId: {
        type: String,
        default: '',
    },
    clientSecret: {
        type: String,
        default: '',
    },
    redirectUrl: {
        type: String,
        default: 'postmessage',
    },
    status: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('SocialAuth', SocialAuthSchema);