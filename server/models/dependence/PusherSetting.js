const mongoose = require('mongoose');

const PusherSettingSchema = new mongoose.Schema({
    appId: { type: String, required: true },
    key: { type: String, required: true },
    secret: { type: String, required: true },
    cluster: { type: String, required: true, default: 'ap2' },
    status: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('PusherSetting', PusherSettingSchema);