// =====================================================
// useCulqiCallback — Hook-level tests
// =====================================================
// Strict TDD: tests written BEFORE implementation.

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks (must be before imports) ───────────────────

const mockChargePayment = vi.fn();
vi.mock('@/shared/payments/paymentApi', () => ({
  chargePayment: mockChargePayment,
}));

const mockPosthogCapture = vi.fn();
vi.mock('posthog-js', () => ({
  posthog: { capture: mockPosthogCapture },
}));

// ── Helpers ──────────────────────────────────────────

function createMockCartItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    name: 'Camiseta Algodón',
    category: 'Ropa',
    stock: 10,
    price: '150',
    currency: 'PEN',
    status: 'Active',
    image: '/img/test.jpg',
    quantity: 2,
    ...overrides,
  };
}

function createDefaultOptions(overrides: Record<string, unknown> = {}) {
  const paymentGuardRef = { current: false };
  const culqiCallbackGuardRef = { current: false };
  const onOrderPaid = vi.fn();
  const onPaymentInstructions = vi.fn();
  const onError = vi.fn();
  const onCulqiProcessingChange = vi.fn();
  const onPaymentProcessingChange = vi.fn();

  return {
    culqiReady: true,
    finalTotal: 500,
    businessId: 'test-business-uuid',
    cartItems: [createMockCartItem()] as [
      typeof createMockCartItem extends (...args: unknown[]) => infer R ? R : never,
    ],
    email: 'test@example.com',
    shippingInfo: {
      courier: 'recojo',
      department: '',
      province: '',
      district: '',
      phone: '999888777',
      dni: '12345678',
      cost: 0,
    },
    slug: 'test-slug',
    customerAuth: null,
    onCulqiProcessingChange,
    onPaymentProcessingChange,
    paymentGuardRef,
    culqiCallbackGuardRef,
    onOrderPaid,
    onPaymentInstructions,
    onError,
    ...overrides,
  };
}

// ── Suite ────────────────────────────────────────────

describe('useCulqiCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Clean up globals
    delete (window as any).Culqi;
    delete (window as any).culqi;
  });

  afterEach(() => {
    delete (window as any).Culqi;
    delete (window as any).culqi;
  });

  test('registers window.culqi when culqiReady is true', async () => {
    const { useCulqiCallback } = await import('@/features/payment/hooks/useCulqiCallback');
    const options = createDefaultOptions();

    renderHook(() => useCulqiCallback(options));

    expect(window.culqi).toBeDefined();
    expect(typeof window.culqi).toBe('function');
  });

  test('does NOT register window.culqi when culqiReady is false', async () => {
    const { useCulqiCallback } = await import('@/features/payment/hooks/useCulqiCallback');

    renderHook(() => useCulqiCallback(createDefaultOptions({ culqiReady: false })));

    expect(window.culqi).toBeUndefined();
  });

  test('token flow calls onOrderPaid on successful charge', async () => {
    mockChargePayment.mockResolvedValue({
      success: true,
      charge: { id: 'ch_123', status: 'paid' },
      payment: { trackingToken: 'tt_abc' },
    });

    const { useCulqiCallback } = await import('@/features/payment/hooks/useCulqiCallback');
    const options = createDefaultOptions();
    renderHook(() => useCulqiCallback(options));

    // Simulate Culqi token callback
    (window as any).Culqi = {
      token: { id: 'tok_test_abc', type: 'card' },
      close: vi.fn(),
    };

    expect(window.culqi).toBeDefined();
    await act(async () => {
      await (window.culqi as () => Promise<void>)();
    });

    expect(mockChargePayment).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok_test_abc' }),
    );
    await waitFor(() => {
      expect(options.onOrderPaid).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: 'Tarjeta' }),
      );
    });
    expect(options.paymentGuardRef.current).toBe(false);
  });

  test('token flow calls onError when chargePayment fails', async () => {
    mockChargePayment.mockRejectedValue(new Error('Payment declined'));

    const { useCulqiCallback } = await import('@/features/payment/hooks/useCulqiCallback');
    const options = createDefaultOptions();
    renderHook(() => useCulqiCallback(options));

    (window as any).Culqi = {
      token: { id: 'tok_test_abc', type: 'card' },
      close: vi.fn(),
    };

    await act(async () => {
      await (window.culqi as () => Promise<void>)();
    });

    await waitFor(() => {
      expect(options.onError).toHaveBeenCalledWith('Payment declined');
    });
  });

  test('order flow with async payment calls onPaymentInstructions', async () => {
    const { useCulqiCallback } = await import('@/features/payment/hooks/useCulqiCallback');
    const options = createDefaultOptions();
    renderHook(() => useCulqiCallback(options));

    (window as any).Culqi = {
      order: {
        id: 'ord_culqi_abc',
        payment_method: 'pago_efectivo',
        cip_code: '1234567890',
        action: {},
        expiration_date: Math.floor(Date.now() / 1000) + 86400,
      },
      close: vi.fn(),
    };

    await act(async () => {
      await (window.culqi as () => Promise<void>)();
    });

    await waitFor(() => {
      expect(options.onPaymentInstructions).toHaveBeenCalledWith(
        expect.objectContaining({
          culqiOrderId: 'ord_culqi_abc',
          paymentMethod: 'pago_efectivo',
          paymentCode: '1234567890',
        }),
      );
    });
  });

  test('cleanup resets window.culqi on unmount', async () => {
    const { useCulqiCallback } = await import('@/features/payment/hooks/useCulqiCallback');
    const options = createDefaultOptions();

    const { unmount } = renderHook(() => useCulqiCallback(options));

    expect(window.culqi).toBeDefined();

    unmount();

    expect(window.culqi).toBeUndefined();
  });

  test('guard ref prevents re-entry when culqiCallbackGuardRef is true', async () => {
    const { useCulqiCallback } = await import('@/features/payment/hooks/useCulqiCallback');
    const options = createDefaultOptions();
    options.culqiCallbackGuardRef.current = true; // Guard already locked

    renderHook(() => useCulqiCallback(options));

    (window as any).Culqi = {
      token: { id: 'tok_test_abc', type: 'card' },
      close: vi.fn(),
    };

    await act(async () => {
      await (window.culqi as () => Promise<void>)();
    });

    // chargePayment should NOT be called because guard prevented it
    expect(mockChargePayment).not.toHaveBeenCalled();
  });

  test('order flow paid calls onOrderPaid with charge', async () => {
    mockChargePayment.mockResolvedValue({
      success: true,
      charge: { id: 'ch_456', status: 'paid' },
      payment: { trackingToken: 'tt_def' },
    });

    const { useCulqiCallback } = await import('@/features/payment/hooks/useCulqiCallback');
    const options = createDefaultOptions();
    renderHook(() => useCulqiCallback(options));

    (window as any).Culqi = {
      order: {
        id: 'ord_culqi_paid',
        status: 'paid',
        amount: 50000,
      },
      close: vi.fn(),
    };

    await act(async () => {
      await (window.culqi as () => Promise<void>)();
    });

    await waitFor(() => {
      expect(mockChargePayment).toHaveBeenCalledWith(
        expect.objectContaining({ culqiOrderId: 'ord_culqi_paid' }),
      );
    });
    await waitFor(() => {
      expect(options.onOrderPaid).toHaveBeenCalled();
    });
  });

  test('analytics capture is called on successful token payment', async () => {
    mockChargePayment.mockResolvedValue({
      success: true,
      charge: { id: 'ch_789', status: 'paid' },
      payment: { trackingToken: 'tt_ghi' },
    });

    const { useCulqiCallback } = await import('@/features/payment/hooks/useCulqiCallback');
    const options = createDefaultOptions();
    renderHook(() => useCulqiCallback(options));

    (window as any).Culqi = {
      token: { id: 'tok_yape_1', type: 'yape' },
      close: vi.fn(),
    };

    await act(async () => {
      await (window.culqi as () => Promise<void>)();
    });

    await waitFor(() => {
      expect(mockPosthogCapture).toHaveBeenCalledWith(
        'order_created',
        expect.objectContaining({ businessSlug: 'test-slug' }),
      );
      expect(mockPosthogCapture).toHaveBeenCalledWith(
        'payment_completed',
        expect.objectContaining({ method: 'Yape' }),
      );
    });
  });
});
