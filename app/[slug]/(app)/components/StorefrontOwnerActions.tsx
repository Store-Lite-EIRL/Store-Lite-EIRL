'use client';

import { Button } from '@/shared/components/ui/buttons/Button';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import styles from '../BusinessPageContent.module.css';

interface StorefrontOwnerActionsProps {
  isOwner: boolean;
  onCreateProduct: () => void;
  onShowLookupModal: () => void;
}

export function StorefrontOwnerActions({
  isOwner,
  onCreateProduct,
  onShowLookupModal,
}: StorefrontOwnerActionsProps) {
  if (isOwner) {
    return (
      <div className={styles.ownerActionRow}>
        <Button variant="filled" onClick={onCreateProduct} className={styles.addProductButton}>
          <Icon slot="icon" size={21}>
            add_circle
          </Icon>
          Agregar Producto
        </Button>
      </div>
    );
  }
  return (
    <div className={styles.ownerActionRow}>
      <Button variant="filled" onClick={onShowLookupModal} className={styles.addProductButton}>
        <Icon slot="icon" size={21}>
          search
        </Icon>
        Ver Pedido
      </Button>
    </div>
  );
}
