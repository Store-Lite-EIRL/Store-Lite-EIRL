import { Button, Icon } from '@/shared/components/ui';

interface PreviewPaginationProps {
  page: number;
  total: number;
  onChange: (p: number) => void;
}

export function PreviewPagination({ page, total, onChange }: PreviewPaginationProps) {
  if (total <= 1) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 1.25rem',
        borderTop: '1px solid var(--md-sys-color-outline-variant)',
        background: 'var(--md-sys-color-surface-container-low)',
        flexShrink: 0,
      }}
    >
      <Button variant="outlined" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <Icon slot="icon" size={21}>
          chevron_left
        </Icon>
        Anterior
      </Button>

      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
        <span
          style={{
            background: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            padding: '2px 10px',
            borderRadius: 8,
            fontWeight: 700,
          }}
        >
          {page}
        </span>
        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>de {total}</span>
      </span>

      <Button variant="outlined" disabled={page === total} onClick={() => onChange(page + 1)}>
        Siguiente
        <Icon slot="icon" size={21}>
          chevron_right
        </Icon>
      </Button>
    </div>
  );
}
