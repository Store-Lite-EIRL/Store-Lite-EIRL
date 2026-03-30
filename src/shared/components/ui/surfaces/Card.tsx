'use client';

import React from 'react';

export type CardVariant = 'elevated' | 'filled' | 'outlined';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: React.ReactNode;
}

export const Card = ({ variant = 'elevated', className, style, children, ...props }: CardProps) => {
  const variantClass = `md3-card--${variant}`;

  return (
    <div className={`md3-card ${variantClass} ${className || ''}`} style={style} {...props}>
      {children}
    </div>
  );
};
