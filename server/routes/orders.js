const express = require('express');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const { authenticate, requireCustomer, requireVendor } = require('../middleware/auth');

const router = express.Router();

function generateOrderNumber() {
  return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

function generateSubOrderNumber() {
  return 'SUB-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

// Create order (checkout) - NEW: Multi-vendor order splitting
router.post('/', authenticate, async (req, res) => {
  const { shippingAddress, shipping_address, billingAddress, billing_address, paymentMethod, payment_method, notes, products, customerEmail, customerPhone } = req.body;

  const address = shippingAddress || shipping_address;
  if (!address) {
    return res.status(400).json({ error: 'Shipping address is required' });
  }

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'No products in order' });
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    // Validate all products and check stock
    const productMap = new Map();
    let totalAmount = 0;

    for (const item of products) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product || !product.isActive) {
        await session.abortTransaction();
        return res.status(400).json({ error: `Product not available: ${item.productId}` });
      }

      if (item.quantity > product.quantity) {
        await session.abortTransaction();
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = item.unitPrice * item.quantity;
      totalAmount += itemTotal;

      // Group by vendor for sub-orders
      const vendorId = product.vendorId.toString();
      if (!productMap.has(vendorId)) {
        productMap.set(vendorId, []);
      }
      productMap.get(vendorId).push({
        productId: product._id,
        vendorId: product.vendorId,
        name: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal
      });
    }

    // Calculate totals
    const taxAmount = Number((totalAmount * 0.1).toFixed(2));
    const shippingAmount = 5;
    const grandTotal = Number((totalAmount + taxAmount + shippingAmount).toFixed(2));

    // Get vendor commission rates
    const vendorIds = Array.from(productMap.keys());
    const vendors = await User.find({ _id: { $in: vendorIds }, role: 'vendor' })
      .select('vendorDetails.commissionRate')
      .session(session);
    
    const commissionMap = new Map();
    vendors.forEach(vendor => {
      commissionMap.set(vendor._id.toString(), vendor.vendorDetails?.commissionRate || 10);
    });

    // Create sub-orders
    const subOrders = [];
    for (const [vendorId, items] of productMap) {
      const vendorSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const commissionRate = commissionMap.get(vendorId) || 10;
      const commission = Number((vendorSubtotal * (commissionRate / 100)).toFixed(2));
      const vendorEarnings = Number((vendorSubtotal - commission).toFixed(2));

      subOrders.push({
        subOrderNumber: generateSubOrderNumber(),
        vendorId: new mongoose.Types.ObjectId(vendorId),
        items: items,
        subtotal: vendorSubtotal,
        vendorCommission: commission,
        vendorEarnings: vendorEarnings,
        status: 'pending'
      });
    }

    // Create main order with sub-orders
    const order = new Order({
      userId: req.userId,
      subOrders: subOrders,
      totalAmount: grandTotal,
      shippingAmount,
      taxAmount,
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress: address,
      billingAddress: billingAddress || billing_address || address,
      orderNumber: generateOrderNumber(),
      paymentMethod: paymentMethod || payment_method || 'mock',
      notes: notes || '',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || ''
    });

    await order.save({ session });

    // Decrement product quantities and create inventory logs
    for (const item of products) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: -item.quantity, soldCount: item.quantity } },
        { session }
      );

      // Update inventory and log transaction
      const inventory = await Inventory.findOne({ productId: item.productId }).session(session);
      if (inventory) {
        inventory.currentStock = inventory.currentStock - item.quantity;
        inventory.logs.push({
          type: 'purchase',
          quantityChange: -item.quantity,
          reason: `Order #${order.orderNumber}`,
          orderId: order._id
        });
        await inventory.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Order placed successfully',
      orderId: order._id,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        taxAmount: order.taxAmount,
        shippingAmount: order.shippingAmount,
        status: order.status,
        subOrders: subOrders.map(so => ({
          subOrderNumber: so.subOrderNumber,
          vendorId: so.vendorId,
          subtotal: so.subtotal,
          itemCount: so.items.length
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer orders
router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .populate('subOrders.vendorId', 'name')
      .populate('subOrders.items.productId', 'name images')
      .sort({ createdAt: -1 });
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

    const order = await Order.findById(id)
      .populate('userId', 'name email phone')
      .populate('subOrders.vendorId', 'name vendorDetails.storeName')
      .populate('subOrders.items.productId', 'name images price');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check access permissions
    const isCustomer = order.userId._id.toString() === req.userId.toString();
    const isVendor = order.subOrders.some(so => so.vendorId._id.toString() === req.userId.toString());

    if (!isCustomer && !isVendor) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vendor orders (via sub-orders)
router.get('/vendor/orders', authenticate, requireVendor, async (req, res) => {
  try {
    const orders = await Order.find({ 'subOrders.vendorId': req.userId })
      .populate('userId', 'name email phone')
      .populate('subOrders.items.productId', 'name sku')
      .sort({ createdAt: -1 });

    const vendorOrders = orders.map(order => {
      const vendorSubOrders = order.subOrders.filter(so => so.vendorId.toString() === req.userId.toString());
      
      return {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.userId.name,
        customerEmail: order.userId.email,
        customerPhone: order.userId.phone,
        shippingAddress: order.shippingAddress,
        subOrders: vendorSubOrders.map(so => ({
          subOrderNumber: so.subOrderNumber,
          status: so.status,
          itemCount: so.items.length,
          subtotal: so.subtotal,
          vendorCommission: so.vendorCommission,
          vendorEarnings: so.vendorEarnings,
          items: so.items,
          trackingNumber: so.trackingNumber,
          estimatedDelivery: so.estimatedDelivery,
          createdAt: so.createdAt,
          updatedAt: so.updatedAt
        })),
        orderTotal: order.totalAmount,
        orderDate: order.createdAt
      };
    });

    res.json({ orders: vendorOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update sub-order status (vendor only)
router.patch('/vendor/suborders/:subOrderId', authenticate, requireVendor, async (req, res) => {
  const { subOrderId } = req.params;
  const { status, trackingNumber, estimatedDelivery } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const order = await Order.findOne({ 'subOrders._id': subOrderId });
    if (!order) {
      return res.status(404).json({ error: 'Sub-order not found' });
    }

    const subOrder = order.subOrders.id(subOrderId);
    if (subOrder.vendorId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (status) subOrder.status = status;
    if (trackingNumber) subOrder.trackingNumber = trackingNumber;
    if (estimatedDelivery) subOrder.estimatedDelivery = estimatedDelivery;
    subOrder.updatedAt = new Date();

    await order.save();
    res.json({ message: 'Sub-order updated', subOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

