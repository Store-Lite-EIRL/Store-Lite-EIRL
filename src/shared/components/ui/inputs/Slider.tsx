'use client';

import React from 'react';

interface SliderProps extends React.HTMLAttributes<HTMLElement> {
  value?: number | string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  labeled?: boolean;
  ticks?: boolean;
  range?: boolean;
  valueStart?: number | string; // For range
  valueEnd?: number | string; // For range
  disabled?: boolean;
}

export const Slider = ({ valueStart, valueEnd, className, ...props }: SliderProps) => {
  return (
    <md-slider value-start={valueStart} value-end={valueEnd} className={className} {...props} />
  );
};
