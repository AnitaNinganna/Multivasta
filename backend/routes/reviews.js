const express = require('express');
const db = require('../config/database');
const { authenticate, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// Get product reviews (public)
router.get('/product/:productId', (req, res) => {
  const { productId } = req.params;

  db.all(
    `SELECT r.*, u.full_name as customer_name
     FROM reviews r
     JOIN users u ON r.customer_id = u.id
     WHERE r.product_id = ? AND r.is_approved = 1
     ORDER BY r.created_at DESC`,
    [productId],
    (err, reviews) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Calculate average rating
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      res.json({ reviews, average_rating: avgRating.toFixed(1), total_reviews: reviews.length });
    }
  );
});

// Get vendor reviews (public)
router.get('/vendor/:vendorId', (req, res) => {
  const { vendorId } = req.params;

  db.all(
    `SELECT r.*, u.full_name as customer_name
     FROM reviews r
     JOIN users u ON r.customer_id = u.id
     WHERE r.vendor_id = ? AND r.is_approved = 1
     ORDER BY r.created_at DESC`,
    [vendorId],
    (err, reviews) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      res.json({ reviews, average_rating: avgRating.toFixed(1), total_reviews: reviews.length });
    }
  );
});

// Create review (customer only)
router.post('/', authenticate, requireCustomer, (req, res) => {
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

  // Verify customer purchased this product from this order
  db.get(
    `SELECT oi.* FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.id = ? AND o.customer_id = ? AND o.status = 'delivered'`,
    [order_id, req.userId],
    (err, orderItem) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!orderItem) {
        return res.status(403).json({ error: 'You can only review products from delivered orders' });
      }

      db.run(
        `INSERT INTO reviews (customer_id, product_id, vendor_id, order_id, rating, title, comment)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.userId, product_id || null, vendor_id || null, order_id, rating, title || null, comment || null],
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.status(201).json({ message: 'Review submitted successfully', review_id: this.lastID });
        }
      );
    }
  );
});

// Approve review (admin only - handled in admin routes)
// Update review (customer can update their own)
router.put('/:id', authenticate, requireCustomer, (req, res) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;

  db.get('SELECT * FROM reviews WHERE id = ? AND customer_id = ?', [id, req.userId], (err, review) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const fields = [];
    const values = [];

    if (rating) { fields.push('rating = ?'); values.push(rating); }
    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (comment !== undefined) { fields.push('comment = ?'); values.push(comment); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    db.run(`UPDATE reviews SET ${fields.join(', ')} WHERE id = ?`, values, function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: 'Review updated successfully' });
    });
  });
});

module.exports = router;

