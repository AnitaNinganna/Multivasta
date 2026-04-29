export default function ProductCard({ product, onView }) {
  return (
    <article className="product-card">
      <div className="product-image">
        <span>{product.images?.length ? 'Image available' : 'No image'}</span>
      </div>
      <div className="product-details">
        <div className="card-heading">
          <h2>{product.name}</h2>
          <span className={`status-badge ${product.quantity ? 'in-stock' : 'out-of-stock'}`}>
            {product.quantity ? 'In stock' : 'Out of stock'}
          </span>
        </div>
        <p>{product.description || 'No description available.'}</p>
        <div className="product-meta">
          <span>{product.categoryId?.name || 'Uncategorized'}</span>
          <span>{product.vendorId?.storeName || 'Unknown vendor'}</span>
        </div>
        <div className="product-cta">
          <strong>${product.price?.toFixed(2) ?? '0.00'}</strong>
          <button type="button" className="secondary-button" onClick={() => onView(product)}>
            View details
          </button>
        </div>
      </div>
    </article>
  );
}
