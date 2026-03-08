'use client';

import React from 'react';

interface TabsProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

interface PrimaryTabProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  selected?: boolean;
  inlineIcon?: boolean;
}

interface SecondaryTabProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  selected?: boolean;
}

export const Tabs = ({ children, className, ...props }: TabsProps) => {
  return (
    <md-tabs className={className} {...props}>
      {children}
    </md-tabs>
  );
};

export const PrimaryTab = ({ children, selected, inlineIcon, ...props }: PrimaryTabProps) => {
  return (
    <md-primary-tab selected={selected} inline-icon={inlineIcon} {...props}>
      {children}
    </md-primary-tab>
  );
};

export const SecondaryTab = ({ children, selected, ...props }: SecondaryTabProps) => {
  return (
    <md-secondary-tab selected={selected} {...props}>
      {children}
    </md-secondary-tab>
  );
};
