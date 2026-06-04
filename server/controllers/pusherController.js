const PusherSetting = require('../models/dependence/PusherSetting');
const triggerRealtimeEvent = require('../utils/pusherTrigger');

// ✅ FIX: Added GET endpoint to fetch current config
exports.getPusherSetting = async (req, res) => {
    try {
        const setting = await PusherSetting.findOne();
        if (!setting) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({ success: true, data: setting });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.savePusherSetting = async (req, res) => {
    try {
        const { appId, key, secret, cluster } = req.body;

        // ✅ Basic validation
        if (!appId || !key || !secret || !cluster) {
            return res.status(400).json({
                success: false,
                error: 'All fields (appId, key, secret, cluster) are required.'
            });
        }

        const setting = await PusherSetting.findOneAndUpdate(
            {}, // Single config document (upsert pattern)
            { appId, key, secret, cluster },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: setting });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ✅ FIX: Added null-check before toggling — was crashing if no setting existed
exports.togglePusherStatus = async (req, res) => {
    try {
        const setting = await PusherSetting.findOne();

        if (!setting) {
            return res.status(404).json({
                success: false,
                error: 'Pusher configuration not found. Please save settings first.'
            });
        }

        setting.status = !setting.status;
        await setting.save();

        res.status(200).json({ success: true, status: setting.status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ✅ FIX: placeOrder should be in its own orderController, but kept here
//    with proper guard in case req.user is missing
exports.placeOrder = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // Order save logic goes here...

        // Real-time Notification
        await triggerRealtimeEvent('admin-channel', 'new-order', {
            customerName: req.user.name,
            totalAmount: req.body.amount,
            message: 'A new order has arrived, please check!'
        });

        res.status(201).json({ success: true, message: 'Order Placed' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};