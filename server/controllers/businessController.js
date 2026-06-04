const BusinessSetting = require('../models/BusinessSetting');

// @desc    Get Business Settings
exports.getSettings = async (req, res) => {
    try {
        // Hamesha pehla record uthayega (ya default create karega)
        let settings = await BusinessSetting.findOne();
        if (!settings) {
            settings = await BusinessSetting.create({});
        }
        res.status(200).json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Save and Update Business Settings
exports.updateSettings = async (req, res) => {
    try {
        const updateData = req.body;

        // Upsert logic: Agar data nahi hai toh create karega, warna update
        const settings = await BusinessSetting.findOneAndUpdate(
            {}, 
            updateData, 
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({ 
            success: true, 
            message: "Settings updated successfully!", 
            settings 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};