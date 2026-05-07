import React from 'react';
import './SkeletonLoader.css';

export const SkeletonProductCard = () => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-image"></div>
    <div className="skeleton-content">
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text short"></div>
      <div className="skeleton skeleton-text short"></div>
    </div>
  </div>
);

export const SkeletonProductDetail = () => (
  <div className="skeleton-detail">
    <div className="skeleton-detail-image skeleton"></div>
    <div className="skeleton-detail-info">
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text short"></div>
      <div className="skeleton skeleton-text short"></div>
      <div className="skeleton skeleton-button"></div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="skeleton-table">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton-table-row">
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text short"></div>
      </div>
    ))}
  </div>
);

export const SkeletonOrderCard = () => (
  <div className="skeleton-order-card">
    <div className="skeleton skeleton-text"></div>
    <div className="skeleton skeleton-text short"></div>
    <div className="skeleton skeleton-text short"></div>
  </div>
);
