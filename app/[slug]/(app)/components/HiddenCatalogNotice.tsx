'use client';

import { Button } from '@/shared/components/ui/buttons/Button';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import filterStyles from '../../../(main)/home/FilterBar.module.css';
import styles from '../BusinessPageContent.module.css';

interface HiddenCatalogNoticeProps {
  isOwner: boolean;
  onCreateProduct: () => void;
}

export function HiddenCatalogNotice({ isOwner, onCreateProduct }: HiddenCatalogNoticeProps) {
  return (
    <div className={filterStyles.aboutContent}>
      <div className={filterStyles.infoCard}>
        <h2 className={filterStyles.infoTitle}>Catálogo oculto</h2>
        <p className={filterStyles.description}>
          El grid de productos está oculto en la configuración del storefront, pero la navegación
          principal del negocio sigue disponible.
        </p>
        {isOwner && (
          <div className={styles.ownerActionRow}>
            <Button variant="filled" onClick={onCreateProduct} className={styles.addProductButton}>
              <Icon slot="icon" size={21}>
                add_circle
              </Icon>
              Agregar Producto
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
