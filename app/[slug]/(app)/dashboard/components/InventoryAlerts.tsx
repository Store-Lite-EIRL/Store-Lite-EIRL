import styles from './InventoryAlerts.module.css';

interface ProductBase {
  id: string;
  title: string;
}

interface LikedProduct extends ProductBase {
  stars: number;
}

interface StockProduct extends ProductBase {
  stock?: number;
}

interface InventoryAlertsProps {
  topLiked: LikedProduct[];
  outOfStock: ProductBase[];
  lowStock: StockProduct[];
}

export function InventoryAlerts({ topLiked, outOfStock, lowStock }: InventoryAlertsProps) {
  return (
    <section className={styles.container}>
      {/* ─── Column: Top Liked ─── */}
      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Más Populares</h3>
          <span className={styles.cardSub}>Basado en likes (estrellas)</span>
        </div>
        <ul className={styles.list}>
          {topLiked.length === 0 ? (
            <p className={styles.empty}>Sin likes registrados.</p>
          ) : (
            topLiked.map((p) => (
              <li key={p.id} className={styles.listItem}>
                <span className={styles.name}>{p.title}</span>
                <span className={styles.badgeLike}>⭐ {p.stars}</span>
              </li>
            ))
          )}
        </ul>
      </article>

      {/* ─── Column: Out of Stock ─── */}
      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Sin Stock (Agotados)</h3>
          <span className={styles.cardSub}>Reponer urgente</span>
        </div>
        <ul className={styles.list}>
          {outOfStock.length === 0 ? (
            <p className={styles.empty}>¡Inventario completo!</p>
          ) : (
            outOfStock.map((p) => (
              <li key={p.id} className={styles.listItem}>
                <span className={styles.name}>{p.title}</span>
                <span className={styles.badgeError}>AGOTADO</span>
              </li>
            ))
          )}
        </ul>
      </article>

      {/* ─── Column: Low Stock ─── */}
      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Stock Bajo</h3>
          <span className={styles.cardSub}>Menos de 5 unidades</span>
        </div>
        <ul className={styles.list}>
          {lowStock.length === 0 ? (
            <p className={styles.empty}>Todo bien por ahora.</p>
          ) : (
            lowStock.map((p) => (
              <li key={p.id} className={styles.listItem}>
                <span className={styles.name}>{p.title}</span>
                <span className={styles.badgeWarn}>{p.stock} unid.</span>
              </li>
            ))
          )}
        </ul>
      </article>
    </section>
  );
}
