const Product  = require('../../models/product_Management/Product');
const User     = require('../../models/Admin');
const Category = require('../../models/Category/Category');
const Brand    = require('../../models/product_Management/Brand');

// ─── ADD PRODUCT ──────────────────────────────────────────────
exports.addProduct = async (req, res) => {
    try {
        const thumbnail = req.files && req.files['thumbnail']
            ? req.files['thumbnail'][0].path
            : null;

        const additionalImages = req.files && req.files['additionalImages']
            ? req.files['additionalImages'].map(file => file.path)
            : [];

        if (!thumbnail) {
            return res.status(400).json({ success: false, message: "Main Thumbnail is required" });
        }

        const {
            name, category, sku, buyingPrice, sellingPrice,
            stockQuantity, metaKeywords, attributes, ...rest
        } = req.body;

        const product = new Product({
            ...rest,
            name,
            sku,
            category,
            buyingPrice:      Number(buyingPrice),
            sellingPrice:     Number(sellingPrice),
            stockQuantity:    Number(stockQuantity),
            thumbnail,
            additionalImages,
            metaKeywords:     metaKeywords ? JSON.parse(metaKeywords) : [],
            attributes: (() => {
                try { return attributes ? JSON.parse(attributes) : []; }
                catch { return []; }
            })(),
            createdBy: req.user.id,
        });

        await product.save();

        res.status(201).json({
            success: true,
            message: "Product Added successfully!",
            product,
        });

    } catch (error) {
        console.error("Add Product Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// ─── GET ALL PRODUCTS ─────────────────────────────────────────
exports.getAllProducts = async (req, res) => {
    try {
        const page       = parseInt(req.query.page)  || 1;
        const limit      = parseInt(req.query.limit) || 10;
        const search     = req.query.search          || "";
        const categoryId = req.query.category        || "";

        let filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { sku:  { $regex: search, $options: "i" } },
            ];
        }

        if (categoryId) {
            filter.category = categoryId;
        }

        const products = await Product.find(filter)
            .populate('category', 'name thumbnail')
            .populate('brand',    'name')
            .populate('createdBy','name')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const totalProducts = await Product.countDocuments(filter);

        res.status(200).json({
            success:      true,
            count:        products.length,
            totalProducts,
            totalPages:   Math.ceil(totalProducts / limit),
            currentPage:  page,
            products,
        });

    } catch (error) {
        console.error("Get Products Error:", error.message);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// ─── GET SINGLE PRODUCT ───────────────────────────────────────
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name thumbnail')
            .populate('brand',    'name')
            .populate('createdBy','name');

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, product });

    } catch (error) {
        console.error("Get Product Error:", error.message);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// ─── UPDATE PRODUCT ───────────────────────────────────────────
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // If a new thumbnail was uploaded, use it; otherwise keep existing
        const newThumbnail = req.files && req.files['thumbnail']
            ? req.files['thumbnail'][0].path
            : null;

        // If new additional images were uploaded, use them; otherwise keep existing
        const newAdditionalImages = req.files && req.files['additionalImages']
            ? req.files['additionalImages'].map(file => file.path)
            : null;

        const {
            name, category, sku, buyingPrice, sellingPrice,
            stockQuantity, metaKeywords, attributes, ...rest
        } = req.body;

        // Build the update object
        const updateData = {
            ...rest,
        };

        if (name          !== undefined) updateData.name          = name;
        if (sku           !== undefined) updateData.sku           = sku;
        if (category      !== undefined) updateData.category      = category;
        if (buyingPrice   !== undefined) updateData.buyingPrice   = Number(buyingPrice);
        if (sellingPrice  !== undefined) updateData.sellingPrice  = Number(sellingPrice);
        if (stockQuantity !== undefined) updateData.stockQuantity = Number(stockQuantity);

        if (newThumbnail)                updateData.thumbnail         = newThumbnail;
        if (newAdditionalImages)         updateData.additionalImages  = newAdditionalImages;

        if (metaKeywords !== undefined) {
            updateData.metaKeywords = metaKeywords ? JSON.parse(metaKeywords) : [];
        }

        if (attributes !== undefined) {
            updateData.attributes = (() => {
                try { return attributes ? JSON.parse(attributes) : []; }
                catch { return []; }
            })();
        }

        updateData.updatedAt = new Date();

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .populate('category', 'name thumbnail')
            .populate('brand',    'name');

        res.status(200).json({
            success: true,
            message: "Product updated successfully!",
            product: updatedProduct,
        });

    } catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// ─── DELETE PRODUCT ───────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully!",
        });

    } catch (error) {
        console.error("Delete Product Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};