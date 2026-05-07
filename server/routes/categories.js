const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { slug: id };

    const category = await Category.findOne(query);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { name, description, slug } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const category_slug = (slug || name).toString().toLowerCase().replace(/\s+/g, '-');

    const category = new Category({
      name,
      slug: category_slug,
      description: description || ''
    });

    await category.save();
    res.status(201).json({ 
      message: 'Category created successfully', 
      category 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Category slug already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update category (admin only)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const category = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
