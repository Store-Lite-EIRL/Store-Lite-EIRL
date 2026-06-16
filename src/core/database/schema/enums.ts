// =====================================================
// DRIZZLE ORM ENUMS - Virtual Stores Platform
// =====================================================

import { pgEnum } from 'drizzle-orm/pg-core';

export const themeModeEnum = pgEnum('theme_mode', ['light', 'dark']);
export const contrastLevelEnum = pgEnum('contrast_level', ['standard', 'medium', 'high']);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'validando',
  'not_delivered',
  'delivered',
  'en_reparto',
  // @deprecated — legacy status, kept for backward compatibility with existing DB records
  'esperando_confirmacion',
  'completed',
  'failed',
  'disputed',
  'refund_requested',
  'refunded',
]);
export const paymentMethodEnum = pgEnum('payment_method', [
  'card',
  'yape',
  'plin',
  'pago_efectivo',
  'billetera_movil',
  'cuotealo',
]);
export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'basico',
  'emprendedor',
  'business_pro',
  'enterprise_ai',
]);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'inactive',
  'past_due',
  'canceled',
  'expired',
  'trialing',
]);
export const shippingTypeEnum = pgEnum('shipping_type', ['agencia', 'domicilio', 'recojo']);
export const planPaymentStatusEnum = pgEnum('plan_payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
  'disputed',
]);

// =====================================================
// NOTIFICATION ENUMS
// =====================================================

// Tipos de notificación - acción específica que ocurrió
export const notificationTypeEnum = pgEnum('notification_type', [
  // Chat
  'message_new',
  'message_unread',
  // Almacén (stock)
  'stock_low',
  'stock_out',
  // Plan
  'plan_expiring',
  'plan_expired',
  'plan_upgraded',
  // Pedidos
  'order_created',
  'order_status_changed',
  'order_shipped',
  'order_finalization_requested',
  'order_finalization_confirmed',
  'order_finalization_rejected',
  'order_auto_finalized',
  // Sistema
  'system',
]);

// Categorías de notificación - para filtrado en UI
export const notificationCategoryEnum = pgEnum('notification_category', [
  'chat',
  'almacen',
  'plan',
  'pedidos',
  'sistema',
]);

// =====================================================
// PAYMENT ORDERS ENUM
// =====================================================

export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'expired', 'cancelled']);

// =====================================================
// IMPORT ENUMS
// =====================================================

export const importJobStatusEnum = pgEnum('import_job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export const importRowStatusEnum = pgEnum('import_row_status', [
  'pending',
  'processing',
  'completed',
  'error',
]);
