const Customer = require('../models/Customer');

// @desc    Add New Customer (Admin Side)
exports.addCustomer = async (req, res) => {
    try {
        const { 
            fullName, email, phone, street, city, pincode, 
            totalSpent, totalOrders 
        } = req.body;

        // 1. Image Check (Cloudinary URL)
        const avatarUrl = req.file ? req.file.path : null;

        // 2. Duplicate Check
        const existingCustomer = await Customer.findOne({ 
            $or: [{ email }, { phone }] 
        });

        if (existingCustomer) {
            return res.status(400).json({ 
                success: false, 
                message: "Customer already exists with this email or phone." 
            });
        }

        // 3. Create New Customer with Stats
        const customer = new Customer({
            fullName,
            email,
            phone,
            avatar: avatarUrl, // Ab image save hogi
            address: [{ 
                street, 
                city, 
                pincode, 
                isDefault: true 
            }],
            // Agar admin starting mein hi purana hisab daalna chahe
            totalOrders: totalOrders || 0,
            totalSpent: totalSpent || 0,
            isActive: true
        });

        await customer.save();

        res.status(201).json({ 
            success: true, 
            message: "Customer Created with Image and Stats!", 
            customer 
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get All Customers (For Dashboard Table)
// @desc    Get All Customers for Dashboard Table
exports.getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });

        // Stats calculate karna (e.g. Total customers, Active customers)
        const totalCustomers = await Customer.countDocuments();
        const activeCustomers = await Customer.countDocuments({ isActive: true });

        res.status(200).json({
            success: true,
            total: totalCustomers,
            active: activeCustomers,
            customers
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update Customer Details
// @route   PUT /api/customers/update/:id

// @desc    Update Customer Details (With Avatar & Address)
exports.updateCustomer = async (req, res) => {
    try {
        const { fullName, email, phone, street, city, pincode, isActive } = req.body;
        const customerId = req.params.id;

        let customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ success: false, message: "Customer nahi mila" });

        // Profile Picture update ka logic
        const avatarUrl = req.file ? req.file.path : customer.avatar;

        // Address update logic: Agar naya address bheja hai toh use update karein
        // Note: Real world mein hum specific address index update karte hain, 
        // par yahan hum default address ko update kar rahe hain.
        let updatedAddress = customer.address;
        if (street || city || pincode) {
            updatedAddress = [{
                street: street || customer.address[0]?.street,
                city: city || customer.address[0]?.city,
                pincode: pincode || customer.address[0]?.pincode,
                isDefault: true
            }];
        }

        const dataToUpdate = {
            fullName: fullName || customer.fullName,
            email: email || customer.email,
            phone: phone || customer.phone,
            avatar: avatarUrl,
            isActive: isActive !== undefined ? isActive : customer.isActive,
            address: updatedAddress
        };

        const updatedCustomer = await Customer.findByIdAndUpdate(customerId, dataToUpdate, { new: true });

        res.status(200).json({
            success: true,
            message: "Customer profile updated!",
            customer: updatedCustomer
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// @desc    Delete Customer Permanently
// @route   DELETE /api/customers/delete/:id
exports.deleteCustomer = async (req, res) => {
    try {
        const customerId = req.params.id;

        // 1. Check karein ki customer exist karta hai ya nahi
        const customer = await Customer.findById(customerId);
        
        if (!customer) {
            return res.status(404).json({ 
                success: false, 
                message: "Customer nahi mila!" 
            });
        }

        // 2. Delete operation
        await Customer.findByIdAndDelete(customerId);

        res.status(200).json({ 
            success: true, 
            message: `Customer '${customer.fullName}' ko successfully delete kar diya gaya hai.` 
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Delete karne mein error aayi", 
            error: error.message 
        });
    }
};