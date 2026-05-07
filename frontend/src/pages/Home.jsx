import { Link } from 'react-router-dom';
import PhotoSlider from '../components/PhotoSlider';

export default function HomePage() {
  return (
    <div className="app-shell">
      <PhotoSlider />

      <section className="hero-card hero-welcome">
        <div className="hero-copy">
          <p className="eyebrow">MultiVasta</p>
          <h1 className="page-heading">Welcome back to the modern multivendor marketplace platform.</h1>
          <p className="page-lead">
            Secure, seamless, and built for 2026. MultiVasta gives vendors and buyers a polished experience with instant access, live validation, and enterprise-grade commerce workflows.
          </p>
          <div className="hero-actions-row">
            <Link to="/products" className="button button-primary">
              Browse products
            </Link>
            <Link to="/vendor" className="button button-secondary">
              Vendor dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <p className="feature-title">Instant Access</p>
          <p>Real-time validation, intelligent recovery, and intuitive flows that keep buyers moving and vendors selling.</p>
        </article>
        <article className="feature-card">
          <p className="feature-title">Premium Security</p>
          <p>Enterprise-grade protection, encrypted sessions, and transparent role-based authorization for every user.</p>
        </article>
        <article className="feature-card">
          <p className="feature-title">Global Commerce</p>
          <p>Scale storefronts worldwide with polished listings, curated discovery, and fast checkout experiences.</p>
        </article>
      </section>

      <section className="spotlight-grid">
        <div className="spotlight-card">
          <p className="eyebrow">Seller spotlight</p>
          <h2>Vendor storefronts designed for trust and growth</h2>
          <p className="page-lead">Give vendors a premium presence with clear branding, ratings, and easy inventory management that buyers can rely on.</p>
          <div className="spotlight-features">
            <div>
              <strong>Vendor visibility</strong>
              <p>Highlight top sellers and curated collections with subtle yet actionable badges.</p>
            </div>
            <div>
              <strong>Smart store controls</strong>
              <p>Simple product management, pricing updates, and order tracking from one polished dashboard.</p>
            </div>
          </div>
        </div>
        <div className="spotlight-card spotlight-panel">
          <div>
            <p className="feature-title">Featured seller</p>
            <h3>Urban Audio Co.</h3>
            <p>Trusted electronics vendor with fast shipping, top reviews, and premium product curation.</p>
          </div>
          <div className="spotlight-metrics">
            <span>⭐ 4.8</span>
            <span>124 reviews</span>
            <span>98% on-time delivery</span>
          </div>
        </div>
      </section>

      <section className="testimonial-card">
        <p className="testimonial-quote">
          “MultiVasta made it incredibly easy to scale our vendor operations. Professional, intuitive, and lightning fast.”
        </p>
        <p className="testimonial-author">Sarah Chen</p>
      </section>
    </div>
  );
}
