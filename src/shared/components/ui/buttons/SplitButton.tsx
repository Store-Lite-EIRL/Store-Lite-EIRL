'use client';

import React from 'react';
import { Button } from './Button';

interface SplitButtonProps {
  children: React.ReactNode; // Main button content
  onMainClick?: () => void;
  onSplitClick?: (event: React.MouseEvent<HTMLElement>) => void;
  variant?: 'filled' | 'outlined' | 'tonal' | 'elevated' | 'text';
  disabled?: boolean;
  className?: string;
}

export const SplitButton = ({
  children,
  onMainClick,
  onSplitClick,
  variant = 'filled',
  disabled,
  className = '',
}: SplitButtonProps) => {
  return (
    <div className={`split-button split-button-${variant} ${className}`} role="group">
      <Button
        variant={variant}
        onClick={onMainClick}
        disabled={disabled}
        className="split-button-main"
      >
        {children}
      </Button>
      <span className="split-button-divider" />
      <Button
        variant={variant}
        onClick={onSplitClick}
        disabled={disabled}
        className="split-button-arrow"
        aria-label="More options"
      >
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 6L0.669873 0L9.33013 0L5 6Z" />
        </svg>
      </Button>
    </div>
  );
};
