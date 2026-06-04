const Brand = require('../../models/product_Management/Brand');
const cloudinary = require('cloudinary').v2; // Purana image delete karne ke liye


// @desc    Add New Brand
exports.addBrand = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        const logo = req.file ? req.file.path : null;

        if (!logo) {
            return res.status(400).json({ success: false, message: "Brand logo is required" });
        }

        const brand = new Brand({
            name,
            logo,
            description,
            isActive: isActive === 'true' || isActive === true
        });

        await brand.save();
        res.status(201).json({ success: true, message: "Brand created successfully!", brand });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get All Brands
exports.getBrands = async (req, res) => {
    try {
        const brands = await Brand.find().sort({ name: 1 }); // Alphabetical order
        res.status(200).json({ success: true, brands });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// @desc    Update Brand
// @route   PUT /api/brands/update/:id
exports.updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;

        // 1. Pehle purana brand dhoondhein
        let brand = await Brand.findById(id);
        if (!brand) {
            return res.status(404).json({ success: false, message: "Brand not found" });
        }

        // 2. Agar naya logo upload hua hai
        let logoUrl = brand.logo;
        if (req.file) {
            // (Optional) Purana image Cloudinary se delete karne ka logic yahan aa sakta hai
            logoUrl = req.file.path; // Naya image path
        }

        // 3. Brand update karein
        brand = await Brand.findByIdAndUpdate(
            id,
            {
                name,
                description,
                logo: logoUrl,
                isActive: isActive === 'true' || isActive === true
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Brand updated successfully!",
            brand
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete Brand
// @route   DELETE /api/brands/delete/:id
exports.deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ success: false, message: "Brand not found" });
        }

        // Brand delete karein
        await Brand.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Brand deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};