// models/User.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Address Sub-Schema ────────────────────────────────────────────────────
const addressSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },

    altPhone: {
      type: String,
      default: '',
      trim: true,
    },

    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },

    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },

    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },

    house: {
      type: String,
      required: [true, 'House / Building is required'],
      trim: true,
    },

    road: {
      type: String,
      required: [true, 'Road / Area is required'],
      trim: true,
    },

    landmark: {
      type: String,
      default: '',
      trim: true,
    },

    type: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home',
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,      // each address gets its own ObjectId  ← needed for .id() lookups
    timestamps: true,      // createdAt / updatedAt per address
  }
);

// ─── User Schema ───────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },

    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    avatar: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''],
      default: '',
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },


    isActive: {
      type: Boolean,
      default: true,
    },

    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],

    // ── Delivery addresses (embedded array) ──────────────────────────────
    addresses: {
      type: [addressSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ── Hash password before saving ───────────────────────────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance method: compare plain password with hash ────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;