const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { authenticate, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// Get product reviews (public)
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(404).json({ error: 'Invalid product ID' });
    }

    const reviews = await Review.find({ productId, isApproved: true }).populate('customerId', 'name');
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    res.json({ reviews, average_rating: avgRating.toFixed(1), total_reviews: reviews.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get vendor reviews (public)
router.get('/vendor/:vendorId', async (req, res) => {
  const { vendorId } = req.params;

  try {
    if (!mongoose.isValidObjectId(vendorId)) {
      return res.status(404).json({ error: 'Invalid vendor ID' });
    }

    const reviews = await Review.find({ vendorId, isApproved: true }).populate('customerId', 'name');
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    res.json({ reviews, average_rating: avgRating.toFixed(1), total_reviews: reviews.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create review (customer only)
router.post('/', authenticate, requireCustomer, async (req, res) => {
  const { product_id, vendor_id, order_id, rating, title, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  if (!product_id && !vendor_id) {
    return res.status(400).json({ error: 'Product ID or Vendor ID is required' });
  }

  if (!order_id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    if (!mongoose.isValidObjectId(order_id)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await Order.findOne({ _id: order_id, userId: req.userId, status: 'delivered' });
    if (!order) {
      return res.status(403).json({ error: 'You can only review from delivered orders' });
    }

    const matches = order.products.some(item => {
      if (product_id && item.productId.toString() === product_id.toString()) return true;
      if (vendor_id && item.vendorId.toString() === vendor_id.toString()) return true;
      return false;
    });

    if (!matches) {
      return res.status(403).json({ error: 'Review target not found in your delivered order' });
    }

    const review = new Review({
      customerId: req.userId,
      productId: mongoose.isValidObjectId(product_id) ? product_id : null,
      vendorId: mongoose.isValidObjectId(vendor_id) ? vendor_id : null,
      orderId: order._id,
      rating,
      title: title || '',
      comment: comment || '',
      isApproved: false
    });

    await review.save();
    res.status(201).json({ message: 'Review submitted successfully', review_id: review._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update review (customer can update their own)
router.put('/:id', authenticate, requireCustomer, async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = await Review.findOne({ _id: id, customerId: req.userId });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    review.isApproved = false;
    await review.save();

    res.json({ message: 'Review updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

