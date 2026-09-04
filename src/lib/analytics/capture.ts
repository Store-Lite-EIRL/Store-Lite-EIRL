/**
 * Analytics Capture Wrapper
 *
 * Thin wrapper around PostHog server client that:
 * 1. Auto-injects context (userId, businessId, plan)
 * 2. Scrubs PII from properties
 * 3. Single import point for all event captures
 */

import type { AnalyticsEvents } from '@/lib/analytics/taxonomy';
import { AnalyticsTags } from '@/lib/analytics/taxonomy';
import { scrubPII } from '@/lib/piiScrubber';
import { getPostHogClient } from '@/lib/posthogServer';

import { getAnalyticsContext, type AnalyticsContext } from './context';

type EventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/**
 * Capture an analytics event via PostHog.
 * Context (user_id, business_id, plan) is auto-injected.
 * PII is scrubbed from all properties.
 */
export async function captureEvent(
  event: EventName,
  properties?: Record<string, unknown>,
): Promise<void> {
  const ctx: AnalyticsContext = await getAnalyticsContext();
  const client = getPostHogClient();

  const cleanProps = properties ? scrubPII(properties) : {};

  const mergedProperties: Record<string, unknown> = {};

  if (ctx.userId) {
    mergedProperties[AnalyticsTags.USER_ID] = ctx.userId;
  }
  if (ctx.businessId) {
    mergedProperties[AnalyticsTags.BUSINESS_ID] = ctx.businessId;
  }
  if (ctx.plan !== 'none') {
    mergedProperties[AnalyticsTags.PLAN] = ctx.plan;
  }

  Object.assign(mergedProperties, cleanProps);

  client.capture({
    distinctId: ctx.userId ?? 'anonymous',
    event,
    properties: mergedProperties,
  });
}
