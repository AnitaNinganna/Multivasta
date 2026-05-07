import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState } from 'react';
import Navbar from './components/Navbar';
import MiniCart from './components/MiniCart';
import AdvancedSearch from './components/AdvancedSearch';
import HomePage from './pages/Home';
import ProductsPage from './pages/Products';
import AboutPage from './pages/About';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import CartPage from './pages/Cart';
import CheckoutPage from './pages/Checkout';
import OrdersPage from './pages/Orders';
import VendorPage from './pages/Vendor';
import VendorDashboard from './pages/VendorDashboard';
import AdminPage from './pages/Admin';
import { CartProvider } from './CartContext';
import { AuthProvider } from './AuthContext';

function App() {
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar 
            onOpenMiniCart={() => setMiniCartOpen(true)} 
            onOpenAdvancedSearch={() => setAdvancedSearchOpen(true)}
          />
          <MiniCart isOpen={miniCartOpen} onClose={() => setMiniCartOpen(false)} />
          <AdvancedSearch 
            isOpen={advancedSearchOpen} 
            onClose={() => setAdvancedSearchOpen(false)}
            onSearch={(filters) => {
              // Search will navigate automatically in Products page
            }}
          />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:productId" element={<ProductsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrdersPage />} />
            <Route path="/vendor" element={<VendorPage />} />
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
