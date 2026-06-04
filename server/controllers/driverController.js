const Driver = require('../models/Driver');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');

// @desc    Onboard New Driver
exports.createDriver = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            vehicleType,
            vehicleNumber,
            identityType,
            identityNumber,
            drivingLicense,
            gender,
            dob,        // frontend sends key "dob" from the date input
            password,
        } = req.body;

        const profileImage = req.file ? req.file.path : null;

        // Duplicate check
        const orConditions = [];
        if (email)         orConditions.push({ email });
        if (phone)         orConditions.push({ phone });
        if (vehicleNumber) orConditions.push({ vehicleNumber });

        if (orConditions.length > 0) {
            const driverExists = await Driver.findOne({ $or: orConditions });
            if (driverExists) {
                return res.status(400).json({ success: false, message: "Driver or Vehicle already registered" });
            }
        }

        const driver = new Driver({
            fullName,
            email,
            phone,
            vehicleType,
            vehicleNumber,
            identityType,
            identityNumber,
            drivingLicense,
            gender,
            dateOfBirth: dob,   // ✅ stored as plain string "YYYY-MM-DD" — no conversion
            password,           // ✅ stored as plain text — shown in edit form
            profileImage,
        });

        await driver.save();
        res.status(201).json({ success: true, message: "Driver onboarded successfully!", driver });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get Single Driver by ID
exports.getDriverById = async (req, res) => {
    try {
        // No .select('-password') — we want to return password so edit form can show it
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver not found" });
        }
        res.status(200).json({ success: true, driver });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update Driver by ID
exports.updateDriver = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ success: false, message: "Driver not found" });
        }

        const {
            fullName, email, phone,
            vehicleType, vehicleNumber,
            identityType, identityNumber,
            drivingLicense, gender,
            dob, dateOfBirth,   // accept both key names
            password,
        } = req.body;

        // Duplicate checks against other drivers
        if (email && email !== driver.email) {
            const exists = await Driver.findOne({ email, _id: { $ne: req.params.id } });
            if (exists) return res.status(400).json({ success: false, message: "Email already in use" });
        }
        if (phone && phone !== driver.phone) {
            const exists = await Driver.findOne({ phone, _id: { $ne: req.params.id } });
            if (exists) return res.status(400).json({ success: false, message: "Phone already in use" });
        }
        if (vehicleNumber && vehicleNumber !== driver.vehicleNumber) {
            const exists = await Driver.findOne({ vehicleNumber, _id: { $ne: req.params.id } });
            if (exists) return res.status(400).json({ success: false, message: "Vehicle number already registered" });
        }

        if (fullName)        driver.fullName       = fullName;
        if (email)           driver.email          = email;
        if (phone)           driver.phone          = phone;
        if (vehicleType)     driver.vehicleType    = vehicleType;
        if (vehicleNumber)   driver.vehicleNumber  = vehicleNumber;
        if (identityType)    driver.identityType   = identityType;
        if (identityNumber)  driver.identityNumber = identityNumber;
        if (drivingLicense)  driver.drivingLicense = drivingLicense;
        if (gender)          driver.gender         = gender;
        if (password)        driver.password       = password;   // ✅ plain text update

        // Accept "dob" or "dateOfBirth" key from body
        const dobValue = dob || dateOfBirth;
        if (dobValue)        driver.dateOfBirth    = dobValue;   // ✅ plain string stored directly

        if (req.file)        driver.profileImage   = req.file.path;

        await driver.save();
        res.status(200).json({ success: true, message: "Driver updated successfully!", driver });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle Driver Online/Offline Status
exports.toggleStatus = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });
        driver.isOnline = !driver.isOnline;
        await driver.save();
        res.status(200).json({ success: true, isOnline: driver.isOnline });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get All Drivers with optional filters
exports.getAllDrivers = async (req, res) => {
    try {
        const { status, vehicle } = req.query;
        let query = {};
        if (status)  query.isOnline    = status === 'online';
        if (vehicle) query.vehicleType = vehicle;

        const drivers = await Driver.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: drivers.length, drivers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const driver = await Driver.findOne({ email, isActive: true });
    if (!driver || driver.password !== password) // plain-text match (as per your schema)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: driver._id, role: 'driver' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      driver: {
        _id: driver._id,
        fullName: driver.fullName,
        email: driver.email,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber,
        profileImage: driver.profileImage,
        isOnline: driver.isOnline,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDriverOrders = async (req, res) => {
  try {
        // console.log('req.driver:', req.driver); // ← add this

    const orders = await Order.find({ assignedDriver: req.driver._id })
      .populate('user', 'fullName phone email')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
        // console.error('getDriverOrders error:', err.message); // ← add this

    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDriverOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      assignedDriver: req.driver._id,
    }).populate('user', 'fullName phone email');
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markDelivered = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      assignedDriver: req.driver._id,
    });
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    if (!['On The Way', 'Shipped', 'Processing'].includes(order.status))
      return res.status(400).json({
        success: false,
        message: `Cannot deliver an order with status: ${order.status}`,
      });

    const proofImage = req.file ? req.file.path : null; // Cloudinary URL from multer
    if (!proofImage)
      return res.status(400).json({ success: false, message: 'Delivery proof photo is required' });

    order.status          = 'Delivered';
    order.paymentStatus   = 'Paid';
    order.deliveredAt     = new Date();
    order.deliveryProof   = proofImage; // add this field to your Order schema
    await order.save();

    // Update driver stats
    await Driver.findByIdAndUpdate(req.driver._id, {
      $inc: { totalOrdersDelivered: 1 },
    });

    res.json({ success: true, message: 'Order marked as delivered!', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── FUNCTION 1: Confirm Pickup ────────────────────────────────────────────
// @route  PATCH /api/drivers/my-orders/:id/pickup
exports.confirmPickup = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      assignedDriver: req.driver._id,
    });
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'Processing' && order.status !== 'Shipped')
      return res.status(400).json({
        success: false,
        message: `Cannot confirm pickup for order with status: ${order.status}`,
      });

    const pickupProof = req.file ? req.file.path : null;
    if (!pickupProof)
      return res.status(400).json({ success: false, message: 'Pickup proof photo is required' });

    order.status     = 'Picked Up';
    order.pickupProof = pickupProof;
    order.pickedUpAt  = new Date();
    order.statusHistory.push({ status: 'Picked Up', changedAt: new Date() });
    await order.save();

    res.json({ success: true, message: 'Pickup confirmed!', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── FUNCTION 2: Update Status Manually ───────────────────────────────────
// @route  PATCH /api/drivers/my-orders/:id/status
exports.updateDriverOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Only these 4 stages are driver-controllable
    const ALLOWED = ['Picked Up', 'In Transit', 'On The Way', 'Delivered'];
    if (!ALLOWED.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });

    const order = await Order.findOne({
      _id: req.params.id,
      assignedDriver: req.driver._id,
    });
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    // Enforce forward-only progression
    const progression = ['Picked Up', 'In Transit', 'On The Way', 'Delivered'];
    const currentIdx  = progression.indexOf(order.status);
    const newIdx      = progression.indexOf(status);

    if (newIdx <= currentIdx)
      return res.status(400).json({
        success: false,
        message: 'Cannot move order backwards in status',
      });

    order.status = status;
    order.statusHistory.push({ status, changedAt: new Date() });
    if (status === 'Delivered') {
      order.deliveredAt   = new Date();
      order.paymentStatus = 'Paid';
    }
    await order.save();

    res.json({ success: true, message: `Status updated to ${status}`, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};