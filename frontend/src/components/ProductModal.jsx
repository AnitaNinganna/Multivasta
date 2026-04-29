import './ProductModal.css';

export default function ProductModal({ product, onClose }) {
  if (!product) {
    return null;
  }

  const attributes = product.attributes && typeof product.attributes === 'object'
    ? Object.entries(product.attributes)
    : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="modal-label">Product details</p>
            <h2>{product.name}</h2>
            <div className="modal-meta">
              <span>{product.categoryId?.name || 'Uncategorized'}</span>
              <span>{product.vendorId?.storeName || 'Unknown vendor'}</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-image">
            <span>{product.images?.length ? 'Product image preview' : 'No image available'}</span>
          </div>
          <div className="modal-details">
            <p className="modal-description">{product.description || 'No description provided for this product.'}</p>
            <div className="modal-info-row">
              <div>
                <h3>Price</h3>
                <p>${product.price?.toFixed(2) ?? '0.00'}</p>
              </div>
              <div>
                <h3>Stock</h3>
                <p>{product.quantity} available</p>
              </div>
              <div>
                <h3>SKU</h3>
                <p>{product.sku || 'N/A'}</p>
              </div>
            </div>
            {attributes.length > 0 && (
              <div className="modal-attributes">
                <h3>Attributes</h3>
                <div className="modal-tags">
                  {attributes.map(([key, value]) => (
                    <span key={key} className="modal-tag">{key}: {String(value)}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
