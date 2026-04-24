const express = require('express');
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get admin dashboard statistics
router.get('/dashboard', authenticate, requireAdmin, (req, res) => {
  // Total users
  db.get(
    `SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as total_customers,
      SUM(CASE WHEN role = 'vendor' THEN 1 ELSE 0 END) as total_vendors,
      SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins
     FROM users`,
    [],
    (err, userStats) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Total orders and revenue
      db.get(
        `SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(grand_total), 0) as total_revenue,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders
         FROM orders`,
        [],
        (err, orderStats) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Total products and categories
          db.get(
            `SELECT 
              COUNT(*) as total_products,
              SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as pending_products
             FROM products`,
            [],
            (err, productStats) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // Recent orders
              db.all(
                `SELECT o.*, u.full_name as customer_name
                 FROM orders o
                 JOIN users u ON o.customer_id = u.id
                 ORDER BY o.created_at DESC
                 LIMIT 10`,
                [],
                (err, recentOrders) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  res.json({
                    users: userStats,
                    orders: orderStats,
                    products: productStats,
                    recent_orders: recentOrders
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Get all users
router.get('/users', authenticate, requireAdmin, (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  let query = 'SELECT id, email, full_name, role, phone, address, created_at FROM users WHERE 1=1';
  const params = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ users, page: parseInt(page), limit: parseInt(limit) });
  });
});

// Get pending vendor approvals
router.get('/pending-vendors', authenticate, requireAdmin, (req, res) => {
  db.all(
    `SELECT v.*, u.email, u.full_name, u.phone
     FROM vendors v
     JOIN users u ON v.user_id = u.id
     WHERE v.is_approved = 0
     ORDER BY v.created_at DESC`,
    [],
    (err, vendors) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ vendors });
    }
  );
});

// Get pending product approvals
router.get('/pending-products', authenticate, requireAdmin, (req, res) => {
  db.all(
    `SELECT p.*, v.store_name
     FROM products p
     JOIN vendors v ON p.vendor_id = v.id
     WHERE p.is_approved = 0
     ORDER BY p.created_at DESC`,
    [],
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const parsedProducts = products.map(p => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : []
      }));

      res.json({ products: parsedProducts });
    }
  );
});

// Get all orders (admin view)
router.get('/orders', authenticate, requireAdmin, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let query = `
    SELECT o.*, u.full_name as customer_name
    FROM orders o
    JOIN users u ON o.customer_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, orders) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ orders, page: parseInt(page), limit: parseInt(limit) });
  });
});

// Update commission rate for vendor
router.patch('/vendors/:id/commission', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { commission_rate } = req.body;

  if (commission_rate === undefined || commission_rate < 0 || commission_rate > 100) {
    return res.status(400).json({ error: 'Valid commission rate (0-100) is required' });
  }

  db.run(
    'UPDATE vendors SET commission_rate = ? WHERE id = ?',
    [commission_rate, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      res.json({ message: 'Commission rate updated successfully' });
    }
  );
});

// Update order status (admin)
router.patch('/orders/:id/status', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(
    'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ message: 'Order status updated successfully' });
    }
  );
});

// Category management
router.post('/categories', authenticate, requireAdmin, (req, res) => {
  const { name, slug, description, parent_id } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug are required' });
  }

  db.run(
    'INSERT INTO categories (name, slug, description, parent_id) VALUES (?, ?, ?, ?)',
    [name, slug, description || null, parent_id || null],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Category slug already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ message: 'Category created', category_id: this.lastID });
    }
  );
});

router.get('/categories', authenticate, requireAdmin, (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name', [], (err, categories) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ categories });
  });
});

module.exports = router;

