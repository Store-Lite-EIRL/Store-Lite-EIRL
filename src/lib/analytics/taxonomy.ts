/**
 * Analytics Taxonomy
 *
 * Single source of truth for event names and tag keys
 * across Sentry and PostHog. Using `as const` objects
 * for zero runtime cost and full TypeScript autocomplete.
 */

export const AnalyticsEvents = {
  USER_SIGNED_UP: 'user_signed_up',
  BUSINESS_CREATED: 'business_created',
  PRODUCT_CREATED: 'product_created',
  CHECKOUT_STARTED: 'checkout_started',
  PAYMENT_COMPLETED: 'payment_completed',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export const AnalyticsTags = {
  USER_ID: 'user_id',
  BUSINESS_ID: 'business_id',
  PLAN: 'plan',
} as const;

export type AnalyticsTagKey = (typeof AnalyticsTags)[keyof typeof AnalyticsTags];
