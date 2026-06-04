const Currency = require('../models/Currency');

// @desc    Add New Currency
exports.addCurrency = async (req, res) => {
    try {
        const { currencyName, currencySymbol, currencyCode, exchangeRate, isDefault } = req.body;

        // Agar ye default hai, toh purani default currencies ko false karo
        if (isDefault) {
            await Currency.updateMany({}, { isDefault: false });
        }

        const newCurrency = await Currency.create({
            currencyName,
            currencySymbol,
            currencyCode,
            exchangeRate,
            isDefault
        });

        res.status(201).json({ 
            success: true, 
            message: "Currency added successfully!", 
            data: newCurrency 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get All Currencies
exports.getAllCurrencies = async (req, res) => {
    try {
        const currencies = await Currency.find().sort({ isDefault: -1 });
        res.status(200).json({ success: true, currencies });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}; 