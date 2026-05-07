const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  images: { type: [String], default: [] },
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  quantity: { type: Number, default: 0, min: 0 },
  sku: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  soldCount: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  tags: { type: [String], default: [] },
  searchText: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for search functionality
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ vendorId: 1, isApproved: 1 });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });

ProductSchema.pre('save', function () {
  this.updatedAt = Date.now();
  // Auto-generate search text for full-text search
  this.searchText = `${this.name} ${this.description} ${this.tags.join(' ')}`;
});

module.exports = mongoose.model('Product', ProductSchema);
