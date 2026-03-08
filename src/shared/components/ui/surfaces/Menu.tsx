'use client';

import React from 'react';

interface MenuProps extends React.HTMLAttributes<HTMLElement> {
  anchor: string;
  open?: boolean;
  [key: string]: unknown;
}

export const Menu = ({ anchor, open, children, ...props }: MenuProps) => {
  return (
    <md-menu anchor={anchor} open={open} {...props}>
      {children}
    </md-menu>
  );
};

interface MenuItemProps extends React.HTMLAttributes<HTMLElement> {
  headline?: string;
  [key: string]: unknown;
}

export const MenuItem = ({ children, headline, ...props }: MenuItemProps) => {
  return (
    <md-menu-item {...props}>
      {headline && <div slot="headline">{headline}</div>}
      {children}
    </md-menu-item>
  );
};
