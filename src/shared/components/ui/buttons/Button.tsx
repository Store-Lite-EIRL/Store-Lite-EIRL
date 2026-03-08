'use client';

import React from 'react';

export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';

interface ButtonProps extends React.HTMLAttributes<HTMLElement> {
  variant?: ButtonVariant;
  disabled?: boolean;
  href?: string;
  target?: string;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}

export const Button = ({
  variant = 'filled',
  children,
  className,
  form,
  ...props
}: ButtonProps & { form?: string }) => {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (ref.current && form) {
      ref.current.setAttribute('form', form);
    }
  }, [form]);

  if (variant === 'outlined') {
    return (
      <md-outlined-button
        ref={ref}
        className={className}
        suppressHydrationWarning
        {...props}
      >
        {children}
      </md-outlined-button>
    );
  }

  if (variant === 'text') {
    return (
      <md-text-button
        ref={ref}
        className={className}
        suppressHydrationWarning
        {...props}
      >
        {children}
      </md-text-button>
    );
  }

  if (variant === 'elevated') {
    return (
      <md-elevated-button
        ref={ref}
        className={className}
        suppressHydrationWarning
        {...props}
      >
        {children}
      </md-elevated-button>
    );
  }

  if (variant === 'tonal') {
    return (
      <md-filled-tonal-button
        ref={ref}
        className={className}
        suppressHydrationWarning
        {...props}
      >
        {children}
      </md-filled-tonal-button>
    );
  }

  return (
      <md-filled-button
        ref={ref}
        className={className}
        suppressHydrationWarning
        {...props}
      >
      {children}
    </md-filled-button>
  );
};

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ButtonGroup = ({ children, className = '' }: ButtonGroupProps) => {
  return <div className={`button-group ${className}`}>{children}</div>;
};
