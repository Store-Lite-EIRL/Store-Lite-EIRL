'use client';

import { useState } from 'react';

export function PlanExpiredBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        color: '#856404',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span>
        Tu plan ha expirado. Renueva para seguir disfrutando de todas las funcionalidades.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Cerrar"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '4px 8px',
          color: '#856404',
        }}
      >
        ✕
      </button>
    </div>
  );
}
