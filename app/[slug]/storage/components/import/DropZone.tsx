import { Icon } from '@/shared/components/ui';
import React from 'react';

interface DropZoneProps {
  dragOver: boolean;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onClick: () => void;
}

export function DropZone({ dragOver, onDrop, onDragOver, onDragLeave, onClick }: DropZoneProps) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClick}
      style={{
        border: `2px dashed ${dragOver ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline-variant)'}`,
        borderRadius: 16,
        padding: '2rem 1.5rem',
        display: 'flex',
        marginInline: 10,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        cursor: 'pointer',
        background: dragOver
          ? 'var(--md-sys-color-primary-container)'
          : 'var(--md-sys-color-surface-container-lowest)',
        transition: 'background 0.2s, border-color 0.2s',
        textAlign: 'center',
        minHeight: 160,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--md-sys-color-surface-container-high)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon style={{ fontSize: 28, color: 'var(--md-sys-color-primary)' }}>cloud_upload</Icon>
      </div>
      <div>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
          Arrastra tu archivo aquí
        </p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
          o haz clic para seleccionar
        </p>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.8 }}>
          Máximo 5 categorías (hojas) y 20 productos por categoría
        </p>
      </div>
    </div>
  );
}
