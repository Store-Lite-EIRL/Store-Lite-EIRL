import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { captureEvent } from '../capture';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockPostHogCapture = vi.fn();
const mockGetPostHogClient = vi.fn(() => ({ capture: mockPostHogCapture }));

vi.mock('@/lib/posthogServer', () => ({
  getPostHogClient: () => mockGetPostHogClient(),
}));

const mockGetAnalyticsContext = vi.fn();

vi.mock('../context', () => ({
  getAnalyticsContext: () => mockGetAnalyticsContext(),
}));

describe('captureEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls PostHog with context when session exists', async () => {
    mockGetAnalyticsContext.mockResolvedValue({
      userId: 'u-1',
      businessId: 'b-2',
      plan: 'pro',
    });

    await captureEvent('product_created', { productName: 'Shirt' });

    expect(mockPostHogCapture).toHaveBeenCalledWith({
      distinctId: 'u-1',
      event: 'product_created',
      properties: {
        user_id: 'u-1',
        business_id: 'b-2',
        plan: 'pro',
        productName: 'Shirt',
      },
    });
  });

  it('omits user/business context when no session', async () => {
    mockGetAnalyticsContext.mockResolvedValue({
      userId: null,
      businessId: null,
      plan: 'none',
    });

    await captureEvent('checkout_started');

    expect(mockPostHogCapture).toHaveBeenCalledWith({
      distinctId: 'anonymous',
      event: 'checkout_started',
      properties: {},
    });
  });

  it('scrubs email PII from event properties', async () => {
    mockGetAnalyticsContext.mockResolvedValue({
      userId: 'u-1',
      businessId: 'b-2',
      plan: 'pro',
    });

    await captureEvent('payment_completed', { email: 'secret@hidden.com', amount: 100 });

    expect(mockPostHogCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          email: '[REDACTED_EMAIL]',
          amount: 100,
        }),
      }),
    );
  });

  it('scrubs phone PII from event properties', async () => {
    mockGetAnalyticsContext.mockResolvedValue({
      userId: 'u-1',
      businessId: 'b-2',
      plan: 'pro',
    });

    await captureEvent('payment_completed', { phone: '+1234567890' });

    expect(mockPostHogCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          phone: '[REDACTED_PHONE]',
        }),
      }),
    );
  });
});
