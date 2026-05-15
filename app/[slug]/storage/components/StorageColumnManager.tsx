'use client';

import { Button, Icon } from '@/shared/components/ui';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import { useState } from 'react';
import type { ExtraColumnsState } from '../hooks/useExtraColumns';

interface StorageColumnManagerProps {
  columns: ExtraColumnsState;
}

export const StorageColumnManager = ({ columns }: StorageColumnManagerProps) => {
  const [open, setOpen] = useState(false);
  const { availableColumns, visibleColumns, toggleColumn } = columns;

  if (availableColumns.length === 0) return null;

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)} style={{ gap: 4 }}>
        <Icon slot="icon" size={20}>
          view_column
        </Icon>
        <span>Columnas</span>
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <div slot="headline">Columnas del archivo</div>

        <div slot="content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {availableColumns.length === 0 ? (
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem' }}>
              No se detectaron columnas adicionales. Importá un archivo con campos extra primero.
            </p>
          ) : (
            availableColumns.map((col) => (
              <label
                key={col}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col)}
                  onChange={() => toggleColumn(col)}
                  style={{
                    accentColor: 'var(--md-sys-color-primary)',
                    width: 16,
                    height: 16,
                    cursor: 'pointer',
                    margin: 0,
                  }}
                />
                <span style={{ textTransform: 'capitalize' }}>{col}</span>
              </label>
            ))
          )}
        </div>

        <div slot="actions">
          <Button variant="text" onClick={() => setOpen(false)}>
            Listo
          </Button>
        </div>
      </Dialog>
    </>
  );
};
