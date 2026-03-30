'use client';

import React from 'react';
import { createPortal } from 'react-dom';

interface MdDialogElement extends HTMLElement {
  show: () => void;
  close: () => void;
}

interface DialogProps extends React.HTMLAttributes<HTMLElement> {
  open?: boolean; // Controlled?
  id?: string;
  onClose?: () => void;
  children?: React.ReactNode;
  type?: 'alert' | 'simple'; // optional distinction
}

export const Dialog = ({ id, className, children, open, onClose, ...props }: DialogProps) => {
  // Ref to the web component to attach listeners
  const dialogRef = React.useRef<MdDialogElement | null>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      if (open) {
        if (typeof dialog.show === 'function') {
          dialog.show();
        } else {
          dialog.setAttribute('open', 'true');
        }
        document.body.style.overflow = 'hidden';
      } else {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.removeAttribute('open');
        }
        document.body.style.overflow = '';
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClosed = () => {
      if (onClose) onClose();
    };

    // 'close' or 'closed' event depending on MD3 implementation, usually 'close' for native dialogs or 'closed' for some components
    // Material Web often uses 'close' or 'closed'. Let's listen to 'close' as standard MD3 web component event
    dialog.addEventListener('close', handleClosed);
    dialog.addEventListener('closed', handleClosed); // Listen to both to be safe

    return () => {
      dialog.removeEventListener('close', handleClosed);
      dialog.removeEventListener('closed', handleClosed);
    };
  }, [onClose]);

  const dialogContent = (
    <md-dialog ref={dialogRef} id={id} className={className} {...props}>
      {children}
    </md-dialog>
  );

  // Render via Portal to document.body so the dialog and its scrim appear above
  // the navbar and other layout elements (avoids stacking context issues)
  if (typeof document !== 'undefined') {
    return createPortal(dialogContent, document.body);
  }

  return dialogContent;
};
