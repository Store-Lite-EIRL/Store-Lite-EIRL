import { describe, expect, it } from 'vitest';

import { AnalyticsEvents, AnalyticsTags } from '../taxonomy';

describe('AnalyticsEvents', () => {
  it('exports all five funnel events with correct snake_case values', () => {
    expect(AnalyticsEvents.USER_SIGNED_UP).toBe('user_signed_up');
    expect(AnalyticsEvents.BUSINESS_CREATED).toBe('business_created');
    expect(AnalyticsEvents.PRODUCT_CREATED).toBe('product_created');
    expect(AnalyticsEvents.CHECKOUT_STARTED).toBe('checkout_started');
    expect(AnalyticsEvents.PAYMENT_COMPLETED).toBe('payment_completed');
  });

  it('has exactly five events (no extra, no missing)', () => {
    const keys = Object.keys(AnalyticsEvents);
    expect(keys).toHaveLength(5);
  });

  it('uses constant values that are unique', () => {
    const values = Object.values(AnalyticsEvents);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe('AnalyticsTags', () => {
  it('exports all three tag keys with correct values', () => {
    expect(AnalyticsTags.USER_ID).toBe('user_id');
    expect(AnalyticsTags.BUSINESS_ID).toBe('business_id');
    expect(AnalyticsTags.PLAN).toBe('plan');
  });

  it('has exactly three tags', () => {
    const keys = Object.keys(AnalyticsTags);
    expect(keys).toHaveLength(3);
  });
});
