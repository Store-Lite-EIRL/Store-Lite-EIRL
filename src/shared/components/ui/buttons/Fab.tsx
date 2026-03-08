'use client';

import React from 'react';

export type FabVariant = 'surface' | 'primary' | 'secondary' | 'tertiary';
export type FabSize = 'medium' | 'small' | 'large';

export interface FabProps extends React.HTMLAttributes<HTMLElement> {
  variant?: FabVariant;
  size?: FabSize;
  label?: string; // If label is present, it's an extended FAB (handled by md-fab with label prop? Check docs. Usually md-fab has label prop for extended)
  disabled?: boolean;
  lowered?: boolean;
  children?: React.ReactNode; // Icon usually
}

export const Fab = ({
  variant = 'primary',
  size = 'medium',
  label,
  children,
  className,
  ...props
}: FabProps) => {
  return (
    <md-fab variant={variant} size={size} label={label} className={className} {...props}>
      {children}
    </md-fab>
  );
};

interface BrandedFabProps extends React.HTMLAttributes<HTMLElement> {
  label?: string;
  children?: React.ReactNode;
}

export const BrandedFab = ({ children, label, className, ...props }: BrandedFabProps) => {
  return (
    <md-branded-fab label={label} className={className} {...props}>
      {children}
    </md-branded-fab>
  );
};
