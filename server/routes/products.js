const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const { authenticate, requireVendor, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Get all products with advanced search - ENHANCED
router.get('/', async (req, res) => {
  const { 
    search, 
    category, 
    vendor, 
    minPrice, 
    maxPrice, 
    minRating,
    sortBy = 'newest',
    page = 1, 
    limit = 20 
  } = req.query;

  const filter = { isActive: true, isApproved: true };

  try {
    // Category filtering
    if (category) {
      if (mongoose.isValidObjectId(category)) {
        filter.categoryId = new mongoose.Types.ObjectId(category);
      } else {
        const categoryDoc = await Category.findOne({ name: new RegExp(category, 'i') });
        if (categoryDoc) {
          filter.categoryId = categoryDoc._id;
        }
      }
    }

    // Vendor filtering
    if (vendor) {
      if (mongoose.isValidObjectId(vendor)) {
        filter.vendorId = new mongoose.Types.ObjectId(vendor);
      } else {
        const vendorUser = await User.findOne({ 
          'vendorDetails.storeName': new RegExp(vendor, 'i'),
          role: 'vendor'
        });
        if (vendorUser) {
          filter.vendorId = vendorUser._id;
        }
      }
    }

    // Price range filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // Rating filtering
    if (minRating !== undefined) {
      filter.rating = { $gte: Number(minRating) };
    }

    // Advanced search with full-text search
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      
      // Try full-text search first
      try {
        filter.$text = { $search: search };
      } catch {
        // Fall back to regex search
        filter.$or = [
          { name: searchRegex },
          { description: searchRegex },
          { tags: searchRegex },
          { sku: searchRegex }
        ];
      }
    }

    // Sorting options
    let sortOptions = { createdAt: -1 };
    switch (sortBy) {
      case 'price_low':
        sortOptions = { price: 1 };
        break;
      case 'price_high':
        sortOptions = { price: -1 };
        break;
      case 'rating':
        sortOptions = { rating: -1, reviewCount: -1 };
        break;
      case 'popular':
        sortOptions = { soldCount: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('vendorId', 'name vendorDetails.storeName email')
        .populate('categoryId', 'name')
        .select('name description price rating reviewCount soldCount quantity images sku categoryId vendorId tags createdAt')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    // Get faceted data for filters
    const facets = await getFacets(filter);

    res.json({
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        description: p.description,
        price: p.price,
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        soldCount: p.soldCount || 0,
        quantity: p.quantity,
        images: p.images,
        sku: p.sku,
        category: p.categoryId?.name,
        vendor: {
          id: p.vendorId._id,
          name: p.vendorId.vendorDetails?.storeName || p.vendorId.name,
          email: p.vendorId.email
        },
        tags: p.tags
      })),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      },
      facets: facets,
      appliedFilters: {
        search: search || null,
        category: category || null,
        vendor: vendor || null,
        priceRange: minPrice || maxPrice ? { min: minPrice, max: maxPrice } : null,
        minRating: minRating || null,
        sortBy
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function for faceted search
async function getFacets(baseFilter) {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'products'
        }
      },
      {
        $match: { 'products': { $exists: true, $not: { $size: 0 } } }
      },
      {
        $project: { name: 1, count: { $size: '$products' } }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);

    const priceRanges = await Product.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    const vendors = await User.aggregate([
      { $match: { role: 'vendor', 'vendorDetails.isApproved': true } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'vendorId',
          as: 'products'
        }
      },
      {
        $match: { 'products': { $exists: true, $not: { $size: 0 } } }
      },
      {
        $project: {
          name: '$vendorDetails.storeName',
          count: { $size: '$products' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);

    const ratings = [
      { rating: 5, label: '5 Stars', count: await Product.countDocuments({ ...baseFilter, rating: 5 }) },
      { rating: 4, label: '4+ Stars', count: await Product.countDocuments({ ...baseFilter, rating: { $gte: 4 } }) },
      { rating: 3, label: '3+ Stars', count: await Product.countDocuments({ ...baseFilter, rating: { $gte: 3 } }) }
    ];

    return {
      categories: categories,
      priceRange: priceRanges[0] || { minPrice: 0, maxPrice: 10000 },
      vendors: vendors,
      ratings: ratings
    };
  } catch (error) {
    return null;
  }
}

// Get search suggestions
router.get('/search/suggestions', async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json({ suggestions: [] });
  }

  try {
    const regex = new RegExp(q, 'i');
    
    const [productNames, categoryNames] = await Promise.all([
      Product.find({ name: regex, isActive: true, isApproved: true })
        .distinct('name')
        .limit(5),
      Category.find({ name: regex })
        .distinct('name')
        .limit(5)
    ]);

    res.json({
      suggestions: [
        ...productNames.map(name => ({ type: 'product', value: name })),
        ...categoryNames.map(name => ({ type: 'category', value: name }))
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload product images (vendor only)
router.post('/upload', authenticate, requireVendor, upload.array('images', 6), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const uploadedUrls = req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(file.filename)}`);
    res.status(201).json({ message: 'Images uploaded successfully', images: uploadedUrls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current vendor products (vendor only)
router.get('/mine', authenticate, requireVendor, async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.userId })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    res.json({ products });
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

    const product = await Product.findOne({ _id: id, isActive: true, isApproved: true })
      .populate('vendorId', 'name vendorDetails.storeName vendorDetails.commissionRate')
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
  const { name, description, price, sku, quantity, images, attributes, category_id, tags = [] } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'vendor') {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }

    const categoryId = category_id && mongoose.isValidObjectId(category_id) ? category_id : null;

    const product = new Product({
      vendorId: req.userId,
      name,
      description: description || '',
      price,
      sku: sku || '',
      quantity: quantity || 0,
      images: Array.isArray(images) ? images : [],
      attributes: attributes || {},
      tags: Array.isArray(tags) ? tags : [],
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

    const product = await Product.findOne({ _id: id, vendorId: req.userId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    const updateFields = {};
    ['name', 'description', 'price', 'sku', 'quantity', 'tags'].forEach(field => {
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

    const result = await Product.deleteOne({ _id: id, vendorId: req.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    // Also delete associated inventory
    const Inventory = require('../models/Inventory');
    await Inventory.deleteOne({ productId: id });

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

