const express = require('express');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const { authenticate, requireCustomer, requireVendor } = require('../middleware/auth');

const router = express.Router();

function generateOrderNumber() {
  return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

// Create order (checkout)
router.post('/', authenticate, requireCustomer, async (req, res) => {
  const { shipping_address, billing_address, payment_method, notes } = req.body;

  if (!shipping_address) {
    return res.status(400).json({ error: 'Shipping address is required' });
  }

  try {
    const cart = await Cart.findOne({ userId: req.userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = item.productId;
      if (!product || !product.isActive) {
        return res.status(400).json({ error: `Product not available: ${item.productId}` });
      }

      if (item.quantity > product.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = item.unitPrice * item.quantity;
      totalAmount += itemTotal;
      orderItems.push({
        productId: product._id,
        vendorId: product.vendorId,
        name: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal
      });
    }

    const taxAmount = Number((totalAmount * 0.05).toFixed(2));
    const shippingAmount = cart.items.length > 0 ? 10.0 : 0;
    const grandTotal = Number((totalAmount + taxAmount + shippingAmount).toFixed(2));

    const order = new Order({
      userId: req.userId,
      products: orderItems,
      totalAmount,
      shippingAmount,
      taxAmount,
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress: shipping_address,
      billingAddress: billing_address || shipping_address,
      orderNumber: generateOrderNumber(),
      paymentMethod: payment_method || 'mock',
      notes: notes || ''
    });

    await order.save();

    await Promise.all(
      cart.items.map(item =>
        Product.findByIdAndUpdate(item.productId._id, { $inc: { quantity: -item.quantity } })
      )
    );

    await Cart.deleteOne({ userId: req.userId });

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order._id,
        order_number: order.orderNumber,
        total_amount: order.totalAmount,
        tax_amount: order.taxAmount,
        shipping_amount: order.shippingAmount,
        grand_total: grandTotal,
        status: order.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer orders
router.get('/my-orders', authenticate, requireCustomer, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order details
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = await Order.findById(id).populate('userId', 'name');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (req.userRole === 'customer' && order.userId._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vendor orders (by vendor product items)
router.get('/vendor/orders', authenticate, requireVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const orders = await Order.find({ 'products.vendorId': req.userId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const formatted = orders.map(order => {
      const vendorItems = order.products.filter(item => item.vendorId.toString() === req.userId.toString());
      const total = vendorItems.reduce((sum, item) => sum + item.totalPrice, 0);
      return {
        order_id: order._id,
        order_number: order.orderNumber,
        customer_name: order.userId.name,
        customer_email: order.userId.email,
        status: order.status,
        createdAt: order.createdAt,
        total,
        items: vendorItems
      };
    });

    res.json({ orders: formatted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

