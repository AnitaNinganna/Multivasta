import { useEffect, useMemo, useState } from 'react';
import { fetchProducts, checkHealth } from './api';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';

function App() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [health, setHealth] = useState('Waiting for backend...');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState('All');

  useEffect(() => {
    loadProducts();
    refreshHealth();
  }, []);

  const clearMessage = () => setTimeout(() => setError(''), 4000);

  const loadProducts = async (searchTerm = '') => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchProducts(searchTerm);
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Unable to load products');
      clearMessage();
    } finally {
      setLoading(false);
    }
  };

  const refreshHealth = async () => {
    try {
      const data = await checkHealth();
      setHealth(data.status === 'OK' ? 'Backend healthy' : 'Backend returned error');
    } catch {
      setHealth('Backend unavailable');
    }
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

  const handleSearch = () => {
    loadProducts(query.trim());
    setSelectedCategory('All');
    setSelectedVendor('All');
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedVendor('All');
  };

  const activeFilters = [selectedCategory, selectedVendor].filter((item) => item && item !== 'All');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Multi-vendor marketplace</p>
          <h1>MultiVasta storefront</h1>
          <p className="subtitle">A polished React storefront with live product browsing and backend integration.</p>
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
          <h2>Find the best marketplace listings quickly</h2>
          <p>Search by product name, description, vendor, or category, then explore details in a professional modal view.</p>
        </div>
        <div className="hero-card hero-actions">
          <div>
            <p className="hero-label">Search</p>
            <div className="search-bar">
              <input
                type="search"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              />
              <button type="button" className="button button-primary" onClick={handleSearch}>
                Search
              </button>
            </div>
          </div>
          <div className="summary-card">
            <p>Use filters to refine the product list and explore vendor offerings efficiently.</p>
            <div className="summary-metrics">
              <span>{filteredProducts.length}</span>
              <small>matching products</small>
            </div>
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
          <button type="button" className="button button-secondary" onClick={clearFilters} disabled={activeFilters.length === 0}>
            Clear filters
          </button>
        </div>

        {error && <div className="message message-error">{error}</div>}
        {loading && <div className="message message-loading">Loading products…</div>}
        {!loading && !filteredProducts.length && <div className="message">No products match the selected filters.</div>}

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} onView={setSelectedProduct} />
          ))}
        </div>
      </main>

      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}

export default App;
