import { Button, Dialog } from '@/shared/components/ui';
import type { CSSProperties } from 'react';
import type { Product } from '../data';

interface DeleteProductDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const DeleteProductDialog = ({
  open,
  product,
  onClose,
  onConfirm,
}: DeleteProductDialogProps) => {
  const deleteButtonStyle: CSSProperties & { '--md-sys-color-primary': string } = {
    '--md-sys-color-primary': 'var(--md-sys-color-error)',
  };

  if (!product) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <div slot="headline">Confirmar Eliminación</div>
      <div slot="content">
        ¿Estás seguro de que deseas eliminar el producto <strong>{product.name}</strong>? Esta
        acción no se puede deshacer.
      </div>
      <div slot="actions">
        <Button variant="text" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="filled" onClick={() => onConfirm(product.id)} style={deleteButtonStyle}>
          Eliminar
        </Button>
      </div>
    </Dialog>
  );
};
