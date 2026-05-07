# MERN Multi-Vendor E-commerce Platform Guide

This document describes a production-ready MERN architecture for a multi-vendor e-commerce platform, with clear frontend and backend folder structure, core features, sample code snippets, and setup guidance.

---

## 1. Folder Structure

### Backend

```
backend/
  ├── config/
  │   ├── db.js
  │   └── cloudinary.js
  ├── controllers/
  │   ├── authController.js
  │   ├── productController.js
  │   ├── orderController.js
  │   ├── vendorController.js
  │   ├── adminController.js
  │   └── uploadController.js
  ├── middleware/
  │   ├── auth.js
  │   ├── roles.js
  │   └── errorHandler.js
  ├── models/
  │   ├── User.js
  │   ├── Vendor.js
  │   ├── Product.js
  │   ├── Order.js
  │   └── Cart.js
  ├── routes/
  │   ├── authRoutes.js
  │   ├── productRoutes.js
  │   ├── orderRoutes.js
  │   ├── vendorRoutes.js
  │   ├── adminRoutes.js
  │   └── uploadRoutes.js
  ├── utils/
  │   ├── generateToken.js
  │   └── validateRequest.js
  ├── .env
  ├── server.js
  └── package.json
```

### Frontend

```
frontend/
  ├── public/
  │   └── index.html
  ├── src/
  │   ├── api/
  │   │   ├── authService.js
  │   │   ├── productService.js
  │   │   ├── orderService.js
  │   │   └── vendorService.js
  │   ├── app/
  │   │   └── store.js
  │   ├── components/
  │   │   ├── Navbar.jsx
  │   │   ├── ProductCard.jsx
  │   │   ├── ProductList.jsx
  │   │   ├── CartDrawer.jsx
  │   │   ├── CheckoutStepper.jsx
  │   │   ├── VendorDashboard.jsx
  │   │   ├── AdminDashboard.jsx
  │   │   └── ToastContainer.jsx
  │   ├── features/
  │   │   ├── auth/authSlice.js
  │   │   ├── cart/cartSlice.js
  │   │   ├── products/productsSlice.js
  │   │   ├── orders/ordersSlice.js
  │   │   └── vendors/vendorSlice.js
  │   ├── hooks/
  │   │   └── useAuth.js
  │   ├── pages/
  │   │   ├── Home.jsx
  │   │   ├── Products.jsx
  │   │   ├── ProductDetail.jsx
  │   │   ├── Cart.jsx
  │   │   ├── Checkout.jsx
  │   │   ├── Login.jsx
  │   │   ├── Signup.jsx
  │   │   ├── VendorPanel.jsx
  │   │   ├── AdminPanel.jsx
  │   │   └── Orders.jsx
  │   ├── styles/
  │   │   ├── globals.css
  │   │   └── dark-theme.css
  │   ├── App.jsx
  │   └── main.jsx
  └── package.json
```

---

## 2. Backend Architecture

### 2.1 server.js / app.js

`backend/server.js`

```js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### 2.2 Database Connection

`backend/config/db.js`

```js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
```

### 2.3 Auth Utilities

`backend/utils/generateToken.js`

```js
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export default generateToken;
```

### 2.4 Auth Middleware

`backend/middleware/auth.js`

```js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      req.user.role = decoded.role;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
```

`backend/middleware/roles.js`

```js
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
};
```

### 2.5 Mongoose Models

#### User Model

`backend/models/User.js`

```js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['customer', 'vendor', 'admin'],
      default: 'customer',
    },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
```

#### Vendor Model

`backend/models/Vendor.js`

```js
import mongoose from 'mongoose';

const vendorSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    description: { type: String },
    logo: { type: String },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

const Vendor = mongoose.model('Vendor', vendorSchema);
export default Vendor;
```

#### Product Model

`backend/models/Product.js`

```js
import mongoose from 'mongoose';

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String }],
    category: { type: String, required: true },
    countInStock: { type: Number, default: 0 },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    vendorInfo: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
      name: String,
    },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
```

#### Order Model

`backend/models/Order.js`

```js
import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    orderItems: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        quantity: Number,
        price: Number,
        image: String,
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
      },
    ],
    shippingAddress: {
      address: String,
      city: String,
      postalCode: String,
      country: String,
    },
    paymentMethod: String,
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    taxPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
```

#### Cart Model (optional)

`backend/models/Cart.js`

```js
import mongoose from 'mongoose';

const cartSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cartItems: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        qty: Number,
        price: Number,
        image: String,
      },
    ],
  },
  { timestamps: true }
);

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
```

### 2.6 Controllers

#### Auth Controller

`backend/controllers/authController.js`

```js
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import generateToken from '../utils/generateToken.js';

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'customer',
  });

  if (role === 'vendor') {
    const vendor = await Vendor.create({
      name,
      email,
      description: 'New vendor profile',
    });
    user.vendor = vendor._id;
    await user.save();
  }

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id, user.role),
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});
```

#### Product Controller

`backend/controllers/productController.js`

```js
import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import Vendor from '../models/Vendor.js';

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, countInStock, images } = req.body;
  const vendor = await Vendor.findOne({ _id: req.user.vendor });
  const product = await Product.create({
    name,
    description,
    price,
    category,
    countInStock,
    images,
    vendor: vendor._id,
    vendorInfo: { id: vendor._id, name: vendor.name },
  });
  res.status(201).json(product);
});

export const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 12;
  const page = Number(req.query.page) || 1;
  const keyword = req.query.keyword
    ? { name: { $regex: req.query.keyword, $options: 'i' } }
    : {};
  const categoryFilter = req.query.category ? { category: req.query.category } : {};
  const priceFilter = req.query.minPrice || req.query.maxPrice
    ? {
        price: {
          ...(req.query.minPrice ? { $gte: Number(req.query.minPrice) } : {}),
          ...(req.query.maxPrice ? { $lte: Number(req.query.maxPrice) } : {}),
        },
      }
    : {};

  const filter = { ...keyword, ...categoryFilter, ...priceFilter };
  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('vendor', 'name')
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize), count });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('vendor', 'name');
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.vendor.toString() !== req.user.vendor.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to edit this product');
  }

  const { name, description, price, category, countInStock, images } = req.body;
  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.category = category || product.category;
  product.countInStock = countInStock ?? product.countInStock;
  product.images = images || product.images;

  const updatedProduct = await product.save();
  res.json(updatedProduct);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.vendor.toString() !== req.user.vendor.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this product');
  }

  await product.remove();
  res.json({ message: 'Product removed' });
});
```

#### Order Controller

`backend/controllers/orderController.js`

```js
import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

export const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  const order = new Order({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid: false,
  });

  const createdOrder = await order.save();
  res.status(201).json(createdOrder);
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('orderItems.product', 'name price');
  res.json(orders);
});

export const getVendorOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ 'orderItems.vendor': req.user.vendor }).populate('user', 'name email');
  res.json(orders);
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name email');
  res.json(orders);
});

export const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});
```

#### Admin Controller

`backend/controllers/adminController.js`

```js
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

export const getAdminOverview = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    { $group: { _id: null, total: { $sum: '$totalPrice' } } },
  ]);

  res.json({
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue: totalRevenue[0] ? totalRevenue[0].total : 0,
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().populate('vendor', 'name');
  res.json(products);
});

export const banUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.isBanned = true;
    await user.save();
    res.json({ message: 'User banned' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});
```

### 2.7 Routes

#### Auth Routes

`backend/routes/authRoutes.js`

```js
import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
export default router;
```

#### Product Routes

`backend/routes/productRoutes.js`

```js
import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();
router.route('/').get(getProducts).post(protect, authorizeRoles('vendor', 'admin'), createProduct);
router.route('/:id').get(getProductById).put(protect, authorizeRoles('vendor', 'admin'), updateProduct).delete(protect, authorizeRoles('vendor', 'admin'), deleteProduct);
export default router;
```

#### Order Routes

`backend/routes/orderRoutes.js`

```js
import express from 'express';
import {
  createOrder,
  getMyOrders,
  getVendorOrders,
  getAllOrders,
  updateOrderToPaid,
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();
router.route('/').post(protect, authorizeRoles('customer', 'vendor', 'admin'), createOrder);
router.route('/my').get(protect, authorizeRoles('customer', 'admin'), getMyOrders);
router.route('/vendor').get(protect, authorizeRoles('vendor', 'admin'), getVendorOrders);
router.route('/all').get(protect, authorizeRoles('admin'), getAllOrders);
router.route('/:id/pay').put(protect, authorizeRoles('customer', 'admin'), updateOrderToPaid);
export default router;
```

#### Admin Routes

`backend/routes/adminRoutes.js`

```js
import express from 'express';
import {
  getAdminOverview,
  getAllUsers,
  getAllProducts,
  banUser,
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();
router.use(protect, authorizeRoles('admin'));
router.get('/overview', getAdminOverview);
router.get('/users', getAllUsers);
router.get('/products', getAllProducts);
router.put('/users/:id/ban', banUser);
export default router;
```

### 2.8 Stripe Payment Example

#### Stripe Payment Intent Route

`backend/controllers/paymentController.js`

```js
import Stripe from 'stripe';
import asyncHandler from 'express-async-handler';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, currency = 'usd' } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
  });
  res.json({ clientSecret: paymentIntent.client_secret });
});
```

`backend/routes/paymentRoutes.js`

```js
import express from 'express';
import { createPaymentIntent } from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/create-payment-intent', protect, createPaymentIntent);
export default router;
```

### 2.9 Cloudinary Upload Example

`backend/config/cloudinary.js`

```js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

`backend/controllers/uploadController.js`

```js
import asyncHandler from 'express-async-handler';
import cloudinary from '../config/cloudinary.js';

export const uploadImage = asyncHandler(async (req, res) => {
  const fileStr = req.body.data;
  const uploadResponse = await cloudinary.uploader.upload(fileStr, {
    folder: 'multivendor/products',
  });
  res.json({ url: uploadResponse.secure_url });
});
```

`backend/routes/uploadRoutes.js`

```js
import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/', protect, uploadImage);
export default router;
```

---

## 3. Frontend Architecture

### 3.1 App Setup

`frontend/src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VendorPanel from './pages/VendorPanel';
import AdminPanel from './pages/AdminPanel';
import Orders from './pages/Orders';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/vendor" element={<VendorPanel />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/orders" element={<Orders />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### 3.2 Redux Toolkit Store

`frontend/src/app/store.js`

```js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import cartReducer from '../features/cart/cartSlice';
import productsReducer from '../features/products/productsSlice';
import ordersReducer from '../features/orders/ordersSlice';
import vendorsReducer from '../features/vendors/vendorSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productsReducer,
    orders: ordersReducer,
    vendors: vendorsReducer,
  },
});
```

### 3.3 Auth Slice Example

`frontend/src/features/auth/authSlice.js`

```js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../api/authService';

const user = JSON.parse(localStorage.getItem('multivastaUser')) || null;
const token = localStorage.getItem('multivastaToken');

const initialState = {
  user,
  token,
  isLoading: false,
  isError: false,
  message: '',
};

export const login = createAsyncThunk('auth/login', async (credentials, thunkAPI) => {
  try {
    return await authService.login(credentials);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
  try {
    return await authService.register(userData);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isLoading = false;
      state.message = '';
      localStorage.removeItem('multivastaUser');
      localStorage.removeItem('multivastaToken');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.token = action.payload.token;
        localStorage.setItem('multivastaUser', JSON.stringify(action.payload));
        localStorage.setItem('multivastaToken', action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.token = action.payload.token;
        localStorage.setItem('multivastaUser', JSON.stringify(action.payload));
        localStorage.setItem('multivastaToken', action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

### 3.4 API Service Example

`frontend/src/api/authService.js`

```js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const register = async (userData) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  return response.data;
};

const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/auth/login`, credentials);
  return response.data;
};

const authService = {
  register,
  login,
};

export default authService;
```

`frontend/src/api/productService.js`

```js
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const getProducts = async (params) => {
  const response = await axios.get(`${API_URL}/products`, { params });
  return response.data;
};

const getProductById = async (id) => {
  const response = await axios.get(`${API_URL}/products/${id}`);
  return response.data;
};

const createProduct = async (productData, token) => {
  const response = await axios.post(`${API_URL}/products`, productData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const productService = {
  getProducts,
  getProductById,
  createProduct,
};

export default productService;
```

### 3.5 Navbar Component

`frontend/src/components/Navbar.jsx`

```jsx
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Navbar() {
  const { user } = useSelector((state) => state.auth);

  return (
    <nav className="navbar dark-theme-nav">
      <Link to="/" className="brand">Multivendor</Link>
      <ul className="nav-links">
        <li><Link to="/products">Shop</Link></li>
        <li><Link to="/cart">Cart</Link></li>
        {user ? (
          <>
            {user.role === 'vendor' && <li><Link to="/vendor">Vendor</Link></li>}
            {user.role === 'admin' && <li><Link to="/admin">Admin</Link></li>}
            <li><Link to="/orders">Orders</Link></li>
            <li><button className="link-button">Logout</button></li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/signup">Signup</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}
```

### 3.6 ProductCard Component

`frontend/src/components/ProductCard.jsx`

```jsx
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`}>
        <img src={product.images?.[0]} alt={product.name} className="product-image" />
      </Link>
      <div className="product-body">
        <h3>{product.name}</h3>
        <p className="product-vendor">{product.vendorInfo?.name || product.vendor?.name}</p>
        <div className="product-footer">
          <span className="price">${product.price.toFixed(2)}</span>
          <button className="button-secondary">View</button>
        </div>
      </div>
    </article>
  );
}
```

### 3.7 Cart Slice

`frontend/src/features/cart/cartSlice.js`

```js
import { createSlice } from '@reduxjs/toolkit';

const cartFromStorage = JSON.parse(localStorage.getItem('multivastaCart')) || [];

const cartSlice = createSlice({
  name: 'cart',
  initialState: { cartItems: cartFromStorage },
  reducers: {
    addToCart(state, action) {
      const item = action.payload;
      const existingItem = state.cartItems.find((x) => x.product === item.product);
      if (existingItem) {
        existingItem.qty += item.qty;
      } else {
        state.cartItems.push(item);
      }
      localStorage.setItem('multivastaCart', JSON.stringify(state.cartItems));
    },
    removeFromCart(state, action) {
      state.cartItems = state.cartItems.filter((x) => x.product !== action.payload);
      localStorage.setItem('multivastaCart', JSON.stringify(state.cartItems));
    },
    updateQuantity(state, action) {
      const { product, qty } = action.payload;
      const item = state.cartItems.find((x) => x.product === product);
      if (item) item.qty = qty;
      localStorage.setItem('multivastaCart', JSON.stringify(state.cartItems));
    },
    clearCart(state) {
      state.cartItems = [];
      localStorage.removeItem('multivastaCart');
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
```

### 3.8 Checkout Page Example

`frontend/src/pages/Checkout.jsx`

```jsx
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../features/cart/cartSlice';
import orderService from '../api/orderService';

export default function Checkout() {
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);
  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState({ address: '', city: '', postalCode: '', country: '' });
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading, setLoading] = useState(false);

  const itemsPrice = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  const shippingPrice = itemsPrice > 200 ? 0 : 15;
  const taxPrice = Number((0.1 * itemsPrice).toFixed(2));
  const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await orderService.createOrder({
        orderItems: cartItems,
        shippingAddress: shipping,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });
      dispatch(clearCart());
      setStep(3);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-steps">
        <span className={step >= 1 ? 'active' : ''}>Shipping</span>
        <span className={step >= 2 ? 'active' : ''}>Payment</span>
        <span className={step >= 3 ? 'active' : ''}>Review</span>
      </div>
      {step === 1 && (
        <section className="checkout-card">
          <h2>Shipping Address</h2>
          <input value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} placeholder="Address" />
          <input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} placeholder="City" />
          <input value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} placeholder="Postal Code" />
          <input value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} placeholder="Country" />
          <button onClick={() => setStep(2)}>Continue</button>
        </section>
      )}
      {step === 2 && (
        <section className="checkout-card">
          <h2>Payment Method</h2>
          <label>
            <input type="radio" value="stripe" checked={paymentMethod === 'stripe'} onChange={(e) => setPaymentMethod(e.target.value)} />
            Stripe
          </label>
          <button onClick={() => setStep(3)}>Continue</button>
        </section>
      )}
      {step === 3 && (
        <section className="checkout-card">
          <h2>Review Order</h2>
          <div className="summary">
            <p>Subtotal: ${itemsPrice.toFixed(2)}</p>
            <p>Shipping: ${shippingPrice.toFixed(2)}</p>
            <p>Tax: ${taxPrice.toFixed(2)}</p>
            <p>Total: ${totalPrice.toFixed(2)}</p>
          </div>
          <button disabled={loading} onClick={handleSubmit}>{loading ? 'Placing order...' : 'Place Order'}</button>
        </section>
      )}
    </div>
  );
}
```

### 3.9 Basic Dark Theme Styling

`frontend/src/styles/globals.css`

```css
:root {
  color-scheme: dark;
  --bg: #090b12;
  --surface: #111827;
  --surface-strong: #1f2937;
  --text: #e5e7eb;
  --muted: #9ca3af;
  --primary: #6366f1;
  --secondary: #22c55e;
  --border: #2d3748;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: Inter, system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  border: none;
  cursor: pointer;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid var(--border);
}

.product-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 32px 70px rgba(15, 23, 42, 0.35);
}

.checkout-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
}

button.button-primary {
  background: linear-gradient(135deg, var(--primary), #4338ca);
  color: white;
  padding: 0.95rem 1.5rem;
  border-radius: 999px;
}
```

---

## 4. Security and Architectural Decisions

### Authentication & Authorization

- JWT tokens are issued after login/register.
- `protect` middleware validates tokens and attaches `req.user`.
- `authorizeRoles` guards routes by role (`customer`, `vendor`, `admin`).
- Use refresh tokens or token rotation for improved production security.

### Role-Based Access Control

- Customers can browse, add to cart, checkout, and view their orders.
- Vendors can manage only their own products and view vendor-specific orders.
- Admins can manage all users, products, and site-wide order data.

### MVC / Modular API Pattern

- Models define entities and relationships.
- Controllers contain business logic.
- Routes map endpoints to controller functions.
- Middleware handles auth, error handling, and validation.

### Data Relationships

- `User` optionally links to `Vendor` for vendor accounts.
- `Product.vendor` references the vendor that owns the product.
- `Order.orderItems` stores product details and vendor references.

### Image Upload Strategy

- Store images with Cloudinary and save URLs in `Product.images`.
- Use secure upload endpoints protected by authentication.

### Payment Integration

- Backend creates Stripe payment intents using `stripe.paymentIntents.create()`.
- Frontend fetches `clientSecret` and confirms payment.
- Order records store `paymentResult` and payment status.

### Performance Tips

- Use pagination and filters for product listing.
- Build fast API queries with field projection and indexes.
- Cache public product data if needed.
- Keep frontend components reusable, memoized, and lazy loaded.

---

## 5. Setup Instructions

### Backend Setup

1. Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/multivasta
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

2. Install dependencies:

```bash
cd backend
npm install express mongoose dotenv cors morgan bcryptjs jsonwebtoken stripe cloudinary express-async-handler
```

3. Start the server:

```bash
npm run dev
```

### Frontend Setup

1. Create `frontend/.env`:

```env
VITE_API_BASE=http://localhost:5000/api
```

2. Install dependencies:

```bash
cd frontend
npm install react-router-dom axios @reduxjs/toolkit react-redux react-toastify framer-motion
```

3. Start the app:

```bash
npm run dev
```

### Local Development Flow

- Run backend on `http://localhost:5000`
- Run frontend on `http://localhost:5173`
- Use Postman or browser to test auth, product creation, and order APIs.

---

## 6. Expansion Paths

### Vendor Workflow

- Build a separate vendor dashboard page.
- Add product creation forms and image upload.
- Display vendor analytics and pending orders.

### Admin Workflow

- Add user management pages and ban actions.
- Add product moderation and global order overview.
- Provide charts and revenue forecasting.

### UX Enhancements

- Add skeleton loaders during product fetch.
- Implement toast notifications for success/error.
- Add mobile-friendly responsive menus and swipable carousels.

---

## 7. Example Business Logic Flow

### Customer Checkout

1. Customer adds products to cart.
2. Cart state persists in local storage / Redux.
3. Customer enters shipping and payment details.
4. Frontend requests Stripe payment intent.
5. Backend returns `clientSecret`.
6. Frontend confirms payment.
7. Backend marks order as paid.
8. User can view order history.

### Vendor Product CRUD

1. Vendor logs in and accesses vendor panel.
2. Vendor creates products via protected API.
3. Products are returned in catalog with vendor name.
4. Vendor updates or deletes own products.

### Admin Oversight

1. Admin logs in and opens admin panel.
2. Admin views site-wide order metrics.
 3. Admin moderates users and products.

---

## 8. Key Concepts Summary

- Use JWT for secure stateless auth.
- Protect backend routes and enforce roles.
- Keep frontend state in Redux Toolkit for auth and cart.
- Use Axios for all API communications.
- Design UI components modularly for reusability.
- Implement a dark theme and responsive layouts.
- Store and reuse API base URLs through environment variables.

This guide provides the foundational architecture and sample code to build a robust, production-ready MERN multi-vendor e-commerce platform. Continue by implementing the full pages, connecting frontend state to backend APIs, and refining user experience with responsive, animated components."}]}