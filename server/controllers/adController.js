const Ad = require('../models/Ad');

// @desc    Add New Advertisement Banner
// POST /api/ads/add
exports.addAd = async (req, res) => {
    try {
        const { title, link, position, isActive } = req.body;

        const image = req.file ? req.file.path : null;

        if (!image) {
            return res.status(400).json({ success: false, message: "Ad Image is required" });
        }

        const newAd = new Ad({
            title,
            image,
            link,
            position,
            isActive: isActive === 'true' || isActive === true
        });

        await newAd.save();
        res.status(201).json({
            success: true,
            message: "Advertisement added successfully!",
            ad: newAd
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get All Ads (admin)
// GET /api/ads
exports.getAllAds = async (req, res) => {
    try {
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, ads });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get All Active Ads (public)
// GET /api/ads/active
exports.getActiveAds = async (req, res) => {
    try {
        const ads = await Ad.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, ads });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get Single Ad by ID
// GET /api/ads/:id
exports.getAdById = async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ success: false, message: "Ad not found" });
        }
        res.status(200).json({ success: true, ad });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update Ad
// PUT /api/ads/:id
exports.updateAd = async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ success: false, message: "Ad not found" });
        }

        const { title, link, position, isActive } = req.body;

        if (title !== undefined) ad.title = title;
        if (link !== undefined) ad.link = link;
        if (position !== undefined) ad.position = position;
        if (isActive !== undefined) ad.isActive = isActive === 'true' || isActive === true;

        // Replace image only if a new file was uploaded
        if (req.file) {
            ad.image = req.file.path;
        }

        await ad.save();
        res.status(200).json({
            success: true,
            message: "Advertisement updated successfully!",
            ad
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle Ad Active Status
// PATCH /api/ads/:id/toggle
exports.toggleAdStatus = async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ success: false, message: "Ad not found" });
        }

        ad.isActive = !ad.isActive;
        await ad.save();

        res.status(200).json({
            success: true,
            message: `Ad ${ad.isActive ? 'activated' : 'deactivated'} successfully!`,
            ad
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Delete Ad
// DELETE /api/ads/:id
exports.deleteAd = async (req, res) => {
    try {
        const ad = await Ad.findByIdAndDelete(req.params.id);
        if (!ad) {
            return res.status(404).json({ success: false, message: "Ad not found" });
        }

        res.status(200).json({
            success: true,
            message: "Advertisement deleted successfully!"
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};