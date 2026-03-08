'use client';

import React from 'react';

export type ChipVariant = 'assist' | 'filter' | 'input' | 'suggestion';

interface ChipsProps extends React.HTMLAttributes<HTMLElement> {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  removable?: boolean;
  elevated?: boolean;
  children?: React.ReactNode;
}

export const Chips = ({
  label,
  variant = 'assist',
  selected,
  removable,
  elevated,
  children,
  ...props
}: ChipsProps) => {
  if (variant === 'filter') {
    return (
      <md-filter-chip label={label} selected={selected} removable={removable} {...props}>
        {children}
      </md-filter-chip>
    );
  }

  if (variant === 'input') {
    return (
      <md-input-chip label={label} selected={selected} {...props}>
        {children}
      </md-input-chip>
    );
  }

  if (variant === 'suggestion') {
    return (
      <md-suggestion-chip label={label} elevated={elevated} {...props}>
        {children}
      </md-suggestion-chip>
    );
  }

  return (
    <md-assist-chip label={label} elevated={elevated} {...props}>
      {children}
    </md-assist-chip>
  );
};

type VariantChipProps = Omit<ChipsProps, 'variant'>;

export const AssistChip = (props: VariantChipProps) => <Chips {...props} variant="assist" />;
export const FilterChip = (props: VariantChipProps) => <Chips {...props} variant="filter" />;
export const InputChip = (props: VariantChipProps) => <Chips {...props} variant="input" />;
export const SuggestionChip = (props: VariantChipProps) => (
  <Chips {...props} variant="suggestion" />
);
