const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'multivasta-secret-key-2024';

// Verify JWT token
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Check if user is vendor
const requireVendor = (req, res, next) => {
  if (req.userRole !== 'vendor') {
    return res.status(403).json({ error: 'Access denied. Vendor only.' });
  }
  next();
};

// Check if user is customer
const requireCustomer = (req, res, next) => {
  if (req.userRole !== 'customer') {
    return res.status(403).json({ error: 'Access denied. Customer only.' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireVendor, requireCustomer, JWT_SECRET };

