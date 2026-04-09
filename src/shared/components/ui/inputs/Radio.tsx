'use client';

import React from 'react';

interface RadioProps extends React.HTMLAttributes<HTMLElement> {
  checked?: boolean;
  disabled?: boolean;
  value?: string;
  name?: string;
  required?: boolean;
}

export const Radio = ({ className, children, id, ...props }: RadioProps) => {
  const generatedId = React.useId();
  const radioId = id || generatedId;

  return (
    <md-radio id={radioId} className={className} suppressHydrationWarning {...props}>
      {children}
    </md-radio>
  );
};
