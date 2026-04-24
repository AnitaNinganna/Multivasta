const express = require('express');
const db = require('../config/database');
const { authenticate, requireCustomer, requireVendor } = require('../middleware/auth');

const router = express.Router();

// Generate order number
function generateOrderNumber() {
  return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

// Create order (checkout)
router.post('/', authenticate, requireCustomer, (req, res) => {
  const { shipping_address, billing_address, payment_method, notes } = req.body;

  if (!shipping_address) {
    return res.status(400).json({ error: 'Shipping address is required' });
  }

  // Get cart items with product details
  db.all(
    `SELECT c.*, p.id as product_id, p.name, p.price, p.images, p.quantity as stock, p.vendor_id, v.commission_rate
     FROM carts c
     JOIN products p ON c.product_id = p.id
     JOIN vendors v ON p.vendor_id = v.id
     WHERE c.customer_id = ?`,
    [req.userId],
    (err, cartItems) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Validate stock
      for (const item of cartItems) {
        if (item.quantity > item.stock) {
          return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
        }
      }

      const orderNumber = generateOrderNumber();
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxAmount = totalAmount * 0.05; // 5% tax example
      const shippingAmount = cartItems.length > 0 ? 10.00 : 0; // Flat rate example
      const grandTotal = totalAmount + taxAmount + shippingAmount;

      // Begin transaction
      db.run('BEGIN TRANSACTION');

      // Create parent order
      db.run(
        `INSERT INTO orders (customer_id, order_number, total_amount, tax_amount, shipping_amount, grand_total, shipping_address, billing_address, payment_method, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.userId, orderNumber, totalAmount, taxAmount, shippingAmount, grandTotal, shipping_address, billing_address || shipping_address, payment_method || 'mock', notes || null],
        function (err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          const orderId = this.lastID;

          // Group items by vendor
          const vendorGroups = {};
          cartItems.forEach(item => {
            if (!vendorGroups[item.vendor_id]) {
              vendorGroups[item.vendor_id] = {
                vendor_id: item.vendor_id,
                commission_rate: item.commission_rate,
                items: [],
                subtotal: 0
              };
            }
            vendorGroups[item.vendor_id].items.push(item);
            vendorGroups[item.vendor_id].subtotal += item.price * item.quantity;
          });

          let subOrdersCreated = 0;
          const vendorIds = Object.keys(vendorGroups);

          if (vendorIds.length === 0) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'No valid vendor items found' });
          }

          vendorIds.forEach(vendorId => {
            const group = vendorGroups[vendorId];
            const commissionAmount = group.subtotal * (group.commission_rate / 100);
            const vendorEarnings = group.subtotal - commissionAmount;
            const vendorShipping = shippingAmount / vendorIds.length;

            db.run(
              `INSERT INTO sub_orders (order_id, vendor_id, subtotal, commission_amount, vendor_earnings, shipping_amount)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [orderId, vendorId, group.subtotal, commissionAmount, vendorEarnings, vendorShipping],
              function (err) {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: err.message });
                }

                const subOrderId = this.lastID;

                // Insert order items
                const itemStmt = db.prepare(
                  `INSERT INTO order_items (order_id, sub_order_id, product_id, vendor_id, product_name, product_image, quantity, unit_price, total_price)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                );

                group.items.forEach(item => {
                  itemStmt.run(
                    orderId,
                    subOrderId,
                    item.product_id,
                    vendorId,
                    item.name,
                    item.images ? JSON.parse(item.images)[0] : null,
                    item.quantity,
                    item.price,
                    item.price * item.quantity
                  );

                  // Update product stock
                  db.run('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
                });

                itemStmt.finalize();
                subOrdersCreated++;

                // If all sub-orders created
                if (subOrdersCreated === vendorIds.length) {
                  // Clear cart
                  db.run('DELETE FROM carts WHERE customer_id = ?', [req.userId], (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: err.message });
                    }

                    // Commit transaction
                    db.run('COMMIT', (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                      }

                      res.status(201).json({
                        message: 'Order placed successfully',
                        order: {
                          id: orderId,
                          order_number: orderNumber,
                          total_amount: totalAmount,
                          tax_amount: taxAmount,
                          shipping_amount: shippingAmount,
                          grand_total: grandTotal,
                          status: 'pending'
                        }
                      });
                    });
                  });
                }
              }
            );
          });
        }
      );
    }
  );
});

// Get customer orders
router.get('/my-orders', authenticate, requireCustomer, (req, res) => {
  db.all(
    `SELECT o.*, 
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
     FROM orders o
     WHERE o.customer_id = ?
     ORDER BY o.created_at DESC`,
    [req.userId],
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ orders });
    }
  );
});

// Get order details
router.get('/:id', authenticate, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (req.userRole === 'customer' && order.customer_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.all(
      `SELECT so.*, v.store_name
       FROM sub_orders so
       JOIN vendors v ON so.vendor_id = v.id
       WHERE so.order_id = ?`,
      [id],
      (err, subOrders) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.all(
          `SELECT oi.*, p.slug
           FROM order_items oi
           LEFT JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [id],
          (err, items) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.json({ order, sub_orders: subOrders, items });
          }
        );
      }
    );
  });
});

// Get vendor orders (sub-orders)
router.get('/vendor/orders', authenticate, requireVendor, (req, res) => {
  db.get('SELECT id FROM vendors WHERE user_id = ?', [req.userId], (err, vendor) => {
    if (err || !vendor) {
      return res.status(500).json({ error: 'Vendor not found' });
    }

    db.all(
      `SELECT so.*, o.order_number, o.customer_id, o.shipping_address, o.payment_status, o.created_at as order_date,
        u.full_name as customer_name
       FROM sub_orders so
       JOIN orders o ON so.order_id = o.id
       JOIN users u ON o.customer_id = u.id
       WHERE so.vendor_id = ?
       ORDER BY so.created_at DESC`,
      [vendor.id],
      (err, orders) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({ orders });
      }
    );
  });
});

// Update sub-order status (vendor)
router.patch('/sub-orders/:id/status', authenticate, requireVendor, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.get('SELECT id FROM vendors WHERE user_id = ?', [req.userId], (err, vendor) => {
    if (err || !vendor) {
      return res.status(500).json({ error: 'Vendor not found' });
    }

    db.run(
      'UPDATE sub_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND vendor_id = ?',
      [status, id, vendor.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Sub-order not found or unauthorized' });
        }

        res.json({ message: 'Status updated successfully' });
      }
    );
  });
});

module.exports = router;

