import { Icon } from '@/shared/components/ui';

export const EmptyState = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      color: 'var(--md-sys-color-on-surface-variant)',
      padding: '3rem 1rem',
    }}
  >
    <Icon style={{ opacity: 0.5 }} size={64}>
      inventory_2
    </Icon>
    <p style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>No hay productos</p>
    <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: 0 }}>
      Comienza agregando tu primer producto
    </p>
  </div>
);
