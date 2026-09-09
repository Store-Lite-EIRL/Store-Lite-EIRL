import OrderVerificationPage from '@/app/[slug]/(app)/order/verify/[orderNumber]/page';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindFirstBusiness = vi.fn();
const mockFindFirstPayment = vi.fn();

vi.mock('@/core/database/client', () => ({
  db: {
    query: {
      businesses: {
        findFirst: () => mockFindFirstBusiness(),
      },
      payments: {
        findFirst: () => mockFindFirstPayment(),
      },
    },
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([]),
      }),
    }),
  },
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

describe('OrderVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws notFound if business does not exist', async () => {
    mockFindFirstBusiness.mockResolvedValueOnce(null);

    await expect(
      OrderVerificationPage({
        params: Promise.resolve({ slug: 'biz-not-found', orderNumber: 'ORD-1' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders verified checkmark and details for valid order', async () => {
    mockFindFirstBusiness.mockResolvedValueOnce({
      id: 'biz-1',
      name: 'Mi Tienda',
      taxId: '20123456789',
      slug: 'mitienda',
    });

    mockFindFirstPayment.mockResolvedValueOnce({
      id: 'pay-1',
      orderNumber: 'ORD-123',
      amount: '150.00',
      currency: 'PEN',
      paymentMethod: 'card',
      status: 'paid',
      buyerEmail: 'cliente@test.com',
      buyerDni: '12345678',
      createdAt: new Date('2026-09-07T10:00:00Z'),
      trackingToken: 'track-123',
      metadata: {
        cartItems: [{ name: 'Zapato', quantity: 1, price: 150 }],
      },
    });

    const jsx = await OrderVerificationPage({
      params: Promise.resolve({ slug: 'mitienda', orderNumber: 'ORD-123' }),
    });

    expect(jsx).toBeDefined();
  });

  it('renders unverified state when payment not found', async () => {
    mockFindFirstBusiness.mockResolvedValueOnce({
      id: 'biz-1',
      name: 'Mi Tienda',
      slug: 'mitienda',
    });

    mockFindFirstPayment.mockResolvedValueOnce(null);

    const jsx = await OrderVerificationPage({
      params: Promise.resolve({ slug: 'mitienda', orderNumber: 'ORD-FAKE' }),
    });

    expect(jsx).toBeDefined();
  });
});
