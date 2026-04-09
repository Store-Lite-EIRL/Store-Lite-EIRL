'use client';

import { Icon } from '@/shared/components/ui';
import React from 'react';

interface SwitchBusinessModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Name of the currently open business */
  currentBusiness: string;
  /** Name of the business the user wants to switch to */
  pendingBusiness: string;
  /** Callback when user confirms the switch */
  onConfirm: () => void;
  /** Callback when user cancels the switch */
  onCancel: () => void;
}

/**
 * Modal that warns users when they try to switch to a different business
 * while one is already open. Provides options to confirm or cancel.
 */
export const SwitchBusinessModal: React.FC<SwitchBusinessModalProps> = ({
  isOpen,
  currentBusiness,
  pendingBusiness,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="switch-business-modal-overlay"
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        className="switch-business-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="switch-business-title"
        style={{
          backgroundColor: 'var(--md-sys-color-surface, #FFFBFE)',
          borderRadius: '28px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow:
            'var(--md-sys-elevation-level3, 0 4px 8px 0 rgba(0, 0, 0, 0.14), 0 1px 3px 0 rgba(0, 0, 0, 0.12))',
          animation: 'switchBusinessModalEnter 0.2s ease-out',
        }}
      >
        {/* Header with icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--md-sys-color-warning-container, #FFF3E0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={24} style={{ color: 'var(--md-sys-color-warning, #F57C00)' }}>
              warning
            </Icon>
          </div>
          <h2
            id="switch-business-title"
            style={{
              fontSize: '24px',
              fontWeight: 400,
              color: 'var(--md-sys-color-on-surface, #1C1B1F)',
              margin: 0,
            }}
          >
            Negocio ya está abierto
          </h2>
        </div>

        {/* Body */}
        <div
          style={{
            marginBottom: '24px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              lineHeight: 1.5,
              color: 'var(--md-sys-color-on-surface-variant, #49454F)',
              margin: 0,
            }}
          >
            Ya tienes <strong>"{currentBusiness}"</strong> abierto en otra pestaña.
            <br />
            <br />
            ¿Querés cambiar a <strong>"{pendingBusiness}"</strong>?
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <md-text-button
            onClick={onCancel}
            style={{
              color: 'var(--md-sys-color-primary, #79747E)',
            }}
          >
            Cancelar
          </md-text-button>

          <md-filled-button
            onClick={onConfirm}
            style={{
              backgroundColor: 'var(--md-sys-color-primary, #79747E)',
              color: 'var(--md-sys-color-on-primary, #FFFFFF)',
            }}
          >
            Cambiar de negocio
          </md-filled-button>
        </div>
      </div>

      <style>{`
        @keyframes switchBusinessModalEnter {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};
