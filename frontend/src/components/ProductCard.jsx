export default function ProductCard({ product, onView, onQuickAdd }) {
  const coverImage = product.images?.length ? product.images[0] : null;

  return (
    <article className="product-card">
      <div className="product-image">
        {coverImage ? (
          <img src={coverImage} alt={product.name} />
        ) : (
          <span>No image</span>
        )}
      </div>
      <div className="product-details">
        <div className="card-heading">
          <h2>{product.name}</h2>
          <span className={`status-badge ${product.quantity ? 'in-stock' : 'out-of-stock'}`}>
            {product.quantity ? 'In stock' : 'Out of stock'}
          </span>
        </div>
        {product.vendorId?.storeName && (
          <div className="product-trust">
            <span className="vendor-badge">Verified vendor</span>
            <span>{product.vendorId.storeName}</span>
          </div>
        )}
        <p>{product.description || 'No description available.'}</p>
        <div className="product-meta">
          <span>{product.categoryId?.name || 'Uncategorized'}</span>
          <span>{product.vendorId?.storeName || 'Unknown seller'}</span>
        </div>
        <div className="product-cta">
          <strong>${product.price?.toFixed(2) ?? '0.00'}</strong>
          <div className="product-actions">
            <button type="button" className="secondary-button" onClick={() => onView(product)}>
              View details
            </button>
            <button type="button" className="button button-primary" onClick={() => onQuickAdd?.(product)}>
              Add
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
