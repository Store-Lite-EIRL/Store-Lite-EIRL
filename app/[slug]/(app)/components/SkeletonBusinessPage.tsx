import styles from './SkeletonBusinessPage.module.css';

// Reusing layout classes where possible or mimicking structure
import Skeleton from '@/shared/components/feedback/Skeleton';
import featuredStyles from '../../../(main)/home/FeaturedItems.module.css';
import feedStyles from '../../../(main)/home/Feed.module.css';
import heroStyles from '../../../(main)/home/Hero.module.css';
import SkeletonProductCard from './SkeletonProductCard';

export default function SkeletonBusinessPage() {
  return (
    <div className="page-container">
      {/* Hero Skeleton */}
      <div className={`${heroStyles.heroContainer} ${styles.heroSkeleton}`}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </div>

      {/* Featured Items Skeleton */}
      <section className={featuredStyles.sectionContainer}>
        <div className={featuredStyles.itemsContainer} style={{ overflow: 'hidden' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={featuredStyles.itemCard}>
              <Skeleton variant="rectangular" width="100%" height="100%" />
            </div>
          ))}
        </div>
      </section>

      {/* Filter Bar (Tabs) Skeleton */}
      <div
        style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}
      >
        <Skeleton variant="rectangular" width={100} height={32} style={{ borderRadius: '16px' }} />
        <Skeleton variant="rectangular" width={100} height={32} style={{ borderRadius: '16px' }} />
        <Skeleton variant="rectangular" width={100} height={32} style={{ borderRadius: '16px' }} />
      </div>

      {/* Feed Skeleton */}
      <section className={feedStyles.feedContainer}>
        <Skeleton variant="text" width={200} height={32} style={{ marginBottom: '1.5rem' }} />
        <div className={feedStyles.gridContainer}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={feedStyles.gridItem} style={{ background: 'transparent' }}>
              <SkeletonProductCard />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
