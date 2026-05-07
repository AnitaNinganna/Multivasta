import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useNotification } from '../hooks/useNotification';
import './MiniCart.css';

const MiniCart = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const { success } = useNotification();

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const shipping = cartItems.length > 0 ? 5 : 0;
  const total = subtotal + tax + shipping;

  const handleRemove = (productId) => {
    removeFromCart(productId);
    success('✓ Item removed from cart');
  };

  const handleQuantityChange = (productId, quantity) => {
    if (quantity > 0) {
      updateQuantity(productId, quantity);
    }
  };

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          className="mini-cart-backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Drawer */}
      <motion.div
        className={`mini-cart ${isOpen ? 'open' : ''}`}
        initial={{ x: 400 }}
        animate={{ x: isOpen ? 0 : 400 }}
        exit={{ x: 400 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="mini-cart-header">
          <h2>Shopping Cart</h2>
          <motion.button
            className="mini-cart-close"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        </div>

        {/* Items */}
        <div className="mini-cart-items">
          {cartItems.length === 0 ? (
            <div className="mini-cart-empty">
              <div className="empty-icon">🛒</div>
              <p>Your cart is empty</p>
              <motion.button
                className="button button-primary"
                onClick={() => {
                  onClose();
                  navigate('/products');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue Shopping
              </motion.button>
            </div>
          ) : (
            cartItems.map((item) => (
              <motion.div
                key={item._id}
                className="mini-cart-item"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Product Image */}
                <div className="mini-cart-item-image">
                  <img
                    src={item.images?.[0] || 'https://via.placeholder.com/60'}
                    alt={item.name}
                  />
                </div>

                {/* Product Info */}
                <div className="mini-cart-item-info">
                  <h4>{item.name}</h4>
                  <p className="price">${item.price.toFixed(2)}</p>
                </div>

                {/* Quantity Selector */}
                <div className="mini-cart-quantity">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                  >
                    −
                  </motion.button>
                  <span>{item.quantity}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                  >
                    +
                  </motion.button>
                </div>

                {/* Total */}
                <div className="mini-cart-item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>

                {/* Remove */}
                <motion.button
                  className="mini-cart-item-remove"
                  onClick={() => handleRemove(item._id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  🗑️
                </motion.button>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="mini-cart-footer">
            {/* Totals */}
            <div className="mini-cart-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Tax (10%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Shipping:</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="total-row total">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="mini-cart-actions">
              <motion.button
                className="button button-secondary"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue Shopping
              </motion.button>
              <motion.button
                className="button button-primary"
                onClick={handleCheckout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Checkout
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default MiniCart;
