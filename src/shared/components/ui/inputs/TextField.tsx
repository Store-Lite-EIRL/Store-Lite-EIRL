'use client';

import React from 'react';

export type TextFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'textarea';
export type TextFieldVariant = 'filled' | 'outlined';

type MaterialTextFieldEvent = Event & {
  target: EventTarget & { value?: string };
  currentTarget: EventTarget & { value?: string };
};

type TextFieldEventHandler =
  | ((event: MaterialTextFieldEvent) => void)
  | React.ChangeEventHandler<HTMLInputElement>
  | React.ChangeEventHandler<HTMLTextAreaElement>
  | React.ChangeEventHandler<HTMLElement>
  | React.FormEventHandler<HTMLElement>;

interface TextFieldProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange' | 'onInput'> {
  variant?: TextFieldVariant;
  type?: TextFieldType;
  label?: string;
  placeholder?: string;
  value?: string | number;
  prefixText?: string;
  suffixText?: string;
  supportingText?: string;
  errorText?: string;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  rows?: number | string; // For textarea
  cols?: number | string; // For textarea
  name?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  readOnly?: boolean;
  className?: string;
  children?: React.ReactNode;
  onChange?: TextFieldEventHandler;
  onInput?: TextFieldEventHandler;
}

export const TextField = ({
  variant = 'outlined',
  type = 'text',
  className,
  children, // Can be used for slots like leadin-icon
  ...props
}: TextFieldProps) => {
  if (variant === 'filled') {
    return (
      <md-filled-text-field type={type} className={className} suppressHydrationWarning {...props}>
        {children}
      </md-filled-text-field>
    );
  }

  return (
    <md-outlined-text-field type={type} className={className} suppressHydrationWarning {...props}>
      {children}
    </md-outlined-text-field>
  );
};
