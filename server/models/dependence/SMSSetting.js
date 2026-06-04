const mongoose = require('mongoose');

const SMSSettingSchema = new mongoose.Schema({
    providerName: {
        type: String,
        required: true,
        unique: true,
        enum: ['Twilio', 'Nexmo', 'Telesign', 'MessageBird'],
    },
    status: {
        type: Boolean,
        default: false, // Only ONE can be true at a time — enforced in controller
    },

    // ── Twilio ─────────────────────────────────────────────
    twilioSid:   { type: String, default: '' },
    twilioToken: { type: String, default: '' },
    twilioFrom:  { type: String, default: '' },

    // ── Nexmo (Vonage) ─────────────────────────────────────
    nexmoKey:    { type: String, default: '' },
    nexmoSecret: { type: String, default: '' },
    nexmoFrom:   { type: String, default: '' },

    // ── Telesign ───────────────────────────────────────────
    telesignCustomerId: { type: String, default: '' },
    telesignApiKey:     { type: String, default: '' },

    // ── MessageBird ────────────────────────────────────────
    messageBirdApiKey: { type: String, default: '' },
    messageBirdFrom:   { type: String, default: '' },

}, { timestamps: true });

module.exports = mongoose.model('SMSSetting', SMSSettingSchema);