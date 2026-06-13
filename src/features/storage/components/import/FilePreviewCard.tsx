import { Icon } from '@/shared/components/ui';
import type { FileInfo } from './FileValidation';

interface FilePreviewCardProps {
  info: FileInfo;
  onReset: () => void;
}

export function FilePreviewCard({ info, onReset }: FilePreviewCardProps) {
  const isValid = info.status === 'valid';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        marginInline: 10,
        borderRadius: 12,
        border: `1px solid ${isValid ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)'}`,
        background: isValid
          ? 'var(--md-sys-color-primary-container)'
          : 'var(--md-sys-color-error-container)',
      }}
    >
      <Icon
        size={23}
        style={{
          color: isValid ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-error)',
          fontSize: 28,
          flexShrink: 0,
        }}
      >
        {isValid ? 'check_circle' : 'error'}
      </Icon>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontWeight: 600,
            fontSize: '0.875rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: isValid
              ? 'var(--md-sys-color-on-primary-container)'
              : 'var(--md-sys-color-on-error-container)',
          }}
        >
          {info.name}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            color: isValid
              ? 'var(--md-sys-color-on-primary-container)'
              : 'var(--md-sys-color-on-error-container)',
            opacity: 0.8,
          }}
        >
          {info.error ?? `${info.type} · ${info.size}`}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onReset();
        }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 50,
          display: 'flex',
          color: isValid
            ? 'var(--md-sys-color-on-primary-container)'
            : 'var(--md-sys-color-on-error-container)',
        }}
        aria-label="Eliminar archivo"
      >
        <Icon style={{ fontSize: 18 }}>close</Icon>
      </button>
    </div>
  );
}
