'use client';

import { Icon } from '@/shared/components/ui/data-display';
import Link from 'next/link';
import { useRef, useState } from 'react';

interface CreateBusinessButtonProps {
  hasReachedLimit: boolean;
}

export default function CreateBusinessButton({ hasReachedLimit }: CreateBusinessButtonProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLElement>(null);

  if (!hasReachedLimit) {
    return (
      <Link href="/created" style={{ textDecoration: 'none' }}>
        <md-filled-button suppressHydrationWarning>
          <Icon slot="icon">add</Icon>
          Crear nueva empresa
        </md-filled-button>
      </Link>
    );
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <md-filled-button
        ref={buttonRef}
        disabled
        onClick={() => setOpen(!open)}
        suppressHydrationWarning
        id="limit-button"
      >
        <Icon slot="icon">help_outline</Icon>
        Crear nueva empresa
      </md-filled-button>

      <md-menu
        anchor="limit-button"
        open={open}
        anchor-corner="bottom-start"
        style={{ '--md-menu-container-color': 'var(--md-sys-color-surface-container)' }}
        suppressHydrationWarning
      >
        <div style={{ padding: '12px 16px', maxWidth: '240px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--md-sys-color-on-surface)' }}>
            <strong>Límite alcanzado</strong>
            <br />
            Has alcanzado el máximo de 3 empresas permitidas en el plan gratuito. Actualiza a{' '}
            <strong>Premium</strong> para gestionar más negocios.
          </p>
        </div>
      </md-menu>
    </div>
  );
}
