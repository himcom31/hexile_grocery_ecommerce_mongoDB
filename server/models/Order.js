// models/Order/Order.js
const mongoose = require('mongoose');

// ─── Order Item Sub-Schema ─────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  product: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Product',
    required: true,
  },
  name:     { type: String, required: true },
  image:    { type: String, default: null },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  total:    { type: Number, required: true },
}, { _id: true });

// ─── Order Schema ──────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    orderNumber: {
      type:   String,
      unique: true,
    },

    items: {
      type:     [orderItemSchema],
      required: true,
      validate: v => v.length > 0,
    },

    // ── Pricing ──────────────────────────────────────────────────────────
    subtotal:          { type: Number, required: true },
    discount:          { type: Number, default: 0 },
    shippingCharge:    { type: Number, default: 0 },
    tax:               { type: Number, default: 0 },
    total:             { type: Number, required: true },

    // ── Coupon ───────────────────────────────────────────────────────────
    couponCode:        { type: String, default: null },
    couponDiscount:    { type: Number, default: 0 },

    // ── Shipping Address (snapshot at order time) ─────────────────────
    shippingAddress: {
      name:     { type: String, required: true },
      phone:    { type: String, required: true },
      altPhone: { type: String, default: '' },
      house:    { type: String, required: true },
      road:     { type: String, required: true },
      city:     { type: String, required: true },
      state:    { type: String, required: true },
      pincode:  { type: String, required: true },
      landmark: { type: String, default: '' },
      type:     { type: String, default: 'Home' },
    },
    deliveryProof: { type: String, default: null }, // Cloudinary URL


    // ── Payment ──────────────────────────────────────────────────────────
    paymentMethod: {
      type:    String,
      enum:    ['COD', 'Razorpay', 'Stripe', 'Card'],
      default: 'COD',
    },
    paymentStatus: {
      type:    String,
      enum:    ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    razorpayOrderId:   { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },

    // ── Order Status ──────────────────────────────────────────────────────
    status: {
  type: String,
  enum: ['Pending', 'Processing', 'Shipped', 'On The Way', 'Delivered', 'Cancelled', "Picked Up","In Transit",'Returned'],
  default: 'Pending',
},

statusHistory: [{                                // ← ADD
  status:    { type: String },
  changedAt: { type: Date, default: Date.now },
  note:      { type: String, default: '' },
}],
pickupProof:  { type: String, default: null },   // ← ADD — Cloudinary URL
pickedUpAt:   { type: Date,   default: null },   // ← ADD — auto-set on pickup confirm


    note:       { type: String, default: '' },
    deliveredAt:{ type: Date,   default: null },
    cancelledAt:{ type: Date,   default: null },

    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  },
  


  
  { timestamps: true }
);

// ── Auto-generate orderNumber before save ────────────────────────────────
orderSchema.pre('save', async function () {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;