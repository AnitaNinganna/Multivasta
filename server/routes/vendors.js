const express = require('express');
const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const { authenticate, requireVendor, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all approved vendors (public)
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find({ isApproved: true, isActive: true }).populate('userId', 'name email phone');
    res.json({ vendors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vendor dashboard stats
router.get('/dashboard/stats', authenticate, requireVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const products = await Product.find({ vendorId: req.userId });
    const totalProducts = products.length;
    const outOfStock = products.filter(p => p.quantity === 0).length;

    const orders = await Order.find({ 'products.vendorId': req.userId }).populate('userId', 'name');
    const totalOrders = orders.length;

    let totalSales = 0;
    let totalEarnings = 0;

    const recentOrders = orders
      .map(order => {
        const vendorItems = order.products.filter(item => item.vendorId.toString() === req.userId.toString());
        const vendorTotal = vendorItems.reduce((sum, item) => sum + item.totalPrice, 0);
        totalSales += vendorTotal;
        totalEarnings += vendorTotal * ((100 - vendor.commissionRate) / 100);
        return {
          order_id: order._id,
          order_number: order.orderNumber,
          createdAt: order.createdAt,
          total: vendorTotal,
          customer_name: order.userId?.name || 'Customer'
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    res.json({
      sales: { total_orders: totalOrders, total_sales: totalSales, total_earnings: totalEarnings },
      products: { total_products: totalProducts, out_of_stock: outOfStock },
      recent_orders: recentOrders
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vendor dashboard overview
router.get('/dashboard', authenticate, requireVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.userId }).populate('userId', 'name email phone');
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const products = await Product.find({ vendorId: req.userId })
      .sort({ createdAt: -1 })
      .select('name price quantity isActive isApproved createdAt');

    const totalProducts = products.length;
    const outOfStock = products.filter(p => p.quantity === 0).length;

    const orders = await Order.find({ 'products.vendorId': req.userId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const totalOrders = await Order.countDocuments({ 'products.vendorId': req.userId });
    const totalSales = orders.reduce((sum, order) => {
      const vendorItems = order.products.filter(item => item.vendorId.toString() === req.userId.toString());
      return sum + vendorItems.reduce((itemSum, item) => itemSum + item.totalPrice, 0);
    }, 0);

    const dashboard = {
      vendor,
      stats: {
        total_products: totalProducts,
        out_of_stock: outOfStock,
        total_orders: totalOrders,
        recent_sales: totalSales
      },
      products,
      recent_orders: orders.map(order => ({
        order_id: order._id,
        order_number: order.orderNumber,
        customer_name: order.userId?.name || 'Customer',
        total: order.products
          .filter(item => item.vendorId.toString() === req.userId.toString())
          .reduce((sum, item) => sum + item.totalPrice, 0),
        status: order.status,
        createdAt: order.createdAt
      }))
    };

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create vendor product (dashboard)
router.post('/dashboard/products', authenticate, requireVendor, async (req, res) => {
  const { name, description, price, sku, quantity = 0, images = [], attributes = {}, category_id } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  try {
    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    let categoryId = null;
    if (category_id) {
      if (!mongoose.isValidObjectId(category_id)) {
        return res.status(400).json({ error: 'Invalid category ID' });
      }
      const category = await Category.findById(category_id);
      if (!category) {
        return res.status(400).json({ error: 'Category not found' });
      }
      categoryId = category._id;
    }

    const product = new Product({
      vendorId: req.userId,
      name,
      description: description || '',
      price,
      sku: sku || '',
      quantity,
      images: Array.isArray(images) ? images : [],
      attributes,
      categoryId,
      isApproved: false
    });

    await product.save();
    res.status(201).json({ message: 'Product created successfully', product_id: product._id, requires_approval: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update vendor profile
router.put('/profile', authenticate, requireVendor, async (req, res) => {
  const { store_name, store_description, store_logo, bank_account } = req.body;

  try {
    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const updates = {};
    if (store_name !== undefined) updates.storeName = store_name;
    if (store_description !== undefined) updates.storeDescription = store_description;
    if (store_logo !== undefined) updates.storeLogo = store_logo;
    if (bank_account !== undefined) updates.bankAccount = bank_account;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await Vendor.updateOne({ _id: vendor._id }, { $set: updates });
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vendor public profile
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = await Vendor.findOne({ _id: id, isApproved: true, isActive: true }).populate('userId', 'name');
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const products = await Product.find({ vendorId: vendor.userId, isActive: true, isApproved: true }).select('name price images quantity');
    res.json({ vendor, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Approve vendor
router.patch('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = await Vendor.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ message: 'Vendor approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

