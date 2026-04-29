const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  storeName: { type: String, required: true, trim: true },
  storeDescription: { type: String, default: '' },
  commissionRate: { type: Number, default: 10.0 },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  bankAccount: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

VendorSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Vendor', VendorSchema);
