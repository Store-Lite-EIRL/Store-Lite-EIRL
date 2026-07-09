import { CircularProgress } from '@/shared/components/ui/feedback/Progress';

export default function ListBusinessLoading() {
  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}
    >
      {/* Brand skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--md-sys-color-surface-container-high)',
          }}
        />
        <div
          style={{
            width: '100px',
            height: '20px',
            borderRadius: '6px',
            background: 'var(--md-sys-color-surface-container-high)',
          }}
        />
      </div>

      {/* Hero skeleton */}
      <div
        style={{
          padding: '1.75rem 2rem',
          borderRadius: '1.5rem',
          background: 'var(--md-sys-color-surface-container-high)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--md-sys-color-surface-container-highest)',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div
              style={{
                width: '120px',
                height: '12px',
                borderRadius: '6px',
                background: 'var(--md-sys-color-surface-container-highest)',
              }}
            />
            <div
              style={{
                width: '180px',
                height: '22px',
                borderRadius: '6px',
                background: 'var(--md-sys-color-surface-container-highest)',
              }}
            />
          </div>
        </div>
        <div
          style={{
            width: '140px',
            height: '40px',
            borderRadius: '20px',
            background: 'var(--md-sys-color-surface-container-highest)',
          }}
        />
      </div>

      {/* Section title skeleton */}
      <div
        style={{
          width: '200px',
          height: '14px',
          borderRadius: '6px',
          background: 'var(--md-sys-color-surface-container-high)',
        }}
      />

      {/* Cards skeleton */}
      {[1, 2].map((i) => (
        <div
          key={i}
          style={{
            borderRadius: '1.5rem',
            border: '1px solid var(--md-sys-color-outline-variant)',
            background: 'var(--md-sys-color-surface-container)',
            padding: '1.5rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '0.75rem',
                background: 'var(--md-sys-color-surface-container-highest)',
                flexShrink: 0,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
              <div
                style={{
                  width: '160px',
                  height: '20px',
                  borderRadius: '6px',
                  background: 'var(--md-sys-color-surface-container-highest)',
                }}
              />
              <div
                style={{
                  width: '100px',
                  height: '12px',
                  borderRadius: '6px',
                  background: 'var(--md-sys-color-surface-container-highest)',
                }}
              />
            </div>
          </div>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'var(--md-sys-color-surface-container-highest)',
            }}
          />
        </div>
      ))}

      {/* Spacer + footer loading indicator */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingBottom: '2rem',
        }}
      >
        <CircularProgress indeterminate fourColor style={{ width: '24px', height: '24px' }} />
      </div>
    </div>
  );
}
