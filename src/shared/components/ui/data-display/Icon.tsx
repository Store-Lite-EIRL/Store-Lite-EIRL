import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  slot?: string;
  size?: number | string;
}

export const Icon = ({ children, slot, className, size, style, ...props }: IconProps) => {
  const iconStyle = size
    ? {
        ...style,
        fontSize: typeof size === 'number' ? `${size}px` : size,
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }
    : style;

  return (
    <md-icon
      slot={slot}
      className={className}
      style={iconStyle}
      {...props}
      suppressHydrationWarning
    >
      {children}
    </md-icon>
  );
};
