const SocialAuth = require('../../models/dependence/SocialAuth');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all social auth settings (admin panel)
// @route   GET /api/social/all
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllSocialSettings = async (req, res) => {
    try {
        const settings = await SocialAuth.find();
        res.status(200).json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Save (upsert) a provider's credentials
// @route   POST /api/social/save
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.saveSocialSetting = async (req, res) => {
    try {
        const { provider, clientId, clientSecret, redirectUrl } = req.body;

        if (!provider) {
            return res.status(400).json({ success: false, message: 'Provider is required' });
        }

        const setting = await SocialAuth.findOneAndUpdate(
            { provider },
            { clientId, clientSecret, redirectUrl },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            success: true,
            message: `${provider} settings saved successfully.`,
            data: setting,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle ON/OFF status by provider name
// @route   PATCH /api/social/toggle/:provider
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.toggleSocialStatus = async (req, res) => {
    try {
        const { provider } = req.params;

        const setting = await SocialAuth.findOne({ provider });
        if (!setting) {
            return res.status(404).json({ success: false, message: `${provider} settings not found` });
        }

        setting.status = !setting.status;
        await setting.save();

        res.status(200).json({
            success: true,
            message: `${provider} is now ${setting.status ? 'Active' : 'Inactive'}.`,
            status: setting.status,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};