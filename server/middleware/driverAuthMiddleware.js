const jwt    = require('jsonwebtoken');
const Driver = require('../models/Driver');

const protectDriver1 = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'driver')
      return res.status(403).json({ success: false, message: 'Access denied' });

    req.driver = await Driver.findById(decoded.id).select('-password');
    if (!req.driver || !req.driver.isActive)
      return res.status(401).json({ success: false, message: 'Driver not found or inactive' });

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};


// middleware/driverAuthMiddleware.js
const protectDriver = async (req, res, next) => {
  const auth = req.headers.authorization;
  
  
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Not authorized' });

  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    
    
    if (decoded.role !== 'driver')
      return res.status(403).json({ success: false, message: 'Access denied' });

    req.driver = await Driver.findById(decoded.id).select('-password');
    if (!req.driver || !req.driver.isActive)
      return res.status(401).json({ success: false, message: 'Driver not found or inactive' });

    next();
  } catch (err) {
    console.log('JWT error:', err.message); // ← add this temporarily
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = { protectDriver };
