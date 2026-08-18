// =====================================================
// Checkout — Component-level tests
// =====================================================

import type { CartItem } from '@/features/storage/context/CartContext';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// ── Mocks ────────────────────────────────────────────

const mockUseParams = vi.fn(() => ({ slug: 'test-slug' }));
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};
vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: () => mockRouter,
}));

const mockGetSession = vi.fn();
const mockSetSession = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      setSession: mockSetSession,
    },
  }),
}));

// ── Helpers ──────────────────────────────────────────

function createMockCartItem(overrides: Partial<CartItem> = {}): CartItem {
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

function createCheckoutProps(overrides: Record<string, unknown> = {}) {
  const item = createMockCartItem();
  return {
    totalAmount: 1500, // > YAPE_LIMITS.max (1000)
    cartItems: [item, { ...item, id: 'item-2', name: 'Pantalón', price: '200' }] as [
      CartItem,
      ...CartItem[],
    ],
    culqiPublicKey: 'pk_test_xxx',
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
    businessId: 'test-business-uuid',
    businessName: 'Test Store',
    businessRuc: '12345678901',
    businessAddress: 'Av. Test 123',
    businessCity: 'Lima',
    ...overrides,
  };
}

/** Goes through checkout steps via the "Recojo en Tienda" path */
async function fillCheckoutAndGoToPay() {
  const user = userEvent.setup();

  // Click "Recojo en Tienda" button (recojo path — only needs phone)
  // Accessible name is "storeTienda" (md-icon + span text combined)
  const tiendaBtn = screen.getByRole('button', { name: /Tienda/i });
  await user.click(tiendaBtn);

  // Wait for recojo phone input to appear
  const phoneInput = await screen.findByPlaceholderText(/Tu Tel[eé]fono/i);
  await user.clear(phoneInput);
  await user.type(phoneInput, '999888777');

  // Click "Continuar"
  const continueBtn = screen.getByText('Continuar');
  await user.click(continueBtn);

  // Wait for step 2 (DNI input)
  const dniInput = await screen.findByPlaceholderText(/DNI/i);
  await user.type(dniInput, '12345678');

  // Fill customer full name
  const nameInput = screen.getByPlaceholderText(/Nombre completo/i);
  await user.type(nameInput, 'Juan Perez');

  // Fill email
  const emailInput = screen.getByPlaceholderText(/correo/i) as HTMLInputElement;
  await user.clear(emailInput);
  await user.type(emailInput, 'test@example.com');
}

// ── Suite ────────────────────────────────────────────

describe('Checkout — Order creation before Culqi.open()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });

    // Mock window.Culqi (global, present before mount so the script-loader effect runs directly)
    window.Culqi = {
      publicKey: 'pk_test_xxx',
      settings: vi.fn(),
      options: vi.fn(),
      open: vi.fn(),
      close: vi.fn(),
      culqi: vi.fn(),
    } as unknown as Window['Culqi'] & {
      settings: ReturnType<typeof vi.fn>;
      options: ReturnType<typeof vi.fn>;
      open: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    };

    // Default fetch mock: Culqi order creation succeeds
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        culqiOrderId: 'ord_test_123',
        paymentCode: null,
        qrUrl: null,
        expirationDate: new Date(Date.now() + 259200000).toISOString(),
      }),
    });
  });

  test('calls POST /api/payment/create-order when amount exceeds YAPE_LIMITS.max', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        culqiOrderId: 'ord_test_123',
      }),
    });
    globalThis.fetch = fetchMock;

    const props = createCheckoutProps({ totalAmount: 1500 }); // > 1000
    const Checkout = (await import('@/app/[slug]/(app)/components/Checkout')).default;
    render(<Checkout {...props} />);

    await fillCheckoutAndGoToPay();

    // Click pay button
    const payBtn = screen.getByText(/Ir a Pagar/i);
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/payment/create-order',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: expect.stringContaining('"amount":150000'),
        }),
      );
    });

    // Verify Culqi.settings was called with order
    await waitFor(() => {
      expect(window.Culqi.settings).toHaveBeenCalledWith(
        expect.objectContaining({ order: 'ord_test_123' }),
      );
    });
  });

  test('does NOT call create-order when amount is within YAPE_LIMITS', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    globalThis.fetch = fetchMock;

    const props = createCheckoutProps({ totalAmount: 500 }); // <= 1000
    const Checkout = (await import('@/app/[slug]/(app)/components/Checkout')).default;
    render(<Checkout {...props} />);

    await fillCheckoutAndGoToPay();

    const payBtn = screen.getByText(/Ir a Pagar/i);
    fireEvent.click(payBtn);

    // Give a moment for any async operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should NOT have been called with create-order
    const createOrderCalls = fetchMock.mock.calls.filter(
      ([url]: [string]) => url === '/api/payment/create-order',
    );
    expect(createOrderCalls).toHaveLength(0);
  });

  test('falls back to charge-only flow when order creation API fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    globalThis.fetch = fetchMock;

    const props = createCheckoutProps({ totalAmount: 1500 });
    const Checkout = (await import('@/app/[slug]/(app)/components/Checkout')).default;
    render(<Checkout {...props} />);

    await fillCheckoutAndGoToPay();

    const payBtn = screen.getByText(/Ir a Pagar/i);
    fireEvent.click(payBtn);

    // Should open Culqi without order (fallback to charge)
    await waitFor(() => {
      expect(window.Culqi.open).toHaveBeenCalled();
    });

    // Culqi.settings should NOT include an order key
    const settingsCall = (window.Culqi.settings as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(settingsCall).toBeDefined();
    expect(settingsCall).not.toHaveProperty('order');
  });
});

describe('Checkout — Culqi.order callback handling', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });

    window.Culqi = {
      publicKey: 'pk_test_xxx',
      settings: vi.fn(),
      options: vi.fn(),
      open: vi.fn(),
      close: vi.fn(),
      culqi: vi.fn(),
    } as unknown as Window['Culqi'] & {
      settings: ReturnType<typeof vi.fn>;
      options: ReturnType<typeof vi.fn>;
      open: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    };
  });

  test('sets paymentInstructions when Culqi.order is present', async () => {
    const Checkout = (await import('@/app/[slug]/(app)/components/Checkout')).default;
    const props = createCheckoutProps({ totalAmount: 500 });
    render(<Checkout {...props} />);

    // Simulate Culqi.order callback
    const culqiOrder = {
      id: 'ord_culqi_abc',
      payment_method: 'pago_efectivo',
      cip_code: '1234567890',
      expiration_date: Math.floor(Date.now() / 1000) + 86400,
    };

    // Set Culqi.order and trigger the callback
    Object.defineProperty(window, 'Culqi', {
      value: {
        ...window.Culqi,
        order: culqiOrder,
      },
      writable: true,
    });

    if (window.culqi) {
      await window.culqi();
    }

    // Wait for the overlay to appear with CIP code
    await waitFor(() => {
      expect(screen.getByText(/1234567890/)).toBeInTheDocument();
    });
  });

  test('keeps Culqi.token path unchanged when Culqi.order is absent', async () => {
    // The culqi callback is set up via useEffect on mount (when window.Culqi is present).
    // We trigger it directly with a token — no need for the full UI flow.
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        charge: { id: 'ch_123', status: 'paid' },
      }),
    });

    const Checkout = (await import('@/app/[slug]/(app)/components/Checkout')).default;
    const props = createCheckoutProps({ totalAmount: 500 });
    render(<Checkout {...props} />);

    // Trigger the culqi callback with a token (no order)
    Object.defineProperty(window, 'Culqi', {
      value: {
        ...window.Culqi,
        token: { id: 'tok_test_abc', type: 'card' },
        order: undefined,
      },
      writable: true,
      configurable: true,
    });

    if (window.culqi) {
      await window.culqi();
    }

    // Should call fetch to /api/payment/charge (the existing charge flow)
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/payment/charge', expect.any(Object));
    });
  });
});

describe('Checkout — Payment instructions overlay', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });

    window.Culqi = {
      publicKey: 'pk_test_xxx',
      settings: vi.fn(),
      options: vi.fn(),
      open: vi.fn(),
      close: vi.fn(),
      culqi: vi.fn(),
    } as unknown as Window['Culqi'] & {
      settings: ReturnType<typeof vi.fn>;
      options: ReturnType<typeof vi.fn>;
      open: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    };
  });

  test('renders CIP code for PagoEfectivo', async () => {
    const Checkout = (await import('@/app/[slug]/(app)/components/Checkout')).default;
    const props = createCheckoutProps({ totalAmount: 500 });
    render(<Checkout {...props} />);

    // Trigger Culqi.order callback with pago_efectivo
    Object.defineProperty(window, 'Culqi', {
      value: {
        ...window.Culqi,
        order: {
          id: 'ord_culqi_abc',
          payment_method: 'pago_efectivo',
          cip_code: '9876543210',
          action: {},
          expiration_date: Math.floor(Date.now() / 1000) + 86400,
        },
      },
      writable: true,
    });

    if (window.culqi) {
      await window.culqi();
    }

    // Should show CIP code prominently
    await waitFor(() => {
      expect(screen.getByText(/9876543210/)).toBeInTheDocument();
    });

    // Should mention PagoEfectivo
    expect(screen.getByText(/pago efectivo/i)).toBeInTheDocument();
  });

  test('renders QR image for Billetera Móvil', async () => {
    const Checkout = (await import('@/app/[slug]/(app)/components/Checkout')).default;
    const props = createCheckoutProps({ totalAmount: 500 });
    render(<Checkout {...props} />);

    // Trigger Culqi.order callback with billetera_movil
    Object.defineProperty(window, 'Culqi', {
      value: {
        ...window.Culqi,
        order: {
          id: 'ord_culqi_abc',
          payment_method: 'billetera_movil',
          cip_code: undefined,
          action: {
            qr: { image_url: 'https://culqi.com/qr/abc123' },
          },
          expiration_date: Math.floor(Date.now() / 1000) + 86400,
        },
      },
      writable: true,
    });

    if (window.culqi) {
      await window.culqi();
    }

    // Should show QR image
    await waitFor(() => {
      const qrImg = screen.getByAltText(/qr/i) as HTMLImageElement;
      expect(qrImg).toBeInTheDocument();
      expect(qrImg.src).toContain('culqi.com/qr/abc123');
    });
  });

  test('overlay is closable', async () => {
    const Checkout = (await import('@/app/[slug]/(app)/components/Checkout')).default;
    const props = createCheckoutProps({ totalAmount: 500 });
    render(<Checkout {...props} />);

    // Trigger Culqi.order callback
    Object.defineProperty(window, 'Culqi', {
      value: {
        ...window.Culqi,
        order: {
          id: 'ord_culqi_abc',
          payment_method: 'pago_efectivo',
          cip_code: '1234567890',
          action: {},
          expiration_date: Math.floor(Date.now() / 1000) + 86400,
        },
      },
      writable: true,
    });

    if (window.culqi) {
      await window.culqi();
    }

    // Wait for overlay to appear
    await waitFor(() => {
      expect(screen.getByText(/1234567890/)).toBeInTheDocument();
    });

    // Find and click close button
    const closeBtn = screen.getByText(/entendido/i);
    fireEvent.click(closeBtn);

    // Overlay should be gone
    await waitFor(() => {
      expect(screen.queryByText(/1234567890/)).not.toBeInTheDocument();
    });
  });
});
