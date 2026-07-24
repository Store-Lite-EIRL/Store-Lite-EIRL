// =====================================================
// PhaseCompletionSection — Unit tests
// =====================================================

import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import PhaseCompletionSection from '../../app/[slug]/dashboard/components/PhaseCompletionSection';

// ── Mocks ────────────────────────────────────────────

vi.mock('@/shared', () => ({
  Icon: ({ children, ...props }: any) => (
    <span data-testid="shared-icon" {...props}>
      {children}
    </span>
  ),
}));

vi.mock('lucide-react', () => ({
  AlertCircle: () => <span>AlertCircle</span>,
  CheckCircle: () => <span>CheckCircle</span>,
  Clock: () => <span>Clock</span>,
}));

// ── Fixtures ─────────────────────────────────────────

function createMockOrder(overrides: Record<string, any> = {}) {
  return {
    status: 'paid',
    finalizationDeadline: null,
    completedAt: null,
    createdAt: new Date('2026-06-01').toISOString(),
    orderNumber: 'ORD-001',
    productTitle: 'Producto de prueba',
    amount: '150.00',
    currency: 'PEN',
    paymentMethod: 'yape',
    shippingType: 'domicilio',
    maskedDni: '***1234',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────

describe('PhaseCompletionSection', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('does not render guidance banner after removal', () => {
    render(<PhaseCompletionSection order={createMockOrder()} />);

    expect(screen.queryByText(/El pedido está en su fase final/)).not.toBeInTheDocument();
  });

  test('shows countdown when pending with finalizationDeadline', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T10:00:00Z'));
    render(
      <PhaseCompletionSection
        order={createMockOrder({
          status: 'esperando_confirmacion',
          finalizationDeadline: new Date('2026-07-01T12:00:00Z').toISOString(),
        })}
      />,
    );

    expect(screen.getByText(/Tiempo restante/)).toBeInTheDocument();
  });

  test('shows countdown for DELIVERED status with deadline', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-01T10:00:00Z'));
    render(
      <PhaseCompletionSection
        order={createMockOrder({
          status: 'DELIVERED',
          finalizationDeadline: new Date('2026-07-01T12:00:00Z').toISOString(),
        })}
      />,
    );

    expect(screen.getByText(/Tiempo restante/)).toBeInTheDocument();
  });

  test('shows completed seal for completed status', () => {
    render(
      <PhaseCompletionSection
        order={createMockOrder({
          status: 'completed',
          completedAt: new Date('2026-06-15').toISOString(),
        })}
      />,
    );

    // Header
    expect(screen.getByText('¡Pedido Finalizado!')).toBeInTheDocument();
    expect(screen.getByText('14 días')).toBeInTheDocument();

    // Summary grid
    expect(screen.getByText('Producto de prueba')).toBeInTheDocument();
    expect(screen.getByText('Yape')).toBeInTheDocument();
    expect(screen.getByText('***1234')).toBeInTheDocument();

    // Timeline
    expect(screen.getByText('Creado')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.getByText('Validado')).toBeInTheDocument();
    expect(screen.getByText('En Reparto')).toBeInTheDocument();
    expect(screen.getByText('Entregado')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
  });

  test('shows completed for finalizado and COMPLETED status', () => {
    render(
      <PhaseCompletionSection
        order={createMockOrder({
          status: 'COMPLETED',
          completedAt: new Date('2026-06-15').toISOString(),
        })}
      />,
    );

    expect(screen.getByText('¡Pedido Finalizado!')).toBeInTheDocument();
  });

  test('shows locked message for inactive phase 3', () => {
    render(<PhaseCompletionSection order={createMockOrder({ status: 'paid' })} />);

    expect(screen.getByText(/estará disponible/)).toBeInTheDocument();
  });

  test('expanded timeline shows 6 items for completed orders', () => {
    render(
      <PhaseCompletionSection
        order={createMockOrder({
          status: 'completed',
          completedAt: new Date('2026-06-15').toISOString(),
          createdAt: new Date('2026-06-01').toISOString(),
        })}
      />,
    );

    expect(screen.getByText('Creado')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.getByText('Validado')).toBeInTheDocument();
    expect(screen.getByText('En Reparto')).toBeInTheDocument();
    expect(screen.getByText('Entregado')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();
  });

  test('shows pickup-specific timeline for recojo orders', () => {
    render(
      <PhaseCompletionSection
        order={createMockOrder({
          status: 'completed',
          completedAt: new Date('2026-06-15').toISOString(),
          shippingType: 'recojo',
        })}
      />,
    );

    // Pickup timeline (4 items — no delivery-specific ones)
    expect(screen.getByText('Recojo')).toBeInTheDocument();
    expect(screen.getByText('Creado')).toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
    expect(screen.getByText('Completado')).toBeInTheDocument();

    // MUST NOT have delivery-specific items
    expect(screen.queryByText('En Reparto')).not.toBeInTheDocument();
    expect(screen.queryByText('Entregado')).not.toBeInTheDocument();
    expect(screen.queryByText('Validado')).not.toBeInTheDocument();
  });
});
