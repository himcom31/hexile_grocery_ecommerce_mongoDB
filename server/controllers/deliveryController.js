const DeliveryCharge = require('../models/DeliveryCharge');

// @desc    Add New Delivery Charge
// @route   POST /api/delivery/add
// @access  Private/Admin
exports.addDeliveryCharge = async (req, res) => {
    try {
        const { minOrderQty, maxOrderQty, charge } = req.body;

        if (Number(minOrderQty) >= Number(maxOrderQty)) {
            return res.status(400).json({
                success: false,
                message: 'Maximum order quantity must be greater than minimum order quantity'
            });
        }

        const newCharge = await DeliveryCharge.create({ minOrderQty, maxOrderQty, charge });

        res.status(201).json({
            success: true,
            message: 'Delivery charge added successfully',
            data: newCharge
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get All Delivery Charges
// @route   GET /api/delivery/all
// @access  Public
exports.getAllCharges = async (req, res) => {
    try {
        const charges = await DeliveryCharge.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, charges });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update Delivery Charge
// @route   PUT /api/delivery/update/:id
// @access  Private/Admin
exports.updateDeliveryCharge = async (req, res) => {
    try {
        const { minOrderQty, maxOrderQty, charge } = req.body;

        const existing = await DeliveryCharge.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Delivery charge not found' });
        }

        const newMin = minOrderQty !== undefined ? Number(minOrderQty) : existing.minOrderQty;
        const newMax = maxOrderQty !== undefined ? Number(maxOrderQty) : existing.maxOrderQty;

        if (newMin >= newMax) {
            return res.status(400).json({
                success: false,
                message: 'Maximum order quantity must be greater than minimum order quantity'
            });
        }

        if (minOrderQty !== undefined) existing.minOrderQty = minOrderQty;
        if (maxOrderQty !== undefined) existing.maxOrderQty = maxOrderQty;
        if (charge      !== undefined) existing.charge      = charge;

        await existing.save();

        res.status(200).json({
            success: true,
            message: 'Delivery charge updated successfully',
            data: existing
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete Delivery Charge
// @route   DELETE /api/delivery/delete/:id
// @access  Private/Admin
exports.deleteDeliveryCharge = async (req, res) => {
    try {
        const existing = await DeliveryCharge.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Delivery charge not found' });
        }

        await existing.deleteOne();
        res.status(200).json({ success: true, message: 'Delivery charge deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// deliveryController.js — add this
exports.getChargeForQty = async (req, res) => {
  try {
    const qty = Number(req.query.qty) || 1;
    const charge = await DeliveryCharge.findOne({
      isActive:    true,
      minOrderQty: { $lte: qty },
      maxOrderQty: { $gte: qty },
    });
    res.json({ success: true, charge: charge?.charge ?? 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};