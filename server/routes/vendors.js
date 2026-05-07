const express = require('express');
const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const { authenticate, requireVendor, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all approved vendors (public)
router.get('/', async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor', 'vendorDetails.isApproved': true, 'vendorDetails.isActive': true })
      .select('name email phone vendorDetails');
    res.json({ vendors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vendor dashboard stats - ENHANCED
router.get('/dashboard/stats', authenticate, requireVendor, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'vendor') {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const products = await Product.find({ vendorId: req.userId });
    const totalProducts = products.length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    const totalSoldCount = products.reduce((sum, p) => sum + (p.soldCount || 0), 0);

    // Get orders with new sub-order structure
    const orders = await Order.find({ 'subOrders.vendorId': req.userId });
    const totalOrders = orders.length;

    let totalSales = 0;
    let totalEarnings = 0;
    let totalCommission = 0;

    orders.forEach(order => {
      const vendorSubOrders = order.subOrders.filter(so => so.vendorId.toString() === req.userId.toString());
      vendorSubOrders.forEach(so => {
        totalSales += so.subtotal;
        totalCommission += so.vendorCommission;
        totalEarnings += so.vendorEarnings;
      });
    });

    // Get low stock products
    const lowStockProducts = await Product.find({
      vendorId: req.userId,
      quantity: { $lte: 10 },
      quantity: { $gt: 0 }
    }).select('name quantity _id');

    // Get recent orders with new structure
    const recentOrders = orders
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(order => {
        const vendorSubOrders = order.subOrders.filter(so => so.vendorId.toString() === req.userId.toString());
        return {
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          customerName: order.userId?.name || 'Customer',
          subOrderCount: vendorSubOrders.length,
          totalAmount: vendorSubOrders.reduce((sum, so) => sum + so.subtotal, 0),
          status: vendorSubOrders[0]?.status || 'pending'
        };
      });

    // Calculate monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyOrders = orders.filter(o => o.createdAt >= thirtyDaysAgo);
    let monthlyRevenue = 0;
    monthlyOrders.forEach(order => {
      const vendorSubOrders = order.subOrders.filter(so => so.vendorId.toString() === req.userId.toString());
      vendorSubOrders.forEach(so => {
        monthlyRevenue += so.vendorEarnings;
      });
    });

    res.json({
      sales: {
        totalOrders,
        totalSales: Number(totalSales.toFixed(2)),
        totalEarnings: Number(totalEarnings.toFixed(2)),
        totalCommission: Number(totalCommission.toFixed(2)),
        monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
        itemsSold: totalSoldCount
      },
      inventory: {
        totalProducts,
        outOfStock,
        lowStockCount: lowStockProducts.length,
        lowStockProducts: lowStockProducts.map(p => ({
          id: p._id,
          name: p.name,
          quantity: p.quantity
        }))
      },
      recentOrders,
      vendorName: user.vendorDetails?.storeName || user.name
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get detailed vendor dashboard
router.get('/dashboard', authenticate, requireVendor, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'vendor') {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const products = await Product.find({ vendorId: req.userId })
      .sort({ createdAt: -1 })
      .select('name price quantity isActive isApproved rating reviewCount soldCount');

    const orders = await Order.find({ 'subOrders.vendorId': req.userId })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(10);

    const totalProducts = products.length;
    const approvedProducts = products.filter(p => p.isApproved).length;
    const totalOrders = await Order.countDocuments({ 'subOrders.vendorId': req.userId });

    // Calculate analytics
    let totalRevenue = 0;
    let totalItemsSold = 0;
    let averageRating = 0;
    let totalReviews = 0;

    products.forEach(p => {
      totalItemsSold += p.soldCount || 0;
      averageRating += p.rating * (p.reviewCount || 0);
      totalReviews += p.reviewCount || 0;
    });

    averageRating = totalReviews > 0 ? Number((averageRating / totalReviews).toFixed(2)) : 0;

    orders.forEach(order => {
      const vendorSubOrders = order.subOrders.filter(so => so.vendorId.toString() === req.userId.toString());
      vendorSubOrders.forEach(so => {
        totalRevenue += so.vendorEarnings;
      });
    });

    const recentOrders = orders.map(order => {
      const vendorSubOrders = order.subOrders.filter(so => so.vendorId.toString() === req.userId.toString());
      return {
        orderNumber: order.orderNumber,
        customerName: order.userId?.name || 'Customer',
        date: order.createdAt,
        amount: vendorSubOrders.reduce((sum, so) => sum + so.subtotal, 0),
        status: vendorSubOrders[0]?.status || 'pending',
        itemCount: vendorSubOrders.reduce((sum, so) => sum + so.items.length, 0)
      };
    });

    const dashboard = {
      store: user.vendorDetails,
      stats: {
        totalProducts,
        approvedProducts,
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalItemsSold,
        averageRating
      },
      topProducts: products
        .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
        .slice(0, 5)
        .map(p => ({
          id: p._id,
          name: p.name,
          sold: p.soldCount || 0,
          rating: p.rating || 0,
          reviews: p.reviewCount || 0
        })),
      recentOrders
    };

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', authenticate, requireVendor, async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      vendorId: req.userId,
      quantity: { $lte: 10 },
      isActive: true
    }).select('name quantity sku price');

    const outOfStockProducts = await Product.find({
      vendorId: req.userId,
      quantity: 0,
      isActive: true
    }).select('name sku price');

    res.json({
      lowStock: lowStockProducts.map(p => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
        price: p.price,
        alert: 'Low stock - consider restocking'
      })),
      outOfStock: outOfStockProducts.map(p => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        price: p.price,
        alert: 'Out of stock'
      })),
      totalAlerts: lowStockProducts.length + outOfStockProducts.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create vendor product
router.post('/products', authenticate, requireVendor, async (req, res) => {
  const { name, description, price, sku, quantity = 0, images = [], attributes = {}, category_id, tags = [] } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  try {
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
      tags: Array.isArray(tags) ? tags : [],
      isApproved: false
    });

    await product.save();

    // Create inventory record
    const inventory = new Inventory({
      productId: product._id,
      vendorId: req.userId,
      currentStock: quantity,
      availableStock: quantity,
      lowStockThreshold: 10
    });

    await inventory.save();

    res.status(201).json({
      message: 'Product created successfully',
      productId: product._id,
      requiresApproval: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update vendor product
router.put('/products/:productId', authenticate, requireVendor, async (req, res) => {
  const { productId } = req.params;
  const { name, description, price, quantity, sku, images, attributes, tags } = req.body;

  try {
    const product = await Product.findOne({ _id: productId, vendorId: req.userId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (sku !== undefined) product.sku = sku;
    if (images !== undefined) product.images = images;
    if (attributes !== undefined) product.attributes = attributes;
    if (tags !== undefined) product.tags = tags;

    await product.save();
    res.json({ message: 'Product updated', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update vendor profile
router.put('/profile', authenticate, requireVendor, async (req, res) => {
  const { storeName, storeDescription, storeLogo, bankAccount } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (storeName !== undefined) user.vendorDetails.storeName = storeName;
    if (storeDescription !== undefined) user.vendorDetails.storeDescription = storeDescription;
    if (storeLogo !== undefined) user.vendorDetails.metadata = user.vendorDetails.metadata || {};
    if (bankAccount !== undefined) user.vendorDetails.bankAccount = bankAccount;

    await user.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vendor public profile
router.get('/store/:vendorId', async (req, res) => {
  const { vendorId } = req.params;

  try {
    if (!mongoose.isValidObjectId(vendorId)) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const user = await User.findOne({
      _id: vendorId,
      role: 'vendor',
      'vendorDetails.isApproved': true,
      'vendorDetails.isActive': true
    }).select('name email phone vendorDetails');

    if (!user) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const products = await Product.find({
      vendorId: vendorId,
      isActive: true,
      isApproved: true
    }).select('name price images quantity rating reviewCount soldCount');

    res.json({ vendor: user, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Approve vendor
router.patch('/:userId/approve', authenticate, requireAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'vendor') {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    user.vendorDetails.isApproved = true;
    await user.save();

    res.json({ message: 'Vendor approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get all pending vendors
router.get('/admin/pending', authenticate, requireAdmin, async (req, res) => {
  try {
    const vendors = await User.find({
      role: 'vendor',
      'vendorDetails.isApproved': false
    }).select('name email phone vendorDetails createdAt');

    res.json({ vendors, total: vendors.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

