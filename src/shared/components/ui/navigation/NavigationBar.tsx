'use client';

import { Icon } from '@/shared/components/ui/data-display/Icon';
import React from 'react';
import './Navigation.css';

interface NavigationBarItem {
  id: string;
  label: string;
  icon: string | React.ReactNode;
  activeIcon?: string | React.ReactNode;
  badgeValue?: string;
  showBadge?: boolean;
}

interface NavigationBarProps {
  items: NavigationBarItem[];
  activeIndex: number;
  onTabChange?: (index: number) => void;
  hideInactiveLabels?: boolean;
  className?: string;
}

export const NavigationBar = ({
  items,
  activeIndex,
  onTabChange,
  hideInactiveLabels = false,
  className = '',
}: NavigationBarProps) => {
  const handleTabInteraction = (e: CustomEvent) => {
    const tabIndex = (e.detail as { activeIndex: number }).activeIndex;
    if (tabIndex !== undefined && onTabChange) {
      onTabChange(tabIndex);
    }
  };

  return (
    <md-navigation-bar
      className={className}
      activeIndex={activeIndex}
      hideInactiveLabels={hideInactiveLabels}
      onNavigation-bar-activated={handleTabInteraction}
    >
      {items.map((item, index) => {
        const isActive = activeIndex === index;
        return (
          <md-navigation-tab
            key={item.id}
            id={item.id}
            label={item.label}
            active={isActive}
            hideInactiveLabel={hideInactiveLabels}
            badgeValue={item.badgeValue || ''}
            showBadge={item.showBadge || false}
          >
            {/* Direct slot assignment to Icon components */}
            {typeof item.icon === 'string' ? (
              <Icon slot="active-icon">{item.activeIcon || item.icon}</Icon>
            ) : (
              <div slot="active-icon">{item.activeIcon || item.icon}</div>
            )}

            {typeof item.icon === 'string' ? (
              <Icon slot="inactive-icon">{item.icon}</Icon>
            ) : (
              <div slot="inactive-icon">{item.icon}</div>
            )}
          </md-navigation-tab>
        );
      })}
    </md-navigation-bar>
  );
};
