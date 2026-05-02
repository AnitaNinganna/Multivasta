export default function AboutPage() {
  return (
    <div className="app-shell">
      <section className="hero-card hero-welcome">
        <p className="eyebrow">About</p>
        <h1 className="page-heading">Frontend setup for Day 6</h1>
        <p className="page-lead">
          The frontend is now organized with React Router, a shared navigation bar, and dedicated pages.
          This structure makes the storefront easier to extend and keeps the user experience clean.
        </p>
        <div className="page-summary">
          <p>What you get:</p>
          <ul>
            <li>Client-side routing with home, product listing, and about pages.</li>
            <li>Reusable navigation and page layout.</li>
            <li>Interactive product browsing with live backend integration.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
