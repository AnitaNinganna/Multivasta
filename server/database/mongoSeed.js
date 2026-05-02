const mongoose = require('mongoose');
const db = require('../config/mongo');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const Product = require('../models/Product');

async function seed() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);
    const vendorPassword = await bcrypt.hash('vendor123', 10);

    // Clear collections only for fresh seed
    await Promise.all([
      User.deleteMany({}),
      Vendor.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({})
    ]);

    const admin = new User({ name: 'System Administrator', email: 'admin@multivasta.com', password: adminPassword, role: 'admin', phone: '+1-555-0100', address: 'Admin Office, HQ' });
    await admin.save();

    const customers = [
      { name: 'John Doe', email: 'john.doe@email.com' },
      { name: 'Jane Smith', email: 'jane.smith@email.com' },
      { name: 'Bob Wilson', email: 'bob.wilson@email.com' }
    ];

    const customerDocs = await User.insertMany(customers.map(customer => ({
      ...customer,
      password: customerPassword,
      role: 'customer',
      phone: '+1-555-0101',
      address: 'Customer Address'
    })));

    const vendorsData = [
      { email: 'tech.store@email.com', name: 'Alice Johnson', store: 'TechStore Pro', desc: 'Premium electronics and gadgets', phone: '+1-555-0201', commission: 8 },
      { email: 'fashion.hub@email.com', name: 'Maria Garcia', store: 'Fashion Hub', desc: 'Trendy clothing and accessories', phone: '+1-555-0202', commission: 12 },
      { email: 'home.decor@email.com', name: 'David Chen', store: 'HomeDecor Plus', desc: 'Beautiful home decoration items', phone: '+1-555-0203', commission: 10 }
    ];

    const vendorUsers = await User.insertMany(vendorsData.map(v => ({
      name: v.name,
      email: v.email,
      password: vendorPassword,
      role: 'vendor',
      phone: v.phone,
      address: 'Vendor Address'
    })));

    const vendorDocs = await Vendor.insertMany(vendorUsers.map((user, index) => ({
      userId: user._id,
      storeName: vendorsData[index].store,
      storeDescription: vendorsData[index].desc,
      commissionRate: vendorsData[index].commission,
      isApproved: true
    })));

    const categoriesData = [
      { name: 'Electronics', slug: 'electronics', description: 'Gadgets and electronic devices' },
      { name: 'Clothing', slug: 'clothing', description: 'Apparel for men, women, and kids' },
      { name: 'Home & Living', slug: 'home-living', description: 'Furniture and home decor' },
      { name: 'Books', slug: 'books', description: 'Physical and digital books' },
      { name: 'Sports', slug: 'sports', description: 'Sports equipment and accessories' }
    ];

    const categoryDocs = await Category.insertMany(categoriesData);

    const productsData = [
      { vendorIndex: 0, categorySlug: 'electronics', name: 'Wireless Bluetooth Headphones', price: 79.99, qty: 50, images: ['https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=Headphones'] },
      { vendorIndex: 0, categorySlug: 'electronics', name: 'Smart Watch Series 5', price: 249.99, qty: 30, images: ['https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=SmartWatch'] },
      { vendorIndex: 1, categorySlug: 'clothing', name: 'Classic Denim Jacket', price: 89.99, qty: 40, images: ['https://via.placeholder.com/300x300/E74C3C/FFFFFF?text=Jacket'] },
      { vendorIndex: 1, categorySlug: 'clothing', name: 'Summer Floral Dress', price: 59.99, qty: 25, images: ['https://via.placeholder.com/300x300/E74C3C/FFFFFF?text=Dress'] },
      { vendorIndex: 2, categorySlug: 'home-living', name: 'Ceramic Vase Set', price: 45.99, qty: 35, images: ['https://via.placeholder.com/300x300/2ECC71/FFFFFF?text=Vase'] }
    ];

    await Product.insertMany(productsData.map(product => ({
      vendorId: vendorUsers[product.vendorIndex]._id,
      categoryId: categoryDocs.find(cat => cat.slug === product.categorySlug)._id,
      name: product.name,
      description: `High-quality ${product.name} from our store.`,
      price: product.price,
      quantity: product.qty,
      images: product.images,
      isApproved: true,
      isActive: true
    })));

    console.log('MongoDB seed completed');
    console.log('Admin: admin@multivasta.com / admin123');
    console.log('Customer: john.doe@email.com / customer123');
    console.log('Vendor: tech.store@email.com / vendor123');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    mongoose.connection.close();
  }
}

seed();
