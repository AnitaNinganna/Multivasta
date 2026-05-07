import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNotification } from '../hooks/useNotification';
import './ProductModal.css';

export default function ProductModal({ product, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [imageZoom, setImageZoom] = useState(false);
  const { success } = useNotification();

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!product) {
    return null;
  }

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    success(`✓ Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`);
    setQuantity(1);
    setTimeout(onClose, 1000);
  };

  const attributes = product.attributes && typeof product.attributes === 'object'
    ? Object.entries(product.attributes)
    : [];

  return (
    <motion.div
      className="modal-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="modal-content-enhanced"
        onClick={(event) => event.stopPropagation()}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="modal-header">
          <div>
            <p className="modal-label">Product details</p>
            <h2>{product.name}</h2>
            <div className="modal-meta">
              <span>{product.categoryId?.name || 'Uncategorized'}</span>
              <span>{product.vendorId?.storeName || 'Unknown vendor'}</span>
            </div>
          </div>
          <motion.button
            type="button"
            className="modal-close"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        </div>

        <div className="modal-body-enhanced">
          {/* Image Section */}
          <div className="modal-image-section">
            <div
              className={`modal-image ${imageZoom ? 'zoomed' : ''}`}
              onClick={() => setImageZoom(!imageZoom)}
            >
              {product.images?.length ? (
                <img src={product.images[0]} alt={product.name} />
              ) : (
                <span>No image available</span>
              )}
              {imageZoom && <div className="zoom-hint">Click to unzoom</div>}
            </div>
            {product.images?.length > 1 && (
              <div className="image-thumbnails">
                {product.images.slice(0, 4).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${product.name}-${idx}`}
                    className="thumbnail"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="modal-details-enhanced">
            {/* Price and Stock */}
            <div className="price-stock-row">
              <div className="price-box">
                <h3>Price</h3>
                <p className="price-value">${product.price?.toFixed(2) ?? '0.00'}</p>
              </div>
              <div className={`stock-box ${product.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                <h3>Stock</h3>
                <p>{product.quantity > 0 ? `${product.quantity} available` : 'Out of Stock'}</p>
              </div>
              {product.sku && (
                <div className="sku-box">
                  <h3>SKU</h3>
                  <p>{product.sku}</p>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="modal-tabs">
              <motion.button
                className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
                whileHover={{ backgroundColor: '#f0f0f0' }}
              >
                Description
              </motion.button>
              <motion.button
                className={`tab-btn ${activeTab === 'vendor' ? 'active' : ''}`}
                onClick={() => setActiveTab('vendor')}
                whileHover={{ backgroundColor: '#f0f0f0' }}
              >
                Vendor Info
              </motion.button>
              <motion.button
                className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
                onClick={() => setActiveTab('specs')}
                whileHover={{ backgroundColor: '#f0f0f0' }}
              >
                Specs
              </motion.button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'description' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="description-text">{product.description || 'No description provided for this product.'}</p>
                </motion.div>
              )}

              {activeTab === 'vendor' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="vendor-info">
                    <p><strong>Vendor:</strong> {product.vendorId?.storeName || 'Unknown'}</p>
                    <p><strong>Email:</strong> {product.vendorId?.email || 'N/A'}</p>
                    <p><strong>Rating:</strong> ⭐ 4.5/5 (123 reviews)</p>
                    <p><strong>Response Time:</strong> Usually 2-4 hours</p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'specs' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {attributes.length > 0 ? (
                    <div className="specs-table">
                      {attributes.map(([key, value]) => (
                        <div key={key} className="spec-row">
                          <span className="spec-key">{key}:</span>
                          <span className="spec-value">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No specifications available</p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Quantity Selector */}
            {product.quantity > 0 && (
              <div className="quantity-section">
                <label>Quantity:</label>
                <div className="quantity-selector">
                  <motion.button
                    className="qty-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    −
                  </motion.button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.quantity, parseInt(e.target.value) || 1)))}
                    min="1"
                    max={product.quantity}
                  />
                  <motion.button
                    className="qty-btn"
                    onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    +
                  </motion.button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              <motion.button
                type="button"
                className="button button-primary"
                onClick={handleAddToCart}
                disabled={product.quantity === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {product.quantity > 0 ? `Add to Cart ($${(product.price * quantity).toFixed(2)})` : 'Out of Stock'}
              </motion.button>
              <motion.button
                type="button"
                className="button button-secondary"
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
