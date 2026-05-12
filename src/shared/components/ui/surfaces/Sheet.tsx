'use client';

import '@/styles/components/Sheet.css';
import React, { useCallback, useState } from 'react';
import { IconButton } from '../buttons/IconButton';
import { Icon } from '../data-display/Icon';

interface SheetProps {
  id?: string;
  title?: string;
  children?: React.ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
  defaultOpen?: boolean;
  onClose?: () => void;
  headerActions?: React.ReactNode;
}

export const Sheet = ({
  id,
  title,
  children,
  direction = 'right',
  className = '',
  defaultOpen = false,
  onClose,
  headerActions,
}: SheetProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const show = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  React.useEffect(() => {
    if (rootRef.current) {
      const node = rootRef.current as HTMLDivElement & { show: () => void; close: () => void };
      node.show = show;
      node.close = close;
    }
  }, [close, show]);

  /* Lock body scroll while sheet is open */
  React.useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  return (
    <>
      <div className={`md-sheet-scrim ${isOpen ? 'open' : ''}`} onClick={close} />
      <div
        ref={rootRef}
        id={id}
        className={`md-sheet md-sheet--${direction} ${isOpen ? 'open' : ''} ${className}`}
      >
        <div className="md-sheet__header">
          {title && <h2 className="md-sheet__title">{title}</h2>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {headerActions}
            <IconButton onClick={close}>
              <Icon>close</Icon>
            </IconButton>
          </div>
        </div>
        <div className="md-sheet__content">{children}</div>
      </div>
    </>
  );
};
