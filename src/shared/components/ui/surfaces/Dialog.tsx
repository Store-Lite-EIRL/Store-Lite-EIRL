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

      const applyState = (shouldOpen: boolean) => {
        const el = dialogRef.current;
        if (!el) return;

        if (shouldOpen) {
          // The native <dialog> is ONLY modal when opened via show() (which
          // calls showModal() internally). The "open" attribute renders it
          // outside the browser top layer, so clicks pass through to the page
          // behind — the MD3 scrim is pointer-events: none and cannot block.
          if (typeof el.show === 'function') {
            el.show();
            document.body.style.overflow = 'hidden';
          } else {
            // md-dialog is registered lazily via MaterialWebInit's dynamic
            // import. If this effect runs before registration, wait for the
            // upgrade, then open it as a real modal.
            customElements
              .whenDefined('md-dialog')
              .then(() => {
                if (dialogRef.current) {
                  dialogRef.current.show();
                  document.body.style.overflow = 'hidden';
                }
              })
              .catch((err) => {
                console.error('md-dialog registration failed:', err);
              });
          }
        } else if (typeof el.close === 'function') {
          el.close();
          document.body.style.overflow = '';
        } else {
          document.body.style.overflow = '';
        }
      };

      applyState(!!open);
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
    // Host uses display:contents — position/z-index on md-dialog are no-ops.
    // Modal blocking comes from the native top layer (showModal via show()),
    // guaranteed by the effect above.
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
