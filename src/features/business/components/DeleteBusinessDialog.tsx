'use client';

import { deleteBusinessAction } from '@/features/business/actions/businessActions';
import { Icon } from '@/shared/components/ui/data-display';
import { LinearProgress } from '@/shared/components/ui/feedback/Progress';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import { useState } from 'react';

interface DeleteBusinessDialogProps {
  business: {
    id: string;
    name: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteBusinessDialog({
  business,
  open,
  onClose,
  onSuccess,
}: DeleteBusinessDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!business) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteBusinessAction(business.id);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Ocurrió un error al eliminar la tienda.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} type="alert">
      <div slot="headline">
        <Icon
          style={{
            color: 'var(--md-sys-color-error)',
            marginRight: '8px',
            verticalAlign: 'middle',
          }}
        >
          delete_forever
        </Icon>
        Eliminar Tienda
      </div>
      <div slot="content">
        <p>
          ¿Estás seguro de que deseas eliminar <strong>{business?.name}</strong>?
        </p>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--md-sys-color-on-surface-variant)',
            marginTop: '8px',
          }}
        >
          Esta acción eliminará permanentemente la tienda, sus productos, categorías e imágenes.
          Esta acción no se puede deshacer.
        </p>

        {isDeleting && (
          <div style={{ marginTop: '16px' }}>
            <LinearProgress indeterminate />
            <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '4px' }}>
              Eliminando todo...
            </p>
          </div>
        )}

        {error && (
          <div
            style={{ color: 'var(--md-sys-color-error)', marginTop: '8px', fontSize: '0.875rem' }}
          >
            {error}
          </div>
        )}
      </div>
      <div slot="actions">
        <md-text-button onClick={onClose} disabled={isDeleting}>
          Cancelar
        </md-text-button>
        <md-filled-button
          onClick={handleDelete}
          disabled={isDeleting}
          style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)' }}
        >
          Eliminar todo
        </md-filled-button>
      </div>
    </Dialog>
  );
}
