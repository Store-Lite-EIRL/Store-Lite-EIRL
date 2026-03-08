'use client';

import { IconButton } from '@/shared/components/ui/buttons/IconButton';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import React from 'react';
import './Navigation.css';

interface NavigationRailItem {
  id: string;
  label: string;
  icon: string | React.ReactNode;
  activeIcon?: string | React.ReactNode;
}

interface NavigationRailProps {
  items: NavigationRailItem[];
  activeIndex: number;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  onItemSelect?: (index: number) => void;
  className?: string;
}

export const NavigationRail = ({
  items,
  activeIndex,
  expanded = false,
  onToggleExpanded,
  onItemSelect,
  className = '',
}: NavigationRailProps) => {
  return (
    <nav
      className={`md-navigation-rail ${expanded ? 'md-navigation-rail--expanded' : ''} ${className}`}
    >
      <div className="md-navigation-rail__header">
        <IconButton onClick={onToggleExpanded}>
          <Icon>menu</Icon>
        </IconButton>
      </div>

      <div className="md-navigation-rail__content">
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <div
              key={item.id}
              className={`md-navigation-rail__item ${isActive ? 'md-navigation-rail__item--active' : ''}`}
              onClick={() => onItemSelect?.(index)}
              title={item.label}
            >
              <div className="md-navigation-rail__icon-container">
                <div className="md-navigation-rail__item-indicator" />
                <div className="md-navigation-rail__item-icon">
                  {(() => {
                    if (typeof item.icon === 'string') {
                      return (
                        <Icon>
                          {isActive && item.activeIcon
                            ? (item.activeIcon as string)
                            : (item.icon as string)}
                        </Icon>
                      );
                    }
                    return isActive && item.activeIcon
                      ? item.activeIcon
                      : (item.icon as React.ReactNode);
                  })()}
                </div>
              </div>
              {expanded && <div className="md-navigation-rail__item-label">{item.label}</div>}
            </div>
          );
        })}
      </div>
    </nav>
  );
};
