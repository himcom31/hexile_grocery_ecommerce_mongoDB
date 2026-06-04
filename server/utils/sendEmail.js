const nodemailer = require('nodemailer');
const MailSetting = require('../models/dependence/MailSetting');

const sendEmail = async (options) => {
    try {
        // 1. Fetch active mail config from DB
        const config = await MailSetting.findOne({ status: true });
        if (!config) throw new Error('Mail configuration not found or is disabled.');

        // 2. Create transporter
        const transporter = nodemailer.createTransport({
            host: config.mailHost,
            // ✅ FIX: mailPort is stored as String in schema but nodemailer requires a Number
            port: Number(config.mailPort),
            // true only for port 465 (SSL), false for 587/25/1025 (TLS/STARTTLS)
            secure: config.mailEncryption === 'ssl',
            auth: {
                user: config.mailUserName,
                pass: config.mailPassword,
            },
        });

        // 3. Build mail options
        const mailOptions = {
            // ✅ FIX: was using mailUserName as the address in the display name position.
            //    Correct pattern: Display Name <from-address>
            from: `"${config.mailFromAddress}" <${config.mailFromAddress}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            // html is optional — only set if provided
            ...(options.html ? { html: options.html } : {}),
        };

        // 4. Send
        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to:', options.email);
        return true;
    } catch (error) {
        console.error('❌ Email Error:', error.message);
        return false;
    }
};

module.exports = sendEmail;