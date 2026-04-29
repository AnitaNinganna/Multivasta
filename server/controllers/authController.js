const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { JWT_SECRET } = require('../middleware/auth');

// Register
exports.register = async (req, res) => {
  try {
    const { email, password, full_name, name, role, phone, address, store_name, store_description } = req.body;
    const displayName = full_name || name;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const userRole = role || 'customer';
    if (!['customer', 'vendor', 'admin'].includes(userRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: displayName,
      email,
      password: hashedPassword,
      role: userRole,
      phone: phone || '',
      address: address || ''
    });

    const savedUser = await user.save();

    if (userRole === 'vendor') {
      const vendor = new Vendor({
        userId: savedUser._id,
        storeName: store_name || `${displayName} Store`,
        storeDescription: store_description || ''
      });
      await vendor.save();
    }

    generateTokenAndRespond(savedUser, res, 201);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    generateTokenAndRespond(user, res, 200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'vendor') {
      const vendor = await Vendor.findOne({ userId: req.userId });
      return res.json({ user, vendor });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function generateTokenAndRespond(user, res, statusCode) {
  const token = jwt.sign({ userId: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.status(statusCode).json({
    message: 'Authentication successful',
    token,
    user: { id: user._id, email: user.email, name: user.name, role: user.role }
  });
}
