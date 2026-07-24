import { Button, Dialog } from '@/shared/components/ui';
import type { CSSProperties } from 'react';

interface DeleteChatDialogProps {
  open: boolean;
  chatName: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteChatDialog = ({ open, chatName, onClose, onConfirm }: DeleteChatDialogProps) => {
  const deleteButtonStyle: CSSProperties & { '--md-sys-color-primary': string } = {
    '--md-sys-color-primary': 'var(--md-sys-color-error)',
  };

  if (!chatName) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <div slot="headline">Eliminar Chat</div>
      <div slot="content">
        ¿Estás seguro de que deseas eliminar el chat con <strong>{chatName}</strong>? Esta acción no
        se puede deshacer.
      </div>
      <div slot="actions">
        <Button variant="text" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="filled" onClick={onConfirm} style={deleteButtonStyle}>
          Eliminar
        </Button>
      </div>
    </Dialog>
  );
};
