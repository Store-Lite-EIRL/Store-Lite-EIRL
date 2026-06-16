// =====================================================
// DRIZZLE ORM TYPE EXPORTS - Virtual Stores Platform
// =====================================================

import type {
  notificationCategoryEnum,
  notificationTypeEnum,
  orderStatusEnum,
  subscriptionPlanEnum,
  subscriptionStatusEnum,
} from './enums';

// =====================================================
// ENUM VALUE TYPES
// =====================================================

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type SubscriptionPlan = (typeof subscriptionPlanEnum.enumValues)[number];
export type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
export type NotificationCategory = (typeof notificationCategoryEnum.enumValues)[number];

// =====================================================
// HELPERS
// =====================================================

// Helper: ticket number formatter (usar donde se necesite mostrar el número)
export function formatTicketNumber(series: string, correlative: number): string {
  return `${series}-${String(correlative).padStart(8, '0')}`;
}
