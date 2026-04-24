const express = require('express');
const db = require('../config/database');
const { authenticate, requireCustomer } = require('../middleware/auth');

const router = express.Router();

// Get cart items for customer
router.get('/', authenticate, requireCustomer, (req, res) => {
  db.all(
    `SELECT c.*, p.name, p.price, p.images, p.quantity as stock_quantity, v.store_name, v.id as vendor_id
     FROM carts c
     JOIN products p ON c.product_id = p.id
     JOIN vendors v ON p.vendor_id = v.id
     WHERE c.customer_id = ?`,
    [req.userId],
    (err, items) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const parsedItems = items.map(item => ({
        ...item,
        images: item.images ? JSON.parse(item.images) : []
      }));

      // Group by vendor for split cart view
      const groupedByVendor = parsedItems.reduce((acc, item) => {
        const vendorId = item.vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = {
            vendor_id: vendorId,
            store_name: item.store_name,
            items: [],
            subtotal: 0
          };
        }
        acc[vendorId].items.push(item);
        acc[vendorId].subtotal += item.price * item.quantity;
        return acc;
      }, {});

      const total = parsedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      res.json({
        items: parsedItems,
        grouped_by_vendor: Object.values(groupedByVendor),
        total_items: parsedItems.length,
        total_amount: total
      });
    }
  );
});

// Add item to cart
router.post('/', authenticate, requireCustomer, (req, res) => {
  const { product_id, quantity = 1 } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // Check product exists and has stock
  db.get('SELECT id, quantity, is_active FROM products WHERE id = ?', [product_id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!product || !product.is_active) {
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already in cart
    db.get('SELECT * FROM carts WHERE customer_id = ? AND product_id = ?', [req.userId, product_id], (err, cartItem) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (cartItem) {
        // Update quantity
        const newQuantity = cartItem.quantity + quantity;
        if (newQuantity > product.quantity) {
          return res.status(400).json({ error: 'Cannot add more than available stock' });
        }

        db.run('UPDATE carts SET quantity = ? WHERE id = ?', [newQuantity, cartItem.id], function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Cart updated', cart_item_id: cartItem.id });
        });
      } else {
        // Insert new cart item
        db.run(
          'INSERT INTO carts (customer_id, product_id, quantity) VALUES (?, ?, ?)',
          [req.userId, product_id, quantity],
          function (err) {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'Added to cart', cart_item_id: this.lastID });
          }
        );
      }
    });
  });
});

// Update cart item quantity
router.put('/:cart_item_id', authenticate, requireCustomer, (req, res) => {
  const { cart_item_id } = req.params;
  const { quantity } = req.body;

  if (quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be at least 1' });
  }

  db.get(
    `SELECT c.*, p.quantity as stock_quantity FROM carts c JOIN products p ON c.product_id = p.id WHERE c.id = ? AND c.customer_id = ?`,
    [cart_item_id, req.userId],
    (err, item) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!item) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      if (quantity > item.stock_quantity) {
        return res.status(400).json({ error: 'Quantity exceeds available stock' });
      }

      db.run('UPDATE carts SET quantity = ? WHERE id = ?', [quantity, cart_item_id], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Quantity updated' });
      });
    }
  );
});

// Remove item from cart
router.delete('/:cart_item_id', authenticate, requireCustomer, (req, res) => {
  const { cart_item_id } = req.params;

  db.run('DELETE FROM carts WHERE id = ? AND customer_id = ?', [cart_item_id, req.userId], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  });
});

// Clear cart
router.delete('/', authenticate, requireCustomer, (req, res) => {
  db.run('DELETE FROM carts WHERE customer_id = ?', [req.userId], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ message: 'Cart cleared' });
  });
});

module.exports = router;

