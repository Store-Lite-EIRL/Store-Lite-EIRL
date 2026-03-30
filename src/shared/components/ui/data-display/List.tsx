'use client';

import React from 'react';

interface ListProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

interface ListItemProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  headline?: React.ReactNode;
  supportingText?: React.ReactNode;
  trailingSupportingText?: React.ReactNode;
  type?: string;
}

export const List = ({ children, className, ...props }: ListProps) => {
  return (
    <md-list className={className} {...props}>
      {children}
    </md-list>
  );
};

export const ListItem = ({
  children,
  headline,
  supportingText,
  trailingSupportingText,
  type,
  ...props
}: ListItemProps) => {
  return (
    <md-list-item type={type || 'text'} suppressHydrationWarning {...props}>
      {headline && <div slot="headline">{headline}</div>}
      {supportingText && <div slot="supporting-text">{supportingText}</div>}
      {trailingSupportingText && (
        <div slot="trailing-supporting-text">{trailingSupportingText}</div>
      )}
      {children}
    </md-list-item>
  );
};
