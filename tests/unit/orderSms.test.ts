import { beforeEach, describe, expect, test, vi } from 'vitest';

// ─── Hoisted mocks (must be before vi.mock calls) ───

const { mockSendSms } = vi.hoisted(() => ({
  mockSendSms: vi.fn(),
}));

// ─── Mock env ───

vi.mock('@/config/env', () => ({
  env: {
    nextPublicAppUrl: 'http://test.com',
  },
}));

// ─── Mock jsonpe dependency ───

vi.mock('@/lib/sms/jsonpe', () => ({
  sendSms: mockSendSms,
}));

// ─── Subject under test ───

import { ORDER_STATUS_V2 } from '@/core/orders/orderStatus';
import { sendOrderStatusSms } from '@/lib/twilio/orderSms';

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================
// sendOrderStatusSms — Unit tests
// =====================================================

describe('sendOrderStatusSms', () => {
  test('sends SMS with correct phone and message for PAID status', async () => {
    await sendOrderStatusSms({
      toStatus: ORDER_STATUS_V2.PAID,
      buyerPhone: '51999999999',
      businessSlug: 'my-shop',
      businessName: 'My Shop',
      trackingToken: 'tok-123',
    });

    expect(mockSendSms).toHaveBeenCalledTimes(1);
    expect(mockSendSms).toHaveBeenCalledWith(
      '51999999999',
      expect.stringContaining('http://test.com/my-shop/order/tok-123'),
    );
  });

  test('skips SMS when buyerPhone is empty', async () => {
    await sendOrderStatusSms({
      toStatus: ORDER_STATUS_V2.PAID,
      buyerPhone: '',
      businessSlug: 'my-shop',
      businessName: 'My Shop',
      trackingToken: 'tok-123',
    });

    expect(mockSendSms).not.toHaveBeenCalled();
  });

  test('skips SMS when status has no matching template', async () => {
    await sendOrderStatusSms({
      toStatus: 'NONEXISTENT_STATUS' as any,
      buyerPhone: '51999999999',
      businessSlug: 'my-shop',
      businessName: 'My Shop',
      trackingToken: 'tok-123',
    });

    expect(mockSendSms).not.toHaveBeenCalled();
  });

  test('includes the correct message template text for PAID', async () => {
    await sendOrderStatusSms({
      toStatus: ORDER_STATUS_V2.PAID,
      buyerPhone: '51999999999',
      businessSlug: 'my-shop',
      businessName: 'My Shop',
      trackingToken: 'tok-123',
    });

    expect(mockSendSms).toHaveBeenCalledWith(
      '51999999999',
      expect.stringContaining('Compra confirmada'),
    );
  });
});
