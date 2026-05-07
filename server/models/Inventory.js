const mongoose = require('mongoose');

const InventoryLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['purchase', 'return', 'restock', 'damage'], required: true },
  quantityChange: { type: Number, required: true },
  reason: { type: String, default: '' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  createdAt: { type: Date, default: Date.now },
});

const InventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentStock: { type: Number, default: 0, min: 0 },
  reservedStock: { type: Number, default: 0, min: 0 },
  availableStock: {
    type: Number,
    default: 0,
    get: function() {
      return this.currentStock - this.reservedStock;
    }
  },
  lowStockThreshold: { type: Number, default: 10 },
  isLowStock: { type: Boolean, default: false },
  reorderPoint: { type: Number, default: 50 },
  lastRestockDate: { type: Date, default: null },
  logs: { type: [InventoryLogSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

InventorySchema.pre('save', function() {
  this.updatedAt = Date.now();
  this.isLowStock = this.availableStock <= this.lowStockThreshold;
});

module.exports = mongoose.model('Inventory', InventorySchema);
