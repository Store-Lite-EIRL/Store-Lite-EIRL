import ProductModal from '../../../components/ProductModal';
import styles from '../../../components/ProductModal.module.css';

export default function ModalLoading() {
  return (
    <ProductModal>
      <div
        style={{
          padding: '2rem',
          display: 'flex',
          gap: '2rem',
          minHeight: '400px',
          flexWrap: 'wrap',
        }}
      >
        {/* Gallery skeleton */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            flex: '0 0 clamp(220px, 40%, 420px)',
          }}
        >
          <div
            className={styles.skeletonBox}
            style={{ aspectRatio: '1', borderRadius: '1rem', width: '100%' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={styles.skeletonBox}
                style={{ width: '64px', height: '64px', borderRadius: '0.5rem', flexShrink: 0 }}
              />
            ))}
          </div>
        </div>

        {/* Info sidebar skeleton */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            flex: 1,
            minWidth: '220px',
          }}
        >
          <div
            className={styles.skeletonBox}
            style={{ height: '2rem', width: '70%', borderRadius: '0.5rem' }}
          />
          <div
            className={styles.skeletonBox}
            style={{ height: '1rem', width: '40%', borderRadius: '0.5rem' }}
          />
          <div
            className={styles.skeletonBox}
            style={{ height: '2.5rem', width: '50%', borderRadius: '0.5rem' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div
              className={styles.skeletonBox}
              style={{ height: '1rem', width: '100%', borderRadius: '0.5rem' }}
            />
            <div
              className={styles.skeletonBox}
              style={{ height: '1rem', width: '90%', borderRadius: '0.5rem' }}
            />
            <div
              className={styles.skeletonBox}
              style={{ height: '1rem', width: '75%', borderRadius: '0.5rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div
              className={styles.skeletonBox}
              style={{ height: '40px', flex: 1, borderRadius: '2rem' }}
            />
            <div
              className={styles.skeletonBox}
              style={{ height: '40px', flex: 1, borderRadius: '2rem' }}
            />
          </div>
        </div>
      </div>
    </ProductModal>
  );
}
