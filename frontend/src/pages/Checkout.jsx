import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { useNotification } from '../hooks/useNotification';
import '../styles/Checkout.css';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const STEPS = [
  { id: 1, title: 'Shipping', description: 'Delivery address' },
  { id: 2, title: 'Payment', description: 'Payment method' },
  { id: 3, title: 'Review', description: 'Order summary' },
];

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { success, error: errorNotif, loading: loadingNotif, update, dismiss } = useNotification();

  const [currentStep, setCurrentStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingError, setShippingError] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mock');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
    }
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [user, token, cartItems, navigate]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const tax = subtotal * 0.1;
  const shipping = 5;
  const total = subtotal + tax + shipping;

  // Validation functions
  const validateShipping = () => {
    setShippingError('');
    if (!shippingAddress.trim()) {
      setShippingError('Shipping address is required');
      return false;
    }
    if (shippingAddress.trim().length < 10) {
      setShippingError('Please enter a complete address');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateShipping()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateShipping()) {
      setCurrentStep(1);
      return;
    }

    setLoading(true);
    setOrderError('');

    const toastId = loadingNotif('Processing your order...');

    try {
      // Prepare order data
      const orderData = {
        products: cartItems.map(item => ({
          productId: item._id,
          quantity: item.quantity || 1,
          unitPrice: item.price,
          totalPrice: (item.quantity || 1) * item.price
        })),
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentMethod,
        notes
      };

      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create order');
      }

      update(toastId, {
        render: '✓ Order placed successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });

      setOrderSuccess(true);
      clearCart();
      setTimeout(() => {
        navigate(`/orders/${data.orderId || data.order?._id}`);
      }, 1500);
    } catch (err) {
      const message = err.message || 'Failed to process order';
      setOrderError(message);
      update(toastId, {
        render: `✗ ${message}`,
        type: 'error',
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="app-shell">
        <motion.div
          className="checkout-success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="success-icon"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            ✓
          </motion.div>
          <h1>Order placed successfully!</h1>
          <p>Redirecting to your order details...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="checkout-container">
        <h1>Secure Checkout</h1>

        {/* Progress Stepper */}
        <div className="checkout-stepper">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.id}
              className="stepper-item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className={`step-circle ${
                  currentStep === step.id
                    ? 'active'
                    : currentStep > step.id
                    ? 'completed'
                    : 'inactive'
                }`}
                whileHover={currentStep >= step.id ? { scale: 1.1 } : {}}
              >
                {currentStep > step.id ? (
                  <span className="step-icon">✓</span>
                ) : (
                  <span className="step-number">{step.id}</span>
                )}
              </motion.div>
              <div className="step-label">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
              {index < STEPS.length - 1 && <div className="stepper-line" />}
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="checkout-layout">
          <motion.form
            className="checkout-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            key={currentStep}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Shipping */}
            {currentStep === 1 && (
              <motion.section
                className="checkout-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2>Shipping Address</h2>
                <div className="form-group">
                  <label>Full Address *</label>
                  <textarea
                    placeholder="e.g., 123 Main St, Apt 4B, New York, NY 10001"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows="4"
                    className={shippingError ? 'error' : ''}
                  />
                  {shippingError && (
                    <span className="error-message">{shippingError}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={billingAddress === ''}
                      onChange={(e) =>
                        setBillingAddress(
                          e.target.checked ? '' : shippingAddress
                        )
                      }
                    />
                    Use same address for billing
                  </label>
                </div>
              </motion.section>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <motion.section
                className="checkout-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2>Payment Method</h2>
                <div className="payment-methods">
                  <motion.label
                    className={`payment-option ${
                      paymentMethod === 'mock' ? 'selected' : ''
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <input
                      type="radio"
                      value="mock"
                      checked={paymentMethod === 'mock'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <h4>Demo Payment</h4>
                      <p>For testing purposes</p>
                    </div>
                  </motion.label>

                  <motion.label
                    className={`payment-option ${
                      paymentMethod === 'credit-card' ? 'selected' : ''
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <input
                      type="radio"
                      value="credit-card"
                      checked={paymentMethod === 'credit-card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <h4>Credit Card</h4>
                      <p>Visa, Mastercard, Amex</p>
                    </div>
                  </motion.label>
                </div>

                <div className="form-group">
                  <label>Order Notes</label>
                  <textarea
                    placeholder="Add any special instructions for your order..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                  />
                </div>
              </motion.section>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <motion.section
                className="checkout-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2>Review Your Order</h2>

                <div className="review-section">
                  <h3>Shipping Address</h3>
                  <p>{shippingAddress}</p>
                </div>

                <div className="review-section">
                  <h3>Billing Address</h3>
                  <p>{billingAddress || shippingAddress}</p>
                </div>

                <div className="review-section">
                  <h3>Payment Method</h3>
                  <p>
                    {paymentMethod === 'mock'
                      ? 'Demo Payment'
                      : 'Credit Card'}
                  </p>
                </div>

                {notes && (
                  <div className="review-section">
                    <h3>Special Instructions</h3>
                    <p>{notes}</p>
                  </div>
                )}
              </motion.section>
            )}

            {orderError && (
              <motion.div
                className="message message-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {orderError}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="checkout-actions">
              {currentStep > 1 && (
                <motion.button
                  type="button"
                  className="button button-secondary"
                  onClick={handlePrevStep}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ← Back
                </motion.button>
              )}

              {currentStep < 3 ? (
                <motion.button
                  type="button"
                  className="button button-primary"
                  onClick={handleNextStep}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Next →
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  className="button button-primary"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </motion.button>
              )}
            </div>
          </motion.form>

          {/* Summary Sidebar */}
          <motion.div
            className="checkout-summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="summary-card">
              <h2>Order Summary</h2>

              <div className="order-items">
                {cartItems.map((item) => (
                  <motion.div
                    key={item._id}
                    className="summary-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="item-details">
                      <img
                        src={item.images?.[0] || 'https://via.placeholder.com/40'}
                        alt={item.name}
                      />
                      <div>
                        <p className="item-name">{item.name}</p>
                        <small>{item.vendorId?.storeName}</small>
                      </div>
                    </div>
                    <div className="item-price">
                      <p>{item.quantity || 1}x</p>
                      <p className="price">
                        ${(item.price * (item.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="summary-row summary-total">
                  <span>Total</span>
                  <strong>${total.toFixed(2)}</strong>
                </div>
              </div>

              <div className="summary-info">
                <p>
                  <strong>Step {currentStep} of {STEPS.length}</strong>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
