require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
// MongoDB connection (stub for Day 2 schema migration)
require('./config/mongo');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const vendorRoutes = require('./routes/vendors');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const categoryRoutes = require('./routes/categories');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Multi-Vasta API is running', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ status: 'OK', message: 'API test route is available', timestamp: new Date().toISOString() });
});

const clientDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Fallback for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Route not found', path: req.originalUrl });
  }
  res.status(404).send('Not Found');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`);
});

