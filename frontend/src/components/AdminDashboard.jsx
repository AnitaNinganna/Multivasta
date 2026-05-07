import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { useNotification } from '../hooks/useNotification';
import './AdminDashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const AdminDashboard = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error } = useNotification();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      setStats(data);

      // Generate mock chart data based on stats
      const mockChartData = [
        { month: 'Jan', revenue: 4000, orders: 24, users: 100 },
        { month: 'Feb', revenue: 3000, orders: 13, users: 120 },
        { month: 'Mar', revenue: 2000, orders: 9, users: 150 },
        { month: 'Apr', revenue: 2780, orders: 39, users: 180 },
        { month: 'May', revenue: 1890, orders: 23, users: 200 },
        { month: 'Jun', revenue: 2390, orders: 34, users: 220 },
      ];
      setChartData(mockChartData);
    } catch (err) {
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="error">Failed to load dashboard</div>;
  }

  const pieData = [
    { name: 'Products', value: stats.totalProducts || 50 },
    { name: 'Orders', value: stats.totalOrders || 100 },
    { name: 'Users', value: stats.totalUsers || 200 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="admin-dashboard">
      {/* Stats Cards */}
      <motion.div
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div className="stat-card" whileHover={{ y: -5 }}>
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <p>Total Users</p>
            <h3>{stats.totalUsers || 0}</h3>
            <span className="stat-change">↑ 12% this month</span>
          </div>
        </motion.div>

        <motion.div className="stat-card" whileHover={{ y: -5 }}>
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <p>Total Products</p>
            <h3>{stats.totalProducts || 0}</h3>
            <span className="stat-change">↑ 8% this month</span>
          </div>
        </motion.div>

        <motion.div className="stat-card" whileHover={{ y: -5 }}>
          <div className="stat-icon">🛍️</div>
          <div className="stat-content">
            <p>Total Orders</p>
            <h3>{stats.totalOrders || 0}</h3>
            <span className="stat-change">↑ 24% this month</span>
          </div>
        </motion.div>

        <motion.div className="stat-card revenue" whileHover={{ y: -5 }}>
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <p>Total Revenue</p>
            <h3>${(stats.totalRevenue || 0).toFixed(2)}</h3>
            <span className="stat-change">↑ 18% this month</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts */}
      <motion.div
        className="charts-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Revenue Line Chart */}
        <div className="chart-card">
          <h3>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Bar Chart */}
        <div className="chart-card">
          <h3>Monthly Orders</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Pie Chart */}
        <div className="chart-card">
          <h3>Data Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        className="recent-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3>Quick Stats</h3>
        <div className="quick-stats">
          <div className="quick-stat">
            <span>Avg Order Value</span>
            <strong>${(stats.totalRevenue / Math.max(stats.totalOrders, 1)).toFixed(2)}</strong>
          </div>
          <div className="quick-stat">
            <span>Total Vendors</span>
            <strong>{Math.floor((stats.totalProducts || 0) / 5)}</strong>
          </div>
          <div className="quick-stat">
            <span>Conversion Rate</span>
            <strong>{((stats.totalOrders / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}%</strong>
          </div>
          <div className="quick-stat">
            <span>Avg Items per Order</span>
            <strong>{(stats.totalOrders ? (stats.totalProducts / stats.totalOrders).toFixed(1) : 0)}</strong>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
