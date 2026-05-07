import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../styles/Orders.css';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function OrdersPage() {
  const { orderId } = useParams();
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    loadOrders();
  }, [user, token]);

  useEffect(() => {
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o._id === orderId);
      if (order) {
        setSelectedOrder(order);
      }
    }
  }, [orderId, orders]);

  const loadOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load orders');
      }

      setOrders(data.orders || []);

      if (orderId && data.orders) {
        const order = data.orders.find(o => o._id === orderId);
        if (order) {
          setSelectedOrder(order);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    return `status-badge status-${status || 'pending'}`;
  };

  if (!user) {
    return (
      <div className="app-shell">
        <div className="orders-empty">
          <h1>Please log in</h1>
          <p>You need to be logged in to view your orders.</p>
          <Link to="/login" className="button button-primary">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-shell">
        <div className="message message-loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="orders-container">
        <h1>Your orders</h1>

        <div className="orders-layout">
          <div className="orders-list-section">
            {error && <div className="message message-error">{error}</div>}

            {orders.length === 0 ? (
              <div className="orders-empty-message">
                <p>No orders yet</p>
                <Link to="/products" className="button button-primary">
                  Start shopping
                </Link>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div
                    key={order._id}
                    className={`order-card ${selectedOrder?._id === order._id ? 'active' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="order-card-header">
                      <div>
                        <p className="order-number">Order #{order.orderNumber}</p>
                        <p className="order-date">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={getStatusBadgeClass(order.status)}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-card-body">
                      <p>{order.products?.length || 0} item{order.products?.length !== 1 ? 's' : ''}</p>
                      <p className="order-total">${order.totalAmount?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedOrder && (
            <div className="order-detail-section">
              <div className="order-detail-card">
                <h2>Order details</h2>

                <div className="order-detail-header">
                  <div>
                    <p className="detail-label">Order number</p>
                    <p className="detail-value">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p className="detail-label">Status</p>
                    <span className={getStatusBadgeClass(selectedOrder.status)}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="detail-label">Payment</p>
                    <span className={`status-badge status-${selectedOrder.paymentStatus}`}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="order-detail-items">
                  <h3>Items</h3>
                  {selectedOrder.products?.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <div>
                        <p>{item.name}</p>
                        <small>Quantity: {item.quantity}</small>
                      </div>
                      <div>
                        <p>${item.unitPrice?.toFixed(2)}</p>
                        <small>${item.totalPrice?.toFixed(2)}</small>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-detail-totals">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <span>${(selectedOrder.totalAmount - (selectedOrder.shippingAmount || 0) - (selectedOrder.taxAmount || 0)).toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>Tax</span>
                    <span>${(selectedOrder.taxAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>Shipping</span>
                    <span>${(selectedOrder.shippingAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row total">
                    <span>Total</span>
                    <strong>${selectedOrder.totalAmount?.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="order-detail-shipping">
                  <h3>Shipping address</h3>
                  <p>{selectedOrder.shippingAddress}</p>
                </div>

                {selectedOrder.notes && (
                  <div className="order-detail-notes">
                    <h3>Order notes</h3>
                    <p>{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="order-detail-actions">
                  <p className="detail-label">Order placed</p>
                  <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
