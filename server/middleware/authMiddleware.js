const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); // Admin model import kiya
//const User = require('../models/User');   // Customer model (agar hai toh)
const User = require('../models/User/User');


const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // 1. Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 2. Role-based User Fetching
            // Check karein ki token mein role 'admin' hai ya 'user'
            if (decoded.role === 'admin') {
                req.user = await Admin.findById(decoded.id).select('-password');
            } else {
                req.user = await User.findById(decoded.id).select('-password');
            }

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            next();
        } catch (error) {
            console.error('Token Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Admin specific access middleware
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin only' });
    }
};

const protectUser = async (req, res, next) => {
  try {
    let token;
 
    // Expect: Authorization: Bearer <token>
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
 
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.',
      });
    }
 
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
 
    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id).select('-password');
 
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }
 
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }
 
    req.user = user;
    next();
 
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired. Please login again.' });
    }
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};


// Delivery Boy specific access middleware (Naya update)
// const isDeliveryBoy = (req, res, next) => {
    // if (req.user && req.user.role === 'delivery') {
        // next();
    // } else {
        // res.status(403).json({ message: 'Access denied: Delivery Partner only' });
    // }
// };

module.exports = { protect, isAdmin,protectUser};