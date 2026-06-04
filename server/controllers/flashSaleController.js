const FlashSale = require('../models/FlashSale');
const Product = require('../models/product_Management/Product'); // adjust path if needed

// @desc    Create New Flash Sale
exports.addFlashSale = async (req, res) => {
    try {
        const { name, minDiscount, startDate, startTime, endDate, endTime, description } = req.body;
        const thumbnail = req.file ? req.file.path : null;

        if (!thumbnail) {
            return res.status(400).json({ success: false, message: "Flash Sale Thumbnail is required" });
        }

        const flashSale = new FlashSale({
            name, minDiscount, startDate, startTime, endDate, endTime, description, thumbnail,
        });

        await flashSale.save();
        res.status(201).json({ success: true, message: "Flash Sale Created!", flashSale });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get All Flash Sales
exports.getFlashSales = async (req, res) => {
    try {
        const sales = await FlashSale.find().sort({ startDate: 1 });
        res.status(200).json({ success: true, sales });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get Single Flash Sale (with populated products)
exports.getFlashSaleById = async (req, res) => {
    try {
        const sale = await FlashSale.findById(req.params.id).populate('products');
        if (!sale) return res.status(404).json({ success: false, message: "Flash Sale not found" });
        res.status(200).json({ success: true, sale });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update Flash Sale
exports.updateFlashSale = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) updateData.thumbnail = req.file.path;

        const sale = await FlashSale.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!sale) return res.status(404).json({ success: false, message: "Flash Sale not found" });
        res.status(200).json({ success: true, message: "Flash Sale Updated!", sale });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle Flash Sale Active Status
exports.toggleFlashSaleStatus = async (req, res) => {
    try {
        const sale = await FlashSale.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: "Flash Sale not found" });

        sale.isActive = !sale.isActive;
        await sale.save();
        res.status(200).json({ success: true, message: `Flash Sale ${sale.isActive ? 'Activated' : 'Deactivated'}`, sale });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete Flash Sale
exports.deleteFlashSale = async (req, res) => {
    try {
        const sale = await FlashSale.findByIdAndDelete(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: "Flash Sale not found" });
        res.status(200).json({ success: true, message: "Flash Sale Deleted!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Add Product to Flash Sale
exports.addProductToFlashSale = async (req, res) => {
    try {
        const { productId } = req.body;
        const sale = await FlashSale.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: "Flash Sale not found" });

        if (sale.products.includes(productId)) {
            return res.status(400).json({ success: false, message: "Product already in this Flash Sale" });
        }

        sale.products.push(productId);
        await sale.save();

        const updated = await FlashSale.findById(req.params.id).populate('products');
        res.status(200).json({ success: true, message: "Product added to Flash Sale!", sale: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update a product's price/quantity within a Flash Sale
//          (Stored on the Product model directly — adjust if you have a separate join model)
exports.updateProductInFlashSale = async (req, res) => {
    try {
        const { price, quantity } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.productId,
            { sellingPrice: price, stockQuantity: quantity },
            { new: true }
        );
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.status(200).json({ success: true, message: "Product updated!", product });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Remove Product from Flash Sale
exports.removeProductFromFlashSale = async (req, res) => {
    try {
        const sale = await FlashSale.findById(req.params.id);
        if (!sale) return res.status(404).json({ success: false, message: "Flash Sale not found" });

        sale.products = sale.products.filter(
            (p) => p.toString() !== req.params.productId
        );
        await sale.save();

        const updated = await FlashSale.findById(req.params.id).populate('products');
        res.status(200).json({ success: true, message: "Product removed from Flash Sale!", sale: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};