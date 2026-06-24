// =====================================================
// PhaseShippingSection — Unit tests
// =====================================================

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import PhaseShippingSection from '../../app/[slug]/dashboard/components/PhaseShippingSection';

// ── Mocks ────────────────────────────────────────────

vi.mock('lucide-react', () => ({
  AlertCircle: () => <span>AlertCircle</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  RefreshCw: () => <span>RefreshCw</span>,
  Truck: () => <span>Truck</span>,
}));

vi.mock('@/shared/components/ui/buttons/Button', () => ({
  default: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

vi.mock('../../app/[slug]/dashboard/components/ShippingSection', () => ({
  default: () => <div data-testid="shipping-section">ShippingSection Mock</div>,
}));

// ── Fixtures ─────────────────────────────────────────

function createMockOrder(overrides: Record<string, any> = {}) {
  return {
    id: 'order-1',
    status: 'IN_TRANSIT',
    courierName: 'Shalom',
    trackingNumber: 'TRK-123',
    pickupCode: 'PC-456',
    ...overrides,
  };
}

const defaultProps = {
  onNotifyDelivery: vi.fn(),
  onFinalizeOrder: vi.fn(),
  notifyingDelivery: false,
  finalizingOrder: false,
};

// ── Tests ────────────────────────────────────────────

describe('PhaseShippingSection', () => {
  test('renders guidance banner for phase 2', () => {
    render(
      <PhaseShippingSection
        order={createMockOrder()}
        {...defaultProps}
      />
    );

    expect(
      screen.getByText(/Seguí el estado del envío/)
    ).toBeInTheDocument();
  });

  test('renders shipping section and courier info', () => {
    render(
      <PhaseShippingSection
        order={createMockOrder()}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Seguimiento de Envío')).toBeInTheDocument();
    expect(screen.getByTestId('shipping-section')).toBeInTheDocument();
    expect(screen.getByText('Shalom')).toBeInTheDocument();
    expect(screen.getByText('TRK-123')).toBeInTheDocument();
    expect(screen.getByText('PC-456')).toBeInTheDocument();
  });

  test('shows Notificar Llegada for IN_TRANSIT status', () => {
    render(
      <PhaseShippingSection
        order={createMockOrder({ status: 'IN_TRANSIT' })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Notificar Llegada')).toBeInTheDocument();
  });

  test('shows Notificar Entrega for READY_TO_SHIP status', () => {
    render(
      <PhaseShippingSection
        order={createMockOrder({ status: 'READY_TO_SHIP' })}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Notificar Entrega')).toBeInTheDocument();
  });

  test('does not show any notify button for unrelated status', () => {
    render(
      <PhaseShippingSection
        order={createMockOrder({ status: 'paid' })}
        {...defaultProps}
      />
    );

    expect(screen.queryByText('Notificar Entrega')).not.toBeInTheDocument();
    expect(screen.queryByText('Notificar Llegada')).not.toBeInTheDocument();
  });
});
