'use client';

import React from 'react';
import './Navigation.css';

interface NavigationDrawerProps {
  opened?: boolean;
  pivot?: 'start' | 'end';
  children: React.ReactNode;
  className?: string;
}

export const NavigationDrawer = ({
  opened = true,
  pivot = 'start',
  children,
  className = '',
}: NavigationDrawerProps) => {
  return (
    <md-navigation-drawer className={className} opened={opened} pivot={pivot}>
      <div className="md-navigation-drawer__content">{children}</div>
    </md-navigation-drawer>
  );
};
