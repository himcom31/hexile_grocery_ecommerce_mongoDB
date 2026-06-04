const Category = require('../../models/Category/Category');

exports.addCategory = async (req, res) => {
    try {
        console.log("Request Body:", req.body);
        
        const { name, description, isActive } = req.body;
        const thumbnail = req.file ? req.file.path : null;

        if (!thumbnail) {
            return res.status(400).json({ 
                success: false, 
                message: "Thumbnail upload fail ho gaya ya missing hai." 
            });
        }

        const category = new Category({
            name,
            thumbnail,
            description,
            isActive: isActive === 'true' || isActive === true
        });

        const savedCategory = await category.save();
        
        return res.status(201).json({ 
            success: true, 
            message: "Category created successfully!", 
            category: savedCategory 
        });

    } catch (error) {
        console.error("DETAILED ERROR:", error);
        // Isse aapko Postman mein asli wajah dikhegi
        return res.status(500).json({ 
            success: false, 
            message: "Backend mein error hai", 
            error: error.message 
        });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
 
        const updateData = {};
 
        if (name && name.trim()) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (isActive !== undefined) {
            updateData.isActive = isActive === 'true' || isActive === true;
        }
 
        // If new thumbnail uploaded
        if (req.file) {
            updateData.thumbnail = req.file.path;
        }
 
        const updated = await Category.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
 
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }
 
        return res.status(200).json({
            success: true,
            message: "Category updated successfully!",
            category: updated
        });
 
    } catch (error) {
        console.error("updateCategory ERROR:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Category with this name already exists."
            });
        }
        return res.status(500).json({
            success: false,
            message: "Server error while updating category.",
            error: error.message
        });
    }
};
 
// DELETE /api/category/:id
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
 
        const deleted = await Category.findByIdAndDelete(id);
 
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }
 
        return res.status(200).json({
            success: true,
            message: `Category "${deleted.name}" deleted successfully.`
        });
 
    } catch (error) {
        console.error("deleteCategory ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting category.",
            error: error.message
        });
    }
};