import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import '../styles/Cart.css';

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const initialQuantities = {};
    cartItems.forEach(item => {
      initialQuantities[item._id] = item.quantity || 1;
    });
    setQuantities(initialQuantities);
  }, [cartItems]);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setQuantities(prev => ({
      ...prev,
      [productId]: newQuantity
    }));
  };

  const handleRemove = (productId) => {
    removeFromCart(productId);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * (quantities[item._id] || 1)), 0);
  const tax = subtotal * 0.1; // 10% tax
  const shipping = cartItems.length > 0 ? 5 : 0; // Flat shipping
  const total = subtotal + tax + shipping;

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="app-shell">
        <div className="cart-empty">
          <h1>Your cart is empty</h1>
          <p>Start adding products to your cart to get started!</p>
          <Link to="/products" className="button button-primary">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="cart-container">
        <h1>Shopping cart</h1>

        <div className="cart-layout">
          <div className="cart-items-section">
            <div className="cart-items-header">
              <span>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart</span>
              <button
                type="button"
                className="button button-secondary"
                onClick={clearCart}
              >
                Clear cart
              </button>
            </div>

            <div className="cart-items-list">
              {cartItems.map(item => (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-image">
                    {item.images?.length ? (
                      <img src={item.images[0]} alt={item.name} />
                    ) : (
                      <span className="no-image">No image</span>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <div>
                      <h3>{item.name}</h3>
                      <p className="cart-item-vendor">
                        {item.vendorId?.storeName || 'Unknown vendor'}
                      </p>
                      <p className="cart-item-category">
                        {item.categoryId?.name || 'Uncategorized'}
                      </p>
                    </div>

                    <div className="cart-item-quantity">
                      <label htmlFor={`qty-${item._id}`}>Qty:</label>
                      <div className="quantity-selector">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item._id, quantities[item._id] - 1)}
                          disabled={quantities[item._id] <= 1}
                        >
                          −
                        </button>
                        <input
                          id={`qty-${item._id}`}
                          type="number"
                          min="1"
                          value={quantities[item._id] || 1}
                          onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value) || 1)}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item._id, quantities[item._id] + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="cart-item-price">
                    <div className="price-detail">
                      <span className="unit-price">${item.price.toFixed(2)}</span>
                      <span className="item-total">
                        ${(item.price * (quantities[item._id] || 1)).toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="button button-small button-danger"
                      onClick={() => handleRemove(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-summary-section">
            <div className="cart-summary-card">
              <h2>Order summary</h2>

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

              <button
                type="button"
                className="button button-primary button-full"
                onClick={handleCheckout}
              >
                {user ? 'Proceed to checkout' : 'Login to checkout'}
              </button>

              <Link to="/products" className="button button-secondary button-full">
                Continue shopping
              </Link>

              <div className="cart-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">✓</span>
                  <span>Secure checkout</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">✓</span>
                  <span>Real-time order tracking</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">✓</span>
                  <span>Multiple payment options</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
