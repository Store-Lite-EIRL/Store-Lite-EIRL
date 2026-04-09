'use client';

import React from 'react';

interface CheckboxProps extends React.HTMLAttributes<HTMLElement> {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  value?: string;
  name?: string;
  required?: boolean;
  touchTarget?: 'wrapper' | 'none'; // 'wrapper' increases touch target
}

export const Checkbox = ({
  touchTarget = 'wrapper',
  className,
  children,
  id,
  ...props
}: CheckboxProps) => {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;

  return (
    <md-checkbox id={checkboxId} touch-target={touchTarget} className={className} suppressHydrationWarning {...props}>
      {children}
    </md-checkbox>
  );
};
