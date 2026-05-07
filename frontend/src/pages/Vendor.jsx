import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { createProduct, fetchVendorProducts, fetchCategories, uploadProductImages } from '../api';

export default function VendorPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    sku: '',
    category_id: '',
    images: [],
    imageUpload: null,
  });
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  useEffect(() => {
    if (!user || user.role !== 'vendor') {
      return;
    }

    const loadData = async () => {
      try {
        const [vendorProducts, categoryList] = await Promise.all([
          fetchVendorProducts(token),
          fetchCategories(),
        ]);
        setProducts(vendorProducts.products || []);
        setCategories(categoryList);
      } catch (err) {
        setStatus({ loading: false, error: err.message || 'Could not load vendor data', success: null });
      }
    };

    loadData();
  }, [token, user]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    if (name === 'imageUpload') {
      setForm((prev) => ({ ...prev, imageUpload: files[0] || null }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadImage = async () => {
    if (!form.imageUpload) {
      return;
    }

    setStatus((prev) => ({ ...prev, loading: true, error: null, success: null }));
    const formData = new FormData();
    formData.append('images', form.imageUpload);

    try {
      const response = await uploadProductImages(formData, token);
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...(response.images || [])],
        imageUpload: null,
      }));
      setStatus({ loading: false, success: 'Image uploaded to product form', error: null });
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Image upload failed', success: null });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user || !token) {
      navigate('/login');
      return;
    }

    setStatus({ loading: true, error: null, success: null });
    try {
      await createProduct(
        {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          quantity: Number(form.quantity),
          sku: form.sku,
          category_id: form.category_id,
          images: form.images,
        },
        token
      );
      setStatus({ loading: false, success: 'Product created successfully', error: null });
      setForm({ name: '', description: '', price: '', quantity: '', sku: '', category_id: '', images: [], imageUpload: null });
      const freshProducts = await fetchVendorProducts(token);
      setProducts(freshProducts.products || []);
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Failed to create product', success: null });
    }
  };

  if (!user) {
    return (
      <div className="vendor-page vendor-unauthorized">
        <div className="vendor-card">
          <h2>Vendor access required</h2>
          <p>Please sign in as a vendor to manage your products.</p>
          <Link to="/login" className="button button-primary">Go to login</Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'vendor') {
    return (
      <div className="vendor-page vendor-unauthorized">
        <div className="vendor-card">
          <h2>Vendor Dashboard</h2>
          <p>Your account does not have vendor permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="vendor-page">
      <section className="vendor-hero">
        <div>
          <p className="vendor-label">Vendor Dashboard</p>
          <h1>Manage your store</h1>
          <p className="vendor-intro">Add new products, upload images, and keep your catalog up to date.</p>
        </div>
      </section>

      <section className="vendor-grid">
        <div className="vendor-card vendor-form-card">
          <div className="vendor-card-header">
            <div>
              <p className="vendor-label-alt">Add Product</p>
              <h2>Create a new listing</h2>
            </div>
          </div>

          {status.error && <div className="alert alert-error">{status.error}</div>}
          {status.success && <div className="alert alert-success">{status.success}</div>}

          <form className="vendor-form" onSubmit={handleSubmit}>
            <label className="form-label">
              Product name
              <input name="name" value={form.name} onChange={handleChange} placeholder="Elegant speaker" required />
            </label>

            <label className="form-label">
              Description
              <textarea name="description" value={form.description} onChange={handleChange} rows="5" placeholder="A feature-rich audio product." />
            </label>

            <div className="form-row">
              <label className="form-label">
                Price
                <input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" placeholder="199.99" required />
              </label>
              <label className="form-label">
                Quantity
                <input type="number" name="quantity" value={form.quantity} onChange={handleChange} min="0" step="1" placeholder="12" required />
              </label>
            </div>

            <div className="form-row">
              <label className="form-label">
                SKU
                <input type="text" name="sku" value={form.sku} onChange={handleChange} placeholder="SPK-001" />
              </label>
              <label className="form-label">
                Category
                <select name="category_id" value={form.category_id} onChange={handleChange}>
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label className="form-label vendor-file-label">
                Product image
                <input type="file" name="imageUpload" accept="image/*" onChange={handleChange} />
              </label>
              <button type="button" className="button button-secondary" onClick={handleUploadImage} disabled={!form.imageUpload || status.loading}>
                Upload image
              </button>
            </div>

            {form.images.length > 0 && (
              <div className="image-preview-grid">
                {form.images.map((url, index) => (
                  <div key={index} className="image-preview">
                    <img src={url} alt={`Product ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="button button-primary" disabled={status.loading}>
              {status.loading ? 'Creating product...' : 'Create product'}
            </button>
          </form>
        </div>

        <div className="vendor-card vendor-products-card">
          <div className="vendor-card-header">
            <div>
              <p className="vendor-label-alt">Your listings</p>
              <h2>Active products</h2>
            </div>
          </div>

          <div className="product-list">
            {products.length === 0 ? (
              <p className="empty-state">No products yet — add your first item.</p>
            ) : (
              products.map((product) => (
                <article key={product._id} className="product-row">
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.categoryId?.name || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <span className="product-price">${product.price.toFixed(2)}</span>
                    <span className="product-qty">Qty: {product.quantity}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
