'use client';

import React from 'react';

interface SegmentedButtonSetProps extends React.HTMLAttributes<HTMLElement> {
  multiselect?: boolean;
  children: React.ReactNode;
}

export const SegmentedButtonSet = ({
  multiselect,
  children,
  className,
  ...props
}: SegmentedButtonSetProps) => {
  return (
    <md-outlined-segmented-button-set multiselect={multiselect} className={className} {...props}>
      {children}
    </md-outlined-segmented-button-set>
  );
};

interface SegmentedButtonProps extends React.HTMLAttributes<HTMLElement> {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  noIcon?: boolean; // Default md-segmented-button has a check icon on selection
  children?: React.ReactNode; // For custom icons if needed
}

export const SegmentedButton = ({
  label,
  selected,
  disabled,
  noIcon,
  children,
  ...props
}: SegmentedButtonProps) => {
  return (
    <md-outlined-segmented-button
      label={label}
      selected={selected}
      disabled={disabled}
      no-checkmark={noIcon}
      {...props}
    >
      {children}
    </md-outlined-segmented-button>
  );
};
