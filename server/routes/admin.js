const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get admin dashboard statistics
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const total_users = await User.countDocuments();
    const total_customers = await User.countDocuments({ role: 'customer' });
    const total_vendors = await User.countDocuments({ role: 'vendor' });
    const total_admins = await User.countDocuments({ role: 'admin' });

    const total_orders = await Order.countDocuments();
    const orders = await Order.find();
    const total_revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const pending_orders = await Order.countDocuments({ status: 'pending' });
    const delivered_orders = await Order.countDocuments({ status: 'delivered' });

    const total_products = await Product.countDocuments();
    const pending_products = await Product.countDocuments({ isApproved: false });

    const recent_orders = await Order.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name');

    res.json({
      users: { total_users, total_customers, total_vendors, total_admins },
      orders: { total_orders, total_revenue, pending_orders, delivered_orders },
      products: { total_products, pending_products },
      recent_orders
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;

  try {
    const filter = {};
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('email name role phone address createdAt')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ users, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending vendor approvals
router.get('/pending-vendors', authenticate, requireAdmin, async (req, res) => {
  try {
    const vendors = await Vendor.find({ isApproved: false }).populate('userId', 'email name phone');
    res.json({ vendors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending product approvals
router.get('/pending-products', authenticate, requireAdmin, async (req, res) => {
  try {
    const products = await Product.find({ isApproved: false })
      .populate('vendorId', 'name vendorDetails.storeName vendorDetails.commissionRate');
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders (admin view)
router.get('/orders', authenticate, requireAdmin, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  try {
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ orders, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update commission rate for vendor
router.patch('/vendors/:id/commission', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { commission_rate } = req.body;

  if (commission_rate === undefined || commission_rate < 0 || commission_rate > 100) {
    return res.status(400).json({ error: 'Valid commission rate (0-100) is required' });
  }

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = await Vendor.findByIdAndUpdate(id, { commissionRate: commission_rate }, { new: true });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ message: 'Commission rate updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status (admin)
router.patch('/orders/:id/status', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve product
router.patch('/products/:id/approve', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await Product.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product approved successfully', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all categories (public route, but moved here for consistency)
router.get('/categories', authenticate, requireAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category
router.post('/categories', authenticate, requireAdmin, async (req, res) => {
  const { name, slug, description, parent_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const category_slug = (slug || name).toString().toLowerCase().replace(/\s+/g, '-');
    
    const category = new Category({
      name,
      slug: category_slug,
      description: description || '',
      parentId: mongoose.isValidObjectId(parent_id) ? parent_id : null
    });

    await category.save();
    res.status(201).json({ message: 'Category created', categoryId: category._id });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Category slug already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

