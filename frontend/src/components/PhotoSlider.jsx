import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1505740106531-4243f3831d11?auto=format&fit=crop&w=1400&q=80',
    title: 'Sell smarter with MultiVasta',
    subtitle: 'Create listings, upload images, and reach buyers from a modern vendor dashboard.',
    cta: 'Start selling',
    to: '/vendor',
  },
  {
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1400&q=80',
    title: 'Shop products from trusted sellers',
    subtitle: 'Discover top trending items across categories with fast search and filters.',
    cta: 'Browse products',
    to: '/products',
  },
  {
    image: 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5c3?auto=format&fit=crop&w=1400&q=80',
    title: 'Grow your business online',
    subtitle: 'Powerful marketplace features built for vendors, sellers, and shoppers alike.',
    cta: 'Learn more',
    to: '/about',
  },
];

export default function PhotoSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeSlide = useMemo(() => slides[activeIndex], [activeIndex]);

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  const goTo = (index) => {
    setActiveIndex(index);
  };

  const nextSlide = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  return (
    <section
      className="photo-slider"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="slider-media" style={{ backgroundImage: `url(${activeSlide.image})` }}>
        <div className="slider-overlay" />
        <div className="slider-copy">
          <p className="slider-eyebrow">Featured</p>
          <h2>{activeSlide.title}</h2>
          <p>{activeSlide.subtitle}</p>
          <Link to={activeSlide.to} className="button button-primary slider-cta">
            {activeSlide.cta}
          </Link>
        </div>
      </div>

      <div className="slider-controls">
        <button type="button" className="slider-button" onClick={prevSlide} aria-label="Previous slide">
          ‹
        </button>
        <div className="slider-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              className={`slider-dot ${index === activeIndex ? 'active' : ''}`}
              onClick={() => goTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        <button type="button" className="slider-button" onClick={nextSlide} aria-label="Next slide">
          ›
        </button>
      </div>
    </section>
  );
}
