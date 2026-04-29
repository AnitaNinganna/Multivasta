# Day 2: Requirement Analysis, Database Design, and Project Synopsis

## 1. Project Overview
Multi-Vasta is a multi-vendor e-commerce platform that connects customers, vendors, and administrators in a single marketplace.

Key goals:
- Enable customers to browse and purchase products from multiple vendors
- Allow vendors to manage their own product catalogs and view orders
- Give admins centralized control over users, vendors, and order monitoring

## 2. Modules and User Roles

### Customer Module
- Register and login
- Browse and search products
- Add products to cart
- Checkout and place orders
- View order history and order status

### Vendor Module
- Register and login
- Create, edit, and delete products
- View orders for their products
- Manage vendor profile and store details

### Admin Module
- Manage users and vendors
- Approve or reject vendor stores
- Monitor all orders and system activity
- Approve vendor products

## 3. Core Features
- Multi-vendor product listing
- Cart and checkout system
- Order placement and tracking
- Vendor dashboard with product management
- Admin control panel for user and vendor oversight
- Role-based authentication and authorization

## 4. Database Design (MongoDB)

### Collections and Schemas

#### User Collection
Stores customer, vendor, and admin accounts.

```json
{
  "name": "String",
  "email": "String",
  "password": "String",
  "role": "customer | vendor | admin",
  "phone": "String",
  "address": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Vendor Collection
Stores vendor-specific details linked to a User.

```json
{
  "userId": "ObjectId",
  "storeName": "String",
  "storeDescription": "String",
  "commissionRate": "Number",
  "isApproved": "Boolean",
  "isActive": "Boolean",
  "bankAccount": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Product Collection
Stores products offered by vendors.

```json
{
  "name": "String",
  "description": "String",
  "price": "Number",
  "vendorId": "ObjectId",
  "category": "String",
  "images": ["String"],
  "attributes": "Mixed",
  "isActive": "Boolean",
  "isApproved": "Boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Order Collection
Stores customer orders and item details.

```json
{
  "userId": "ObjectId",
  "products": [
    {
      "productId": "ObjectId",
      "vendorId": "ObjectId",
      "name": "String",
      "quantity": "Number",
      "unitPrice": "Number",
      "totalPrice": "Number"
    }
  ],
  "totalAmount": "Number",
  "shippingAmount": "Number",
  "taxAmount": "Number",
  "status": "pending | completed | shipped | delivered | cancelled",
  "paymentStatus": "pending | paid | failed | refunded",
  "shippingAddress": "String",
  "billingAddress": "String",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Cart Collection
Stores the current cart for each customer.

```json
{
  "userId": "ObjectId",
  "items": [
    {
      "productId": "ObjectId",
      "quantity": "Number",
      "unitPrice": "Number"
    }
  ],
  "updatedAt": "Date"
}
```

## 5. Relationships
- User → Vendor: one-to-one for vendor profile details
- Vendor → Product: one-to-many
- User (customer) → Order: one-to-many
- Order → Products: one-to-many embedded line items
- Customer → Cart: one-to-one

## 6. Implementation Notes
- The platform is built with Node.js and Express.
- Authentication uses JWT for role-based access control.
- MongoDB is the target database for production, supporting flexible vendor and order models.
- The current backend code also includes SQLite-based prototypes, but the Day 2 design focuses on MongoDB schema migration.

## 7. Next Steps
1. Integrate `server/config/mongo.js` into `server.js`.
2. Replace SQLite routes with Mongoose models and controllers.
3. Build vendor dashboard views and admin management APIs.
4. Seed MongoDB with vendor, product, and order sample data.

---

Prepared for Day 2: Requirement Analysis, Database Design, and Project Synopsis.
