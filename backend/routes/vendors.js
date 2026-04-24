const express = require('express');
const db = require('../config/database');
const { authenticate, requireVendor, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all approved vendors (public)
router.get('/', (req, res) => {
  db.all(
    `SELECT v.*, u.full_name, u.email, u.phone
     FROM vendors v
     JOIN users u ON v.user_id = u.id
     WHERE v.is_approved = 1 AND v.is_active = 1`,
    [],
    (err, vendors) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ vendors });
    }
  );
});

// Get vendor public profile
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT v.*, u.full_name
     FROM vendors v
     JOIN users u ON v.user_id = u.id
     WHERE v.id = ? AND v.is_approved = 1 AND v.is_active = 1`,
    [id],
    (err, vendor) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      // Get vendor products
      db.all(
        `SELECT id, name, slug, price, compare_price, images, quantity
         FROM products
         WHERE vendor_id = ? AND is_active = 1 AND is_approved = 1`,
        [id],
        (err, products) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          const parsedProducts = products.map(p => ({
            ...p,
            images: p.images ? JSON.parse(p.images) : []
          }));

          res.json({ vendor, products: parsedProducts });
        }
      );
    }
  );
});

// Get vendor dashboard stats
router.get('/dashboard/stats', authenticate, requireVendor, (req, res) => {
  db.get('SELECT id FROM vendors WHERE user_id = ?', [req.userId], (err, vendor) => {
    if (err || !vendor) {
      return res.status(500).json({ error: 'Vendor not found' });
    }

    const vendorId = vendor.id;

    // Total sales
    db.get(
      `SELECT COUNT(*) as total_orders, COALESCE(SUM(subtotal), 0) as total_sales, COALESCE(SUM(vendor_earnings), 0) as total_earnings
       FROM sub_orders
       WHERE vendor_id = ? AND status != 'cancelled'`,
      [vendorId],
      (err, salesStats) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Total products
        db.get(
          `SELECT COUNT(*) as total_products, SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock
           FROM products
           WHERE vendor_id = ?`,
          [vendorId],
          (err, productStats) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            // Recent orders
            db.all(
              `SELECT so.*, o.order_number, o.created_at
               FROM sub_orders so
               JOIN orders o ON so.order_id = o.id
               WHERE so.vendor_id = ?
               ORDER BY so.created_at DESC
               LIMIT 5`,
              [vendorId],
              (err, recentOrders) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                res.json({
                  sales: salesStats,
                  products: productStats,
                  recent_orders: recentOrders
                });
              }
            );
          }
        );
      }
    );
  });
});

// Update vendor profile
router.put('/profile', authenticate, requireVendor, (req, res) => {
  const { store_name, store_description, store_logo, bank_account } = req.body;

  db.get('SELECT id FROM vendors WHERE user_id = ?', [req.userId], (err, vendor) => {
    if (err || !vendor) {
      return res.status(500).json({ error: 'Vendor not found' });
    }

    const fields = [];
    const values = [];

    if (store_name) { fields.push('store_name = ?'); values.push(store_name); }
    if (store_description !== undefined) { fields.push('store_description = ?'); values.push(store_description); }
    if (store_logo) { fields.push('store_logo = ?'); values.push(store_logo); }
    if (bank_account) { fields.push('bank_account = ?'); values.push(bank_account); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(vendor.id);

    db.run(`UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`, values, function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: 'Profile updated successfully' });
    });
  });
});

// Admin: Approve vendor
router.patch('/:id/approve', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE vendors SET is_approved = 1 WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ message: 'Vendor approved successfully' });
  });
});

module.exports = router;

