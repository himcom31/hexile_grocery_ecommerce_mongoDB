// controllers/Order/orderController.js
const Order   = require('../models/Order');
const Cart    = require('../models/User/Cart');       // adjust path
const User    = require('../models/User/User');       // adjust path
const Product = require('../models/product_Management/Product');         // adjust path

// ─── Helper: format address snapshot ────────────────────────────────────────
const snapshotAddress = (addr) => ({
  name:     addr.name     || '',
  phone:    addr.phone    || '',
  altPhone: addr.altPhone || '',
  house:    addr.house    || '',
  road:     addr.road     || '',
  city:     addr.city     || '',
  state:    addr.state    || '',
  pincode:  addr.pincode  || '',
  landmark: addr.landmark || '',
  type:     addr.type     || 'Home',
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/orders/place
// @desc    Place a new order
// @access  Protected (user)
// ─────────────────────────────────────────────────────────────────────────────
exports.placeOrder = async (req, res) => {
  try {
    const {
      addressId,
      paymentMethod = 'COD',
      note          = '',
      couponCode    = null,
      couponDiscount = 0,
      shippingCharge = 0,
      tax            = 0,
      razorpayOrderId   = null,
      razorpayPaymentId = null,
    } = req.body;

    // ── 1. Fetch user + addresses ────────────────────────────────────────
    const user = await User.findById(req.user._id).select('addresses');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const address = addressId
      ? user.addresses.id(addressId)
      : user.addresses.find(a => a.isDefault) || user.addresses[0];

    if (!address) {
      return res.status(400).json({ success: false, message: 'No delivery address found. Please add one.' });
    }

    // ── 2. Fetch cart ────────────────────────────────────────────────────
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // ── 3. Build order items ─────────────────────────────────────────────
    const orderItems = cart.items.map(item => {
      const p     = item.product;
      const price = p.buyingPrice ?? p.price ?? 0;
      const qty   = item.quantity || 1;
      return {
        product:  p._id,
        name:     p.name,
        image:    p.thumbnail || p.additionalImages?.[0] || p.image || null,
        price,
        quantity: qty,
        total:    price * qty,
      };
    });

    // ── 4. Pricing ───────────────────────────────────────────────────────
    const subtotal = orderItems.reduce((sum, i) => sum + i.total, 0);
    const discount = Number(couponDiscount) || 0;
    const total    = Math.max(0, subtotal - discount + Number(shippingCharge) + Number(tax));

    // ── 5. Create order ──────────────────────────────────────────────────
    const paymentStatus = (paymentMethod === 'Razorpay' && razorpayPaymentId) ? 'Paid' : 'Pending';

    const order = await Order.create({
      user:          req.user._id,
      items:         orderItems,
      subtotal,
      discount,
      shippingCharge: Number(shippingCharge),
      tax:            Number(tax),
      total,
      couponCode:     couponCode || null,
      couponDiscount: discount,
      shippingAddress: snapshotAddress(address),
      paymentMethod,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      note,
    });

    // ── 6. Clear cart ────────────────────────────────────────────────────
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order,
    });
  } catch (err) {
    console.error('[POST /api/orders/place]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/orders/my
// @desc    Get logged-in user's orders
// @access  Protected (user)
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/orders/my/:id
// @desc    Get single order detail
// @access  Protected (user)
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/orders/my/:id
// @desc    Get single order detail
// @access  Protected (user)
// ─────────────────────────────────────────────────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('assignedDriver', 'fullName phone vehicleType vehicleNumber profileImage'); // ← ADD THIS

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PATCH /api/orders/my/:id/cancel
// @desc    Cancel an order (only if Pending/Processing)
// @access  Protected (user)
// ─────────────────────────────────────────────────────────────────────────────
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!['Pending', 'Processing'].includes(order.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${order.status} order` });
    }

    order.status      = 'Cancelled';
    order.cancelledAt = new Date();
    await order.save();

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET  /api/orders/admin/all          — admin: all orders
// @route   PATCH /api/orders/admin/:id/status  — admin: update status
// ─────────────────────────────────────────────────────────────────────────────

exports.adminGetAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      paymentMethod,
      search,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // ── Build filter ──────────────────────────────────────────────────────
    const filter = {};

    if (status && status !== 'All')              filter.status        = status;
    if (paymentStatus && paymentStatus !== 'All') filter.paymentStatus = paymentStatus;
    if (paymentMethod && paymentMethod !== 'All') filter.paymentMethod = paymentMethod;

    // Date range
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);          // include the whole "to" day
        filter.createdAt.$lte = end;
      }
    }

    // Search: order number, customer name, or email
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      // We need to search across order fields AND populated user fields.
      // Strategy: find matching user IDs first, then OR them in.
      const User = require('../models/User/User');   // adjust path if needed
      const matchingUsers = await User.find({
        $or: [{ fullName: regex }, { email: regex }],
      }).select('_id');

      const userIds = matchingUsers.map(u => u._id);

      filter.$or = [
        { orderNumber: regex },
        ...(userIds.length ? [{ user: { $in: userIds } }] : []),
      ];
    }

    // ── Sort ──────────────────────────────────────────────────────────────
    const allowedSortFields = ['createdAt', 'total', 'orderNumber', 'status', 'paymentStatus'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    // ── Query ─────────────────────────────────────────────────────────────
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'fullName email phone')
        .sort(sort)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      orders,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, ...(status === 'Delivered' ? { deliveredAt: new Date(), paymentStatus: 'Paid' } : {}) },
      { new: true }
    ).populate('user', 'fullName email phone');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Admin: Assign a rider/driver to an order
// @route   PATCH /api/orders/admin/:id/assign-rider
exports.adminAssignRider = async (req, res) => {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ success: false, message: 'driverId is required' });
    }

    const Driver = require('../models/Driver');
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        assignedDriver: driverId,
        status: 'Out for Delivery',   // optional: auto-advance status
      },
      { new: true }
    ).populate('user', 'fullName email phone')
     .populate('assignedDriver', 'fullName phone vehicleType vehicleNumber');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Rider assigned successfully', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};