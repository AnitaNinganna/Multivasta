const mongoose = require('mongoose');

const VendorDetailsSchema = new mongoose.Schema({
  storeName: { type: String, trim: true, default: '' },
  storeDescription: { type: String, default: '' },
  commissionRate: { type: Number, default: 10.0 },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  bankAccount: { type: String, default: '' },
  tags: { type: [String], default: [] },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'vendor', 'admin'], default: 'customer' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  vendorDetails: { type: VendorDetailsSchema, default: () => ({}) },
  lastLogin: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('User', UserSchema);
