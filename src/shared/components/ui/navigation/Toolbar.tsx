'use client';

import React, { useState } from 'react';
import { Icon } from '../data-display';

interface ToolbarItem {
  icon: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}

interface ToolbarProps {
  /** Position where the toolbar will appear */
  position?: 'bottom' | 'top' | 'left' | 'right';
  /** Array of toolbar items with icons and click handlers */
  items: ToolbarItem[];
  /** Whether the toolbar is visible (for floating variant) */
  visible?: boolean;
  /** Whether the toolbar is floating or fixed */
  variant?: 'floating' | 'fixed';
  /** Color theme for the toolbar */
  colorTheme?: 'primary' | 'secondary' | 'tertiary' | 'surface';
  /** Additional CSS classes */
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  position = 'bottom',
  items,
  visible = true,
  variant = 'floating',
  colorTheme = 'surface',
  className = '',
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!visible && variant === 'floating') {
    return null;
  }

  const isVertical = position === 'left' || position === 'right';

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: Record<string, React.CSSProperties> = {
      bottom: {
        bottom: variant === 'fixed' ? '0' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      top: {
        top: variant === 'fixed' ? '0' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
      },
      left: {
        left: variant === 'fixed' ? '0' : '20px',
        top: '50%',
        transform: 'translateY(-50%)',
      },
      right: {
        right: variant === 'fixed' ? '0' : '20px',
        top: '50%',
        transform: 'translateY(-50%)',
      },
    };
    return baseStyles[position];
  };

  const getColorStyles = (): React.CSSProperties => {
    const colorMap: Record<string, React.CSSProperties> = {
      primary: {
        backgroundColor: 'var(--md-sys-color-primary-container)',
        color: 'var(--md-sys-color-on-primary-container)',
      },
      secondary: {
        backgroundColor: 'var(--md-sys-color-secondary-container)',
        color: 'var(--md-sys-color-on-secondary-container)',
      },
      tertiary: {
        backgroundColor: 'var(--md-sys-color-tertiary-container)',
        color: 'var(--md-sys-color-on-tertiary-container)',
      },
      surface: {
        backgroundColor: 'var(--md-sys-color-surface-container)',
        color: 'var(--md-sys-color-on-surface-variant)',
      },
    };
    return colorMap[colorTheme];
  };

  const baseStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: isVertical ? 'column' : 'row',
    alignItems: 'center',
    gap: '8px',
    padding: isVertical ? '12px 8px' : '8px 12px',
    borderRadius: variant === 'floating' ? '24px' : '0px',
    ...getColorStyles(),
    boxShadow:
      variant === 'floating' ? 'var(--md-sys-elevation-level3)' : 'var(--md-sys-elevation-level2)',
    border: variant === 'fixed' ? `1px solid var(--md-sys-color-outline-variant)` : 'none',
    position: variant === 'fixed' ? 'fixed' : 'absolute',
    zIndex: 1000,
    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
    ...getPositionStyles(),
  };

  // Adjust border radius for fixed position
  if (variant === 'fixed') {
    if (position === 'bottom') {
      baseStyles.borderRadius = '16px 16px 0 0';
    } else if (position === 'top') {
      baseStyles.borderRadius = '0 0 16px 16px';
    } else if (position === 'left') {
      baseStyles.borderRadius = '0 16px 16px 0';
    } else if (position === 'right') {
      baseStyles.borderRadius = '16px 0 0 16px';
    }
  }

  const handleItemClick = (index: number, onClick?: () => void) => {
    setActiveIndex(index);
    setTimeout(() => setActiveIndex(null), 300); // Reset animation after 300ms
    onClick?.();
  };

  return (
    <div className={`toolbar ${variant} ${position} ${className}`} style={baseStyles}>
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => handleItemClick(index, item.onClick)}
          disabled={item.disabled}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px',
            borderRadius: '50%',
            cursor: item.disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            color: item.disabled
              ? 'var(--md-sys-color-on-surface)'
              : 'var(--md-sys-color-on-surface-variant)',
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            backgroundColor:
              activeIndex === index ? 'var(--md-sys-color-state-pressed)' : 'transparent',
            transform: activeIndex === index ? 'scale(0.95)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (!item.disabled) {
              e.currentTarget.style.backgroundColor = 'var(--md-sys-color-state-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!item.disabled && activeIndex !== index) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <Icon
            style={{
              fontSize: '20px',
              transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
              transform: activeIndex === index ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            {item.icon}
          </Icon>
        </button>
      ))}
    </div>
  );
};
