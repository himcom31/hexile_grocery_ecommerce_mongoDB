const Blog = require('../models/Blog');
const Category = require('../models/Category/Category');

exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find()
            .populate('category', 'name')
            .populate('author', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, blogs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('category', 'name')
            .populate('author', 'name');

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        res.status(200).json({ success: true, blog });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.addBlog = async (req, res) => {
    try {
        const { title, category, tags, description } = req.body;
        const thumbnail = req.file ? req.file.path : null;

        if (!thumbnail) {
            return res.status(400).json({ success: false, message: "Blog thumbnail is required" });
        }

        const blog = new Blog({
            title,
            category,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)) : [],
            description,
            thumbnail,
            author: req.user.id
        });

        await blog.save();
        res.status(201).json({ success: true, message: "Blog published!", blog });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateBlog = async (req, res) => {
    try {
        const { title, category, tags, description, isActive } = req.body;

        const updateData = {
            title,
            category,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)) : [],
            description,
        };

        if (typeof isActive !== 'undefined') {
            updateData.isActive = isActive === 'true' || isActive === true;
        }

        if (req.file) {
            updateData.thumbnail = req.file.path;
        }

        const blog = await Blog.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('category', 'name');

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        res.status(200).json({ success: true, message: "Blog updated!", blog });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.toggleBlogStatus = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        blog.isActive = !blog.isActive;
        await blog.save();

        res.status(200).json({ success: true, message: `Blog ${blog.isActive ? 'activated' : 'deactivated'}`, blog });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        res.status(200).json({ success: true, message: "Blog deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};