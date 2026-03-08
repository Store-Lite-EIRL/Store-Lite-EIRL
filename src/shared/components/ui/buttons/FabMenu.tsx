'use client';

import React, { useState } from 'react';
import { Icon } from '../data-display/Icon';
import { Fab } from './Fab';

interface FabMenuProps {
  children: React.ReactNode;
  icon?: string;
  activeIcon?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'surface';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const FabMenu = ({
  children,
  icon = 'add',
  activeIcon = 'close',
  variant = 'primary',
  size = 'medium',
  className = '',
}: FabMenuProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`fab-menu-container ${open ? 'open' : ''} ${className}`}>
      <div className={`fab-menu-items ${open ? 'visible' : ''}`}>{children}</div>
      <Fab
        variant={variant}
        size={size}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon slot="icon" className={`fab-icon-transition ${open ? 'rotate' : ''}`}>
          {open ? activeIcon : icon}
        </Icon>
      </Fab>
    </div>
  );
};

export const FabMenuItem = ({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label?: string;
  onClick?: () => void;
}) => {
  return (
    <div className="fab-menu-item" onClick={onClick}>
      {label && <span className="fab-menu-item-label">{label}</span>}
      <Fab size="small" variant="secondary">
        <Icon slot="icon">{icon}</Icon>
      </Fab>
    </div>
  );
};
