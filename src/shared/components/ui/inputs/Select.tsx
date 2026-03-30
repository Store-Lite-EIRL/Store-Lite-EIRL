'use client';

import React from 'react';

interface SelectOptionItem {
  value: string;
  label: string;
}

type MaterialSelectEvent = Event & {
  target: EventTarget & { value?: string; selected?: boolean };
  currentTarget: EventTarget & { value?: string; selected?: boolean };
};

type SelectEventHandler =
  | ((event: MaterialSelectEvent) => void)
  | React.FormEventHandler<HTMLSelectElement>
  | React.FormEventHandler<HTMLElement>
  | React.ChangeEventHandler<HTMLSelectElement>
  | React.ChangeEventHandler<HTMLElement>;

interface SelectProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange' | 'onInput'> {
  label?: string;
  outlined?: boolean;
  options?: SelectOptionItem[];
  children?: React.ReactNode;
  value?: string | number;
  className?: string;
  error?: boolean;
  errorText?: string;
  supportingText?: string;
  onChange?: SelectEventHandler;
  onInput?: SelectEventHandler;
}

interface SelectOptionProps extends React.HTMLAttributes<HTMLElement> {
  value: string;
  headline?: React.ReactNode;
  selected?: boolean;
  children?: React.ReactNode;
}

export const Select = ({ label, outlined, options, children, ...props }: SelectProps) => {
  const optionNodes = options?.map((opt) => (
    <SelectOption key={opt.value} value={opt.value}>
      {opt.label}
    </SelectOption>
  ));

  if (outlined) {
    return (
      <md-outlined-select label={label} suppressHydrationWarning {...props}>
        {optionNodes}
        {children}
      </md-outlined-select>
    );
  }

  return (
    <md-filled-select label={label} suppressHydrationWarning {...props}>
      {optionNodes}
      {children}
    </md-filled-select>
  );
};

export const SelectOption = ({
  value,
  headline,
  selected,
  children,
  ...props
}: SelectOptionProps) => {
  return (
    <md-select-option value={value} selected={selected} suppressHydrationWarning {...props}>
      {headline && <div slot="headline">{headline}</div>}
      {children}
    </md-select-option>
  );
};
