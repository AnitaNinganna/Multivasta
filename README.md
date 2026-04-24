# Multi-Vendor E-commerce Platform

A full-stack e-commerce platform supporting multiple sellers with customer, vendor, and admin modules.

## Architecture Overview

This platform follows a **three-sided marketplace model**:
- **Admin**: Platform owner managing infrastructure, commissions, policies
- **Vendors**: Independent sellers managing inventory, orders, and fulfillment
- **Customers**: Buyers browsing and purchasing from multiple vendors

## Key Features

### Product Listing by Vendors
- Independent product catalogs per vendor
- Admin moderation workflow
- Category management with attributes
- Image uploads and variant support (size, color)

### Cart and Checkout System
- Unified cart across multiple vendors
- Split-cart logic tracking vendor attribution
- Single checkout generating multiple sub-orders
- Location-based shipping and tax calculations

### Order Management
- Customer: Unified order history
- Vendor: Vendor-specific fulfillment orders
- Admin: Complete marketplace oversight
- Order lifecycle: Pending → Confirmed → Shipped → Delivered

### Payment Integration
- Mock payment gateway for development
- Commission deduction model
- Transaction audit trails
- Refund handling

### Vendor Dashboards
- Sales analytics and revenue tracking
- Inventory management with alerts
- Order fulfillment workflow
- Payout management

## Project Structure

```
multivasta/
├── backend/               # Node.js/Express API
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

