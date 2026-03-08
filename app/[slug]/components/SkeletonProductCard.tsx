import Skeleton from '@/shared/components/feedback/Skeleton';

export default function SkeletonProductCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Skeleton variant="rectangular" width="100%" style={{ aspectRatio: '1' }} />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="40%" />
    </div>
  );
}
