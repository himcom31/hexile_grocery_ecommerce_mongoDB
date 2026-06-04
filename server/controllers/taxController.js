const Tax = require('../models/Tax');

// @desc    Add New Tax
exports.addTax = async (req, res) => {
    try {
        const { taxName, percentage } = req.body;

        const taxExists = await Tax.findOne({ taxName });
        if (taxExists) {
            return res.status(400).json({ success: false, message: "This tax already exists" });
        }

        const tax = await Tax.create({ taxName, percentage });
        res.status(201).json({ success: true, message: "Tax added successfully", tax });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get All Taxes
exports.getTaxes = async (req, res) => {
    try {
        const taxes = await Tax.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, taxes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update Tax (name + percentage)
exports.updateTax = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id);
        if (!tax) {
            return res.status(404).json({ success: false, message: "Tax not found" });
        }

        const { taxName, percentage } = req.body;

        // Prevent duplicate name on another document
        if (taxName && taxName !== tax.taxName) {
            const duplicate = await Tax.findOne({ taxName, _id: { $ne: req.params.id } });
            if (duplicate) {
                return res.status(400).json({ success: false, message: "A tax with this name already exists" });
            }
        }

        if (taxName !== undefined)    tax.taxName    = taxName;
        if (percentage !== undefined) tax.percentage = percentage;

        await tax.save();
        res.status(200).json({ success: true, message: "Tax updated successfully", tax });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle Tax Active / Inactive
exports.toggleTaxStatus = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id);
        if (!tax) {
            return res.status(404).json({ success: false, message: "Tax not found" });
        }

        tax.isActive = !tax.isActive;
        await tax.save();

        res.status(200).json({ success: true, message: `Tax is now ${tax.isActive ? "active" : "inactive"}`, isActive: tax.isActive });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete Tax
exports.deleteTax = async (req, res) => {
    try {
        const tax = await Tax.findById(req.params.id);
        if (!tax) {
            return res.status(404).json({ success: false, message: "Tax not found" });
        }

        await tax.deleteOne();
        res.status(200).json({ success: true, message: "Tax deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// taxController.js — add this
exports.getActiveTax = async (req, res) => {
  try {
    const taxes = await Tax.find({ isActive: true });
    // Sum all active tax percentages
    const totalPercentage = taxes.reduce((sum, t) => sum + t.percentage, 0);
    res.json({ success: true, totalPercentage, taxes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};