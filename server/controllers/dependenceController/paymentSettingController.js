const PaymentSetting = require('../../models/dependence/PaymentSetting');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const ALLOWED_GATEWAYS = ['Stripe', 'Razorpay'];

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get ALL payment gateway settings (admin)
// @route   GET /api/payment/all
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllGatewaySettings = async (req, res) => {
    try {
        const settings = await PaymentSetting.find({
            gatewayName: { $in: ALLOWED_GATEWAYS }
        });
        res.status(200).json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add a new payment gateway (Stripe or Razorpay)
// @route   POST /api/payment/add
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.addPaymentSettings = async (req, res) => {
    try {
        const { gatewayName, status, mode, secretKey, publishedKey, title } = req.body;

        if (!ALLOWED_GATEWAYS.includes(gatewayName)) {
            return res.status(400).json({
                success: false,
                message: `Only Stripe and Razorpay are supported.`
            });
        }

        const exists = await PaymentSetting.findOne({ gatewayName });
        if (exists) {
            return res.status(400).json({
                success: false,
                message: `${gatewayName} settings already exist. Use the update endpoint.`
            });
        }

        const logoUrl = req.file ? req.file.path : null;

        const newSetting = await PaymentSetting.create({
            gatewayName,
            status: status === 'true' || status === true,
            mode: mode || 'Test',
            secretKey,
            publishedKey,
            title: title || gatewayName,
            logo: logoUrl,
        });

        res.status(201).json({
            success: true,
            message: `${gatewayName} added successfully!`,
            data: newSetting
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update an existing payment gateway
// @route   POST /api/payment/update
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.updatePaymentSettings = async (req, res) => {
    try {
        const { gatewayName, status, mode, secretKey, publishedKey, title } = req.body;

        if (!ALLOWED_GATEWAYS.includes(gatewayName)) {
            return res.status(400).json({
                success: false,
                message: `Only Stripe and Razorpay are supported.`
            });
        }

        const logo = req.file ? req.file.path : undefined;

        const updateFields = {
            status: status === 'true' || status === true,
            mode,
            secretKey,
            publishedKey,
            title,
        };
        if (logo) updateFields.logo = logo;

        const settings = await PaymentSetting.findOneAndUpdate(
            { gatewayName },
            updateFields,
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: `${gatewayName} settings updated successfully!`,
            settings
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle gateway status ON/OFF
// @route   PATCH /api/payment/toggle/:gatewayName
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
exports.toggleGatewayStatus = async (req, res) => {
    try {
        const { gatewayName } = req.params;

        const setting = await PaymentSetting.findOne({ gatewayName });
        if (!setting) {
            return res.status(404).json({ success: false, message: `${gatewayName} not found` });
        }

        setting.status = !setting.status;
        await setting.save();

        res.status(200).json({
            success: true,
            message: `${gatewayName} is now ${setting.status ? 'Active' : 'Inactive'}`,
            status: setting.status
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get active gateways for checkout (public)
// @route   GET /api/payment/active
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
exports.getActiveGateways = async (req, res) => {
    try {
        const gateways = await PaymentSetting.find({ status: true })
            .select('-secretKey'); // Never expose secret key to frontend
        res.status(200).json({ success: true, gateways });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create Razorpay payment order
// @route   POST /api/payment/process
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.processPayment = async (req, res) => {
    try {
        const { amount, orderId } = req.body;

        if (!amount || amount < 1) {
            return res.status(400).json({ success: false, message: 'Invalid Amount' });
        }

        const config = await PaymentSetting.findOne({ gatewayName: 'Razorpay', status: true });
        if (!config) {
            return res.status(400).json({ success: false, message: 'Razorpay is disabled or not configured.' });
        }

        const instance = new Razorpay({
            key_id: config.publishedKey,
            key_secret: config.secretKey,
        });

        const options = {
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `receipt_${orderId || Date.now()}`,
            notes: {
                userId: req.user?._id?.toString() || 'Guest',
                orderId: orderId,
            }
        };

        const rzpOrder = await instance.orders.create(options);

        res.status(200).json({
            success: true,
            order_id: rzpOrder.id,
            amount: rzpOrder.amount,
            key_id: config.publishedKey,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Payment could not be initiated', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify Razorpay payment signature
// @route   POST /api/payment/verify
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const config = await PaymentSetting.findOne({ gatewayName: 'Razorpay' });
        if (!config) {
            return res.status(400).json({ success: false, message: 'Gateway settings not found' });
        }

        const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSign = crypto
            .createHmac('sha256', config.secretKey)
            .update(sign)
            .digest('hex');

        if (razorpay_signature === expectedSign) {
            return res.status(200).json({ success: true, message: 'Payment verified successfully!' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid signature. Payment could not be verified.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};