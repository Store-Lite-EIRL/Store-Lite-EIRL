import Skeleton from '@/shared/components/feedback/Skeleton';

export default function Loading() {
  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}
    >
      {/* Header with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width={250} height={32} />
      </div>

      {/* Product Content Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          backgroundColor: 'var(--md-sys-color-surface-container-low)',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        }}
      >
        {/* Images Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Skeleton
            variant="rectangular"
            width="100%"
            height="auto"
            style={{ aspectRatio: '1', borderRadius: '1rem' }}
          />
        </div>

        {/* Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <Skeleton
              variant="rectangular"
              width={100}
              height={28}
              style={{ borderRadius: '1rem', marginBottom: '0.5rem' }}
            />
            <Skeleton variant="text" width="80%" height={48} />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <Skeleton variant="text" width={150} height={40} />
            <Skeleton variant="text" width={50} height={24} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Skeleton variant="text" width={200} height={24} />
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="50%" height={24} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Skeleton variant="text" width={150} height={24} />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={100}
              style={{ borderRadius: '8px', marginTop: '0.5rem' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
