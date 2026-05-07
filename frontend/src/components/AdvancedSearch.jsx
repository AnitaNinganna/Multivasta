import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown } from 'lucide-react';
import '../styles/AdvancedSearch.css';

export default function AdvancedSearch({ onSearch, isOpen, onClose }) {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    vendor: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    sortBy: 'newest'
  });

  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // Load categories and vendors
    const loadData = async () => {
      try {
        const [categoriesRes, vendorsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE}/categories`),
          fetch(`${import.meta.env.VITE_API_BASE}/vendors`)
        ]);

        const categoriesData = await categoriesRes.json();
        const vendorsData = await vendorsRes.json();

        setCategories(categoriesData.categories || []);
        setVendors(vendorsData.vendors || []);
      } catch (err) {
        console.error('Error loading filter data:', err);
      }
    };

    loadData();
  }, []);

  const handleSearchChange = async (value) => {
    setFilters(prev => ({ ...prev, search: value }));

    if (value.length >= 2) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/products/search/suggestions?q=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    onSearch(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      search: '',
      category: '',
      vendor: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      sortBy: 'newest'
    });
  };

  const handleSuggestionClick = (suggestion) => {
    handleSearchChange(suggestion.value);
    setShowSuggestions(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="advanced-search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="advanced-search-panel"
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="search-panel-header">
              <h2>Advanced Search</h2>
              <button onClick={onClose} className="close-btn">
                <X size={24} />
              </button>
            </div>

            <div className="search-panel-content">
              {/* Search Input with Suggestions */}
              <div className="search-input-wrapper">
                <div className="search-field">
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Search products, sellers, categories..."
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="search-input"
                  />
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions-dropdown">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <span className="suggestion-type">{suggestion.type}</span>
                        <span>{suggestion.value}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Groups */}
              <div className="filter-groups">
                {/* Category Filter */}
                <div className="filter-group">
                  <label>Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Vendor Filter */}
                <div className="filter-group">
                  <label>Seller</label>
                  <select
                    value={filters.vendor}
                    onChange={(e) => handleFilterChange('vendor', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Sellers</option>
                    {vendors.map(vendor => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.vendorDetails?.storeName || vendor.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="filter-group price-range">
                  <label>Price Range</label>
                  <div className="price-inputs">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="price-input"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="price-input"
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="filter-group">
                  <label>Minimum Rating</label>
                  <select
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Any Rating</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="5">5 Stars</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="filter-group">
                  <label>Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="filter-select"
                  >
                    <option value="newest">Newest</option>
                    <option value="popular">Most Popular</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="search-actions">
                <button onClick={handleReset} className="btn-reset">
                  Clear Filters
                </button>
                <button onClick={handleSearch} className="btn-search-primary">
                  Search
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
