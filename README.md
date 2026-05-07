# Multi-Vendor E-commerce Platform - MultiVasta

A full-stack e-commerce platform supporting multiple sellers with customer, vendor, and admin modules.

**Status**: ✅ **DAYS 8-12 COMPLETE** - Full product browsing, cart, checkout, orders, and admin panel implemented

## 🚀 Major Features Completed (Days 8-12)

### Day 8 - Product UI ✅
- Complete product listing with search and filters
- Product details modal with images and attributes
- Category and vendor filtering
- Real-time filter indicators

### Day 9 - Cart System ✅
- Full shopping cart management
- Add/remove/adjust quantities
- Tax and shipping calculations
- LocalStorage persistence
- Real-time total updates

### Day 10 - Checkout ✅
- Complete checkout workflow
- Shipping and billing address inputs
- Payment method selection
- Order creation and confirmation
- Auto-redirect to order details

### Day 11 - Order Management ✅
- Order history page with status badges
- Order details view
- Complete order information tracking
- User-friendly order interface

### Day 12 - Admin Panel ✅
- Admin dashboard with statistics
- User management (delete users)
- Product approval system
- Category management
- Order viewing and status updates

## Architecture Overview

This platform follows a **three-sided marketplace model**:
- **Admin**: Platform owner managing infrastructure, approving products, managing users
- **Vendors**: Independent sellers managing inventory and orders
- **Customers**: Buyers browsing and purchasing from multiple vendors

## Key Features

### Product Listing by Vendors
- Independent product catalogs per vendor
- Admin moderation workflow
- Category management with attributes
- Image uploads and product variants

### Cart and Checkout System ✅
- Unified cart across multiple vendors
- Single checkout generating orders
- Location-based shipping calculations (flat $5)
- Tax calculations (10%)
- Real-time total updates

### Order Management ✅
- Customer: Unified order history with status tracking
- Vendor: Order fulfillment tracking
- Admin: Complete marketplace oversight
- Order lifecycle: Pending → Completed → Shipped → Delivered

### Admin Control ✅
- Dashboard with key metrics
- User management capabilities
- Product approval workflow
- Category management
- Order status management

## Project Structure

```
multivasta/
├── frontend/              # React/Vite frontend
│   ├── src/
│   │   ├── pages/        # Page components (Products, Cart, Orders, Admin, etc.)
│   │   ├── components/   # Reusable components
│   │   ├── styles/       # CSS styling
│   │   ├── CartContext.jsx        # Cart state management
│   │   ├── AuthContext.jsx        # Auth state management
│   │   └── api.js        # API client functions
│   └── package.json
│
├── server/                # Node.js/Express API
│   ├── config/           # Database and app configuration
│   ├── models/           # Database models (User, Product, Order, etc.)
│   ├── routes/           # API routes (auth, products, orders, admin)
│   ├── middleware/       # Auth, validation, error handling
│   ├── controllers/      # Business logic
│   └── server.js         # Entry point
├── frontend/             # React/Vanilla JS frontend
│   ├── customer/         # Customer module
│   ├── vendor/           # Vendor dashboard
│   ├── admin/            # Admin panel
│   └── shared/           # Common components
├── database/             # Schema and migrations
└── docs/                 # Architecture and API documentation
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Backend | Node.js, Express.js |
| Database | SQLite (development) / PostgreSQL (production) |
| Auth | JWT (JSON Web Tokens) |
| Storage | Local filesystem (images) |

## Database Schema

### Core Entities
- **Users**: customers, vendors, admins (role-based)
- **Vendors**: store profiles, commission rates
- **Products**: vendor products with categories
- **Carts**: customer shopping carts
- **Orders**: split orders (parent + vendor sub-orders)
- **OrderItems**: line items with vendor attribution
- **Payments**: transaction records
- **Reviews**: product and vendor ratings

## Modules

### Customer Module
- Authentication & profile management
- Product browsing, search, filters
- Cart and wishlist management
- Checkout and order tracking
- Reviews and ratings

### Vendor Module
- Store setup and management
- Product CRUD operations
- Order processing and shipping
- Sales analytics dashboard
- Earnings and payouts

### Admin Module
- User and vendor management
- Product moderation
- Commission configuration
- Platform analytics
- Dispute resolution

## Learning Outcomes

1. **Complex Data Relationships**: Many-to-many associations, polymorphic data, order splitting
2. **Transaction Management**: ACID properties, inventory locking, rollback mechanisms
3. **Role-Based Access Control**: Three distinct user types with granular permissions
4. **Scalability Concepts**: Database indexing, caching, queue systems
5. **Business Logic**: Commission calculations, split payments, inventory management

## Getting Started

1. Install dependencies: `npm install`
2. Initialize database: `npm run db:init`
3. Seed data: `npm run db:seed`
4. Start server: `npm start`
5. Open frontend: Open `frontend/index.html` in browser

## API Documentation

See `docs/API.md` for complete endpoint documentation.

