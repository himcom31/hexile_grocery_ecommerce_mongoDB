const mongoose = require('mongoose');

const MailSettingSchema = new mongoose.Schema({
    mailMailer:      { type: String, default: 'smtp' },
    mailHost:        { type: String, required: true },
    // ✅ FIX: Changed from String to Number — nodemailer requires numeric port
    mailPort:        { type: Number, required: true },
    mailUserName:    { type: String, required: true },
    mailPassword:    { type: String, required: true },
    mailEncryption:  { type: String, default: 'tls', enum: ['tls', 'ssl'] },
    mailFromAddress: { type: String, required: true },
    status:          { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('MailSetting', MailSettingSchema);