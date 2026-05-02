import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="app-shell">
      <section className="hero-card hero-welcome">
        <p className="eyebrow">Welcome</p>
        <h1 className="page-heading">MultiVasta storefront is ready.</h1>
        <p className="page-lead">
          Explore the vendor marketplace with product browsing, filters, and a responsive React UI.
          Navigate to products to start shopping or learn more about the platform.
        </p>
        <div className="hero-actions-row">
          <Link to="/products" className="button button-primary">
            Browse products
          </Link>
          <Link to="/about" className="button button-secondary">
            About MultiVasta
          </Link>
        </div>
      </section>
    </div>
  );
}
