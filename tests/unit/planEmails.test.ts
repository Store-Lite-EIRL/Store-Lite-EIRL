// =====================================================
// src/lib/email/planEmails — Unit tests
// =====================================================
// Verifies that sendPlanPurchaseConfirmationEmail:
//  - sends the purchase confirmation email with the right
//    recipient, subject and rendered ticket data
//  - skips sending when buyer email or business is missing
// =====================================================

import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────
// Must be before module imports (vi.mock is hoisted)

const { mockBusinessFindFirst, mockSendEmail } = vi.hoisted(() => ({
  mockBusinessFindFirst: vi.fn(),
  mockSendEmail: vi.fn(),
}));

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      businesses: { findFirst: mockBusinessFindFirst },
    },
  },
}));

vi.mock('@/lib/email/resend', () => ({
  sendEmail: mockSendEmail,
}));

import { sendPlanPurchaseConfirmationEmail } from '@/lib/email/planEmails';

// ── Shared helpers ───────────────────────────────────

function makePlanPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'plan_pay_123',
    businessId: 'biz_123',
    buyerEmail: 'buyer@example.com',
    buyerFullName: 'ACME SAC',
    buyerDocumentType: 'RUC',
    buyerDocumentNumber: '20123456789',
    planType: 'business_pro',
    amountTotal: '149.00',
    ticketSeries: 'B001',
    ticketCorrelative: 42,
    ticketUrl: 'https://example.com/tickets/boleta.png',
    planEndDate: new Date('2026-09-16T23:59:59Z'),
    ...overrides,
  };
}

// ── Suite ────────────────────────────────────────────

describe('sendPlanPurchaseConfirmationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBusinessFindFirst.mockResolvedValue({ slug: 'mi-tienda', name: 'Mi Tienda' });
  });

  test('sends the confirmation email to the buyer with a boleta subject', async () => {
    await sendPlanPurchaseConfirmationEmail(makePlanPayment(), 'biz_123');

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const params = mockSendEmail.mock.calls[0][0];
    expect(params.to).toBe('buyer@example.com');
    expect(params.subject).toContain('boleta');
    expect(params.subject).toContain('Store Lite');
  });

  test('renders ticket number, formatted amount and plan name in the html', async () => {
    await sendPlanPurchaseConfirmationEmail(makePlanPayment(), 'biz_123');

    const html = mockSendEmail.mock.calls[0][0].html;
    expect(html).toContain('B001-00000042');
    expect(html).toContain('S/ 149.00');
    expect(html).toContain('Business Pro');
  });

  test('renders the plan end date line prominently', async () => {
    await sendPlanPurchaseConfirmationEmail(makePlanPayment(), 'biz_123');

    const html = mockSendEmail.mock.calls[0][0].html;
    expect(html).toMatch(/plan está activo hasta el/);
  });

  test('formats ticket number padding for different correlatives', async () => {
    await sendPlanPurchaseConfirmationEmail(makePlanPayment({ ticketCorrelative: 7 }), 'biz_123');

    const html = mockSendEmail.mock.calls[0][0].html;
    expect(html).toContain('B001-00000007');
  });

  test('skips sending when buyer email is missing', async () => {
    await sendPlanPurchaseConfirmationEmail(makePlanPayment({ buyerEmail: null }), 'biz_123');

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  test('skips sending when business is not found', async () => {
    mockBusinessFindFirst.mockResolvedValue(null);

    await sendPlanPurchaseConfirmationEmail(makePlanPayment(), 'biz_123');

    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
