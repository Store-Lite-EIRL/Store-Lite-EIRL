'use client';

import React from 'react';

interface LinearProgressProps extends React.HTMLAttributes<HTMLElement> {
  value?: number | string;
  buffer?: number | string;
  indeterminate?: boolean;
  fourColor?: boolean;
}

export const LinearProgress = ({ className, children, ...props }: LinearProgressProps) => {
  return (
    <md-linear-progress className={className} {...(props as React.HTMLAttributes<HTMLElement>)}>
      {children}
    </md-linear-progress>
  );
};

interface CircularProgressProps extends React.HTMLAttributes<HTMLElement> {
  value?: number | string;
  indeterminate?: boolean;
  fourColor?: boolean;
}

export const CircularProgress = ({ className, children, ...props }: CircularProgressProps) => {
  return (
    <md-circular-progress className={className} {...(props as React.HTMLAttributes<HTMLElement>)}>
      {children}
    </md-circular-progress>
  );
};
