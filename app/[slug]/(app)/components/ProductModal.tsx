'use client';

import { Icon, IconButton, Sheet } from '@/shared/components/ui';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import styles from './ProductModal.module.css';

interface ProductModalProps {
  children: React.ReactNode;
  fullPageHref?: string;
}

export default function ProductModal({ children, fullPageHref }: ProductModalProps) {
  const router = useRouter();

  const onDismiss = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <Sheet
      id="product-route-preview-sheet"
      title="Vista previa del producto"
      direction="bottom"
      className={styles.productSheet}
      defaultOpen
      onClose={onDismiss}
      headerActions={
        fullPageHref ? (
          <IconButton
            variant="filled-tonal"
            onClick={() => window.open(fullPageHref, '_blank')}
            aria-label="Ver completo"
            title="Ver pagina completa"
          >
            <Icon>open_in_new</Icon>
          </IconButton>
        ) : null
      }
    >
      <div className={styles.content}>{children}</div>
    </Sheet>
  );
}
