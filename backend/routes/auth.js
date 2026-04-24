const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { email, password, full_name, role, phone, address, store_name, store_description } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  const userRole = role || 'customer';
  if (!['customer', 'vendor', 'admin'].includes(userRole)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (email, password, full_name, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, full_name, userRole, phone || null, address || null],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }

        const userId = this.lastID;

        // If registering as vendor, create vendor profile
        if (userRole === 'vendor') {
          db.run(
            'INSERT INTO vendors (user_id, store_name, store_description) VALUES (?, ?, ?)',
            [userId, store_name || full_name + ' Store', store_description || ''],
            (vendorErr) => {
              if (vendorErr) {
                return res.status(500).json({ error: vendorErr.message });
              }
              generateTokenAndRespond(userId, userRole, email, full_name, res);
            }
          );
        } else {
          generateTokenAndRespond(userId, userRole, email, full_name, res);
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    generateTokenAndRespond(user.id, user.role, user.email, user.full_name, res);
  });
});

// Get current user profile
router.get('/me', authenticate, (req, res) => {
  db.get('SELECT id, email, full_name, role, phone, address, created_at FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'vendor') {
      db.get('SELECT * FROM vendors WHERE user_id = ?', [req.userId], (vErr, vendor) => {
        if (vErr) {
          return res.status(500).json({ error: vErr.message });
        }
        res.json({ user, vendor });
      });
    } else {
      res.json({ user });
    }
  });
});

// Helper function
function generateTokenAndRespond(userId, role, email, full_name, res) {
  const token = jwt.sign({ userId, role, email }, JWT_SECRET, { expiresIn: '24h' });
  res.status(201).json({
    message: 'Registration successful',
    token,
    user: { id: userId, email, full_name, role }
  });
}

module.exports = router;

