import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import '../styles/Admin.css';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function AdminPage() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  // Form states for creating new items
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      return;
    }

    loadDashboardData();
  }, [user, tab, token]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load all data in parallel
      const [usersRes, productsRes, ordersRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/pending-products`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/orders`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }

      // Load all products (not just pending) for overview
      const allProductsRes = await fetch(`${API_BASE}/products?limit=1000`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (allProductsRes.ok) {
        const data = await allProductsRes.json();
        setProducts(data.products || []);
      }

      // Calculate stats
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      setStats({
        totalUsers: users.length,
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue
      });
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/products/${productId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadDashboardData();
      } else {
        setError('Failed to approve product');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadDashboardData();
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategory })
      });

      if (response.ok) {
        setNewCategory('');
        loadDashboardData();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create category');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="app-shell">
        <div className="admin-restricted">
          <h1>Access Denied</h1>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="admin-container">
        <h1>Admin Panel</h1>

        <div className="admin-tabs">
          <button
            className={`tab-button ${tab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`tab-button ${tab === 'users' ? 'active' : ''}`}
            onClick={() => setTab('users')}
          >
            Users
          </button>
          <button
            className={`tab-button ${tab === 'products' ? 'active' : ''}`}
            onClick={() => setTab('products')}
          >
            Products
          </button>
          <button
            className={`tab-button ${tab === 'orders' ? 'active' : ''}`}
            onClick={() => setTab('orders')}
          >
            Orders
          </button>
          <button
            className={`tab-button ${tab === 'categories' ? 'active' : ''}`}
            onClick={() => setTab('categories')}
          >
            Categories
          </button>
        </div>

        {error && <div className="message message-error">{error}</div>}
        {loading && <div className="message message-loading">Loading...</div>}

        {tab === 'dashboard' && (
          <div className="admin-dashboard">
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Total Users</p>
                <p className="stat-value">{stats.totalUsers}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Total Products</p>
                <p className="stat-value">{stats.totalProducts}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Total Orders</p>
                <p className="stat-value">{stats.totalOrders}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Total Revenue</p>
                <p className="stat-value">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="dashboard-section">
              <h2>Recent Orders</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => (
                    <tr key={order._id}>
                      <td>{order.orderNumber}</td>
                      <td>
                        <span className={`status-badge status-${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>${order.totalAmount?.toFixed(2)}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="admin-section">
            <h2>Manage Users</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(usr => (
                  <tr key={usr._id}>
                    <td>{usr.name}</td>
                    <td>{usr.email}</td>
                    <td>{usr.role || 'user'}</td>
                    <td>
                      <button
                        className="button button-small button-danger"
                        onClick={() => handleDeleteUser(usr._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'products' && (
          <div className="admin-section">
            <h2>Manage Products</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td>${product.price?.toFixed(2)}</td>
                    <td>{product.quantity}</td>
                    <td>
                      {!product.isApproved && (
                        <span className="status-badge status-pending">Pending</span>
                      )}
                      {product.isApproved && (
                        <span className="status-badge status-completed">Approved</span>
                      )}
                    </td>
                    <td>
                      {!product.isApproved && (
                        <button
                          className="button button-small button-primary"
                          onClick={() => handleApproveProduct(product._id)}
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'orders' && (
          <div className="admin-section">
            <h2>Manage Orders</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td>{order.orderNumber}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>${order.totalAmount?.toFixed(2)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'categories' && (
          <div className="admin-section">
            <h2>Manage Categories</h2>
            <form onSubmit={handleCreateCategory} className="form-inline">
              <input
                type="text"
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button type="submit" className="button button-primary">
                Add category
              </button>
            </form>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Products</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category._id}>
                    <td>{category.name}</td>
                    <td>
                      {products.filter(p => p.categoryId === category._id).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
