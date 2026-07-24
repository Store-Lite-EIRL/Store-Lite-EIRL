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
      // LitElement may reset web component properties during upgrade.
      // Re-apply the type property directly to guarantee it sticks.
      if (props.type) {
        (dialog as MdDialogElement & { type?: string }).type = props.type;
      }

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
  }, [open, props.type]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      // 'cancel' fires when user tries to close via Escape / backdrop click.
      // It does NOT fire when dialog.close() is called programmatically.
      // For alert dialogs we block it — only explicit Cancel button can close.
      if (props.type === 'alert') {
        e.preventDefault();
      }
    };

    const handleClosed = () => {
      if (onClose) onClose();
    };

    // Intercept native cancel first (Escape / backdrop)
    dialog.addEventListener('cancel', handleCancel);
    // Then listen for actual close (fires from our own dialog.close() call)
    dialog.addEventListener('close', handleClosed);
    dialog.addEventListener('closed', handleClosed);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClosed);
      dialog.removeEventListener('closed', handleClosed);
    };
  }, [onClose, props.type]);

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
