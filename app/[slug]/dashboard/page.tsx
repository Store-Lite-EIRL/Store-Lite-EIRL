import { notFound, redirect } from 'next/navigation';
import { eq, and, count, desc, sql, gte, lt, sum, lte, gt } from 'drizzle-orm';
import { replaceSlugInPath, resolveBusinessSlug } from '@/core/business/slug';
import { db } from '@/core/database/client';
import { 
  products, 
  productCategories, 
  formMessages, 
  productLikes,
  businessSubscriptions,
  payments,
  messages
} from '@/core/database/schema';
import { getBusinessEntitlements } from '@/core/entitlements/getBusinessEntitlements';

import { DashboardHeader } from './components/DashboardHeader';
import { StatCards } from './components/StatCards';
import { EarningsStats } from './components/EarningsStats';
import { MarketInsights } from './components/MarketInsights';
import { InventoryAlerts } from './components/InventoryAlerts';
import { NotificationsPreview } from './components/NotificationsPreview';
import { PlanStatusBar } from './components/PlanStatusBar';
import { RecentOrders } from './components/RecentOrders';

import styles from './dashboard.module.css';

interface DashboardProps {
  params: Promise<{ slug: string }>;
}

export default async function Dashboard({ params }: DashboardProps) {
  const { slug } = await params;
  const lastUpdatedAt = new Date().toISOString();

  // 1. Fetch business core data
  const resolvedBusiness = await resolveBusinessSlug(slug);
  const business = resolvedBusiness?.business;

  if (!business) {
    return notFound();
  }

  if (resolvedBusiness.matchedAlias) {
    redirect(replaceSlugInPath(`/${slug}/dashboard`, slug, resolvedBusiness.canonicalSlug));
  }

  // ─── Time Period Definitions ───
  const now = new Date();
  
  // Today vs Yesterday
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  // This Week (Last 7 days)
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // This Month (Last 30 days)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

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

  // 3. Parallel fetching for stats & financial analysis
  const [
    counts,
    inventoryData,
    financialMetrics,
    recentOrdersData
  ] = await Promise.all([
    // Group 1: General Counts & Alerts Prep
    Promise.all([
      db.select({ count: count() }).from(products).where(eq(products.businessId, business.id)),
      db.select({ count: count() }).from(productCategories).where(eq(productCategories.businessId, business.id)),
      // Unread Form Messages + Unread Chat Messages
      db.select({ count: count() }).from(formMessages).where(and(eq(formMessages.businessId, business.id), eq(formMessages.isRead, false))),
      db.select({ count: count() })
        .from(messages)
        .innerJoin(products, eq(products.businessId, business.id))
        .where(and(eq(messages.isRead, false), eq(messages.isFromStore, false))),
      db.select({ count: count() })
        .from(productLikes)
        .innerJoin(products, eq(productLikes.productId, products.id))
        .where(eq(products.businessId, business.id)),
      db.select({ count: count() }).from(payments).where(and(eq(payments.businessId, business.id), eq(payments.status, 'paid'))),
      // Out of Stock & Low Stock Counts
      db.select({ count: count() }).from(products).where(and(eq(products.businessId, business.id), eq(products.stock, 0))),
      db.select({ count: count() }).from(products).where(and(eq(products.businessId, business.id), gt(products.stock, 0), lte(products.stock, 5))),
      // Added this week
      db.select({ count: count() }).from(products).where(and(eq(products.businessId, business.id), gte(products.createdAt, sevenDaysAgo)))
    ]),

    // Group 2: Inventory Lists
    Promise.all([
      // Top Liked
      db.query.products.findMany({
        where: eq(products.businessId, business.id),
        limit: 4,
        orderBy: [desc(products.stars)],
      }),
      // Out of Stock
      db.query.products.findMany({
        where: and(eq(products.businessId, business.id), eq(products.stock, 0)),
        limit: 4,
        orderBy: [desc(products.updatedAt)],
      }),
      // Low Stock
      db.query.products.findMany({
        where: and(eq(products.businessId, business.id), gt(products.stock, 0), lte(products.stock, 5)),
        limit: 4,
        orderBy: [desc(products.stock)],
      })
    ]),

    // Group 3: Financials
    Promise.all([
      // Daily Earnings
      db.select({ sum: sum(payments.amount) }).from(payments).where(and(eq(payments.businessId, business.id), eq(payments.status, 'paid'), gte(payments.createdAt, startOfToday))),
      db.select({ sum: sum(payments.amount) }).from(payments).where(and(eq(payments.businessId, business.id), eq(payments.status, 'paid'), gte(payments.createdAt, startOfYesterday), lt(payments.createdAt, startOfToday))),
      
      // Weekly Earnings
      db.select({ sum: sum(payments.amount) }).from(payments).where(and(eq(payments.businessId, business.id), eq(payments.status, 'paid'), gte(payments.createdAt, sevenDaysAgo))),
      db.select({ sum: sum(payments.amount) }).from(payments).where(and(eq(payments.businessId, business.id), eq(payments.status, 'paid'), gte(payments.createdAt, fourteenDaysAgo), lt(payments.createdAt, sevenDaysAgo))),

      // Monthly Earnings
      db.select({ sum: sum(payments.amount) }).from(payments).where(and(eq(payments.businessId, business.id), eq(payments.status, 'paid'), gte(payments.createdAt, thirtyDaysAgo))),
      db.select({ sum: sum(payments.amount) }).from(payments).where(and(eq(payments.businessId, business.id), eq(payments.status, 'paid'), gte(payments.createdAt, sixtyDaysAgo), lt(payments.createdAt, thirtyDaysAgo))),

      // Top Products by Sales
      db.select({ name: products.title, count: count(payments.id) }).from(payments).innerJoin(products, eq(payments.productId, products.id)).where(and(eq(payments.businessId, business.id), eq(payments.status, 'paid'))).groupBy(products.title).orderBy(desc(count(payments.id))).limit(5),

      // Top Categories by Sales
      db.select({ name: productCategories.name, count: count(payments.id) }).from(payments).innerJoin(products, eq(payments.productId, products.id)).innerJoin(productCategories, eq(products.categoryId, productCategories.id)).where(and(eq(payments.businessId, business.id), eq(payments.status, 'paid'))).groupBy(productCategories.name).orderBy(desc(count(payments.id))).limit(5),

      // Best Days
      db.select({ day: sql<number>`EXTRACT(DOW FROM ${payments.createdAt})`, count: count(payments.id) }).from(payments).where(and(eq(payments.businessId, business.id), eq(payments.status, 'paid'), gte(payments.createdAt, sevenDaysAgo))).groupBy(sql`EXTRACT(DOW FROM ${payments.createdAt})`)
    ]),

    // Group 4: Recent Orders
    db.query.payments.findMany({
      where: eq(payments.businessId, business.id),
      limit: 10,
      orderBy: [desc(payments.createdAt)],
      with: { product: { columns: { title: true } } }
    })
  ]);

  // ─── Extract Results ───
  const productsCount = counts[0][0]?.count || 0;
  const categoriesCount = counts[1][0]?.count || 0;
  const unreadMessagesCount = (counts[2][0]?.count || 0) + (counts[3][0]?.count || 0);
  const totalLikes = counts[4][0]?.count || 0;
  const totalSold = counts[5][0]?.count || 0;
  const outOfStockCount = counts[6][0]?.count || 0;
  const lowStockCount = counts[7][0]?.count || 0;
  const addedThisWeekCount = counts[8][0]?.count || 0;

  const topLiked = inventoryData[0];
  const outOfStock = inventoryData[1];
  const lowStock = inventoryData[2];

  const financialData = financialMetrics;
  
  // ─── Formatting Helpers ───
  const getAmount = (res: any) => parseFloat(res[0]?.sum || '0');
  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const earnings = {
    daily: { label: 'Hoy', amount: `S/ ${getAmount(financialData[0]).toFixed(2)}`, percentage: calcChange(getAmount(financialData[0]), getAmount(financialData[1])), isPositive: getAmount(financialData[0]) >= getAmount(financialData[1]), color: 'blue' as const },
    weekly: { label: 'Semanal', amount: `S/ ${getAmount(financialData[2]).toFixed(2)}`, percentage: calcChange(getAmount(financialData[2]), getAmount(financialData[3])), isPositive: getAmount(financialData[2]) >= getAmount(financialData[3]), color: 'green' as const },
    monthly: { label: 'Mensual', amount: `S/ ${getAmount(financialData[4]).toFixed(2)}`, percentage: calcChange(getAmount(financialData[4]), getAmount(financialData[5])), isPositive: getAmount(financialData[4]) >= getAmount(financialData[5]), color: 'purple' as const },
  };

  // Format Market Insights
  const maxProductSales = Math.max(...financialData[6].map(p => Number(p.count)), 1);
  const topProducts = financialData[6].map(p => ({ name: p.name, count: Number(p.count), progress: Math.round((Number(p.count) / maxProductSales) * 100) }));
  const maxCategorySales = Math.max(...financialData[7].map(c => Number(c.count)), 1);
  const topCategories = financialData[7].map(c => ({ name: c.name, count: Number(c.count), progress: Math.round((Number(c.count) / maxCategorySales) * 100) }));
  const dayMap: Record<number, string> = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mie', 4: 'Jue', 5: 'Vie', 6: 'Sab' };
  const maxDaySales = Math.max(...financialData[8].map(d => Number(d.count)), 1);
  const bestDays = [1, 2, 3, 4, 5, 6, 0].map(dayNum => {
    const found = financialData[8].find(d => Number(d.day) === dayNum);
    return { day: dayMap[dayNum], intensity: found ? Math.round((Number(found.count) / maxDaySales) * 100) : 0 };
  });

  // ─── Generate Notifications ───
  const notifications = [];
  
  // Plan Expiry Notification
  if (subscription?.planEndDate) {
    const daysLeft = Math.ceil((new Date(subscription.planEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      notifications.push({
        id: 'plan-expiry',
        type: daysLeft <= 3 ? 'error' : 'warning',
        title: 'Plan próximo a vencer',
        message: daysLeft <= 0 ? 'Tu plan ha vencido. Renueva para mantener el servicio.' : `Tu plan vence en ${daysLeft} día${daysLeft > 1 ? 's' : ''}.`,
      });
    }
  }

  // Stock Notifications
  if (outOfStockCount > 0) {
    notifications.push({
      id: 'out-of-stock',
      type: 'error',
      title: 'Productos agotados',
      message: `Tenés ${outOfStockCount} producto${outOfStockCount > 1 ? 's' : ''} sin stock actualmente.`,
    });
  } else if (lowStockCount > 0) {
    notifications.push({
      id: 'low-stock',
      type: 'warning',
      title: 'Stock bajo',
      message: `${lowStockCount} producto${lowStockCount > 1 ? 's' : ''} tienen menos de 5 unidades.`,
    });
  }

  // Unread Messages Notification
  if (unreadMessagesCount > 0) {
    notifications.push({
      id: 'unread-messages',
      type: 'info',
      title: 'Mensajes pendientes',
      message: `Tenés ${unreadMessagesCount} mensaje${unreadMessagesCount > 1 ? 's' : ''} sin leer.`,
    });
  }

  // New Products Info
  if (addedThisWeekCount > 0) {
    notifications.push({
      id: 'new-products',
      type: 'info',
      title: 'Actividad semanal',
      message: `Agregaste ${addedThisWeekCount} producto${addedThisWeekCount > 1 ? 's' : ''} esta semana.`,
    });
  }

  // Format orders for Urbano Component
  const formattedOrders = recentOrdersData.map((order) => ({
    id: order.id,
    productTitle: order.product?.title || 'Producto desconocido',
    amount: order.amount.toString(),
    currency: order.currency,
    status: order.status as any,
    shippingAddress: order.shippingAddress,
    shippingDistrict: order.shippingDistrict,
    shippingProvince: order.shippingProvince,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
  }));

  const planStartDate = subscription?.planStartDate instanceof Date ? subscription.planStartDate.toISOString() : subscription?.planStartDate;
  const planEndDate = subscription?.planEndDate instanceof Date ? subscription.planEndDate.toISOString() : subscription?.planEndDate;

  return (
    <main className={styles.dashboardRoot}>
      <DashboardHeader businessName={business.name} logoUrl={business.logoUrl} entitlements={entitlements} planEndDate={planEndDate} />

      <StatCards totalProducts={productsCount} totalCategories={categoriesCount} unreadMessages={unreadMessagesCount} totalLikes={totalLikes} totalSold={totalSold} entitlements={entitlements} />

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Notificaciones y Alertas</h2>
      </div>

      <NotificationsPreview notifications={notifications} />

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Análisis de Ventas</h2>
      </div>

      <EarningsStats data={earnings} />

      <MarketInsights topProducts={topProducts} topCategories={topCategories} bestDays={bestDays} />

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Estado de Inventario</h2>
      </div>

      <InventoryAlerts 
        topLiked={topLiked.map(p => ({ id: p.id, title: p.title, stars: p.stars || 0 }))}
        outOfStock={outOfStock.map(p => ({ id: p.id, title: p.title }))}
        lowStock={lowStock.map(p => ({ id: p.id, title: p.title, stock: p.stock }))}
      />

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Estado de pedidos Recientes </h2>
      </div>

      <RecentOrders orders={formattedOrders} />

      <PlanStatusBar entitlements={entitlements} currentProducts={productsCount} currentCategories={categoriesCount} planStartDate={planStartDate} planEndDate={planEndDate} lastUpdatedAt={lastUpdatedAt} />
    </main>
  );
}