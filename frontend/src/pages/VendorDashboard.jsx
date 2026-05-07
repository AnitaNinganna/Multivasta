import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNotification } from '../hooks/useNotification';
import { TrendingUp, Package, ShoppingCart, AlertTriangle, BarChart3, Users } from 'lucide-react';
import '../styles/Admin.css';

export default function VendorDashboard() {
  const { user, token } = useAuth();
  const { success, error: errorNotif } = useNotification();
  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'vendor') {
      return;
    }

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [dashRes, statsRes, alertsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE}/vendors/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_BASE}/vendors/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_BASE}/vendors/alerts/low-stock`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setDashboard(dashData);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          setAlerts(alertsData);
        }
      } catch (err) {
        errorNotif(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    const interval = setInterval(loadDashboard, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [user, token]);

  if (!user || user.role !== 'vendor') {
    return <div className="unauthorized">Access denied. Vendor role required.</div>;
  }

  if (loading) {
    return <div className="loading">Loading vendor dashboard...</div>;
  }

  return (
    <div className="vendor-dashboard">
      <div className="dashboard-header">
        <h1>Vendor Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome, {dashboard?.store?.storeName || user.vendorDetails?.storeName || user.name}
        </p>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="metrics-grid">
          <MetricCard
            icon={<ShoppingCart size={24} />}
            label="Total Orders"
            value={stats.sales.totalOrders}
            trend="+12%"
            color="blue"
          />
          <MetricCard
            icon={<TrendingUp size={24} />}
            label="Total Sales"
            value={`$${stats.sales.totalSales.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
            trend="+8%"
            color="green"
          />
          <MetricCard
            icon={<Users size={24} />}
            label="Items Sold"
            value={stats.sales.itemsSold}
            trend="+24%"
            color="purple"
          />
          <MetricCard
            icon={<BarChart3 size={24} />}
            label="Monthly Revenue"
            value={`$${stats.sales.monthlyRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
            trend="+5%"
            color="orange"
          />
        </div>
      )}

      <div className="dashboard-content">
        {/* Left Column */}
        <div className="dashboard-left">
          {/* Recent Orders */}
          {stats && (
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Recent Orders</h2>
                <span className="badge">{stats.sales.totalOrders}</span>
              </div>
              {stats.recentOrders && stats.recentOrders.length > 0 ? (
                <div className="orders-list">
                  {stats.recentOrders.map((order, idx) => (
                    <div key={idx} className="order-item">
                      <div className="order-info">
                        <div className="order-number">{order.orderNumber}</div>
                        <div className="order-customer">{order.customerName}</div>
                        <div className="order-date">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="order-status">
                        <span className={`status-badge ${order.status}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="order-amount">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No recent orders</div>
              )}
            </section>
          )}

          {/* Top Products */}
          {dashboard && (
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Top Selling Products</h2>
              </div>
              {dashboard.topProducts && dashboard.topProducts.length > 0 ? (
                <div className="products-list">
                  {dashboard.topProducts.map((product, idx) => (
                    <div key={idx} className="product-item">
                      <div className="product-rank">{idx + 1}</div>
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        <div className="product-meta">
                          <span>{product.sold} sold</span>
                          <span>★ {product.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No products yet</div>
              )}
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="dashboard-right">
          {/* Inventory Status */}
          {stats && (
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Inventory Status</h2>
              </div>
              <div className="inventory-stats">
                <div className="inventory-stat">
                  <span className="stat-label">Total Products</span>
                  <span className="stat-value">{stats.inventory.totalProducts}</span>
                </div>
                <div className="inventory-stat">
                  <span className="stat-label">Out of Stock</span>
                  <span className="stat-value error">{stats.inventory.outOfStock}</span>
                </div>
                <div className="inventory-stat">
                  <span className="stat-label">Low Stock</span>
                  <span className="stat-value warning">{stats.inventory.lowStockCount}</span>
                </div>
                <div className="inventory-stat">
                  <span className="stat-label">In Stock</span>
                  <span className="stat-value success">
                    {stats.inventory.totalProducts - stats.inventory.outOfStock}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Alerts */}
          {alerts && alerts.totalAlerts > 0 && (
            <section className="dashboard-section alerts-section">
              <div className="section-header">
                <h2>Alerts & Warnings</h2>
                <span className="alert-badge">{alerts.totalAlerts}</span>
              </div>
              
              {alerts.outOfStock.length > 0 && (
                <div className="alert-group">
                  <h3>
                    <AlertTriangle size={16} /> Out of Stock
                  </h3>
                  {alerts.outOfStock.slice(0, 3).map((product, idx) => (
                    <div key={idx} className="alert-item critical">
                      <div className="alert-title">{product.name}</div>
                      <div className="alert-sku">SKU: {product.sku}</div>
                    </div>
                  ))}
                  {alerts.outOfStock.length > 3 && (
                    <div className="alert-more">
                      +{alerts.outOfStock.length - 3} more
                    </div>
                  )}
                </div>
              )}

              {alerts.lowStock.length > 0 && (
                <div className="alert-group">
                  <h3>
                    <AlertTriangle size={16} /> Low Stock
                  </h3>
                  {alerts.lowStock.slice(0, 3).map((product, idx) => (
                    <div key={idx} className="alert-item warning">
                      <div className="alert-title">{product.name}</div>
                      <div className="alert-sku">Only {product.quantity} left</div>
                    </div>
                  ))}
                  {alerts.lowStock.length > 3 && (
                    <div className="alert-more">
                      +{alerts.lowStock.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Analytics Summary */}
          {stats && (
            <section className="dashboard-section">
              <div className="section-header">
                <h2>Commission & Earnings</h2>
              </div>
              <div className="earnings-summary">
                <div className="earning-item">
                  <span className="earning-label">Total Commission</span>
                  <span className="earning-value">
                    ${stats.sales.totalCommission.toFixed(2)}
                  </span>
                </div>
                <div className="earning-item">
                  <span className="earning-label">Your Earnings</span>
                  <span className="earning-value highlight">
                    ${stats.sales.totalEarnings.toFixed(2)}
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, trend, color }) {
  const colorClasses = {
    blue: 'metric-blue',
    green: 'metric-green',
    purple: 'metric-purple',
    orange: 'metric-orange'
  };

  return (
    <div className={`metric-card ${colorClasses[color]}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-trend">{trend} this month</div>
      </div>
    </div>
  );
}
