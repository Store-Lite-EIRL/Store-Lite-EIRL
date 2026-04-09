import { notFound } from 'next/navigation';
import { eq, and, count, desc } from 'drizzle-orm';
import { db } from '@/core/database/client';
import { 
  businesses, 
  products, 
  productCategories, 
  formMessages, 
  productLikes,
  businessSubscriptions
} from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';

import { DashboardHeader } from './components/DashboardHeader';
import { StatCards } from './components/StatCards';
import { EarningsStats } from './components/EarningsStats';
import { MarketInsights } from './components/MarketInsights';
import { ProductsOverview } from './components/ProductsOverview';
import { MessagesPreview } from './components/MessagesPreview';
import { PlanStatusBar } from './components/PlanStatusBar';

import styles from './dashboard.module.css';

// ─── Mock Data for Financials (UI Only as requested) ───
const FINANCIALS_MOCK = {
  earnings: {
    daily: { label: 'Hoy', amount: '$120.50', percentage: 12, isPositive: true, color: 'blue' as const },
    weekly: { label: 'Semanal', amount: '$850.00', percentage: 8, isPositive: true, color: 'green' as const },
    monthly: { label: 'Mensual', amount: '$3,240.00', percentage: 4, isPositive: false, color: 'purple' as const },
  },
  topProducts: [
    { name: 'Auriculares Pro Wireless', count: 42, progress: 85 },
    { name: 'Cargador Carga Rápida 20W', count: 31, progress: 70 },
    { name: 'Funda Silicona iPhone 13', count: 28, progress: 65 },
    { name: 'Smartwatch Serie 7', count: 18, progress: 45 },
    { name: 'Cable USB-C 2m', count: 12, progress: 25 },
  ],
  topCategories: [
    { name: 'Electrónica', count: 120, progress: 90 },
    { name: 'Accesorios', count: 85, progress: 75 },
    { name: 'Relojería', count: 45, progress: 40 },
    { name: 'Cables', count: 22, progress: 25 },
    { name: 'Fundas', count: 15, progress: 15 },
  ],
  bestDays: [
    { day: 'Lun', intensity: 45 },
    { day: 'Mar', intensity: 30 },
    { day: 'Mie', intensity: 65 },
    { day: 'Jue', intensity: 85 },
    { day: 'Vie', intensity: 95 },
    { day: 'Sab', intensity: 75 },
    { day: 'Dom', intensity: 55 },
  ],
  totalSold: 450,
};

interface DashboardProps {
  params: Promise<{ slug: string }>;
}

export default async function Dashboard({ params }: DashboardProps) {
  const { slug } = await params;

  // 1. Fetch business core data
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
    columns: { 
      id: true, 
      name: true, 
      logoUrl: true, 
      isActive: true 
    },
  });

  if (!business) {
    return notFound();
  }

  // 2. Resolve entitlements & plan
  const [entitlements, subscription] = await Promise.all([
    getBusinessEntitlements(business.id),
    db.query.businessSubscriptions.findFirst({
      where: and(
        eq(businessSubscriptions.businessId, business.id),
        eq(businessSubscriptions.planStatus, 'active')
      ),
      orderBy: [desc(businessSubscriptions.createdAt)],
    })
  ]);

  // 3. Parallel fetching for stats & overview
  const [
    productsCountResult,
    categoriesCountResult,
    unreadMessagesResult,
    totalLikesResult,
    recentProducts,
    recentMessages
  ] = await Promise.all([
    // Counts
    db.select({ count: count() }).from(products).where(eq(products.businessId, business.id)),
    db.select({ count: count() }).from(productCategories).where(eq(productCategories.businessId, business.id)),
    db.select({ count: count() }).from(formMessages).where(and(eq(formMessages.businessId, business.id), eq(formMessages.isRead, false))),
    
    // Sum of likes
    db.select({ count: count() })
      .from(productLikes)
      .innerJoin(products, eq(productLikes.productId, products.id))
      .where(eq(products.businessId, business.id)),

    // Data for lists
    db.query.products.findMany({
      where: eq(products.businessId, business.id),
      limit: 5,
      orderBy: [desc(products.createdAt)],
      with: {
        category: {
          columns: { name: true }
        },
        likes: {
          columns: { id: true }
        }
      }
    }),

    db.query.formMessages.findMany({
      where: eq(formMessages.businessId, business.id),
      limit: 4,
      orderBy: [desc(formMessages.createdAt)],
    })
  ]);

  const totalProducts = productsCountResult[0]?.count || 0;
  const totalCategories = categoriesCountResult[0]?.count || 0;
  const unreadMessages = unreadMessagesResult[0]?.count || 0;
  const totalLikes = totalLikesResult[0]?.count || 0;

  // Format recent products for component
  const formattedProducts = recentProducts.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price.toString(),
    currency: p.currency,
    isAvailable: p.isAvailable,
    stock: p.stock,
    saleStatus: p.saleStatus as 'MAS_VENDIDO' | 'NUEVO_PRODUCTO' | 'NORMAL',
    likes: p.likes?.length || 0,
    categoryName: p.category?.name || null,
  }));

  // Format recent messages for component
  const formattedMessages = recentMessages.map((m) => ({
    id: m.id,
    senderName: m.senderName,
    messageText: m.messageText,
    isRead: m.isRead,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
  }));

  const planStartDate = subscription?.planStartDate instanceof Date ? subscription.planStartDate.toISOString() : subscription?.planStartDate;
  const planEndDate = subscription?.planEndDate instanceof Date ? subscription.planEndDate.toISOString() : subscription?.planEndDate;

  return (
    <main className={styles.dashboardRoot}>
      <DashboardHeader 
        businessName={business.name}
        logoUrl={business.logoUrl}
        entitlements={entitlements}
        planEndDate={planEndDate}
      />

      <StatCards 
        totalProducts={totalProducts}
        totalCategories={totalCategories}
        unreadMessages={unreadMessages}
        totalLikes={totalLikes}
        totalSold={FINANCIALS_MOCK.totalSold}
        entitlements={entitlements}
      />

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Análisis de Ventas</h2>
      </div>

      <EarningsStats data={FINANCIALS_MOCK.earnings} />

      <MarketInsights 
        topProducts={FINANCIALS_MOCK.topProducts}
        topCategories={FINANCIALS_MOCK.topCategories}
        bestDays={FINANCIALS_MOCK.bestDays}
      />

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Resumen de Actividad</h2>
      </div>

      <div className={styles.dashboardGrid}>
        <ProductsOverview 
          products={formattedProducts} 
          slug={slug} 
        />
        <MessagesPreview 
          messages={formattedMessages} 
        />
      </div>

      <PlanStatusBar 
        entitlements={entitlements}
        currentProducts={totalProducts}
        currentCategories={totalCategories}
        planStartDate={planStartDate}
        planEndDate={planEndDate}
      />
    </main>
  );
}
