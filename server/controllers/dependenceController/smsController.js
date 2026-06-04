const SmsSetting = require('../../models/dependence/SMSSetting');

const ALLOWED_PROVIDERS = ['Twilio', 'Nexmo', 'Telesign', 'MessageBird'];

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all SMS provider settings
// @route   GET /api/sms/all
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllSmsSettings = async (req, res) => {
    try {
        const settings = await SmsSetting.find({ providerName: { $in: ALLOWED_PROVIDERS } });
        res.status(200).json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Save (upsert) a single provider's settings
// @route   POST /api/sms/save
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.saveSmsSetting = async (req, res) => {
    try {
        const { providerName, ...fields } = req.body;

        if (!ALLOWED_PROVIDERS.includes(providerName)) {
            return res.status(400).json({
                success: false,
                message: `Provider must be one of: ${ALLOWED_PROVIDERS.join(', ')}`
            });
        }

        // Remove 'status' from fields — status is only changed via /activate
        delete fields.status;

        const setting = await SmsSetting.findOneAndUpdate(
            { providerName },
            { $set: fields },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            success: true,
            message: `${providerName} settings saved successfully.`,
            data: setting
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Set one provider active, deactivate all others
// @route   PUT /api/sms/activate/:providerName
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.setActiveProvider = async (req, res) => {
    try {
        const { providerName } = req.params;

        if (!ALLOWED_PROVIDERS.includes(providerName)) {
            return res.status(400).json({
                success: false,
                message: `Provider must be one of: ${ALLOWED_PROVIDERS.join(', ')}`
            });
        }

        // Deactivate all
        await SmsSetting.updateMany({}, { status: false });

        // Activate selected (upsert in case record doesn't exist yet)
        const active = await SmsSetting.findOneAndUpdate(
            { providerName },
            { status: true },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            success: true,
            message: `${providerName} is now the active SMS provider.`,
            data: active
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Deactivate all providers (set all inactive)
// @route   PUT /api/sms/deactivate-all
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.deactivateAll = async (req, res) => {
    try {
        await SmsSetting.updateMany({}, { status: false });
        res.status(200).json({ success: true, message: 'All SMS providers deactivated.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};