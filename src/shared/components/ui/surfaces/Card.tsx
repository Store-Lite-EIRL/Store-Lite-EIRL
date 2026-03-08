'use client';

import React from 'react';

export type CardVariant = 'elevated' | 'filled' | 'outlined';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: React.ReactNode;
}

export const Card = ({ variant = 'elevated', className, style, children, ...props }: CardProps) => {
  // Basic CSS implementation since MD3 Web Components doesn't strictly have a "card" component yet in 1.0 stable,
  // it relies on CSS classes or labs.
  // However, I'll use the classes I added in globals.css (or surfaces.css) earlier,
  // or rely on standard implementations.
  // Let's implement using the classes we defined in the previous step/original globals.

  const cardClass = `card-${variant}`;

  // We can also allow clicking if it interacts.

  return (
    <div className={`card-example ${cardClass} ${className || ''}`} style={style} {...props}>
      {children}
    </div>
  );
};
