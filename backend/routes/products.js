const express = require('express');
const db = require('../config/database');
const { authenticate, requireVendor, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all products (public)
router.get('/', (req, res) => {
  const { category, vendor, search, min_price, max_price, page = 1, limit = 20 } = req.query;
  let query = `
    SELECT p.*, v.store_name, c.name as category_name
    FROM products p
    JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND p.is_approved = 1
  `;
  const params = [];

  if (category) {
    query += ' AND p.category_id = ?';
    params.push(category);
  }

  if (vendor) {
    query += ' AND p.vendor_id = ?';
    params.push(vendor);
  }

  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (min_price) {
    query += ' AND p.price >= ?';
    params.push(min_price);
  }

  if (max_price) {
    query += ' AND p.price <= ?';
    params.push(max_price);
  }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Parse JSON images and attributes
    const parsedProducts = products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      attributes: p.attributes ? JSON.parse(p.attributes) : {}
    }));

    res.json({ products: parsedProducts, page: parseInt(page), limit: parseInt(limit) });
  });
});

// Get single product (public)
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT p.*, v.store_name, v.commission_rate, c.name as category_name
     FROM products p
     JOIN vendors v ON p.vendor_id = v.id
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ?`,
    [id],
    (err, product) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      product.images = product.images ? JSON.parse(product.images) : [];
      product.attributes = product.attributes ? JSON.parse(product.attributes) : {};

      res.json({ product });
    }
  );
});

// Create product (vendor only)
router.post('/', authenticate, requireVendor, (req, res) => {
  const { name, description, price, compare_price, sku, quantity, weight, images, attributes, category_id } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  // Get vendor_id from user
  db.get('SELECT id FROM vendors WHERE user_id = ?', [req.userId], (err, vendor) => {
    if (err || !vendor) {
      return res.status(500).json({ error: 'Vendor profile not found' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();

    db.run(
      `INSERT INTO products (vendor_id, category_id, name, slug, description, price, compare_price, sku, quantity, weight, images, attributes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendor.id,
        category_id || null,
        name,
        slug,
        description || null,
        price,
        compare_price || null,
        sku || null,
        quantity || 0,
        weight || null,
        images ? JSON.stringify(images) : '[]',
        attributes ? JSON.stringify(attributes) : '{}'
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.status(201).json({ message: 'Product created successfully', product_id: this.lastID });
      }
    );
  });
});

// Update product (vendor only - own products)
router.put('/:id', authenticate, requireVendor, (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  db.get('SELECT id FROM vendors WHERE user_id = ?', [req.userId], (err, vendor) => {
    if (err || !vendor) {
      return res.status(500).json({ error: 'Vendor profile not found' });
    }

    db.get('SELECT * FROM products WHERE id = ? AND vendor_id = ?', [id, vendor.id], (err, product) => {
      if (err || !product) {
        return res.status(404).json({ error: 'Product not found or unauthorized' });
      }

      const fields = [];
      const values = [];

      ['name', 'description', 'price', 'compare_price', 'sku', 'quantity', 'weight', 'category_id'].forEach(field => {
        if (updates[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(updates[field]);
        }
      });

      if (updates.images) {
        fields.push('images = ?');
        values.push(JSON.stringify(updates.images));
      }

      if (updates.attributes) {
        fields.push('attributes = ?');
        values.push(JSON.stringify(updates.attributes));
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id);

      db.run(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values, function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({ message: 'Product updated successfully' });
      });
    });
  });
});

// Delete product (vendor only)
router.delete('/:id', authenticate, requireVendor, (req, res) => {
  const { id } = req.params;

  db.get('SELECT id FROM vendors WHERE user_id = ?', [req.userId], (err, vendor) => {
    if (err || !vendor) {
      return res.status(500).json({ error: 'Vendor profile not found' });
    }

    db.run('DELETE FROM products WHERE id = ? AND vendor_id = ?', [id, vendor.id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found or unauthorized' });
      }

      res.json({ message: 'Product deleted successfully' });
    });
  });
});

// Approve product (admin only)
router.patch('/:id/approve', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE products SET is_approved = 1 WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ message: 'Product approved successfully' });
  });
});

module.exports = router;

