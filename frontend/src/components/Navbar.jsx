import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';

const freeShippingThreshold = 120;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, cartItems, clearCart, recentViews, addToCart } = useCart();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (location.pathname.startsWith('/products')) {
      const params = new URLSearchParams(location.search);
      setSearch(params.get('search') || '');
    } else {
      setSearch('');
    }
  }, [location]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    navigate(`/products${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  };

  const vendorGroups = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const name = item.vendorId?.storeName || item.vendorId || 'Unknown seller';
      const total = (acc[name]?.total || 0) + item.price * item.quantity;
      acc[name] = { name, total };
      return acc;
    }, {});
  }, [cartItems]);

  const shippingAlerts = useMemo(() => {
    return Object.values(vendorGroups)
      .map((vendor) => {
        const remaining = freeShippingThreshold - vendor.total;
        return remaining > 0
          ? {
              vendor: vendor.name,
              remaining: Number(remaining.toFixed(2)),
              progress: Math.min((vendor.total / freeShippingThreshold) * 100, 100),
              total: vendor.total,
            }
          : null;
      })
      .filter(Boolean);
  }, [vendorGroups]);

  const suggestions = recentViews.length
    ? recentViews
    : [
        { _id: 'trending-1', name: 'Smart Travel Speaker', price: 29.99 },
        { _id: 'trending-2', name: 'Minimalist Watch Band', price: 14.99 },
        { _id: 'trending-3', name: 'Eco Kitchen Set', price: 49.99 },
      ];

  const formattedTotal = useMemo(() => totalItems.toString(), [totalItems]);

  return (
    <>
      <header className="site-header">
        <div className="site-brand">
          <span className="site-logo">MultiVasta</span>
          <p className="site-tagline">The modern multivendor marketplace experience.</p>
        </div>

        <form className="site-search" onSubmit={handleSearchSubmit}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products, sellers, categories..."
            aria-label="Search products"
          />
          <button type="submit" className="button button-primary">Search</button>
        </form>

        <div className="site-actions">
          <nav className="site-nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/about">About</NavLink>
            {!user && <NavLink to="/login">Login</NavLink>}
          </nav>
          <div className="account-actions">
            {user ? (
              <>
                <span className="user-pill">Hi, {user.name || user.email}</span>
                <button type="button" className="secondary-button" onClick={logout}>
                  Logout
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="cart-button"
              onClick={() => setDrawerOpen((current) => !current)}
            >
              <span className="cart-icon">🛒</span>
              <span>{formattedTotal}</span>
            </button>
          </div>
        </div>
      </header>

      <aside className={`cart-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <div>
            <strong>Shopping Cart</strong>
            <p>{totalItems ? `${totalItems} item(s)` : 'Your cart is empty'}</p>
          </div>
          <button type="button" className="button button-secondary" onClick={() => setDrawerOpen(false)}>
            Close
          </button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div>
              <p className="cart-empty">Your cart is empty — try these trending picks.</p>
              <div className="cart-suggestion-grid">
                {suggestions.map((suggestion) => (
                  <div key={suggestion._id} className="cart-suggestion-card">
                    <div>
                      <strong>{suggestion.name}</strong>
                      <p>${suggestion.price?.toFixed(2)}</p>
                    </div>
                    <button
                      type="button"
                      className="button button-primary button-small"
                      onClick={() => addToCart(suggestion)}
                    >
                      Quick add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {cartItems.map((item) => (
                <div key={item._id} className="cart-item">
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}

              {shippingAlerts.length > 0 && (
                <div className="shipping-alerts">
                  {shippingAlerts.map((alert) => (
                    <div key={alert.vendor} className="shipping-progress-card">
                      <p>
                        Add <strong>${alert.remaining}</strong> more from <strong>{alert.vendor}</strong> for free shipping.
                      </p>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${alert.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <button type="button" className="button button-secondary" onClick={clearCart}>
              Clear cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
