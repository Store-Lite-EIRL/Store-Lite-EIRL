'use client';

import React from 'react';

export type IconButtonVariant = 'standard' | 'filled' | 'outlined' | 'filled-tonal';

interface IconButtonProps extends React.HTMLAttributes<HTMLElement> {
  variant?: IconButtonVariant;
  disabled?: boolean;
  href?: string;
  target?: string;
  toggle?: boolean;
  selected?: boolean;
  children: React.ReactNode;
  'aria-label'?: string;
}

export const IconButton = ({
  variant = 'standard',
  children,
  className,
  ...props
}: IconButtonProps) => {
  if (variant === 'filled') {
    return (
      <md-filled-icon-button className={className} suppressHydrationWarning {...props}>
        {children}
      </md-filled-icon-button>
    );
  }

  if (variant === 'outlined') {
    return (
      <md-outlined-icon-button className={className} suppressHydrationWarning {...props}>
        {children}
      </md-outlined-icon-button>
    );
  }

  if (variant === 'filled-tonal') {
    return (
      <md-filled-tonal-icon-button className={className} suppressHydrationWarning {...props}>
        {children}
      </md-filled-tonal-icon-button>
    );
  }

  return (
    <md-icon-button className={className} suppressHydrationWarning {...props}>
      {children}
    </md-icon-button>
  );
};
