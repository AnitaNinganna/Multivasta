const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const { authenticate, requireVendor, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
  const { category, vendor, search, min_price, max_price, page = 1, limit = 20 } = req.query;
  const filter = { isActive: true, isApproved: true };

  try {
    if (category) {
      const categoryQuery = mongoose.isValidObjectId(category)
        ? { _id: category }
        : { slug: category.toString().toLowerCase() };
      const categoryDoc = await Category.findOne(categoryQuery);
      if (categoryDoc) {
        filter.categoryId = categoryDoc._id;
      }
    }

    if (vendor && mongoose.isValidObjectId(vendor)) {
      filter.vendorId = vendor;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { description: regex }];
    }

    if (min_price !== undefined) {
      filter.price = { ...filter.price, $gte: Number(min_price) };
    }

    if (max_price !== undefined) {
      filter.price = { ...filter.price, $lte: Number(max_price) };
    }

    const products = await Product.find(filter)
      .populate('vendorId', 'storeName')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ products, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product (public)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await Product.findById(id)
      .populate('vendorId', 'storeName commissionRate')
      .populate('categoryId', 'name');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product (vendor only)
router.post('/', authenticate, requireVendor, async (req, res) => {
  const { name, description, price, sku, quantity, images, attributes, category_id } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  try {
    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    const categoryId = category_id && mongoose.isValidObjectId(category_id) ? category_id : null;

    const product = new Product({
      vendorId: vendor._id,
      name,
      description: description || '',
      price,
      sku: sku || '',
      quantity: quantity || 0,
      images: Array.isArray(images) ? images : [],
      attributes: attributes || {},
      categoryId
    });

    const createdProduct = await product.save();
    res.status(201).json({ message: 'Product created successfully', product_id: createdProduct._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product (vendor only - own products)
router.put('/:id', authenticate, requireVendor, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    const product = await Product.findOne({ _id: id, vendorId: vendor._id });
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    const updateFields = {};
    ['name', 'description', 'price', 'sku', 'quantity'].forEach(field => {
      if (updates[field] !== undefined) {
        updateFields[field] = updates[field];
      }
    });

    if (updates.category_id && mongoose.isValidObjectId(updates.category_id)) {
      updateFields.categoryId = updates.category_id;
    }

    if (updates.images) {
      updateFields.images = Array.isArray(updates.images) ? updates.images : [];
    }

    if (updates.attributes) {
      updateFields.attributes = updates.attributes;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await Product.updateOne({ _id: id }, { $set: updateFields });
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product (vendor only)
router.delete('/:id', authenticate, requireVendor, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const vendor = await Vendor.findOne({ userId: req.userId });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    const result = await Product.deleteOne({ _id: id, vendorId: vendor._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve product (admin only)
router.patch('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await Product.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

