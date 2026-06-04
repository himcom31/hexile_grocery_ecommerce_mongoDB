// routes/addressRoutes.js
// ─────────────────────────────────────────────────────────────────────────
//  Mount in your main app:
//    const addressRoutes = require('./routes/addressRoutes');
//    app.use('/api/address', addressRoutes);
// ─────────────────────────────────────────────────────────────────────────
const express        = require('express');
const router         = express.Router();
const { protectUser }    = require('../../middleware/authMiddleware'); // your existing JWT middleware
const User           = require('../../models/User/User');        // ← adjust path if needed

// ── Helpers ───────────────────────────────────────────────────────────────

/** Strip the internal UI-only flags (_showAlt, _showLandmark) sent from the frontend */
const cleanBody = ({ name, phone, altPhone, pincode, state, city, house, road, landmark, type, isDefault }) => ({
  name:      (name      || '').trim(),
  phone:     (phone     || '').trim(),
  altPhone:  (altPhone  || '').trim(),
  pincode:   (pincode   || '').trim(),
  state:     (state     || '').trim(),
  city:      (city      || '').trim(),
  house:     (house     || '').trim(),
  road:      (road      || '').trim(),
  landmark:  (landmark  || '').trim(),
  type:      type      || 'Home',
  isDefault: Boolean(isDefault),
});

/** Validate required address fields — returns an error string or null */
const validateAddress = ({ name, phone, pincode, state, city, house, road }) => {
  if (!name)    return 'Name is required';
  if (!phone)   return 'Phone number is required';
  if (!pincode) return 'Pincode is required';
  if (!state)   return 'State is required';
  if (!city)    return 'City is required';
  if (!house)   return 'House / Building is required';
  if (!road)    return 'Road / Area is required';
  return null;
};

// ─────────────────────────────────────────────────────────────────────────
// GET /api/address
// Returns all saved addresses for the logged-in user
// ─────────────────────────────────────────────────────────────────────────
router.get('/', protectUser, async (req, res) => {
  try {
    // Select only the addresses field — no need to load the whole document
    const user = await User.findById(req.user._id).select('addresses');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    console.error('[GET /api/address]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/address
// Add a new delivery address
// Body: { name, phone, altPhone?, pincode, state, city, house, road, landmark?, type?, isDefault? }
// ─────────────────────────────────────────────────────────────────────────
router.post('/', protectUser, async (req, res) => {
  try {
    const data  = cleanBody(req.body);
    const error = validateAddress(data);

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // First address is always default; otherwise honour the caller's flag
    const shouldBeDefault = data.isDefault || user.addresses.length === 0;

    if (shouldBeDefault) {
      // Clear current default before adding new one
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    user.addresses.push({ ...data, isDefault: shouldBeDefault });
    await user.save();

    res.status(201).json({
      success:   true,
      message:   'Address added successfully',
      addresses: user.addresses,
    });
  } catch (err) {
    console.error('[POST /api/address]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PUT /api/address/:id
// Update an existing address by its sub-document _id
// ─────────────────────────────────────────────────────────────────────────
router.put('/:id', protectUser, async (req, res) => {
  try {
    const data  = cleanBody(req.body);
    const error = validateAddress(data);

    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // .id() searches the addresses sub-array by _id
    const addr = user.addresses.id(req.params.id);
    if (!addr) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Update every editable field
    const editableFields = ['name', 'phone', 'altPhone', 'pincode', 'state', 'city', 'house', 'road', 'landmark', 'type'];
    editableFields.forEach(f => { addr[f] = data[f]; });

    // Handle default flag change
    if (data.isDefault && !addr.isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
      addr.isDefault = true;
    }

    await user.save();

    res.json({
      success:   true,
      message:   'Address updated successfully',
      addresses: user.addresses,
    });
  } catch (err) {
    console.error('[PUT /api/address/:id]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// DELETE /api/address/:id
// Remove an address; auto-promotes the first remaining address to default
// ─────────────────────────────────────────────────────────────────────────
router.delete('/:id', protectUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const addr = user.addresses.id(req.params.id);
    if (!addr) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = addr.isDefault;

    // Mongoose sub-document removal
    addr.deleteOne();

    // Auto-promote first remaining address to default if the deleted one was default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success:   true,
      message:   'Address removed successfully',
      addresses: user.addresses,
    });
  } catch (err) {
    console.error('[DELETE /api/address/:id]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/address/:id/set-default
// Make one address the default; clears all others
// ─────────────────────────────────────────────────────────────────────────
router.patch('/:id/set-default', protectUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const addr = user.addresses.id(req.params.id);
    if (!addr) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Clear all then set the chosen one
    user.addresses.forEach(a => { a.isDefault = false; });
    addr.isDefault = true;

    await user.save();

    res.json({
      success:   true,
      message:   'Default address updated',
      addresses: user.addresses,
    });
  } catch (err) {
    console.error('[PATCH /api/address/:id/set-default]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;