import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';

export default function Navbar({ onOpenMiniCart, onOpenAdvancedSearch }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');

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

  const formattedTotal = useMemo(() => totalItems.toString(), [totalItems]);

  return (
    <header className="site-header">
      <div className="site-brand">
        <span className="site-logo">MultiVasta</span>
        <p className="site-tagline">Premium multivendor commerce for buyers and sellers.</p>
      </div>

      <form className="site-search" onSubmit={handleSearchSubmit}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search premium products, sellers, categories..."
          aria-label="Search products"
        />
        <button type="submit" className="button button-primary">Search</button>
        <button 
          type="button" 
          className="button button-secondary advanced-search-btn"
          onClick={(e) => {
            e.preventDefault();
            onOpenAdvancedSearch?.();
          }}
          title="Advanced search with filters"
        >
          <Settings size={18} />
        </button>
      </form>

      <div className="site-actions">
        <nav className="site-nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/about">About</NavLink>
          {!user && <NavLink to="/login">Login</NavLink>}
          {user && user.role === 'vendor' && <NavLink to="/vendor-dashboard">Dashboard</NavLink>}
          {user && <NavLink to="/orders">Orders</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
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
          <motion.button
            type="button"
            className="cart-button"
            onClick={onOpenMiniCart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={false}
          >
            <span className="cart-icon">🛒</span>
            {totalItems > 0 && (
              <motion.span
                className="cart-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {formattedTotal}
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
}
