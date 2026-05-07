export default function ProductCard({ product, onView, onQuickAdd }) {
  const coverImage = product.images?.length ? product.images[0] : null;
  const vendorName = product.vendorId?.storeName || product.vendorId?.name || 'Marketplace seller';
  const vendorRating = product.vendorId?.rating || 4.8;

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

        <div className="product-trust">
          <span className="vendor-badge">{vendorName}</span>
          <span className="vendor-rating">⭐ {vendorRating.toFixed(1)}</span>
        </div>

        <p>{product.description || 'No description available.'}</p>

        <div className="product-meta">
          <span className="meta-pill">{product.categoryId?.name || 'Uncategorized'}</span>
          <span className="meta-pill">{vendorName}</span>
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
