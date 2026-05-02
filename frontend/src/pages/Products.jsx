import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchProducts, fetchProductDetails, checkHealth } from '../api';
import { useCart } from '../CartContext';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [error, setError] = useState('');
  const [health, setHealth] = useState('Waiting for backend...');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState('All');
  const [searchParams, setSearchParams] = useSearchParams();

  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, addRecentView } = useCart();

  useEffect(() => {
    const initialSearch = searchParams.get('search') || '';
    setQuery(initialSearch);
    loadProducts(initialSearch);
    refreshHealth();
  }, []);

  useEffect(() => {
    if (productId) {
      loadProductDetail(productId);
    } else {
      setSelectedProduct(null);
    }
  }, [productId]);

  const clearMessage = () => setTimeout(() => setError(''), 4000);

  const loadProducts = async (searchTerm = '') => {
    setLoading(true);
    setError('');

    try {
      const products = await fetchProducts(searchTerm);
      setProducts(products);
    } catch (err) {
      setError(err.message || 'Unable to load products');
      clearMessage();
    } finally {
      setLoading(false);
    }
  };

  const loadProductDetail = async (id) => {
    setProductLoading(true);
    setError('');

    try {
      const product = await fetchProductDetails(id);
      setSelectedProduct(product);
    } catch (err) {
      setError(err.message || 'Unable to load product details');
      setSelectedProduct(null);
      clearMessage();
    } finally {
      setProductLoading(false);
    }
  };

  const handleRefresh = async () => {
    setQuery('');
    setSelectedCategory('All');
    setSelectedVendor('All');
    setSearchParams({});
    await loadProducts();
  };

  const handleSearch = () => {
    setSelectedCategory('All');
    setSelectedVendor('All');
    setSearchParams(query ? { search: query } : {});
    loadProducts(query.trim());
  };

  const handleViewProduct = (productToOpen) => {
    addRecentView(productToOpen);
    navigate(`/products/${productToOpen._id}`);
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
    navigate('/products');
  };

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.categoryId?.name)
      .filter(Boolean);
    return ['All', ...Array.from(new Set(values))];
  }, [products]);

  const vendors = useMemo(() => {
    const values = products
      .map((product) => product.vendorId?.storeName)
      .filter(Boolean);
    return ['All', ...Array.from(new Set(values))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.categoryId?.name === selectedCategory;
      const matchesVendor =
        selectedVendor === 'All' || product.vendorId?.storeName === selectedVendor;
      return matchesCategory && matchesVendor;
    });
  }, [products, selectedCategory, selectedVendor]);

  const activeFilters = [selectedCategory, selectedVendor].filter((item) => item && item !== 'All');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Marketplace</p>
          <h1>Browse all products</h1>
          <p className="subtitle">Search, filter, and explore high-converting listings without distraction.</p>
        </div>

        <div className="status-card">
          <span className="status-chip">API: {health}</span>
          <div className="icon-stats">
            <div>
              <strong>{products.length}</strong>
              <p>Products loaded</p>
            </div>
            <div>
              <strong>{vendors.length - 1}</strong>
              <p>Vendors</p>
            </div>
          </div>
          <button type="button" className="button" onClick={refreshHealth}>
            Refresh status
          </button>
        </div>
      </header>

      <section className="hero-grid">
        <div className="hero-card hero-welcome">
          <h2>Fast product discovery</h2>
          <p>Use the global search and interactive filters to find the best vendor offers quickly. Real-time product details keep the experience smooth.</p>
        </div>
        <div className="hero-card hero-actions">
          <div>
            <p className="hero-label">Search</p>
            <div className="search-bar">
              <input
                type="search"
                placeholder="Search products, vendors, or categories"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              />
              <button type="button" className="button button-primary" onClick={handleSearch}>
                Search
              </button>
            </div>
          </div>
          <div className="summary-card">
            <p>Instantly compare sellers, browse vendor badges, and keep checkout simple with a persistent cart.</p>
            <div className="summary-metrics">
              <span>{filteredProducts.length}</span>
              <small>matching products</small>
            </div>
            <button type="button" className="button button-secondary" onClick={handleRefresh}>
              Reload products
            </button>
          </div>
        </div>
      </section>

      <section className="filter-toolbar">
        <div className="filter-group">
          <strong>Category</strong>
          <div className="filter-chips">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`filter-chip ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <strong>Vendor</strong>
          <div className="filter-chips">
            {vendors.map((vendor) => (
              <button
                key={vendor}
                type="button"
                className={`filter-chip ${selectedVendor === vendor ? 'active' : ''}`}
                onClick={() => setSelectedVendor(vendor)}
              >
                {vendor}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main>
        <div className="section-header">
          <div>
            <p className="section-title">Product showcase</p>
            <p className="section-subtitle">
              {activeFilters.length
                ? `Filtered by ${activeFilters.join(' / ')}`
                : 'Showing all available products.'}
            </p>
          </div>
          <button type="button" className="button button-secondary" onClick={() => {
            setSelectedCategory('All');
            setSelectedVendor('All');
          }} disabled={activeFilters.length === 0}>
            Clear filters
          </button>
        </div>

        {error && <div className="message message-error">{error}</div>}
        {loading && <div className="message message-loading">Loading products…</div>}
        {!loading && filteredProducts.length === 0 && <div className="message">No products match the selected filters.</div>}

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onView={handleViewProduct}
              onQuickAdd={(productToAdd) => addToCart(productToAdd)}
            />
          ))}
        </div>
      </main>

      {productLoading && <div className="message message-loading">Loading product details…</div>}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={handleCloseProduct} onAddToCart={() => addToCart(selectedProduct)} />}
    </div>
  );
}
