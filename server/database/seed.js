const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seedDatabase() {
  console.log('Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  db.run(
    'INSERT OR IGNORE INTO users (email, password, full_name, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
    ['admin@multivasta.com', adminPassword, 'System Administrator', 'admin', '+1-555-0100', 'Admin Office, HQ'],
    function(err) {
      if (err) console.error('Admin seed error:', err.message);
      else console.log('Admin user created');
    }
  );

  // Create customer users
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customers = [
    ['john.doe@email.com', 'John Doe', '+1-555-0101', '123 Main St, City, State'],
    ['jane.smith@email.com', 'Jane Smith', '+1-555-0102', '456 Oak Ave, City, State'],
    ['bob.wilson@email.com', 'Bob Wilson', '+1-555-0103', '789 Pine Rd, City, State']
  ];

  customers.forEach(([email, name, phone, address]) => {
    db.run(
      'INSERT OR IGNORE INTO users (email, password, full_name, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [email, customerPassword, name, 'customer', phone, address],
      function(err) {
        if (err) console.error('Customer seed error:', err.message);
        else console.log(`Customer ${name} created`);
      }
    );
  });

  // Create vendor users and profiles
  const vendorPassword = await bcrypt.hash('vendor123', 10);
  const vendors = [
    { email: 'tech.store@email.com', name: 'Alice Johnson', store: 'TechStore Pro', desc: 'Premium electronics and gadgets', phone: '+1-555-0201', commission: 8 },
    { email: 'fashion.hub@email.com', name: 'Maria Garcia', store: 'Fashion Hub', desc: 'Trendy clothing and accessories', phone: '+1-555-0202', commission: 12 },
    { email: 'home.decor@email.com', name: 'David Chen', store: 'HomeDecor Plus', desc: 'Beautiful home decoration items', phone: '+1-555-0203', commission: 10 }
  ];

  vendors.forEach((vendor, index) => {
    db.run(
      'INSERT OR IGNORE INTO users (email, password, full_name, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [vendor.email, vendorPassword, vendor.name, 'vendor', vendor.phone, 'Vendor Address'],
      function(err) {
        if (err) {
          console.error('Vendor user seed error:', err.message);
          return;
        }

        const userId = this.lastID || (index + 4); // Approximate ID if ignored
        db.run(
          'INSERT OR IGNORE INTO vendors (user_id, store_name, store_description, commission_rate, is_approved) VALUES (?, ?, ?, ?, ?)',
          [userId, vendor.store, vendor.desc, vendor.commission, 1],
          function(err) {
            if (err) console.error('Vendor profile seed error:', err.message);
            else console.log(`Vendor ${vendor.store} created`);
          }
        );
      }
    );
  });

  // Create categories
  const categories = [
    ['Electronics', 'electronics', 'Gadgets and electronic devices'],
    ['Clothing', 'clothing', 'Apparel for men, women, and kids'],
    ['Home & Living', 'home-living', 'Furniture and home decor'],
    ['Books', 'books', 'Physical and digital books'],
    ['Sports', 'sports', 'Sports equipment and accessories']
  ];

  categories.forEach(([name, slug, desc]) => {
    db.run(
      'INSERT OR IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)',
      [name, slug, desc],
      function(err) {
        if (err) console.error('Category seed error:', err.message);
        else console.log(`Category ${name} created`);
      }
    );
  });

  // Create sample products (after a short delay to ensure vendors exist)
  setTimeout(() => {
    const products = [
      // TechStore Pro products
      { vendor: 1, category: 1, name: 'Wireless Bluetooth Headphones', price: 79.99, qty: 50, images: ['https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=Headphones'] },
      { vendor: 1, category: 1, name: 'Smart Watch Series 5', price: 249.99, qty: 30, images: ['https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=SmartWatch'] },
      { vendor: 1, category: 1, name: 'Portable Charger 20000mAh', price: 39.99, qty: 100, images: ['https://via.placeholder.com/300x300/4A90E2/FFFFFF?text=Charger'] },
      // Fashion Hub products
      { vendor: 2, category: 2, name: 'Classic Denim Jacket', price: 89.99, qty: 40, images: ['https://via.placeholder.com/300x300/E74C3C/FFFFFF?text=Jacket'] },
      { vendor: 2, category: 2, name: 'Summer Floral Dress', price: 59.99, qty: 25, images: ['https://via.placeholder.com/300x300/E74C3C/FFFFFF?text=Dress'] },
      { vendor: 2, category: 2, name: 'Leather Crossbody Bag', price: 129.99, qty: 20, images: ['https://via.placeholder.com/300x300/E74C3C/FFFFFF?text=Bag'] },
      // HomeDecor Plus products
      { vendor: 3, category: 3, name: 'Ceramic Vase Set', price: 45.99, qty: 35, images: ['https://via.placeholder.com/300x300/2ECC71/FFFFFF?text=Vase'] },
      { vendor: 3, category: 3, name: 'LED Desk Lamp Modern', price: 34.99, qty: 60, images: ['https://via.placeholder.com/300x300/2ECC71/FFFFFF?text=Lamp'] },
      { vendor: 3, category: 3, name: 'Wall Art Canvas Print', price: 69.99, qty: 15, images: ['https://via.placeholder.com/300x300/2ECC71/FFFFFF?text=Canvas'] }
    ];

    products.forEach((product) => {
      const slug = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
      db.run(
        `INSERT INTO products (vendor_id, category_id, name, slug, description, price, quantity, images, is_approved, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.vendor,
          product.category,
          product.name,
          slug,
          `High-quality ${product.name} from our store.`,
          product.price,
          product.qty,
          JSON.stringify(product.images),
          1,
          1
        ],
        function(err) {
          if (err) console.error('Product seed error:', err.message);
          else console.log(`Product ${product.name} created`);
        }
      );
    });

    console.log('Database seeding completed!');
    console.log('\nDefault login credentials:');
    console.log('Admin: admin@multivasta.com / admin123');
    console.log('Customer: john.doe@email.com / customer123');
    console.log('Vendor: tech.store@email.com / vendor123');
  }, 1000);
}

seedDatabase();

