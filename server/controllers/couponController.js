const Coupon = require('../models/Coupon');

// @desc    Add New Promo Code
// POST /api/coupons/add
exports.addCoupon = async (req, res) => {
    try {
        const coupon = new Coupon({
            ...req.body,
            couponCode: req.body.couponCode.toUpperCase()
        });

        await coupon.save();
        res.status(201).json({ success: true, message: "Promo Code Created!", coupon });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get All Coupons
// GET /api/coupons/all
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find()
            .populate('category', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, coupons });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update a Coupon
// PUT /api/coupons/:id
exports.updateCoupon = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (updateData.couponCode) {
            updateData.couponCode = updateData.couponCode.toUpperCase();
        }

        // If not Category_Specific, clear the category field
        if (updateData.applicableFor && updateData.applicableFor !== 'Category_Specific') {
            updateData.category = undefined;
        }

        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('category', 'name');

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        res.status(200).json({ success: true, message: "Promo Code Updated!", coupon });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete a Coupon
// DELETE /api/coupons/:id
exports.deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        res.status(200).json({ success: true, message: "Promo Code Deleted!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle Coupon Active Status
// PATCH /api/coupons/:id/toggle
exports.toggleCouponStatus = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.status(200).json({ success: true, message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}!`, coupon });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Validate Coupon (at checkout)
// POST /api/coupons/validate
exports.validateCoupon = async (req, res) => {
    try {
        const { code, orderAmount, userId } = req.body;
        const coupon = await Coupon.findOne({ couponCode: code.toUpperCase(), isActive: true });

        if (!coupon) return res.status(404).json({ message: "Invalid Coupon Code" });

        // Date Check
        const now = new Date();
        if (now > coupon.expiryDate) return res.status(400).json({ message: "Coupon Expired" });

        // Min Amount Check
        if (orderAmount < coupon.minOrderAmount) {
            return res.status(400).json({ message: `Min order should be ₹${coupon.minOrderAmount}` });
        }

        res.status(200).json({ success: true, coupon });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};