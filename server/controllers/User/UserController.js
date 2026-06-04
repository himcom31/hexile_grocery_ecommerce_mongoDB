// controllers/user.controller.js
const jwt = require('jsonwebtoken');
const User = require('../../models/User/User');


// ── Helper: generate JWT ─────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ── Helper: build safe user object (no password) ─────
const sanitizeUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  gender: user.gender,        // ← add
  dateOfBirth: user.dateOfBirth,   // ← add
  country: user.country,
  avatar: user.avatar,
  isActive: user.isActive,
  createdAt: user.createdAt,
});


// ────────────────────────────────────────────────────
// @route   POST /api/user/register
// @desc    Register a new user
// @access  Public
// ────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { fullName, country, phone, email, password } = req.body;

    // Validate required fields
    if (!fullName || !country || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: fullName, country, phone, email, password.',
      });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Check if phone already exists
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this phone number already exists.',
      });
    }

    // Create user (password hashed via pre-save hook in model)
    const user = await User.create({ fullName, country, phone, email, password });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: sanitizeUser(user),
    });

  } catch (error) {
    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};


// ────────────────────────────────────────────────────
// @route   POST /api/user/login
// @desc    Login with email or phone + password
// @access  Public
// ────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    // identifier can be email or phone (matches AuthModal LoginForm)

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/phone and password are required.',
      });
    }

    // Determine if identifier is email or phone
    const isEmail = identifier.includes('@');

    // Find user — explicitly select password since it's select:false in schema
    const user = await User.findOne(
      isEmail
        ? { email: identifier.toLowerCase() }
        : { phone: identifier }
    ).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: sanitizeUser(user),
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};


// ────────────────────────────────────────────────────
// @route   GET /api/user/me
// @desc    Get currently logged-in user's profile
// @access  Protected
// ────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    return res.status(200).json({
      success: true,
      user: sanitizeUser(req.user),
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};


// ────────────────────────────────────────────────────
// @route   PUT /api/user/update-profile
// @desc    Update logged-in user's profile
// @access  Protected
// ────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { fullName, country, phone, avatar,gender, dateOfBirth  } = req.body;

    // If phone is being updated, check it's not taken by another user
    if (phone) {
      const phoneExists = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (phoneExists) {
        return res.status(409).json({
          success: false,
          message: 'This phone number is already in use.',
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, country, phone, avatar, gender, dateOfBirth },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: sanitizeUser(updatedUser),
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('UpdateProfile error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};


// ────────────────────────────────────────────────────
// @route   PUT /api/user/change-password
// @desc    Change password for logged-in user
// @access  Protected
// ────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // ── 1. Basic input validation ────────────────────────────────────────
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both current and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    // ── 2. Fetch user WITH password (select: false in schema, so force it) ─
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // ── 3. Verify current password ───────────────────────────────────────
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // ── 4. Set new password and save ─────────────────────────────────────
    // The pre('save') hook in User.model.js will hash it automatically
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });

  } catch (err) {
    console.error('[PUT /api/user/change-password]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};



///////////////////////////////////////////////////////////////////////////////////
