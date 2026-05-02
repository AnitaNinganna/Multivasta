const express = require('express');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticate, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// Get cart items for customer
router.get('/', authenticate, requireCustomer, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId }).populate({
      path: 'items.productId',
      populate: { path: 'vendorId', select: 'name vendorDetails.storeName' }
    });

    const items = cart?.items || [];
    const parsedItems = items.map(item => ({
      cart_item_id: item._id,
      product_id: item.productId?._id,
      name: item.productId?.name,
      price: item.unitPrice,
      quantity: item.quantity,
      images: item.productId?.images || [],
      stock_quantity: item.productId?.quantity || 0,
      store_name: item.productId?.vendorId?.storeName || '',
      vendor_id: item.productId?.vendorId?._id
    }));

    const groupedByVendor = parsedItems.reduce((acc, item) => {
      const vendorId = item.vendor_id?.toString() || 'unknown';
      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendor_id: item.vendor_id,
          store_name: item.store_name,
          items: [],
          subtotal: 0
        };
      }
      acc[vendorId].items.push(item);
      acc[vendorId].subtotal += item.price * item.quantity;
      return acc;
    }, {});

    const total = parsedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    res.json({
      items: parsedItems,
      grouped_by_vendor: Object.values(groupedByVendor),
      total_items: parsedItems.length,
      total_amount: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add item to cart
router.post('/', authenticate, requireCustomer, async (req, res) => {
  const { product_id, quantity = 1 } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  if (!mongoose.isValidObjectId(product_id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    const product = await Product.findById(product_id);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] });
    }

    const existingItem = cart.items.find(item => item.productId.equals(product._id));
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.quantity) {
        return res.status(400).json({ error: 'Cannot add more than available stock' });
      }
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        productId: product._id,
        quantity,
        unitPrice: product.price
      });
    }

    await cart.save();
    res.status(201).json({ message: 'Added to cart', cart: cart.items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update cart item quantity
router.put('/:cart_item_id', authenticate, requireCustomer, async (req, res) => {
  const { cart_item_id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be at least 1' });
  }

  if (!mongoose.isValidObjectId(cart_item_id)) {
    return res.status(400).json({ error: 'Invalid cart item ID' });
  }

  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.id(cart_item_id);
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (quantity > product.quantity) {
      return res.status(400).json({ error: 'Quantity exceeds available stock' });
    }

    item.quantity = quantity;
    await cart.save();
    res.json({ message: 'Quantity updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove item from cart
router.delete('/:cart_item_id', authenticate, requireCustomer, async (req, res) => {
  const { cart_item_id } = req.params;

  if (!mongoose.isValidObjectId(cart_item_id)) {
    return res.status(400).json({ error: 'Invalid cart item ID' });
  }

  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.id(cart_item_id);
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    item.remove();
    await cart.save();
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear cart
router.delete('/', authenticate, requireCustomer, async (req, res) => {
  try {
    await Cart.deleteOne({ userId: req.userId });
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

