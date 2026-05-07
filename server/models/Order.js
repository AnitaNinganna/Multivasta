const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
});

// SubOrder: Individual orders per vendor when customer orders from multiple vendors
const SubOrderSchema = new mongoose.Schema({
  subOrderNumber: { type: String, required: true, unique: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [OrderItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  vendorCommission: { type: Number, default: 0, min: 0 },
  vendorEarnings: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], default: 'pending' },
  trackingNumber: { type: String, default: '' },
  estimatedDelivery: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, required: true, unique: true },
  subOrders: { type: [SubOrderSchema], default: [] },
  totalAmount: { type: Number, required: true, min: 0 },
  shippingAmount: { type: Number, default: 0, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, default: 'mock' },
  shippingAddress: { type: String, required: true },
  billingAddress: { type: String, default: '' },
  notes: { type: String, default: '' },
  customerEmail: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

OrderSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Order', OrderSchema);
