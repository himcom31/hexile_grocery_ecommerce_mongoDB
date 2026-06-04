const SmsSetting = require('../models/dependence/SMSSetting');
const twilio = require('twilio');
const axios = require('axios'); // Fast2SMS ke liye

const sendSMS = async (to, message) => {
    try {
        // 1. Database se check karo kaunsa gateway 'Active' hai
        const activeSms = await SmsSetting.findOne({ status: true });

        if (!activeSms) {
            console.log("⚠️ No active SMS gateway found in settings.");
            return false;
        }

        // 2. Agar Twilio Active hai
        if (activeSms.providerName.toLowerCase() === 'twilio') {
            const client = twilio(activeSms.apiKey, activeSms.apiSecret);
            await client.messages.create({
                body: message,
                from: activeSms.phoneNumber, // Twilio ka provided number
                to: to
            });
        } 

        // 3. Agar Fast2SMS (India) Active hai
        else if (activeSms.providerName.toLowerCase() === 'fast2sms') {
            await axios.get(`https://www.fast2sms.com/dev/bulkV2`, {
                params: {
                    authorization: activeSms.apiKey,
                    message: message,
                    language: "english",
                    route: "q",
                    numbers: to,
                }
            });
        }

        console.log(`✅ SMS sent successfully via ${activeSms.providerName}`);
        return true;

    } catch (error) {
        console.error("❌ SMS Gateway Error:", error.message);
        return false;
    }
};

module.exports = sendSMS;