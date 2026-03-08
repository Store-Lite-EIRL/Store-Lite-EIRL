'use client';

import React from 'react';

interface SwitchProps extends React.HTMLAttributes<HTMLElement> {
  selected?: boolean;
  disabled?: boolean;
  value?: string;
  name?: string;
  required?: boolean;
  icons?: boolean; // Show on/off icons
}

export const Switch = ({ className, children, id, ...props }: SwitchProps) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  return (
    <md-switch id={switchId} className={className} {...props}>
      {children}
    </md-switch>
  );
};
