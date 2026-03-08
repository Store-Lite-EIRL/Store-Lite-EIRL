'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from '../data-display';

interface AlertSnackbarProps {
  /** Icon to display in the alert (optional) */
  icon?: string;
  /** Description text for the alert */
  description: string;
  /** Color theme for the alert */
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'warning' | 'success';
  /** Position where the alert will appear */
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  /** Whether the alert is visible */
  open?: boolean;
  /** Callback when the alert is closed */
  onClose?: () => void;
  /** Auto-close duration in milliseconds (0 to disable) */
  autoCloseDuration?: number;
  /** Additional CSS classes */
  className?: string;
}

export const AlertSnackbar: React.FC<AlertSnackbarProps> = ({
  icon,
  description,
  color = 'primary',
  position = 'bottom-center',
  open = false,
  onClose,
  autoCloseDuration = 5000,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(open);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setIsLoading(true);

    setTimeout(() => {
      setIsVisible(false);
      setIsLoading(false);
      onClose?.();
    }, 1000);
  }, [onClose]);

  useEffect(() => {
    if (open) {
      const frameId = window.requestAnimationFrame(() => {
        setIsVisible(true);
        setIsClosing(false);
      });

      if (autoCloseDuration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDuration);
        return () => {
          window.cancelAnimationFrame(frameId);
          clearTimeout(timer);
        };
      }

      return () => window.cancelAnimationFrame(frameId);
    }
  }, [open, autoCloseDuration, handleClose]);

  if (!isVisible) {
    return null;
  }

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: Record<string, React.CSSProperties> = {
      'top-left': { top: '20px', left: '20px' },
      'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
      'top-right': { top: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' },
      'bottom-right': { bottom: '20px', right: '20px' },
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
      error: {
        backgroundColor: 'var(--md-sys-color-error-container)',
        color: 'var(--md-sys-color-on-error-container)',
      },
      warning: {
        backgroundColor: 'var(--md-sys-color-surface-variant)',
        color: 'var(--md-sys-color-on-surface-variant)',
        border: '1px solid var(--md-sys-color-warning)',
      },
      success: {
        backgroundColor: 'var(--md-sys-color-primary-container)',
        color: 'var(--md-sys-color-on-primary-container)',
      },
    };
    return colorMap[color];
  };

  const getTransformValue = (): string => {
    if (!isClosing) {
      return getPositionStyles().transform || 'none';
    }

    if (position === 'top-center' || position === 'bottom-center') {
      return 'translateX(-50%) translateY(20px)';
    }
    return 'translateY(20px)';
  };

  return (
    <div
      className={`alert-snackbar ${isClosing ? 'closing' : ''} ${className}`}
      style={{
        position: 'fixed',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: 'var(--md-sys-elevation-level2)',
        minWidth: '300px',
        maxWidth: '400px',
        ...getPositionStyles(),
        ...getColorStyles(),
        transform: getTransformValue(),
        opacity: isClosing ? 0 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        pointerEvents: isClosing ? 'none' : 'auto',
      }}
    >
      {icon && (
        <Icon
          style={{
            fontSize: '20px',
            flexShrink: 0,
          }}
        >
          {icon}
        </Icon>
      )}

      <div
        style={{
          flex: 1,
          fontSize: '14px',
          fontWeight: 400,
          lineHeight: '1.4',
        }}
      >
        {description}
      </div>

      <button
        onClick={handleClose}
        disabled={isClosing}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px',
          borderRadius: '50%',
          cursor: isClosing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          width: '32px',
          height: '32px',
          flexShrink: 0,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isClosing) {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              width: '28px',
              height: '28px',
              border: '2px solid currentColor',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              opacity: 0.3,
            }}
          />
        )}

        <Icon
          style={{
            fontSize: '18px',
            opacity: isLoading ? 0.5 : 0.7,
            transition: 'opacity 0.2s',
          }}
        >
          close
        </Icon>
      </button>

      <style>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
