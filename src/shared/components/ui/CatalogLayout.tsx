import React from 'react';

interface CatalogLayoutProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Section({ title, children, className = '', style }: CatalogLayoutProps) {
  return (
    <div className={`catalog-section ${className}`} style={style}>
      <h2 className="catalog-section-title">{title}</h2>
      <div className="catalog-grid">{children}</div>
    </div>
  );
}

export function CatalogCard({ title, children, className = '', style }: CatalogLayoutProps) {
  return (
    <div className={`catalog-card ${className}`} style={style}>
      <div className="catalog-card-content">{children}</div>
      <div className="catalog-card-title">{title}</div>
    </div>
  );
}
