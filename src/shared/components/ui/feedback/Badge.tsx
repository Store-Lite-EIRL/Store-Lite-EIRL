'use client';

export const Badge = ({ count, className }: { count?: number | string; className?: string }) => {
  if (count) {
    return (
      <div
        className={`badge-num ${className || ''}`}
        style={{
          minWidth: '16px',
          height: '16px',
          borderRadius: '8px',
          background: 'var(--md-sys-color-error)',
          color: 'var(--md-sys-color-on-error)',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          zIndex: 1,
        }}
      >
        {count}
      </div>
    );
  }
  return (
    <div
      className={`badge-dot ${className || ''}`}
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'var(--md-sys-color-error)',
        position: 'absolute',
        top: '5px',
        right: '5px',
        zIndex: 1,
      }}
    />
  );
};
